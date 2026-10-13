import type { Rect } from './geometry';

export type TargetFrame = Rect & { angle: number };

// Reconstruct a rotated border box instead of outlining its axis-aligned bounds.
export function readTargetFrame(target: HTMLElement, padding: number, followTransform: boolean): TargetFrame {
  const box = target.getBoundingClientRect();
  if (!followTransform) return { left: box.left - padding, top: box.top - padding, right: box.right + padding, bottom: box.bottom + padding, angle: 0 };
  const style = getComputedStyle(target);
  const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
  const borderBoxSize = (dimension: 'width' | 'height') => {
    const size = parseFloat(style[dimension]);
    if (!Number.isFinite(size)) return dimension === 'width' ? target.offsetWidth : target.offsetHeight;
    if (style.boxSizing === 'border-box') return size;
    const sides = dimension === 'width' ? ['Left', 'Right'] : ['Top', 'Bottom'];
    return size + sides.reduce((sum, side) => sum + parseFloat(style.getPropertyValue(`padding-${side.toLowerCase()}`))
      + parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)), 0);
  };
  const width = borderBoxSize('width') * Math.hypot(matrix.a, matrix.b);
  const height = borderBoxSize('height') * Math.hypot(matrix.c, matrix.d);
  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  return { left: cx - width / 2 - padding, top: cy - height / 2 - padding,
    right: cx + width / 2 + padding, bottom: cy + height / 2 + padding, angle: Math.atan2(matrix.b, matrix.a) };
}

export function rotateFramePoint(x: number, y: number, frame: TargetFrame) {
  const cx = (frame.left + frame.right) / 2, cy = (frame.top + frame.bottom) / 2;
  const cos = Math.cos(frame.angle), sin = Math.sin(frame.angle);
  return [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos];
}

export function hasTransformAnimation(target: HTMLElement) {
  return target.getAnimations().some(animation => (animation.playState === 'running' || animation.pending)
    && animation.effect instanceof KeyframeEffect
    && animation.effect.getKeyframes().some(keyframe => ['transform', 'translate', 'rotate', 'scale'].some(property => property in keyframe)));
}
