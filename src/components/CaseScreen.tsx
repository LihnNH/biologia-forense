import { CASES, CASE_LABELS, type CaseId } from '../data/cases';
import { Markdown } from './Markdown';

export function CaseScreen({ caseId, onHome, onSuspects, onGuess }: {
  caseId: CaseId;
  onHome: () => void;
  onSuspects: () => void;
  onGuess: () => void;
}) {
  return <article className="screen-panel">
    <div className="screen-topbar">
      <h2 className="screen-title" id="case-title">{CASE_LABELS[caseId]}</h2>
      <button className="back-button" type="button" onClick={onHome}>Voltar</button>
    </div>
    <Markdown className="description-panel" id="case-description" text={CASES[caseId].description} />
    <div className="actions-row">
      <button className="action-button" type="button" id="open-suspects" onClick={onSuspects}>Suspeitos</button>
      <button className="action-button" type="button" id="open-guess" onClick={onGuess}>Palpite</button>
    </div>
  </article>;
}
