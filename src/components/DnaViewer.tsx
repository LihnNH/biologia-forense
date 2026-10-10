import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { hotspots } from '../data/dna';
import { createDnaScene, type DnaScene } from '../lib/dnaScene';
import { DnaFallback } from './DnaFallback';

export default function DnaViewer({ active, onBack }: { active: boolean; onBack: () => void }) {
  const container = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const callout = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  const controller = useRef<DnaScene | null>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState('');
  const [dragging, setDragging] = useState(false);
  const [titleOpen, setTitleOpen] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null);
  const [displayedHotspot, setDisplayedHotspot] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);

  // Position the animated overlay without re-rendering React on every frame.
  const positionCallout = useEffectEvent(() => {
    if (displayedHotspot === null || !container.current || !callout.current || !path.current || !controller.current) return;
    const hotspot = hotspots[displayedHotspot - 1];
    const { x: anchorX, y: anchorY } = controller.current.project(hotspot.position);
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

  useEffect(() => {
    if (!canvas.current || !container.current) return;
    let scene: DnaScene;
    try {
      scene = createDnaScene({ canvas: canvas.current, container: container.current,
        onReady: () => setReady(true),
        onError: () => setFallback('O modelo 3D não pôde ser aberto. Exibindo uma representação compatível.'),
        onDragging: setDragging, onFrame: positionCallout });
      controller.current = scene;
    } catch {
      setFallback('A aceleração 3D não está disponível neste navegador. Exibindo uma representação compatível.');
      return;
    }
    return () => { scene.dispose(); controller.current = null; };
  }, []);

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
    if (ready && /^[1-6]$/.test(event.key)) {
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
  return <article ref={container} className={`dna-viewer-card${dragging ? ' dragging' : ''}${fallback ? ' using-2d-fallback' : ''}`} id="dna-viewer" aria-label={fallback ? 'Representação bidimensional animada de uma molécula de DNA.' : 'Modelo tridimensional de DNA. Arraste para girar e use a roda do mouse para aproximar.'}>
    <canvas ref={canvas} tabIndex={0} aria-label="DNA 3D interativo" hidden={Boolean(fallback)} />
    <div className="dna-viewer-topbar">
      <div className="dna-title-stack">
        <button className="screen-title dna-viewer-title dna-title-button" type="button" id="dna-title-toggle" aria-expanded={titleOpen} aria-controls="dna-title-reveal" onClick={() => setTitleOpen(open => !open)}>DNA</button>
        <p className={`dna-title-reveal${titleOpen ? ' is-open' : ''}`} id="dna-title-reveal" aria-hidden={!titleOpen}>O <em>DNA</em> é a molécula que armazena e<br />transmite as <em>informações genéticas</em> dos seres vivos. Formado por sequências de nucleotídeos, ele contém as instruções necessárias para o funcionamento, desenvolvimento e reprodução das células.</p>
      </div>
      <button className="back-button" type="button" id="close-dna-info" onClick={onBack}>Voltar</button>
    </div>
    {fallback && <DnaFallback message={fallback} />}
    <div className={`dna-callout-layer${selectedHotspot !== null && hotspot ? ' is-visible' : ''}${switching ? ' is-switching' : ''}`} id="dna-callout-layer" aria-hidden={selectedHotspot === null}>
      <svg className="dna-callout-lines" aria-hidden="true"><path ref={path} className="dna-callout-path" id="dna-callout-path" /></svg>
      <article ref={callout} className="dna-callout" id="dna-callout" role="status" aria-live="polite">
        <span className="dna-callout-kicker" id="dna-callout-kicker">{hotspot ? `Tecla ${hotspot.id}` : ''}</span>
        <h3 className="dna-callout-title" id="dna-callout-title">{hotspot?.title}</h3>
        <p className="dna-callout-text" id="dna-callout-text">{hotspot?.text}</p>
      </article>
    </div>
    <p className={`dna-3d-status${fallback ? ' fallback' : ready ? ' hidden' : ''}`} id="dna-3d-status" role="status">{fallback ? 'Modo compatível 2D ativo' : 'Carregando DNA 3D...'}</p>
    <aside className={`dna-license-card${licenseOpen ? ' is-open' : ''}`} id="dna-license-card" aria-hidden={!licenseOpen} onPointerDown={event => event.stopPropagation()}>
      <h3 className="dna-license-title">Licença</h3>
      <p className="dna-license-text">O modelo <a href="https://skfb.ly/onW7w" target="_blank" rel="noopener noreferrer">“DNA”</a>, de LucasPresoto, está licenciado sob a licença <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">Creative Commons Atribuição 4.0 Internacional</a>.</p>
    </aside>
  </article>;
}
