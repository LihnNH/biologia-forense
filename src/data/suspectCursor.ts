import type { FocalCursorOptions } from '../lib/focalCursor/controller';

// Page-specific selectors and styling stay outside the reusable cursor engine.
export const suspectCursorOptions: FocalCursorOptions = {
  scopeSelector: '#case-view',
  targetSelector: '.suspect-portrait',
  continuitySelector: '.suspect-gallery',
  targetPadding: 14,
  followRange: 19,
  followTargetTransform: true,
  // To disable targeting while picking, use '.suspect-gallery:not(.is-picking) .suspect-portrait' above.
  geometry: { cornerShape: 'squircle', cornerRadius: 11 * 2.24, cornerLength: 11 * 2.24 + 12 },
  fallbackGeometry: { cornerShape: 'circle', cornerRadius: 11, cornerLength: 19 },
  nativeCursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m21 21l-5.482-5.482m-5.185 2.149a7.333 7.333 0 1 0 0-14.667a7.333 7.333 0 0 0 0 14.667'/%3E%3C/svg%3E") 14 14, auto`,
};
