import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { artwork } from '../data/assets';
import { CASE_LABELS, CASE_ORDER, CASE_RESULTS } from '../data/cases';
import '../fonts';
import '../styles/answers.css';

function Answers() {
  return <main className="page">
    <header>
      <img draggable={false} className="dna-mark" src={artwork.dna} alt="" aria-hidden="true" />
      <h1>Gabarito Forense</h1>
      <div className="title-line" aria-hidden="true" />
      <p className="subtitle">Soluções dos quatro casos</p>
    </header>
    <p className="warning">Página de apoio da equipe — contém as respostas completas da investigação.</p>
    <section className="grid" aria-label="Soluções dos casos">{CASE_ORDER.map((id, index) => {
      const result = CASE_RESULTS[id];
      return <article className="case-card" key={id} data-number={String(index + 1).padStart(2, '0')}>
        <p className="case-kicker">Caso {index + 1}</p>
        <h2 className="case-title">{CASE_LABELS[id]}</h2>
        <div className="answer-row">
          <div><p className="label">Suspeito</p><p className="suspect">{result.culprit}</p></div>
          <div><p className="label">Código</p><div className="code" aria-label={result.code}>{[...result.code].map((base, i) => <span key={i}>{base}</span>)}</div></div>
        </div>
      </article>;
    })}</section>
    <footer>Biologia Forense</footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><Answers /></StrictMode>);
