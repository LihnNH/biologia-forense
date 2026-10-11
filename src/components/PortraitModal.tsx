import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Suspect } from '../data/cases';
import { Markdown } from './Markdown';
import { useI18n } from '../i18n/I18n';

export interface PortraitOrigin {
  index: number;
  source: HTMLButtonElement;
  rect: DOMRect;
}

function transformFrom(from: DOMRect, to: DOMRect) {
  return `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.width / to.width}, ${from.height / to.height})`;
}

function geometry(rect: DOMRect) {
  return { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` };
}

export function PortraitModal({ origin, suspect, image, onClose }: {
  origin: PortraitOrigin;
  suspect: Suspect;
  image: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const panel = useRef<HTMLDivElement>(null);
  const flight = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const exiting = useRef(false);
  const [ready, setReady] = useState(false);
  const [closing, setClosing] = useState(false);

  // Lock scrolling before measuring the final panel, so its bounds stay stable.
  useLayoutEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const requestClose = useCallback(() => {
    if (exiting.current || !panel.current || !flight.current || !content.current || !backdrop.current) return;
    exiting.current = true;
    setClosing(true);
    const target = origin.source.querySelector('img')?.getBoundingClientRect() ?? origin.rect;
    const currentPanelTransform = getComputedStyle(panel.current).transform;
    const currentPhoto = { ...geometry(flight.current.getBoundingClientRect()), opacity: getComputedStyle(flight.current).opacity };
    const currentContentOpacity = getComputedStyle(content.current).opacity;
    const currentBackdropOpacity = getComputedStyle(backdrop.current).opacity;
    animations.current.forEach(animation => animation.cancel());
    const options: KeyframeAnimationOptions = {
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 300,
      easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards',
    };
    const returnPanel = panel.current.animate([
      { transform: currentPanelTransform }, { transform: transformFrom(target, panel.current.getBoundingClientRect()) },
    ], options);
    const returnPhoto = flight.current.animate([
      currentPhoto, { ...geometry(target), opacity: 1, borderRadius: '5px' },
    ], options);
    const hideContent = content.current.animate([{ opacity: currentContentOpacity }, { opacity: 0, offset: .35 }, { opacity: 0 }], options);
    const hideBackdrop = backdrop.current.animate([{ opacity: currentBackdropOpacity }, { opacity: 0 }], options);
    animations.current = [returnPanel, returnPhoto, hideContent, hideBackdrop];
    void returnPhoto.finished.then(onClose).catch(() => {});
  }, [origin, onClose]);

  useLayoutEffect(() => {
    if (!panel.current || !flight.current || !content.current || !backdrop.current) return;
    const destination = panel.current.getBoundingClientRect();
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const options: KeyframeAnimationOptions = { duration: reducedMotion ? 1 : 420, fill: 'forwards', easing: 'cubic-bezier(.22, 1, .36, 1)' };
    // The floating image starts at the exact image bounds; the gallery keeps its space.
    const expandPanel = panel.current.animate([
      { transform: transformFrom(origin.rect, destination) },
      { transform: 'none' },
    ], options);
    const expandPhoto = flight.current.animate([
      { ...geometry(origin.rect), borderRadius: '5px' },
      { ...geometry(destination), borderRadius: '10px' },
    ], options);
    const hidePhoto = flight.current.animate([{ opacity: 1 }, { opacity: 0 }], {
      ...options, duration: reducedMotion ? 1 : 240, easing: 'ease-out',
    });
    const revealContent = content.current.animate([
      { opacity: 0 }, { opacity: 0, offset: .2 }, { opacity: 1 },
    ], { ...options, duration: reducedMotion ? 1 : 320, easing: 'ease-out' });
    const revealBackdrop = backdrop.current.animate([{ opacity: 0 }, { opacity: 1 }], { ...options, duration: reducedMotion ? 1 : 240 });
    animations.current = [expandPanel, expandPhoto, hidePhoto, revealContent, revealBackdrop];
    void expandPanel.finished.then(() => { if (!exiting.current) setReady(true); }).catch(() => {});
    return () => animations.current.forEach(animation => animation.cancel());
  }, [origin]);

  useEffect(() => {
    const container = panel.current;
    if (!container) return;
    const focusable = () => [...container.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')];
    (focusable()[0] ?? container).focus({ preventScroll: true });
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); requestClose(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first) { event.preventDefault(); container?.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [requestClose]);

  return createPortal(<div className="portrait-modal" role="dialog" aria-modal="true" aria-labelledby="portrait-title" data-phase={closing ? 'closing' : ready ? 'open' : 'opening'}>
    <div className="portrait-backdrop" ref={backdrop} onClick={requestClose} aria-hidden="true" />
    <div className="modal-panel portrait-panel" ref={panel} tabIndex={-1}>
      <div className="portrait-content" ref={content}>
        <p className="result-kicker">{t('suspectDetails')}</p>
        <h2 className="modal-title" id="portrait-title">{suspect.name}</h2>
        <Markdown className="suspect-text" text={`### ${suspect.role}\n\n${suspect.statement}`} />
        <button className="back-button" type="button" onClick={requestClose}>{t('close')}</button>
      </div>
    </div>
    <div className="portrait-flight" ref={flight} aria-hidden="true"><img draggable={false} src={image} alt="" /></div>
  </div>, document.body);
}
