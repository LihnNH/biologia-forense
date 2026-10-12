import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createFocalCursor, type FocalCursorOptions } from '../lib/focalCursor/controller';
import '../styles/focal-cursor.css';

export function FocalCursor({ active, options }: { active: boolean; options: FocalCursorOptions }) {
  const layer = useRef<SVGSVGElement>(null);
  const controller = useRef<ReturnType<typeof createFocalCursor>>(null);
  useLayoutEffect(() => {
    if (!layer.current) return;
    controller.current = createFocalCursor(layer.current, options);
    return () => { controller.current?.dispose(); controller.current = null; };
  }, [options]);
  useLayoutEffect(() => { controller.current?.setActive(active); }, [active, options]);
  return createPortal(<svg ref={layer} className="focal-cursor" aria-hidden="true" data-mode="lens">
    <g data-cursor-pieces><path /><path /><path /><path /></g>
    <path data-cursor-handle />
  </svg>, document.body);
}
