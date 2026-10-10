import { artwork, caseIcons } from '../data/assets';
import { suspectPortraits } from '../data/suspectPortraits';
import favicon from '../../assets/svg/dna-favicon.svg';

const imageUrls = [...new Set([
  ...Object.values(artwork), ...Object.values(caseIcons), favicon,
  ...Object.values(suspectPortraits).flatMap(portraits => Object.values(portraits)),
])];

// Keep decoded images alive so opening a gallery does not decode them again.
const decodedImages = new Map<string, HTMLImageElement>();
const pendingTasks = new Map<string, Promise<void>>();

export interface AssetProgress {
  completed: number;
  total: number;
  failed: number;
}

export const assetCount = imageUrls.length + 1;

function once(key: string, prepare: () => Promise<void>) {
  const existing = pendingTasks.get(key);
  if (existing) return existing;
  const pending = prepare().catch(error => {
    pendingTasks.delete(key);
    throw error;
  });
  pendingTasks.set(key, pending);
  return pending;
}

function withTimeout(task: Promise<unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Tempo limite do carregamento.')), 30_000);
    task.then(() => { window.clearTimeout(timer); resolve(); }, error => { window.clearTimeout(timer); reject(error); });
  });
}

function prepareImage(url: string) {
  return once(url, async () => {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    try {
      await withTimeout(image.decode());
      decodedImages.set(url, image);
    } catch (error) {
      image.src = '';
      throw error;
    }
  });
}

function prepareFonts() {
  return once('fonts', () => withTimeout(Promise.all([
    '400 16px Inter', '600 16px Inter', '800 16px Inter',
    'italic 400 16px Inter', '400 16px "Bebas Neue"',
  ].map(font => document.fonts.load(font))).then(() => document.fonts.ready)));
}

export async function preloadAssets(onProgress: (progress: AssetProgress) => void) {
  const tasks = [prepareFonts, ...imageUrls.map(url => () => prepareImage(url))];
  let next = 0;
  let completed = 0;
  let failed = 0;
  onProgress({ completed, total: assetCount, failed });
  // Limit concurrent decoding to avoid a large CPU/memory spike on mobile.
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      try { await task(); } catch { failed++; }
      completed++;
      onProgress({ completed, total: assetCount, failed });
    }
  }));
}
