import { useCallback, useEffect, useRef, useState } from 'react';
import { Background } from './components/Background';
import { Home } from './components/Home';
import { CaseScreen } from './components/CaseScreen';
import { GuessScreen } from './components/GuessScreen';
import { ResultScreen } from './components/ResultScreen';
import { InvestigationModals } from './components/InvestigationModals';
import DnaViewer from './components/DnaViewer';
import { StartupLoading } from './components/StartupLoading';
import { assetCount, preloadAssets, type AssetProgress } from './lib/preloadAssets';
import { useInvestigation, type View } from './lib/useInvestigation';

export default function App() {
  const [assets, setAssets] = useState<AssetProgress>({ completed: 0, total: assetCount, failed: 0 });
  const [dnaPrepared, setDnaPrepared] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [continueWithoutAssets, setContinueWithoutAssets] = useState(false);
  const onDnaPrepared = useCallback(() => setDnaPrepared(true), []);
  const loading = !dnaPrepared || assets.completed < assets.total || (assets.failed > 0 && !continueWithoutAssets);
  useEffect(() => {
    let cancelled = false;
    void preloadAssets(progress => { if (!cancelled) setAssets(progress); });
    return () => { cancelled = true; };
  }, [attempt]);
  useEffect(() => {
    document.body.classList.toggle('startup-loading', loading);
    return () => document.body.classList.remove('startup-loading');
  }, [loading]);
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
    <main className={`page${loading ? ' is-loading' : ''}`} inert={loading || Boolean(state.modal)} aria-hidden={loading}>
      <section {...screenProps('home')}><Home onCase={id => dispatch({ type: 'case', id })} onInfo={() => dispatch({ type: 'info' })} /></section>
      <section {...screenProps('case')}>{state.view === 'case' && <CaseScreen caseId={state.caseId} onHome={() => dispatch({ type: 'navigate', view: 'home' })} onGuess={() => dispatch({ type: 'navigate', view: 'guess' })} />}</section>
      <section {...screenProps('guess')}><GuessScreen caseId={state.caseId} active={state.view === 'guess'} blocked={Boolean(state.modal)} selectedGuess={selectedGuess} code={state.code} verdict={verdict} onCode={code => dispatch({ type: 'code', code })} onBack={() => dispatch({ type: 'navigate', view: 'case' })} onSuspects={openSuspects} onInfo={() => dispatch({ type: 'info' })} /></section>
      <section {...screenProps('info')}><DnaViewer active={!loading && state.view === 'info'} onPrepared={onDnaPrepared} onBack={() => dispatch({ type: 'closeInfo' })} /></section>
      <section {...screenProps('done')}><ResultScreen caseId={state.caseId} onHome={() => dispatch({ type: 'navigate', view: 'home' })} /></section>
    </main>
    {loading && <StartupLoading completed={assets.completed + Number(dnaPrepared)} total={assets.total + 1} failed={assets.failed} waitingForDna={!dnaPrepared}
      onRetry={() => { setAssets({ completed: 0, total: assetCount, failed: 0 }); setAttempt(value => value + 1); }}
      onContinue={() => setContinueWithoutAssets(true)} />}
    <InvestigationModals modal={state.modal} caseId={state.caseId} selectedGuess={selectedGuess} suspectIndex={state.activeSuspect} onClose={() => dispatch({ type: 'closeModal' })} onStatement={index => dispatch({ type: 'statement', index })} onMark={() => dispatch({ type: 'mark' })} />
  </>;
}
