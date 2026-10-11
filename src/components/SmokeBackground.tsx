import { useEffect, useEffectEvent, useRef } from 'react';
import { createSmokeRenderer, type SmokeTint } from '../lib/smokeRenderer';
import type { SmokeSettings } from '../lib/smokeSettings';

export function SmokeBackground({ active, settings, tint }: { active: boolean; settings: SmokeSettings; tint: SmokeTint | null }) {
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
  useEffect(() => { renderer.current?.setTint(tint); }, [tint]);
  return <canvas className="smoke" ref={canvas} aria-hidden="true" />;
}
