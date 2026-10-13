import { createFocalGeometry, type FocalGeometryOptions } from './geometry';
import { readTargetFrame, rotateFramePoint, hasTransformAnimation, type TargetFrame } from './targetFrame';

export interface FocalCursorOptions {
  scopeSelector: string;
  targetSelector: string;
  /** Keep the full target shape in the gaps inside this container. */
  continuitySelector?: string;
  targetPadding?: number;
  followRange?: number;
  /** Follow the target's own 2D rotation, translation and scale. */
  followTargetTransform?: boolean;
  geometry?: FocalGeometryOptions;
  /** Used when the browser does not support squircle corners. */
  fallbackGeometry?: FocalGeometryOptions;
  nativeCursor?: string;
}

function spring(position: number, velocity: number, goal: number, stiffness: number, damping: number, dt: number) {
  velocity += ((goal - position) * stiffness - velocity * damping) * dt;
  return [position + velocity * dt, velocity];
}

export function createFocalCursor(svg: SVGSVGElement, options: FocalCursorOptions) {
  const pieces = [...svg.querySelectorAll<SVGPathElement>('[data-cursor-pieces] path')];
  const selectedHandle = svg.querySelector<SVGPathElement>('[data-cursor-handle]');
  if (pieces.length !== 4 || !selectedHandle) throw new Error('Focal cursor requires four corner paths and a handle.');
  const handle = selectedHandle;
  const geometryOptions = options.geometry?.cornerShape === 'squircle' && !CSS.supports('corner-shape', 'squircle')
    ? { ...options.geometry, ...options.fallbackGeometry, cornerShape: 'circle' as const }
    : options.geometry;
  const { samples, lensScale, lensOffset, corner, lens } = createFocalGeometry(geometryOptions);
  const offset = options.targetPadding ?? 14;
  const followRange = options.followRange ?? 19;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  let active = false, known = false, shown = false, frame = 0, previousTime = 0;
  let mouseX = 0, mouseY = 0, overTargetArea = false;
  let morph = 0, morphVelocity = 0, followX = 0, followY = 0, followVX = 0, followVY = 0;
  let target: HTMLElement | null = null;
  const zeroFrame = (): TargetFrame => ({ left: 0, top: 0, right: 0, bottom: 0, angle: 0 });
  const frameKeys = ['left', 'top', 'right', 'bottom', 'angle'] as const;
  let rect = zeroFrame(), velocity = zeroFrame();
  let previousTargetFrame: TargetFrame | null = null;

  function hide() {
    cancelAnimationFrame(frame); frame = 0; previousTime = 0;
    shown = false; overTargetArea = false; target = null; morph = morphVelocity = 0;
    followX = followY = followVX = followVY = 0;
    velocity = zeroFrame(); previousTargetFrame = null;
    svg.classList.remove('is-visible');
    document.body.classList.remove('focal-cursor-custom');
  }
  function bounds() {
    return target ? readTargetFrame(target, offset, Boolean(options.followTargetTransform)) : rect;
  }
  function selectTarget(element: Element | null) {
    const scope = document.querySelector<HTMLElement>(options.scopeSelector);
    const candidate = element?.closest<HTMLElement>(options.targetSelector);
    if (target && (!target.isConnected || !scope?.contains(target) || !target.matches(options.targetSelector))) target = null;
    if (candidate && scope?.contains(candidate)) {
      const first = !target;
      if (target !== candidate) previousTargetFrame = null;
      target = candidate;
      overTargetArea = true;
      if (first) rect = bounds();
      svg.dataset.target = String([...scope.querySelectorAll(options.targetSelector)].indexOf(candidate));
    } else {
      const container = options.continuitySelector ? target?.closest<HTMLElement>(options.continuitySelector) : null;
      const box = container && scope?.contains(container) ? container.getBoundingClientRect() : null;
      // Continuity is local to the current target's container, even with multiple groups.
      overTargetArea = Boolean(target && box && mouseX >= box.left && mouseX <= box.right && mouseY >= box.top && mouseY <= box.bottom);
      if (!target) delete svg.dataset.target;
    }
    svg.dataset.mode = overTargetArea ? 'target' : 'lens';
  }
  function draw() {
    const amount = Math.max(0, Math.min(1, morph));
    const cx = mouseX + lensOffset, cy = mouseY + lensOffset;
    pieces.forEach((piece, index) => {
      let path = '';
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const point = corner(index, t, rect, followX, followY);
        const [cornerX, cornerY] = rotateFramePoint(point[0], point[1], rect);
        const [circleX, circleY] = lens(index, t, mouseX, mouseY);
        path += `${i ? 'L' : 'M'}${(circleX + (cornerX - circleX) * amount).toFixed(2)} ${(circleY + (cornerY - circleY) * amount).toFixed(2)} `;
      }
      piece.setAttribute('d', path);
      piece.setAttribute('stroke-width', (2 + .85 * amount).toFixed(3));
    });
    const retract = Math.min(1, amount / .86), smooth = retract * retract * (3 - 2 * retract);
    const startX = cx + 5.185 * lensScale, startY = cy + 5.185 * lensScale;
    const endX = startX + 5.482 * lensScale, endY = startY + 5.482 * lensScale;
    handle.setAttribute('d', `M${(startX + (mouseX - startX) * smooth).toFixed(3)} ${(startY + (mouseY - startY) * smooth).toFixed(3)} L${(endX + (mouseX - endX) * smooth + (smooth === 1 ? .012 : 0)).toFixed(3)} ${(endY + (mouseY - endY) * smooth).toFixed(3)}`);
    handle.setAttribute('stroke-width', (2 + 1.6 * smooth).toFixed(3));
    svg.dataset.morph = amount.toFixed(4);
  }
  function tick(time: number) {
    frame = 0;
    if (!active || !shown || !finePointer.matches) return;
    const dt = Math.min((time - (previousTime || time - 16.667)) / 1000, .035);
    previousTime = time;
    if (target && !target.isConnected) selectTarget(document.elementFromPoint(mouseX, mouseY));
    const goal = overTargetArea ? 1 : 0, destination = bounds();
    // Apply live changes directly; springs remain responsible for travel between targets.
    if (options.followTargetTransform && previousTargetFrame && target) {
      for (const key of frameKeys) rect[key] += destination[key] - previousTargetFrame[key];
    }
    previousTargetFrame = target ? destination : null;
    const cx = (destination.left + destination.right) / 2, cy = (destination.top + destination.bottom) / 2;
    const cos = Math.cos(destination.angle), sin = Math.sin(destination.angle);
    const localX = (mouseX - cx) * cos + (mouseY - cy) * sin;
    const localY = -(mouseX - cx) * sin + (mouseY - cy) * cos;
    const goalX = overTargetArea ? Math.max(-.5, Math.min(.5, localX / Math.max(1, destination.right - destination.left - offset * 2))) * followRange : 0;
    const goalY = overTargetArea ? Math.max(-.5, Math.min(.5, localY / Math.max(1, destination.bottom - destination.top - offset * 2))) * followRange : 0;
    if (reducedMotion.matches) {
      morph = goal; morphVelocity = 0; followX = goalX; followY = goalY; followVX = followVY = 0;
      rect = { ...destination }; velocity = zeroFrame();
    } else {
      [morph, morphVelocity] = spring(morph, morphVelocity, goal, 390, 38, dt);
      [followX, followVX] = spring(followX, followVX, goalX, 145, 22, dt);
      [followY, followVY] = spring(followY, followVY, goalY, 145, 22, dt);
      for (const key of frameKeys) [rect[key], velocity[key]] = spring(rect[key], velocity[key], destination[key], 190, 26, dt);
    }
    draw();
    const moving = Math.abs(morph - goal) > .0004 || Math.abs(morphVelocity) > .005
      || Math.abs(followX - goalX) + Math.abs(followY - goalY) > .02 || Math.abs(followVX) + Math.abs(followVY) > .04
      || frameKeys.some(key => Math.abs(rect[key] - destination[key]) > (key === 'angle' ? .0001 : .02) || Math.abs(velocity[key]) > (key === 'angle' ? .0002 : .04));
    if (moving) schedule();
    else {
      morph = goal; morphVelocity = 0;
      followX = goalX; followY = goalY; followVX = followVY = 0;
      rect = { ...destination }; velocity = zeroFrame();
      draw(); previousTime = 0;
    }
    if (options.followTargetTransform && overTargetArea && target && hasTransformAnimation(target)) schedule();
  }
  function schedule() { if (!frame && active && shown && finePointer.matches) frame = requestAnimationFrame(tick); }
  function show(element: Element | null) {
    if (!active || !finePointer.matches || !known || document.hidden) return;
    shown = true;
    selectTarget(element);
    document.body.classList.add('focal-cursor-custom');
    svg.classList.add('is-visible');
    schedule();
  }
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    mouseX = event.clientX; mouseY = event.clientY; known = true;
    show(event.target instanceof Element ? event.target : null);
  }, { passive: true, signal: listeners.signal });
  document.addEventListener('mouseout', event => { if (!event.relatedTarget) { known = false; hide(); } }, { signal: listeners.signal });
  window.addEventListener('blur', () => { known = false; hide(); }, { signal: listeners.signal });
  window.addEventListener('scroll', () => { if (shown) show(document.elementFromPoint(mouseX, mouseY)); }, { capture: true, passive: true, signal: listeners.signal });
  window.addEventListener('resize', () => { if (shown) show(document.elementFromPoint(mouseX, mouseY)); }, { passive: true, signal: listeners.signal });
  const targetMotionStarted = (event: Event) => {
    if (options.followTargetTransform && shown && target && event.target === target) schedule();
  };
  document.addEventListener('transitionrun', targetMotionStarted, { capture: true, signal: listeners.signal });
  document.addEventListener('animationstart', targetMotionStarted, { capture: true, signal: listeners.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); }, { signal: listeners.signal });
  const preferenceChanged = () => {
    hide();
    if (active && finePointer.matches) show(document.elementFromPoint(mouseX, mouseY));
  };
  finePointer.addEventListener('change', preferenceChanged);
  reducedMotion.addEventListener('change', preferenceChanged);
  return {
    setActive(value: boolean) {
      active = value;
      document.body.classList.toggle('focal-cursor-page', value);
      if (value) document.body.style.setProperty('--focal-cursor-fallback', options.nativeCursor ?? 'auto');
      else document.body.style.removeProperty('--focal-cursor-fallback');
      if (value) show(document.elementFromPoint(mouseX, mouseY)); else hide();
    },
    dispose() {
      active = false; hide(); listeners.abort();
      document.body.classList.remove('focal-cursor-page');
      document.body.style.removeProperty('--focal-cursor-fallback');
      finePointer.removeEventListener('change', preferenceChanged);
      reducedMotion.removeEventListener('change', preferenceChanged);
    }
  };
}
