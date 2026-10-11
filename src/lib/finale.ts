// Milliseconds after the existing guess verification finishes.
export const FINALE_TIMING = {
  fade: 335,
  black: 390,
  title: 145,
  reveal: 610,
} as const;

export type FinalePhase = 'idle' | keyof typeof FINALE_TIMING | 'complete';

export const NEXT_FINALE_PHASE = {
  fade: 'black',
  black: 'title',
  title: 'reveal',
  reveal: 'complete',
} as const;
