import type { ModalKind } from '../lib/useInvestigation';
import { Modal } from './Modal';

export function InvestigationModals({ modal, onClose }: {
  modal: ModalKind;
  onClose: () => void;
}) {
  if (modal === 'error') return <Modal key="error" id="guess-error-modal" labelledBy="guess-error-title" describedBy="guess-error-copy" alert onClose={onClose}>
    <p className="result-kicker">Verificação não confirmada</p>
    <h2 className="modal-title" id="guess-error-title">Palpite incorreto</h2>
    <p className="suspect-text" id="guess-error-copy">Alguma parte do seu palpite não confere com as evidências. Revise os suspeitos deste caso e tente novamente.</p>
    <button className="action-button" type="button" id="retry-suspects" onClick={onClose}>Voltar aos suspeitos</button>
  </Modal>;
  return null;
}
