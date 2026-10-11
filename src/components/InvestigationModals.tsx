import type { ModalKind } from '../lib/useInvestigation';
import { Modal } from './Modal';
import { useI18n } from '../i18n/I18n';

export function InvestigationModals({ modal, onClose }: {
  modal: ModalKind;
  onClose: () => void;
}) {
  const { t } = useI18n();
  if (modal === 'error') return <Modal key="error" id="guess-error-modal" labelledBy="guess-error-title" describedBy="guess-error-copy" alert onClose={onClose}>
    <p className="result-kicker">{t('notConfirmed')}</p>
    <h2 className="modal-title" id="guess-error-title">{t('incorrectCode')}</h2>
    <p className="suspect-text" id="guess-error-copy">{t('incorrectCodeCopy')}</p>
    <button className="action-button" type="button" id="retry-suspects" onClick={onClose}>{t('backToSuspects')}</button>
  </Modal>;
  return null;
}
