import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { artwork } from '../data/assets';
import '../fonts';
import '../styles/answers.css';
import '../styles/debug-home.css';

function DebugHome() {
  return <main className="page debug-home">
    <header>
      <img draggable={false} className="dna-mark" src={artwork.dna} alt="" aria-hidden="true" />
      <h1>Ferramentas de apoio</h1>
      <div className="title-line" aria-hidden="true" />
      <p className="subtitle">Biologia Forense</p>
    </header>
    <nav className="debug-links" aria-label="Páginas de apoio">
      <a className="debug-link" href="./positions.html">
        <span className="debug-link-title">Posições do DNA</span>
        <span className="debug-link-description">Explore o modelo e copie as coordenadas dos pontos.</span>
        <span className="debug-link-action">Abrir posições →</span>
      </a>
      <a className="debug-link" href="./gabarito.html">
        <span className="debug-link-title">Respostas dos casos</span>
        <span className="debug-link-description">Consulte os suspeitos e os códigos das quatro soluções.</span>
        <span className="debug-link-action">Abrir respostas →</span>
      </a>
    </nav>
    <footer>Biologia Forense</footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><DebugHome /></StrictMode>);
