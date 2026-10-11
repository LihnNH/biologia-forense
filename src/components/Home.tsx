import { artwork, caseIcons } from '../data/assets';
import { CASE_ORDER, type CaseId } from '../data/cases';
import { useI18n } from '../i18n/I18n';

export function Home({ onCase, onInfo }: { onCase: (id: CaseId) => void; onInfo: () => void }) {
  const { t, caseLabels } = useI18n();
  return <>
    <header>
      <img draggable={false} className="dna-mark" src={artwork.dna} alt="" loading="eager" aria-hidden="true" />
      <h1>{t('appTitle')}</h1>
      <div className="title-line" aria-hidden="true" />
      <p className="subtitle">{t('subtitle')}</p>
    </header>
    <section className="grid" aria-label={t('chooseEvidence')}>
      {CASE_ORDER.map(id => <article key={id} className="case-card" role="button" tabIndex={0}
        data-case={id} onClick={() => onCase(id)} onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onCase(id);
          }
        }}>
        <div className="icon-ring" aria-hidden="true"><img draggable={false} className="weapon-icon" src={caseIcons[id]} alt="" loading="eager" /></div>
        <h2 className="case-title">{caseLabels[id]}</h2>
        <div className="arrow" aria-hidden="true">›</div>
        <span className="sr-only">{t('openCase', { case: caseLabels[id] })}</span>
      </article>)}
    </section>
    <div className="home-tools"><button className="helper-link" type="button" id="open-dna-info-home" onClick={onInfo}>{t('dnaHelp')}</button></div>
    <div className="footer-mark" aria-hidden="true"><img draggable={false} className="footer-fingerprint" src={artwork.fingerprint} alt="" loading="eager" /></div>
  </>;
}
