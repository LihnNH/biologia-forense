import { useEffect, useState } from 'react';

export interface SmokeSettings {
  enabled: boolean;
  fps: number;
  quality: number;
  strength: number;
  speed: number;
}

export const defaultSmokeSettings: Readonly<SmokeSettings> = {
  enabled: true, fps: 40, quality: 100, strength: 14, speed: 23,
};

export const smokeRanges = {
  fps: { min: 5, max: 120, step: 5 },
  quality: { min: 25, max: 200, step: 5 },
  strength: { min: 0, max: 100, step: 1 },
  speed: { min: 0, max: 100, step: 1 },
} as const;

const storageKey = 'forensic-smoke';

function readSmokeSettings(): SmokeSettings {
  const settings = { ...defaultSmokeSettings };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (!saved || typeof saved !== 'object') return settings;
    const values = saved as Record<string, unknown>;
    if (typeof values.enabled === 'boolean') settings.enabled = values.enabled;
    for (const key of Object.keys(smokeRanges) as (keyof typeof smokeRanges)[]) {
      const value = values[key];
      const { min, max, step } = smokeRanges[key];
      if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max) {
        settings[key] = min + Math.round((value - min) / step) * step;
      }
    }
  } catch { /* Use the defaults when saved settings or storage are unavailable. */ }
  return settings;
}

export function useSmokeSettings() {
  const [settings, setSettings] = useState<SmokeSettings>(readSmokeSettings);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* Controls also work without storage. */ }
  }, [settings]);
  return { settings, setSettings };
}
