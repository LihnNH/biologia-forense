import { useEffect, useReducer } from 'react';
import { CASES, type CaseId } from '../data/cases';
import { isCorrectGuess } from './investigation';

export type View = 'home' | 'case' | 'guess' | 'info' | 'done';
export type ModalKind = 'suspects' | 'statement' | 'error' | null;
interface State {
  view: View;
  caseId: CaseId;
  modal: ModalKind;
  guesses: Partial<Record<CaseId, string>>;
  code: string[];
  activeSuspect: number | null;
  pickerOrigin: 'case' | 'guess';
  infoOrigin: 'home' | 'guess';
  infoVisited: boolean;
}
export type Action =
  | { type: 'case'; id: CaseId }
  | { type: 'navigate'; view: 'home' | 'case' | 'guess' }
  | { type: 'info' }
  | { type: 'closeInfo' }
  | { type: 'suspects' }
  | { type: 'statement'; index: number }
  | { type: 'mark' }
  | { type: 'closeModal' }
  | { type: 'code'; code: string[] }
  | { type: 'verified'; correct: boolean };

const emptyCode = () => ['', '', '', ''];
const initialState: State = {
  view: 'home', caseId: 'Veneno', modal: null, guesses: {}, code: emptyCode(),
  activeSuspect: null, pickerOrigin: 'case', infoOrigin: 'home', infoVisited: false,
};

function reducer(state: State, action: Action): State {
  const pending = state.code.every(Boolean);
  switch (action.type) {
    case 'case':
      return { ...state, caseId: action.id, view: 'case', modal: null, code: emptyCode() };
    case 'navigate':
      return { ...state, view: action.view, modal: null, code: emptyCode() };
    case 'info':
      return { ...state, view: 'info', modal: null, infoVisited: true,
        infoOrigin: state.view === 'guess' ? 'guess' : 'home',
        code: pending ? emptyCode() : state.code };
    case 'closeInfo':
      return { ...state, view: state.infoOrigin };
    case 'suspects':
      return { ...state, modal: 'suspects', activeSuspect: null,
        pickerOrigin: state.view === 'guess' ? 'guess' : 'case',
        code: pending ? emptyCode() : state.code };
    case 'statement':
      return { ...state, modal: 'statement', activeSuspect: action.index };
    case 'mark': {
      if (state.activeSuspect === null) return state;
      const suspect = CASES[state.caseId].suspects[state.activeSuspect];
      if (!suspect) return state;
      return { ...state, guesses: { ...state.guesses, [state.caseId]: suspect.name },
        modal: state.pickerOrigin === 'guess' ? null : 'suspects',
        activeSuspect: null, code: emptyCode() };
    }
    case 'closeModal':
      return { ...state, modal: state.modal === 'suspects' ? null : 'suspects',
        activeSuspect: null, pickerOrigin: state.modal === 'error' ? 'guess' : state.pickerOrigin };
    case 'code':
      return { ...state, code: action.code };
    case 'verified': {
      const guesses = { ...state.guesses };
      delete guesses[state.caseId];
      return { ...state, guesses, code: emptyCode(),
        view: action.correct ? 'done' : 'guess', modal: action.correct ? null : 'error' };
    }
  }
}

export function useInvestigation() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const selectedGuess = state.guesses[state.caseId] ?? '';
  const complete = state.code.every(Boolean);
  const verdict: 'correct' | 'incorrect' | null = selectedGuess && complete
    ? (isCorrectGuess(state.caseId, selectedGuess, state.code.join('')) ? 'correct' : 'incorrect')
    : null;

  useEffect(() => {
    if (!verdict || state.view !== 'guess' || state.modal) return;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'verified', correct: verdict === 'correct' });
    }, verdict === 'correct' ? 320 : 420);
    return () => window.clearTimeout(timer);
  }, [verdict, state.code, state.caseId, state.view, state.modal, selectedGuess]);

  useEffect(() => {
    document.body.classList.toggle('dna-viewer-open', state.view === 'info');
    return () => document.body.classList.remove('dna-viewer-open');
  }, [state.view]);

  useEffect(() => {
    if (state.view === 'home' || state.view === 'case' || state.view === 'info' || state.view === 'done') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.view, state.caseId]);

  return { state, dispatch, selectedGuess, verdict };
}
