import { useSyncExternalStore } from 'react';
import { CASE_ORDER, type CaseId } from '../data/cases';

export const VISITOR_TOTAL_KEY = 'visitantes_totais';
export const FAIR_STATISTICS_KEY = 'forensic-fair-statistics';
const changedEvent = 'forensic-fair-statistics-changed';
const resetEvent = 'forensic-fair-statistics-reset';

interface VisitorGroup {
  number: string;
  visitors: string;
}

export interface FairStatistics {
  visitors: string;
  groups: string;
  solved: string;
  cases: Record<CaseId, string>;
  solvedCases: Record<CaseId, string>;
  groupHistory: VisitorGroup[];
}

// Decimal strings and BigInt keep counts exact without imposing a numeric maximum.
export function parseGroupSize(value: string): bigint | null {
  const trimmed = value.trim();
  return /^[+-]?\d+$/.test(trimmed) ? BigInt(trimmed) : null;
}

function count(value: unknown): string {
  if (typeof value !== 'string') return '0';
  return (parseGroupSize(value) ?? 0n).toString();
}

function emptyStatistics(): FairStatistics {
  return { visitors: '0', groups: '0', solved: '0', cases: { Faca: '0', Veneno: '0', Martelo: '0', Corda: '0' }, solvedCases: { Faca: '0', Veneno: '0', Martelo: '0', Corda: '0' }, groupHistory: [] };
}

function readGroupHistory(value: unknown): VisitorGroup[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    if (!entry || typeof entry !== 'object' || typeof entry.number !== 'string' || typeof entry.visitors !== 'string') return [];
    const number = parseGroupSize(entry.number);
    const visitors = parseGroupSize(entry.visitors);
    return number !== null && number > 0n && visitors !== null && visitors !== 0n
      ? [{ number: number.toString(), visitors: visitors.toString() }] : [];
  });
}

function readStatistics(): FairStatistics {
  const statistics = emptyStatistics();
  try {
    statistics.visitors = count(localStorage.getItem(VISITOR_TOTAL_KEY));
    let saved: unknown;
    try { saved = JSON.parse(localStorage.getItem(FAIR_STATISTICS_KEY) ?? 'null'); } catch { return statistics; }
    if (!saved || typeof saved !== 'object') return statistics;
    const data = saved as Partial<FairStatistics>;
    statistics.groups = count(data.groups);
    statistics.solved = count(data.solved);
    statistics.groupHistory = readGroupHistory(data.groupHistory);
    for (const id of CASE_ORDER) {
      statistics.cases[id] = count(data.cases?.[id]);
      statistics.solvedCases[id] = count(data.solvedCases?.[id]);
    }
  } catch { /* Settings can still open when browser storage is unavailable. */ }
  return statistics;
}

export function notifyFairStatistics() {
  window.dispatchEvent(new Event(changedEvent));
}

export function onFairStatisticsReset(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea === localStorage && event.newValue === null && (event.key === null || event.key === FAIR_STATISTICS_KEY)) listener();
  };
  window.addEventListener(resetEvent, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(resetEvent, listener);
    window.removeEventListener('storage', onStorage);
  };
}

async function withStatisticsLock(action: () => void) {
  if (navigator.locks) await navigator.locks.request('forensic-fair-statistics', action);
  else action();
}

export async function clearFairStatistics() {
  await withStatisticsLock(() => {
    localStorage.removeItem(VISITOR_TOTAL_KEY);
    localStorage.removeItem(FAIR_STATISTICS_KEY);
    window.dispatchEvent(new Event(resetEvent));
    notifyFairStatistics();
  });
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea === localStorage && (event.key === null || event.key === VISITOR_TOTAL_KEY || event.key === FAIR_STATISTICS_KEY)) listener();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(changedEvent, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(changedEvent, listener);
  };
}

export function useFairStatistics(): FairStatistics {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(readStatistics()));
  return JSON.parse(snapshot) as FairStatistics;
}

async function updateStatistics(update: (statistics: FairStatistics) => void) {
  const save = () => {
    const previousVisitors = localStorage.getItem(VISITOR_TOTAL_KEY);
    const previousStatistics = localStorage.getItem(FAIR_STATISTICS_KEY);
    const statistics = readStatistics();
    update(statistics);
    try {
      localStorage.setItem(VISITOR_TOTAL_KEY, statistics.visitors);
      localStorage.setItem(FAIR_STATISTICS_KEY, JSON.stringify(statistics));
    } catch (error) {
      // A failed write must not leave half of a group registered.
      try {
        if (previousVisitors === null) localStorage.removeItem(VISITOR_TOTAL_KEY);
        else localStorage.setItem(VISITOR_TOTAL_KEY, previousVisitors);
        if (previousStatistics === null) localStorage.removeItem(FAIR_STATISTICS_KEY);
        else localStorage.setItem(FAIR_STATISTICS_KEY, previousStatistics);
      } catch { /* Surface the original save error to the caller. */ }
      throw error;
    }
    notifyFairStatistics();
  };
  // Serialize additions from multiple open tabs on the same origin.
  await withStatisticsLock(save);
}

export async function registerGroup(caseId: CaseId, visitors: bigint) {
  await updateStatistics(statistics => {
    statistics.visitors = (BigInt(statistics.visitors) + visitors).toString();
    if (visitors === 0n) return;
    statistics.groups = (BigInt(statistics.groups) + 1n).toString();
    statistics.groupHistory.push({ number: statistics.groups, visitors: visitors.toString() });
    statistics.cases[caseId] = (BigInt(statistics.cases[caseId]) + 1n).toString();
  });
}

export async function registerSolvedCase(caseId: CaseId) {
  await updateStatistics(statistics => {
    statistics.solved = (BigInt(statistics.solved) + 1n).toString();
    statistics.solvedCases[caseId] = (BigInt(statistics.solvedCases[caseId]) + 1n).toString();
  });
}
