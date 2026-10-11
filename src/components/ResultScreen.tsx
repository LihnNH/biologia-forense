import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { CaseId } from '../data/cases';
import { finaleColors, finaleImages } from '../data/finaleImages';
import { suspectNameImages } from '../data/suspectNameImages';
import { FINALE_TIMING, type FinalePhase } from '../lib/finale';
import { useI18n } from '../i18n/I18n';
import { Markdown } from './Markdown';

export function ResultScreen({ caseId, phase, incorrectSuspect, onHome }: { caseId: CaseId; phase: FinalePhase; incorrectSuspect: boolean; onHome: () => void }) {
  const { t, caseLabels, caseResults } = useI18n();
  const result = caseResults[caseId];
  const nameImage = suspectNameImages[caseId][result.culprit];
  // Veneno starts with the crime itself; the other cases start with a repeated identification.
  const explanation = caseId === 'Veneno' ? result.explanation : result.explanation.split('\n\n').slice(1).join('\n\n');
  const screen = useRef<HTMLElement>(null);
  const titleAnchor = useRef<HTMLSpanElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Travel from the viewport center to the title's actual layout position.
    const measure = () => {
      const bounds = titleAnchor.current?.getBoundingClientRect();
      if (bounds) screen.current?.style.setProperty('--finale-title-offset', `${window.innerHeight / 2 - (bounds.top + bounds.height / 2)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (titleAnchor.current) observer.observe(titleAnchor.current);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [caseId]);

  useEffect(() => {
    if (phase === 'complete') heading.current?.focus({ preventScroll: true });
  }, [phase]);

  const screenStyle = {
    '--finale-accent': finaleColors[caseId].join(', '),
    '--finale-title-duration': `${FINALE_TIMING.title}ms`,
    '--finale-reveal-duration': `${FINALE_TIMING.reveal}ms`,
  } as CSSProperties;

  return <article className={`finale-screen is-${phase}`} data-phase={phase} ref={screen} style={screenStyle}>
    <div className="finale-artwork">
      <img draggable={false} src={finaleImages[caseId]} alt={t('photo', { name: result.culprit })} />
    </div>
    <header className="finale-heading">
      <h2 className="finale-title" id="result-title" ref={heading} tabIndex={-1}>
        <span className="finale-title-anchor" ref={titleAnchor}><span className="finale-case-name">{caseLabels[caseId]}</span></span>
        <span className="sr-only">: </span>
        <span className="finale-status">{t('caseSolved')}</span>
      </h2>
    </header>
    <div className="finale-content">
      <p className="finale-culprit">
        <span>{t('culpritWas')}</span>{' '}
        <span className="finale-culprit-signature">
          <strong className="finale-culprit-name" id="culprit-name">
            {nameImage ? <>
              <img draggable={false} className="finale-name-image" src={nameImage} alt="" />
              <span className="sr-only">{result.culprit}</span>
            </> : result.culprit}
          </strong>
        </span>
      </p>
      {incorrectSuspect && <p className="finale-guess-notice" id="result-guess-notice">{t('incorrectSuspectNotice')}</p>}
      <Markdown className="result-explanation finale-explanation" id="result-explanation" text={explanation} />
      <button className="action-button finale-home" type="button" id="done-home" disabled={phase !== 'complete'} onClick={onHome}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {t('backHome')}
      </button>
    </div>
  </article>;
}
