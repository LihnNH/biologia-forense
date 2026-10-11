import { useEffect, useEffectEvent, useRef } from 'react';
import { createSmokeRenderer } from '../lib/smokeRenderer';
import type { SmokeSettings } from '../lib/smokeSettings';

export function SmokeBackground({ active, settings }: { active: boolean; settings: SmokeSettings }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createSmokeRenderer>>(null);
  const initialize = useEffectEvent(() => canvas.current ? createSmokeRenderer(canvas.current, settings) : null);
  useEffect(() => {
    if (!canvas.current) return;
    renderer.current = initialize();
    return () => {
      renderer.current?.destroy();
      renderer.current = null;
    };
  }, []);
  useEffect(() => { renderer.current?.setActive(active); }, [active]);
  useEffect(() => { renderer.current?.setSettings(settings); }, [settings]);
  return <canvas className="smoke" ref={canvas} aria-hidden="true" />;
}
