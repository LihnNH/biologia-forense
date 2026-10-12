import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { Background } from './components/Background';
import { Home } from './components/Home';
import { CaseScreen } from './components/CaseScreen';
import { GuessScreen } from './components/GuessScreen';
import { ResultScreen } from './components/ResultScreen';
import { InvestigationModals } from './components/InvestigationModals';
import { PortraitModal, type PortraitOrigin } from './components/PortraitModal';
import { SettingsModal } from './components/SettingsModal';
import { useI18n } from './i18n/I18n';
import { suspectPortraits } from './data/suspectPortraits';
import { finaleColors } from './data/finaleImages';
import DnaViewer from './components/DnaViewer';
import { StartupLoading } from './components/StartupLoading';
import { assetCount, preloadAssets, type AssetProgress } from './lib/preloadAssets';
import { useInvestigation, type View } from './lib/useInvestigation';
import { useSmokeSettings } from './lib/smokeSettings';
import type { CaseId } from './data/cases';
import { VisitorGroupModal } from './components/VisitorGroupModal';
import { onFairStatisticsReset, registerGroup, registerSolvedCase } from './lib/fairStatistics';
import { PageHelpModal, type HelpPage } from './components/PageHelpModal';

export default function App() {
  const { cases } = useI18n();
  const { settings: smokeSettings, setSettings: setSmokeSettings } = useSmokeSettings();
  const [pendingCase, setPendingCase] = useState<CaseId | null>(null);
  const [helpPage, setHelpPage] = useState<HelpPage | null>(null);
  const closeHelp = useCallback(() => setHelpPage(null), []);
  const activeGroup = useRef<{ counted: boolean; solutionRecorded: boolean } | null>(null);
  const [statisticsSaveError, setStatisticsSaveError] = useState(false);
  useEffect(() => onFairStatisticsReset(() => {
    activeGroup.current = null;
    setStatisticsSaveError(false);
  }), []);
  const [settingsModalPhase, setSettingsModalPhase] = useState<'closed' | 'open' | 'closing'>('closed');
  const settingsModalOpen = settingsModalPhase !== 'closed';
  const closeSettingsModal = useCallback(() => setSettingsModalPhase(phase => phase === 'closed' ? phase : 'closing'), []);
  const handleGlobalKey = useEffectEvent((event: KeyboardEvent) => {
    if (finaleTransitioning || pendingCase) return;
    const key = event.key.toLowerCase();
    if (helpPage) {
      if (event.key === 'Escape' || (key === 'h' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing)) {
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) closeHelp();
      }
      return;
    }
    if (key === 'h' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing) {
      if (loading || settingsModalOpen || state.modal || portrait || (state.view !== 'home' && state.view !== 'case' && state.view !== 'guess')) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable) && !target.matches('.code-input')) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat && !verdict) setHelpPage(state.view);
      return;
    }
    if (settingsModalOpen) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeSettingsModal(); return; }
      if (event.key.toLowerCase() !== 'c') return;
    }
    if (event.key.toLowerCase() !== 'c' || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    const target = event.target;
    if (!settingsModalOpen && target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable)) return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) setSettingsModalPhase(phase => phase === 'open' ? 'closing' : 'open');
  });
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKey, true);
    return () => document.removeEventListener('keydown', handleGlobalKey, true);
  }, []);
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
  const finaleTransitioning = state.finalePhase !== 'idle' && state.finalePhase !== 'complete';
  useEffect(() => {
    if (loading || settingsModalOpen || finaleTransitioning || (helpPage && state.view !== helpPage)) closeHelp();
  }, [loading, settingsModalOpen, finaleTransitioning, state.view, helpPage, closeHelp]);
  useEffect(() => {
    const group = activeGroup.current;
    if (state.view !== 'done' || state.finalePhase !== 'complete' || !group?.counted || group.solutionRecorded) return;
    group.solutionRecorded = true;
    void registerSolvedCase(state.caseId).then(() => setStatisticsSaveError(false)).catch(() => {
      group.solutionRecorded = false;
      setStatisticsSaveError(true);
    });
  }, [state.view, state.finalePhase, state.caseId, settingsModalOpen]);
  useEffect(() => {
    if (finaleTransitioning) setSettingsModalPhase('closed');
  }, [finaleTransitioning]);
  const [portrait, setPortrait] = useState<PortraitOrigin | null>(null);
  const closePortrait = useCallback(() => setPortrait(null), []);
  const portraitOpener = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!portrait) {
      portraitOpener.current?.focus({ preventScroll: true });
      portraitOpener.current = null;
    }
  }, [portrait]);
  const hadModal = useRef(false);
  useEffect(() => {
    if (hadModal.current && !state.modal) {
      document.querySelector<HTMLElement>('#open-pick')?.focus({ preventScroll: true });
    }
    hadModal.current = Boolean(state.modal);
  }, [state.modal, state.view, selectedGuess]);
  const screenProps = (view: View) => ({
    className: `view${state.view === view ? ' is-active' : ''}`,
    id: `${view}-view`, 'data-view': view, hidden: state.view !== view,
  });
  return <>
    <Background active={!loading} smokeSettings={smokeSettings} smokeTint={state.view === 'done' ? finaleColors[state.caseId] : null} />
    <main className={`page${loading ? ' is-loading' : ''}${state.view === 'done' ? ' is-finale' : ''}`} inert={loading || finaleTransitioning || Boolean(state.modal) || Boolean(portrait) || settingsModalOpen || Boolean(pendingCase) || Boolean(helpPage)} aria-hidden={loading}>
      <section {...screenProps('home')}><Home onCase={setPendingCase} onInfo={() => dispatch({ type: 'info' })} /></section>
      <section {...screenProps('case')}>{state.view === 'case' && <CaseScreen caseId={state.caseId} onHome={() => dispatch({ type: 'navigate', view: 'home' })} activePortrait={portrait?.index ?? null} selectedGuess={selectedGuess} onPick={index => dispatch({ type: 'pick', index })} onCode={() => dispatch({ type: 'navigate', view: 'guess' })} onPortrait={(index, source) => {
        portraitOpener.current = source;
        setPortrait({ index, source, rect: source.querySelector('img')!.getBoundingClientRect() });
      }} />}</section>
      <section {...screenProps('guess')}><GuessScreen caseId={state.caseId} active={state.view === 'guess'} blocked={finaleTransitioning || Boolean(state.modal) || settingsModalOpen || Boolean(helpPage)} selectedGuess={selectedGuess} code={state.code} verdict={verdict} onCode={code => dispatch({ type: 'code', code })} onBack={() => dispatch({ type: 'navigate', view: 'case' })} onInfo={() => dispatch({ type: 'info' })} /></section>
      <section {...screenProps('info')}><DnaViewer active={!loading && state.view === 'info'} onPrepared={onDnaPrepared} onBack={() => dispatch({ type: 'closeInfo' })} /></section>
      <section {...screenProps('done')}>{state.view === 'done' && <ResultScreen caseId={state.caseId} phase={state.finalePhase} incorrectSuspect={state.incorrectSuspect} onHome={() => dispatch({ type: 'navigate', view: 'home' })} />}</section>
    </main>
    {(state.finalePhase === 'fade' || state.finalePhase === 'black') && <div className={`finale-blackout is-${state.finalePhase}`} data-phase={state.finalePhase} aria-hidden="true" />}
    {loading && <StartupLoading completed={assets.completed + Number(dnaPrepared)} total={assets.total + 1} failed={assets.failed} waitingForDna={!dnaPrepared}
      onRetry={() => { setAssets({ completed: 0, total: assetCount, failed: 0 }); setAttempt(value => value + 1); }}
      onContinue={() => setContinueWithoutAssets(true)} />}
    <InvestigationModals modal={state.modal} onClose={() => dispatch({ type: 'closeModal' })} />
    {helpPage && <PageHelpModal page={helpPage} onClose={closeHelp} />}
    {portrait && <PortraitModal origin={portrait} suspect={cases[state.caseId].suspects[portrait.index]} image={suspectPortraits[state.caseId][cases[state.caseId].suspects[portrait.index].name]} onClose={closePortrait} />}
    {pendingCase && <VisitorGroupModal caseId={pendingCase} onClose={() => setPendingCase(null)} onConfirm={async visitors => {
      await registerGroup(pendingCase, visitors);
      activeGroup.current = { counted: visitors !== 0n, solutionRecorded: false };
      setStatisticsSaveError(false);
      dispatch({ type: 'case', id: pendingCase });
      setPendingCase(null);
    }} />}
    {settingsModalOpen && <SettingsModal statisticsSaveError={statisticsSaveError} smokeSettings={smokeSettings} onSmokeChange={setSmokeSettings} closing={settingsModalPhase === 'closing'} onExited={() => setSettingsModalPhase(phase => phase === 'closing' ? 'closed' : phase)} onClose={closeSettingsModal} />}
  </>;
}
