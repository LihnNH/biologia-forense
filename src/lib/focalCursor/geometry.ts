export type Rect = { left: number; top: number; right: number; bottom: number };

export interface FocalGeometryOptions {
  samples?: number;
  lensSize?: number;
  lensHotspot?: number;
  cornerRadius?: number;
  cornerLength?: number;
  cornerShape?: 'circle' | 'squircle';
}

const starts = [Math.PI, Math.PI * 1.5, 0, Math.PI * .5];
const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];

// Geometry is independent of the DOM, screen selectors and animation lifecycle.
export function createFocalGeometry(options: FocalGeometryOptions = {}) {
  const samples = Math.max(1, Math.round(options.samples ?? 32));
  const lensScale = (options.lensSize ?? 32) / 24;
  const lensRadius = 7.333 * lensScale;
  const lensOffset = 10.333 * lensScale - (options.lensHotspot ?? 14);
  const radius = Math.max(0, options.cornerRadius ?? 11);
  const length = Math.max(radius, options.cornerLength ?? 19);
  const squircle = options.cornerShape === 'squircle';
  const arc = [{ distance: 0, x: 0, y: radius }];
  let arcLength = 0;
  if (squircle) {
    for (let i = 1; i <= 512; i++) {
      const angle = i / 512 * Math.PI / 2;
      const x = radius * (1 - Math.sqrt(Math.max(0, Math.cos(angle))));
      const y = radius * (1 - Math.sqrt(Math.max(0, Math.sin(angle))));
      const previous = arc.at(-1)!;
      arcLength += Math.hypot(x - previous.x, y - previous.y);
      arc.push({ distance: arcLength, x, y });
    }
  }

  function arcPoint(distance: number) {
    let low = 0, high = arc.length - 1;
    while (low + 1 < high) {
      const middle = (low + high) >> 1;
      if (arc[middle].distance <= distance) low = middle;
      else high = middle;
    }
    const before = arc[low], after = arc[high];
    const amount = (distance - before.distance) / Math.max(.0001, after.distance - before.distance);
    return [before.x + (after.x - before.x) * amount, before.y + (after.y - before.y) * amount];
  }

  function corner(index: number, t: number, rect: Rect, dx: number, dy: number) {
    const straight = length - radius;
    const curved = squircle ? arcLength : Math.PI * radius / 2;
    const distance = t * (straight * 2 + curved);
    let x: number, y: number;
    if (distance < straight) { x = 0; y = length - distance; }
    else if (distance < straight + curved) {
      if (squircle) [x, y] = arcPoint(distance - straight);
      else {
        const angle = Math.PI + (distance - straight) / radius;
        x = radius + radius * Math.cos(angle); y = radius + radius * Math.sin(angle);
      }
    } else { x = radius + distance - straight - curved; y = 0; }
    const cos = Math.round(Math.cos(rotations[index])), sin = Math.round(Math.sin(rotations[index]));
    return [(index === 0 || index === 3 ? rect.left : rect.right) + x * cos - y * sin + dx,
      (index === 0 || index === 1 ? rect.top : rect.bottom) + x * sin + y * cos + dy];
  }

  function lens(index: number, t: number, mouseX: number, mouseY: number) {
    const angle = starts[index] + t * Math.PI / 2;
    return [mouseX + lensOffset + lensRadius * Math.cos(angle), mouseY + lensOffset + lensRadius * Math.sin(angle)];
  }

  return { samples, lensScale, lensOffset, corner, lens };
}
