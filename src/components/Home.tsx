import { artwork, caseIcons } from '../data/assets';
import { CASE_LABELS, CASE_ORDER, type CaseId } from '../data/cases';

export function Home({ onCase, onInfo }: { onCase: (id: CaseId) => void; onInfo: () => void }) {
  return <>
    <header>
      <img className="dna-mark" src={artwork.dna} alt="" loading="eager" aria-hidden="true" />
      <h1>Biologia Forense</h1>
      <div className="title-line" aria-hidden="true" />
      <p className="subtitle">Verificador de DNA</p>
    </header>
    <section className="grid" aria-label="Escolha uma evidência forense">
      {CASE_ORDER.map(id => <article key={id} className="case-card" role="button" tabIndex={0}
        data-case={id} onClick={() => onCase(id)} onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onCase(id);
          }
        }}>
        <div className="icon-ring" aria-hidden="true"><img className="weapon-icon" src={caseIcons[id]} alt="" loading="eager" /></div>
        <h2 className="case-title">{CASE_LABELS[id]}</h2>
        <div className="arrow" aria-hidden="true">›</div>
        <span className="sr-only">Abrir caso {CASE_LABELS[id]}</span>
      </article>)}
    </section>
    <div className="home-tools"><button className="helper-link" type="button" id="open-dna-info-home" onClick={onInfo}>🧬 Como o código ATCG funciona?</button></div>
    <div className="footer-mark" aria-hidden="true"><img className="footer-fingerprint" src={artwork.fingerprint} alt="" loading="eager" /></div>
  </>;
}
