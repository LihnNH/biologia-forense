import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CASES, type CaseId } from '../data/cases';
import { useI18n } from '../i18n/I18n';
import { suspectPortraits } from '../data/suspectPortraits';

export function CaseScreen({ caseId, onHome, activePortrait, onPortrait, selectedGuess, onPick, onCode }: {
  caseId: CaseId;
  onHome: () => void;
  activePortrait: number | null;
  onPortrait: (index: number, source: HTMLButtonElement) => void;
  selectedGuess: string;
  onPick: (index: number) => void;
  onCode: () => void;
}) {
  const { t, cases, caseLabels } = useI18n();
  const [selecting, setSelecting] = useState(false);
  const gallery = useRef<HTMLUListElement>(null);
  const pickButton = useRef<HTMLButtonElement>(null);
  const wiggles = useRef<Animation[]>([]);
  const tilts = useMemo(() => CASES[caseId].suspects.map(() => (Math.random() < .5 ? -1 : 1) * (1.5 + Math.random() * 1.5)), [caseId]);
  useEffect(() => () => wiggles.current.forEach(animation => animation.cancel()), []);
  useEffect(() => {
    if (!selecting) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      wiggles.current.forEach(animation => animation.cancel());
      setSelecting(false);
      pickButton.current?.focus();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selecting]);

  function togglePicking() {
    wiggles.current.forEach(animation => animation.cancel());
    if (selecting) {
      setSelecting(false);
      return;
    }
    setSelecting(true);
    wiggles.current = [...(gallery.current?.children ?? [])].map((portrait, index) => portrait.animate(
      [0, -1.2, 1.2, -.7, .7, 0].map(angle => ({ transform: `rotate(${angle * Math.sign(tilts[index])}deg)` })),
      { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 535, easing: 'ease-in-out' },
    ));
  }
  return <article className="screen-panel case-panel">
    <div className="case-heading">
      <button className="back-button case-back" type="button" onClick={onHome} aria-label={t('back')} title={t('backToCases')}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <h2 className="screen-title" id="case-title">{caseLabels[caseId]}</h2>
    </div>
    <ul className={`suspect-gallery${selecting ? ' is-picking' : ''}`} ref={gallery} aria-label={t('suspects', { case: caseLabels[caseId] })}>
      {cases[caseId].suspects.map((suspect, index) => <li className={`suspect-portrait${selectedGuess === suspect.name ? ' is-guess' : ''}`} style={{ '--portrait-tilt': `${tilts[index]}deg` } as CSSProperties} key={suspect.name}>
        <button className={`portrait-button${activePortrait === index ? ' is-expanded' : ''}`} type="button" aria-label={t(selecting && selectedGuess === suspect.name ? 'unmarkSuspect' : selecting ? 'markSuspect' : 'suspectInfo', { name: suspect.name })} aria-pressed={selecting ? selectedGuess === suspect.name : undefined} aria-haspopup={selecting ? undefined : 'dialog'} onClick={event => {
          if (selecting) {
            wiggles.current.forEach(animation => animation.cancel());
            onPick(index);
            setSelecting(false);
          } else onPortrait(index, event.currentTarget);
        }}>
          <img draggable={false} src={suspectPortraits[caseId][suspect.name]} alt={t('photo', { name: suspect.name })} width={900} height={1420} decoding="async" />
        </button>
      </li>)}
    </ul>
    <p className="case-image-notice">
      <span className="case-image-notice-icon" aria-hidden="true" />
      <span>{t('suspectImageNotice')}</span>
    </p>
    <div className="case-actions">
      <button className="action-button" type="button" id="open-pick" ref={pickButton} aria-pressed={selecting} onClick={togglePicking}>{t(selecting ? 'statements' : 'guess')}</button>
      <button className="action-button" type="button" id="open-guess" disabled={!selectedGuess} onClick={onCode}>{t('code')}</button>
    </div>
    <p className="sr-only" role="status" aria-live="polite">{selecting ? t('pickInstructions') : selectedGuess ? t('guessAvailable', { name: selectedGuess }) : t('chooseSuspect')}</p>
  </article>;
}
