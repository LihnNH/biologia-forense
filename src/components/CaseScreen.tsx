import { CASES, CASE_LABELS, type CaseId } from '../data/cases';
import { suspectPortraits } from '../data/suspectPortraits';

export function CaseScreen({ caseId, onHome, onGuess }: {
  caseId: CaseId;
  onHome: () => void;
  onGuess: () => void;
}) {
  return <article className="screen-panel case-panel">
    <div className="screen-topbar">
      <h2 className="screen-title" id="case-title">{CASE_LABELS[caseId]}</h2>
      <button className="back-button" type="button" onClick={onHome}>Voltar</button>
    </div>
    <ul className="suspect-gallery" aria-label={`Suspeitos — ${CASE_LABELS[caseId]}`}>
      {CASES[caseId].suspects.map(suspect => <li className="suspect-portrait" key={suspect.name}>
        <img src={suspectPortraits[caseId][suspect.name]} alt={`Foto de ${suspect.name}`} width={900} height={1420} decoding="async" />
      </li>)}
    </ul>
    <div className="actions-row">
      <button className="action-button" type="button" id="open-guess" onClick={onGuess}>Palpite</button>
    </div>
  </article>;
}
