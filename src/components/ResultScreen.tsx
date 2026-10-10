import { CASE_LABELS, CASE_RESULTS, type CaseId } from '../data/cases';
import { Markdown } from './Markdown';

export function ResultScreen({ caseId, onHome }: { caseId: CaseId; onHome: () => void }) {
  const result = CASE_RESULTS[caseId];
  return <article className="screen-panel done-panel">
    <p className="result-kicker" id="result-kicker">Código e suspeito confirmados</p>
    <h2 className="screen-title" id="result-title">{CASE_LABELS[caseId]}: caso solucionado</h2>
    <div className="culprit-card">
      <p className="culprit-label">Responsável pelo crime</p>
      <h3 className="culprit-name" id="culprit-name">{result.culprit}</h3>
      <Markdown className="result-explanation" id="result-explanation" text={`Você acertou **as duas partes da investigação**.\n\n${result.explanation}`} />
    </div>
    <button className="action-button" type="button" id="done-home" onClick={onHome}>Voltar para a tela inicial</button>
  </article>;
}
