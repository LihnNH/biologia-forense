import { lazy, Suspense, useEffect, useRef } from 'react';
import { Background } from './components/Background';
import { Home } from './components/Home';
import { CaseScreen } from './components/CaseScreen';
import { GuessScreen } from './components/GuessScreen';
import { ResultScreen } from './components/ResultScreen';
import { InvestigationModals } from './components/InvestigationModals';
import { useInvestigation, type View } from './lib/useInvestigation';

const DnaViewer = lazy(() => import('./components/DnaViewer'));

export default function App() {
  const { state, dispatch, selectedGuess, verdict } = useInvestigation();
  const modalOpener = useRef<HTMLElement | null>(null);
  const hadModal = useRef(false);
  function openSuspects() {
    modalOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dispatch({ type: 'suspects' });
  }
  useEffect(() => {
    if (hadModal.current && !state.modal) {
      const focusTarget = state.view === 'guess'
        ? document.querySelector<HTMLElement>(selectedGuess ? '#guess-view .code-input' : '#change-guess')
        : modalOpener.current;
      focusTarget?.focus({ preventScroll: true });
      modalOpener.current = null;
    }
    hadModal.current = Boolean(state.modal);
  }, [state.modal, state.view, selectedGuess]);
  const screenProps = (view: View) => ({
    className: `view${state.view === view ? ' is-active' : ''}`,
    id: `${view}-view`, 'data-view': view, hidden: state.view !== view,
  });
  return <>
    <Background />
    <main className="page" inert={Boolean(state.modal)}>
      <section {...screenProps('home')}><Home onCase={id => dispatch({ type: 'case', id })} onInfo={() => dispatch({ type: 'info' })} /></section>
      <section {...screenProps('case')}><CaseScreen caseId={state.caseId} onHome={() => dispatch({ type: 'navigate', view: 'home' })} onSuspects={openSuspects} onGuess={() => dispatch({ type: 'navigate', view: 'guess' })} /></section>
      <section {...screenProps('guess')}><GuessScreen caseId={state.caseId} active={state.view === 'guess'} blocked={Boolean(state.modal)} selectedGuess={selectedGuess} code={state.code} verdict={verdict} onCode={code => dispatch({ type: 'code', code })} onBack={() => dispatch({ type: 'navigate', view: 'case' })} onSuspects={openSuspects} onInfo={() => dispatch({ type: 'info' })} /></section>
      <section {...screenProps('info')}>{state.infoVisited && <Suspense fallback={<p className="dna-3d-status" role="status">Carregando visualizador...</p>}><DnaViewer active={state.view === 'info'} onBack={() => dispatch({ type: 'closeInfo' })} /></Suspense>}</section>
      <section {...screenProps('done')}><ResultScreen caseId={state.caseId} onHome={() => dispatch({ type: 'navigate', view: 'home' })} /></section>
    </main>
    <InvestigationModals modal={state.modal} caseId={state.caseId} selectedGuess={selectedGuess} suspectIndex={state.activeSuspect} onClose={() => dispatch({ type: 'closeModal' })} onStatement={index => dispatch({ type: 'statement', index })} onMark={() => dispatch({ type: 'mark' })} />
  </>;
}
