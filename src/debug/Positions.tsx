import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createDnaScene } from '../lib/dnaScene';
import type { SavedPoint } from '../data/dna';
import { DebugNavigation } from './DebugNavigation';
import '../fonts';
import '../styles/positions.css';

function Positions() {
  const container = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const clipboard = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<number | null>(null);
  const [points, setPoints] = useState<SavedPoint[]>([]);
  const [status, setStatus] = useState('Carregando DNA 3D...');
  const [error, setError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvas.current || !container.current) return;
    try {
      const scene = createDnaScene({ canvas: canvas.current, container: container.current, debug: true,
        onReady: () => setStatus('Pronto. Clique diretamente no DNA para salvar o ponto 1.'),
        onError: () => { setError(true); setStatus('Não foi possível abrir o modelo 3D neste navegador.'); },
        onDragging: setDragging,
        onPoint: point => {
          if (!point) { setStatus('Nenhum ponto salvo. Clique diretamente sobre a geometria do DNA.'); return; }
          setPoints(previous => [...previous, point]);
          setStatus(`Ponto ${point.id} salvo. Clique em outro local para criar o ponto ${point.id + 1}.`);
        },
      });
      scene.setActive(true);
      return () => scene.dispose();
    } catch {
      setError(true);
      setStatus('A aceleração 3D não está disponível neste navegador.');
    }
  }, []);
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [points]);
  useEffect(() => () => { if (copyTimer.current !== null) window.clearTimeout(copyTimer.current); }, []);

  async function copyPositions() {
    const text = JSON.stringify(points, null, 2);
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        if (!clipboard.current) return;
        clipboard.current.value = text;
        clipboard.current.select();
        if (!document.execCommand('copy')) throw new Error('Copy command failed');
      }
      setCopied(true);
      setError(false);
      setStatus(`${points.length} posição(ões) copiadas para a área de transferência.`);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1300);
    } catch {
      setError(true);
      setStatus('Não foi possível copiar automaticamente. Tente abrir no Chrome ou Edge.');
    }
  }

  return <main className={`viewer${dragging ? ' dragging' : ''}`} id="viewer" ref={container}>
    <canvas className="webgl" ref={canvas} tabIndex={0} aria-label="DNA 3D para seleção de posições" />
    <div className="topbar">
      <div className="title-block"><DebugNavigation current="positions" /><h1>DNA Position Debug</h1><p className="instructions">Clique no modelo para marcar um ponto. Arraste para girar e use a roda do mouse para aproximar.</p></div>
      <div className="controls">
        <span className="count" id="point-count">{points.length} {points.length === 1 ? 'ponto' : 'pontos'}</span>
        <button type="button" id="copy-positions" disabled={!points.length} onClick={copyPositions}>{copied ? 'Copied!' : 'Copy positions'}</button>
      </div>
    </div>
    <aside className="debug-panel" aria-live="polite">
      <p className={`status${error ? ' error' : ''}`} id="status">{status}</p>
      <div className="points" id="points" ref={list}>{points.map(point => <div className="point-row" key={point.id}>
        <span className="point-number">{point.id}</span>
        <span>x {point.position.x}  y {point.position.y}  z {point.position.z}</span>
      </div>)}</div>
    </aside>
    <textarea className="clipboard-fallback" ref={clipboard} readOnly tabIndex={-1} aria-hidden="true" />
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Positions /></StrictMode>);
