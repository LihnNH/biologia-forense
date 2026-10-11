import { useEffect, useLayoutEffect, useReducer } from 'react';
import { CASES, CASE_RESULTS, type CaseId } from '../data/cases';
import { isCorrectCode } from './investigation';
import { FINALE_TIMING, NEXT_FINALE_PHASE, type FinalePhase } from './finale';

export type View = 'home' | 'case' | 'guess' | 'info' | 'done';
export type ModalKind = 'error' | null;
interface State {
  view: View;
  caseId: CaseId;
  modal: ModalKind;
  guesses: Partial<Record<CaseId, string>>;
  code: string[];
  infoOrigin: 'home' | 'guess';
  finalePhase: FinalePhase;
  incorrectSuspect: boolean;
}
export type Action =
  | { type: 'case'; id: CaseId }
  | { type: 'navigate'; view: 'home' | 'case' | 'guess' }
  | { type: 'info' }
  | { type: 'closeInfo' }
  | { type: 'pick'; index: number }
  | { type: 'closeModal' }
  | { type: 'code'; code: string[] }
  | { type: 'verified'; correct: boolean }
  | { type: 'advanceFinale' };

const emptyCode = () => ['', '', '', ''];
const initialState: State = {
  view: 'home', caseId: 'Veneno', modal: null, guesses: {}, code: emptyCode(),
  infoOrigin: 'home',
  finalePhase: 'idle',
  incorrectSuspect: false,
};

function reducer(state: State, action: Action): State {
  const transitioning = state.finalePhase !== 'idle' && state.finalePhase !== 'complete';
  if (transitioning && action.type !== 'advanceFinale') return state;
  const pending = state.code.every(Boolean);
  switch (action.type) {
    case 'case':
      return { ...state, caseId: action.id, view: 'case', modal: null, code: emptyCode(), finalePhase: 'idle', incorrectSuspect: false };
    case 'navigate':
      if (action.view === 'guess' && !state.guesses[state.caseId]) return state;
      return { ...state, view: action.view, modal: null, code: emptyCode(), finalePhase: 'idle', incorrectSuspect: false };
    case 'info':
      return { ...state, view: 'info', modal: null,
        infoOrigin: state.view === 'guess' ? 'guess' : 'home',
        code: pending ? emptyCode() : state.code };
    case 'closeInfo':
      return { ...state, view: state.infoOrigin };
    case 'pick': {
      if (state.view !== 'case') return state;
      const suspect = CASES[state.caseId].suspects[action.index];
      if (!suspect) return state;
      return { ...state, guesses: { ...state.guesses, [state.caseId]: suspect.name },
        modal: null, code: emptyCode() };
    }
    case 'closeModal':
      return { ...state, modal: null, view: state.modal === 'error' ? 'case' : state.view };
    case 'code':
      return { ...state, code: action.code };
    case 'verified': {
      if (state.view !== 'guess') return state;
      if (action.correct) return { ...state, finalePhase: 'fade',
        incorrectSuspect: state.guesses[state.caseId] !== CASE_RESULTS[state.caseId].culprit };
      const guesses = { ...state.guesses };
      delete guesses[state.caseId];
      return { ...state, guesses, code: emptyCode(),
        view: 'guess', modal: 'error' };
    }
    case 'advanceFinale': {
      if (state.finalePhase === 'idle' || state.finalePhase === 'complete') return state;
      const finalePhase = NEXT_FINALE_PHASE[state.finalePhase];
      if (finalePhase !== 'title') return { ...state, finalePhase };
      const guesses = { ...state.guesses };
      delete guesses[state.caseId];
      return { ...state, finalePhase, guesses, code: emptyCode(), view: 'done', modal: null };
    }
  }
}

export function useInvestigation() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const selectedGuess = state.guesses[state.caseId] ?? '';
  const complete = state.code.every(Boolean);
  const verdict: 'correct' | 'incorrect' | null = selectedGuess && complete
    ? (isCorrectCode(state.caseId, state.code.join('')) ? 'correct' : 'incorrect')
    : null;

  useEffect(() => {
    if (!verdict || state.view !== 'guess' || state.modal || state.finalePhase !== 'idle') return;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'verified', correct: verdict === 'correct' });
    }, verdict === 'correct' ? 320 : 420);
    return () => window.clearTimeout(timer);
  }, [verdict, state.code, state.caseId, state.view, state.modal, state.finalePhase, selectedGuess]);

  useEffect(() => {
    if (state.finalePhase === 'idle' || state.finalePhase === 'complete') return;
    const timer = window.setTimeout(() => dispatch({ type: 'advanceFinale' }), FINALE_TIMING[state.finalePhase]);
    return () => window.clearTimeout(timer);
  }, [state.finalePhase]);

  useLayoutEffect(() => {
    document.body.classList.toggle('finale-open', state.view === 'done');
    document.body.classList.toggle('finale-title', state.finalePhase === 'title');
    document.body.classList.toggle('finale-transitioning', state.finalePhase !== 'idle' && state.finalePhase !== 'complete');
    return () => document.body.classList.remove('finale-open', 'finale-title', 'finale-transitioning');
  }, [state.view, state.finalePhase]);

  useEffect(() => {
    document.body.classList.toggle('dna-viewer-open', state.view === 'info');
    return () => document.body.classList.remove('dna-viewer-open');
  }, [state.view]);

  useEffect(() => {
    if (state.view === 'home' || state.view === 'case' || state.view === 'info' || state.view === 'done') {
      window.scrollTo({ top: 0, behavior: state.view === 'done' ? 'instant' : 'smooth' });
    }
  }, [state.view, state.caseId]);

  return { state, dispatch, selectedGuess, verdict };
}
