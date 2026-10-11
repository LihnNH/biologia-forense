/* Build replaces these two placeholders with the complete versioned manifest. */
const version = __OFFLINE_VERSION__;
const files = __OFFLINE_MANIFEST__;
const base = new URL(self.registration.scope);
const prefix = 'forensic-offline:' + base.href + ':';
const cacheName = prefix + version;
const urls = files.map(file => new URL(file, base).href);
let preparation = null;
let preparationAbort = null;
let disabled = false;

async function cacheReady() {
  if (disabled) return false;
  const cache = await caches.open(cacheName);
  const stored = new Set((await cache.keys()).map(request => request.url));
  return urls.every(url => stored.has(url));
}

function prepare() {
  if (disabled) return Promise.reject(new Error('Offline disabled.'));
  if (preparation) return preparation;
  preparation = (async () => {
    if (await cacheReady()) return;
    if (disabled) throw new Error('Offline disabled.');
    const abort = new AbortController();
    preparationAbort = abort;
    const timeout = setTimeout(() => abort.abort(), 60_000);
    try {
      const cache = await caches.open(cacheName);
      // addAll commits the entire batch only after every resource succeeds.
      await cache.addAll(urls.map(url => new Request(url, {
        cache: url.endsWith('.html') ? 'reload' : 'default', signal: abort.signal,
      })));
    } finally { clearTimeout(timeout); preparationAbort = null; }
  })().finally(() => { preparation = null; });
  return preparation;
}

self.addEventListener('install', event => {
  event.waitUntil(prepare());
  // Updates wait for the previous version's tabs to close. Never interrupt a case.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(prefix) && name !== cacheName) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'CLEAR_OFFLINE') {
    disabled = true;
    preparationAbort?.abort();
    event.waitUntil((async () => {
      await preparation?.catch(() => {});
      for (const name of await caches.keys()) if (name.startsWith(prefix)) await caches.delete(name);
      for (const client of await self.clients.matchAll()) client.postMessage({ type: 'OFFLINE_CLEARED' });
      event.ports[0]?.postMessage({ ready: true });
    })());
    return;
  }
  if (!['OFFLINE_STATUS', 'PREPARE_OFFLINE'].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'PREPARE_OFFLINE') await prepare();
      event.ports[0]?.postMessage({ ready: await cacheReady(), version });
    } catch {
      event.ports[0]?.postMessage({ ready: false, version });
    }
  })());
});

self.addEventListener('fetch', event => {
  if (disabled) return;
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  if (url.pathname === new URL('sw.js', base).pathname) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    let path = url.pathname.slice(base.pathname.length);
    if (request.mode === 'navigate') {
      if (path === '') path = 'index.html';
      if (path === 'debug') return Response.redirect(new URL('debug/' + url.search, base).href, 302);
      if (path === 'debug/') path = 'debug/index.html';
    }
    const cached = await cache.match(new URL(path, base).href, { ignoreSearch: true });
    if (cached) return cached;
    try { return await fetch(request); }
    catch {
      return new Response('Este recurso ainda não foi preparado para uso offline.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
