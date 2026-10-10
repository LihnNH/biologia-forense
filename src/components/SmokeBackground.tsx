import { useEffect, useRef } from 'react';
import { createSmokeRenderer } from '../lib/smokeRenderer';

export function SmokeBackground({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createSmokeRenderer>>(null);
  useEffect(() => {
    if (!canvas.current) return;
    renderer.current = createSmokeRenderer(canvas.current);
    return () => {
      renderer.current?.destroy();
      renderer.current = null;
    };
  }, []);
  useEffect(() => { renderer.current?.setActive(active); }, [active]);
  return <canvas className="smoke" ref={canvas} aria-hidden="true" />;
}
