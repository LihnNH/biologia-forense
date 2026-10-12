import { useI18n } from '../i18n/I18n';
import { Markdown } from './Markdown';
import { Modal } from './Modal';

export type HelpPage = 'home' | 'case' | 'guess';

const content = {
  home: { title: 'helpHomeTitle', steps: 'helpHomeSteps' },
  case: { title: 'helpCaseTitle', steps: 'helpCaseSteps' },
  guess: { title: 'helpCodeTitle', steps: 'helpCodeSteps' }
} as const;

export function PageHelpModal({ page, onClose }: { page: HelpPage; onClose: () => void }) {
  const { t, messages } = useI18n();
  const keys = content[page];
  return <Modal id="page-help-modal" labelledBy="page-help-title" describedBy="page-help-steps" isolateKeyboard onClose={onClose}>
    <p className="result-kicker">{t('help')}</p>
    <h2 className="modal-title" id="page-help-title">{t(keys.title)}</h2>
    <ol className="page-help-steps" id="page-help-steps">
      {messages[keys.steps].map((step, index) => <li key={index}><Markdown className="page-help-step" text={step} /></li>)}
    </ol>
    <button className="action-button" id="close-page-help" type="button" onClick={onClose}>{t('gotIt')}</button>
  </Modal>;
}
