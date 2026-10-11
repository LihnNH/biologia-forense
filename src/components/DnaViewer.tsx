import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { hotspotImagePositions } from '../data/dna';
import { useI18n } from '../i18n/I18n';
import { createDnaScene, type DnaScene } from '../lib/dnaScene';
import { DnaFallback } from './DnaFallback';

export default function DnaViewer({ active, onBack, onPrepared }: { active: boolean; onBack: () => void; onPrepared: () => void }) {
  const { t, hotspots, language } = useI18n();
  const container = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const callout = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  const controller = useRef<DnaScene | null>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [titleOpen, setTitleOpen] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);
  const [displayedHotspot, setDisplayedHotspot] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);

  // Position the animated overlay without re-rendering React on every frame.
  const positionCallout = useEffectEvent(() => {
    if (displayedHotspot === null || !container.current || !callout.current || !path.current) return;
    const hotspot = hotspots[displayedHotspot - 1];
    let anchor: { x: number; y: number };
    if (fallback) {
      if (!image.current) return;
      const bounds = image.current.getBoundingClientRect();
      const viewerBounds = container.current.getBoundingClientRect();
      const position = hotspotImagePositions[displayedHotspot - 1];
      anchor = {
        x: bounds.left - viewerBounds.left - container.current.clientLeft + bounds.width * position.x,
        y: bounds.top - viewerBounds.top - container.current.clientTop + bounds.height * position.y,
      };
    } else {
      if (!controller.current) return;
      anchor = controller.current.project(hotspot.position);
    }
    const { x: anchorX, y: anchorY } = anchor;
    const width = container.current.clientWidth;
    const height = container.current.clientHeight;
    const cardWidth = callout.current.offsetWidth || 320;
    const cardHeight = callout.current.offsetHeight || 118;
    const side = anchorX > width * .58 ? -1 : 1;
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));
    const x = clamp(side > 0 ? anchorX + 68 : anchorX - cardWidth - 68, 18, width - cardWidth - 18);
    let y = anchorY - cardHeight - 52;
    if (y < 132) y = anchorY + 52;
    y = clamp(y, 18, height - cardHeight - 18);
    callout.current.style.setProperty('--callout-x', `${x}px`);
    callout.current.style.setProperty('--callout-y', `${y}px`);
    const endX = x > anchorX ? x : x + cardWidth;
    const endY = clamp(anchorY, y + 18, y + cardHeight - 18);
    const bend = Math.max(28, Math.abs(endX - anchorX) * .42);
    path.current.setAttribute('d', `M ${anchorX.toFixed(1)} ${anchorY.toFixed(1)} C ${(anchorX + side * bend).toFixed(1)} ${anchorY.toFixed(1)}, ${(endX - side * 24).toFixed(1)} ${endY.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`);
  });

  useLayoutEffect(() => {
    if (!active || !fallback) return;
    const reposition = () => positionCallout();
    reposition();
    const observer = new ResizeObserver(reposition);
    for (const element of [container.current, image.current, callout.current]) if (element) observer.observe(element);
    const currentImage = image.current;
    currentImage?.addEventListener('load', reposition);
    window.addEventListener('resize', reposition);
    return () => {
      observer.disconnect();
      currentImage?.removeEventListener('load', reposition);
      window.removeEventListener('resize', reposition);
    };
  }, [active, fallback, displayedHotspot, language]);

  useEffect(() => {
    if (!canvas.current || !container.current) return;
    let scene: DnaScene;
    try {
      scene = createDnaScene({ canvas: canvas.current, container: container.current,
        onReady: () => { setReady(true); onPrepared(); },
        onError: () => { setFallback(true); onPrepared(); },
        onDragging: setDragging, onFrame: positionCallout });
      controller.current = scene;
    } catch {
      setFallback(true);
      onPrepared();
      return;
    }
    return () => { scene.dispose(); controller.current = null; };
  }, [onPrepared]);

  useEffect(() => {
    controller.current?.setActive(active && !fallback);
    if (!active) setSelectedHotspot(null);
  }, [active, fallback]);

  useEffect(() => {
    if (selectedHotspot === null) {
      setSwitching(false);
      const timeout = window.setTimeout(() => { setDisplayedHotspot(null); path.current?.removeAttribute('d'); }, 320);
      return () => window.clearTimeout(timeout);
    }
    if (displayedHotspot === null) { setDisplayedHotspot(selectedHotspot); return; }
    if (displayedHotspot === selectedHotspot) return;
    setSwitching(true);
    const timeout = window.setTimeout(() => { setDisplayedHotspot(selectedHotspot); setSwitching(false); }, 180);
    return () => window.clearTimeout(timeout);
  }, [selectedHotspot, displayedHotspot]);

  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    if (!active || event.repeat) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.matches('input, textarea') || target.isContentEditable)) return;
    if (event.key.toLowerCase() === 'l') { event.preventDefault(); setLicenseOpen(open => !open); return; }
    if ((ready || fallback) && /^[1-6]$/.test(event.key)) {
      event.preventDefault();
      const id = Number(event.key);
      setSelectedHotspot(current => current === id ? null : id);
    } else setSelectedHotspot(null);
  });
  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const hotspot = displayedHotspot === null ? null : hotspots[displayedHotspot - 1];
  return <article ref={container} className={`dna-viewer-card${dragging ? ' dragging' : ''}${fallback ? ' using-2d-fallback' : ''}`} id="dna-viewer" aria-label={t(fallback ? 'dna2dLabel' : 'dna3dLabel')}>
    <canvas ref={canvas} tabIndex={0} aria-label={t('interactiveDna')} hidden={Boolean(fallback)} />
    <div className="dna-viewer-topbar">
      <div className="dna-title-stack">
        <button className="screen-title dna-viewer-title dna-title-button" type="button" id="dna-title-toggle" aria-expanded={titleOpen} aria-controls="dna-title-reveal" onClick={() => setTitleOpen(open => !open)}>DNA</button>
        <p className={`dna-title-reveal${titleOpen ? ' is-open' : ''}`} id="dna-title-reveal" aria-hidden={!titleOpen}>{t('dnaIntroBefore')}<em>DNA</em>{t('dnaIntroAfter')}<br />{t('dnaIntroTransmits')}<em>{t('geneticInfo')}</em>{t('dnaIntroEnd')}</p>
      </div>
      <button className="back-button" type="button" id="close-dna-info" onClick={onBack}>{t('back')}</button>
    </div>
    {fallback && <DnaFallback imageRef={image} selectedHotspot={selectedHotspot}
      onSelect={id => setSelectedHotspot(current => current === id ? null : id)} />}
    <div className={`dna-callout-layer${selectedHotspot !== null && hotspot ? ' is-visible' : ''}${switching ? ' is-switching' : ''}`} id="dna-callout-layer" aria-hidden={selectedHotspot === null}>
      <svg className="dna-callout-lines" aria-hidden="true"><path ref={path} className="dna-callout-path" id="dna-callout-path" /></svg>
      <article ref={callout} className="dna-callout" id="dna-callout" role="status" aria-live="polite">
        <span className="dna-callout-kicker" id="dna-callout-kicker">{hotspot ? t('key', { number: hotspot.id }) : ''}</span>
        <h3 className="dna-callout-title" id="dna-callout-title">{hotspot?.title}</h3>
        <p className="dna-callout-text" id="dna-callout-text">{hotspot?.text}</p>
      </article>
    </div>
    {!fallback && <p className={`dna-3d-status${ready ? ' hidden' : ''}`} id="dna-3d-status" role="status">{t('loadingDna')}</p>}
    <aside className={`dna-license-card${licenseOpen ? ' is-open' : ''}`} id="dna-license-card" aria-hidden={!licenseOpen} onPointerDown={event => event.stopPropagation()}>
      <h3 className="dna-license-title">{t('license')}</h3>
      <p className="dna-license-text">{t('licenseBefore')}<a href="https://skfb.ly/onW7w" target="_blank" rel="noopener noreferrer">“DNA”</a>{t('licenseAfter')}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{t('licenseName')}</a>.</p>
    </aside>
  </article>;
}
