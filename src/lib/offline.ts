import { useSyncExternalStore } from 'react';
import { clearFairStatistics, FAIR_STATISTICS_KEY, VISITOR_TOTAL_KEY } from './fairStatistics';

type OfflinePhase = 'preparing' | 'ready' | 'error' | 'unsupported' | 'clearing' | 'cleared' | 'clearError';
interface OfflineState { phase: OfflinePhase; online: boolean }
const supported = import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator;
let state: OfflineState = { phase: supported ? 'preparing' : 'unsupported', online: navigator.onLine };
const listeners = new Set<() => void>();
let pending: Promise<void> | null = null;
let disabled = false;
let clearing: Promise<void> | null = null;
// Production entry chunks live in assets/, on both the main site and debug pages.
const moduleUrl = import.meta.url;
const base = new URL('../', moduleUrl);
const workerUrl = new URL('sw.js', base);
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('forensic-offline:' + base.href);

function publish(phase: OfflinePhase = state.phase) {
  state = { phase, online: navigator.onLine };
  listeners.forEach(listener => listener());
}

function ask(worker: ServiceWorker, type: 'OFFLINE_STATUS' | 'PREPARE_OFFLINE' | 'CLEAR_OFFLINE'): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => finish(false, new Error('Offline request timed out.')), type === 'PREPARE_OFFLINE' ? 75_000 : 5_000);
    function finish(ready: boolean, error?: Error) {
      clearTimeout(timer);
      channel.port1.close();
      worker.removeEventListener('statechange', changed);
      if (error) reject(error); else resolve(ready);
    }
    function changed() {
      if (type === 'CLEAR_OFFLINE' && worker.state === 'redundant') finish(true);
    }
    worker.addEventListener('statechange', changed);
    channel.port1.onmessage = event => {
      finish(event.data?.ready === true);
    };
    try { worker.postMessage({ type }, [channel.port2]); changed(); }
    catch (error) { finish(false, error instanceof Error ? error : new Error('Offline worker unavailable.')); }
  });
}

function activated(worker: ServiceWorker): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => finish(new Error('Service worker activation timed out.')), 90_000);
    function finish(error?: Error) {
      clearTimeout(timer);
      worker.removeEventListener('statechange', changed);
      if (error) reject(error); else resolve();
    }
    function changed() {
      if (worker.state === 'activated') finish();
      else if (worker.state === 'redundant') finish(new Error('Offline installation failed.'));
    }
    worker.addEventListener('statechange', changed);
    changed();
  });
}

function controlled(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => finish(new Error('The page is not controlled.')), 10_000);
    function finish(error?: Error) {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('controllerchange', changed);
      if (error) reject(error); else resolve();
    }
    function changed() {
      if (navigator.serviceWorker.controller?.scriptURL === workerUrl.href) finish();
    }
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    changed();
  });
}

export function prepareOffline(): Promise<void> {
  if (!supported || disabled) return Promise.resolve();
  if (pending) return pending;
  publish('preparing');
  pending = (async () => {
    let registration = await navigator.serviceWorker.getRegistration(base.href);
    if (disabled) return;
    if (!registration || registration.scope !== base.href || registration.active?.scriptURL !== workerUrl.href) {
      registration = await navigator.serviceWorker.register(workerUrl, { scope: base.href, updateViaCache: 'none' });
    }
    if (disabled) return;
    const worker = registration.active ?? registration.installing ?? registration.waiting;
    if (!worker) throw new Error('No offline worker available.');
    await activated(worker);
    if (!await ask(worker, 'OFFLINE_STATUS') && !await ask(worker, 'PREPARE_OFFLINE')) throw new Error('Offline assets are incomplete.');
    await controlled();
    if (disabled) return;
    publish('ready');
    if (navigator.onLine) void registration.update().catch(() => { /* Keep the working version if an update fails. */ });
  })().catch(() => { if (!disabled) publish('error'); }).finally(() => { pending = null; });
  return pending;
}

export function clearOfflineData(): Promise<void> {
  if (clearing) return clearing;
  disabled = true;
  publish('clearing');
  channel?.postMessage('clearing');
  clearing = (async () => {
    if ('serviceWorker' in navigator) {
      let registrations: ServiceWorkerRegistration[] = [];
      // Stop downloads first, then catch a registration that was already in flight.
      for (let round = 0; round < 2; round++) {
        registrations = (await navigator.serviceWorker.getRegistrations()).filter(registration => registration.scope === base.href);
        const workers = new Set<ServiceWorker>();
        for (const registration of registrations) {
          for (const worker of [registration.active, registration.waiting, registration.installing]) if (worker) workers.add(worker);
        }
        const controller = navigator.serviceWorker.controller;
        if (controller?.scriptURL === workerUrl.href) workers.add(controller);
        const replies = await Promise.allSettled([...workers].map(worker => ask(worker, 'CLEAR_OFFLINE')));
        if (replies.some(reply => reply.status === 'rejected') && controller?.state !== 'redundant') throw new Error('Could not stop the offline worker.');
        if (round === 0) await pending;
      }
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
    if ('caches' in window) {
      const prefix = 'forensic-offline:' + base.href + ':';
      for (const name of await caches.keys()) if (name.startsWith(prefix)) await caches.delete(name);
    }
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of Object.keys(storage)) {
        if (storage === localStorage && (key === FAIR_STATISTICS_KEY || key === VISITOR_TOTAL_KEY)) continue;
        if (key.startsWith('forensic-') || key === VISITOR_TOTAL_KEY) storage.removeItem(key);
      }
    }
    await clearFairStatistics();
    publish('cleared');
    channel?.postMessage('cleared');
  })().catch(error => { publish('clearError'); channel?.postMessage('clearError'); throw error; }).finally(() => { clearing = null; });
  return clearing;
}

if (channel) channel.onmessage = event => {
  if (event.data === 'clearing' || event.data === 'cleared' || event.data === 'clearError') { disabled = true; publish(event.data); }
};
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', event => {
  if (event.data?.type === 'OFFLINE_CLEARED') { disabled = true; }
});

export function useOffline() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => state);
}

if (supported) {
  const connectivityChanged = () => {
    publish();
    if (navigator.onLine && state.phase === 'error') void prepareOffline();
  };
  window.addEventListener('online', connectivityChanged);
  window.addEventListener('offline', connectivityChanged);
  if (document.readyState === 'complete') void prepareOffline();
  else window.addEventListener('load', () => { void prepareOffline(); }, { once: true });
}
