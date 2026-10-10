import { CASE_LABELS, CASES, type CaseId } from '../data/cases';
import type { ModalKind } from '../lib/useInvestigation';
import { Markdown } from './Markdown';
import { Modal } from './Modal';

export function InvestigationModals({ modal, caseId, selectedGuess, suspectIndex, onClose, onStatement, onMark }: {
  modal: ModalKind;
  caseId: CaseId;
  selectedGuess: string;
  suspectIndex: number | null;
  onClose: () => void;
  onStatement: (index: number) => void;
  onMark: () => void;
}) {
  if (modal === 'suspects') return <Modal key="suspects" id="suspects-modal" labelledBy="suspects-title" onClose={onClose}>
    <h2 className="modal-title" id="suspects-title">Suspeitos - {CASE_LABELS[caseId]}</h2>
    <div className="suspect-list" id="suspect-list">{CASES[caseId].suspects.map((suspect, index) => {
      const selected = suspect.name === selectedGuess;
      return <button key={suspect.name} className={`suspect-button${selected ? ' is-guess' : ''}`} type="button" aria-pressed={selected} onClick={() => onStatement(index)}>
        <span className="suspect-label">{index + 1}. {suspect.name} — {suspect.role}
          <span className="suspect-meta">{suspect.age} anos{suspect.meta ? ` • ${suspect.meta}` : ''}</span>
        </span>
        {selected && <span className="guess-badge">Marcado</span>}
      </button>;
    })}</div>
    <button className="back-button" type="button" id="close-suspects" onClick={onClose}>Voltar</button>
  </Modal>;
  if (modal === 'statement' && suspectIndex !== null) {
    const suspect = CASES[caseId].suspects[suspectIndex];
    return <Modal key="statement" id="statement-modal" labelledBy="statement-title" onClose={onClose}>
      <h2 className="modal-title" id="statement-title">{suspect.name}</h2>
      <Markdown className="suspect-text" id="statement-text" text={`### ${suspect.role}\n\n${suspect.statement}`} />
      <div className="statement-actions">
        <button className="action-button" type="button" id="mark-as-guess" onClick={onMark}>{selectedGuess === suspect.name ? 'Culpado selecionado ✓' : 'Marcar como culpado'}</button>
        <button className="back-button" type="button" id="back-to-suspects" onClick={onClose}>Voltar</button>
      </div>
    </Modal>;
  }
  if (modal === 'error') return <Modal key="error" id="guess-error-modal" labelledBy="guess-error-title" describedBy="guess-error-copy" alert onClose={onClose}>
    <p className="result-kicker">Verificação não confirmada</p>
    <h2 className="modal-title" id="guess-error-title">Palpite incorreto</h2>
    <p className="suspect-text" id="guess-error-copy">Alguma parte do seu palpite não confere com as evidências. Revise os suspeitos deste caso e tente novamente.</p>
    <button className="action-button" type="button" id="retry-suspects" onClick={onClose}>Voltar aos suspeitos</button>
  </Modal>;
  return null;
}
