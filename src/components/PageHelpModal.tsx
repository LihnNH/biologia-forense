import { useI18n } from '../i18n/I18n';
import { Markdown } from './Markdown';
import { Modal } from './Modal';

export type HelpPage = 'home' | 'case' | 'guess';

const content = {
  home: { title: 'helpHomeTitle', steps: 'helpHomeSteps' },
  case: { title: 'helpCaseTitle', steps: 'helpCaseSteps' },
  guess: { title: 'helpCodeTitle', steps: 'helpCodeSteps' }
} as const;

const shortcuts = [
  { keys: ['H'], description: 'helpShortcutHelp' },
  { keys: ['C'], description: 'helpShortcutSettings' },
  { keys: ['Esc'], description: 'helpShortcutEscape' },
  { keys: ['Tab', 'Shift + Tab'], description: 'helpShortcutFocus' },
  { keys: ['Enter', 'Space'], description: 'helpShortcutActivate' },
  { keys: ['1', '2', '3', '4', '5', '6'], description: 'helpShortcutDnaPoints' },
  { keys: ['L'], description: 'helpShortcutDnaLicense' },
  { keys: ['↑', '↓', '←', '→'], description: 'helpShortcutDnaRotate' },
  { keys: ['+', '−'], description: 'helpShortcutDnaZoom' },
  { keys: ['←', '→'], description: 'helpShortcutCodeMove' },
  { keys: ['Backspace'], description: 'helpShortcutCodeDelete' },
  { keys: ['Ctrl + V', '⌘ + V'], description: 'helpShortcutCodePaste' },
  { keys: ['↑', '↓'], description: 'helpShortcutVisitors' }
] as const;

export function PageHelpModal({ page, onClose }: { page: HelpPage; onClose: () => void }) {
  const { t, messages } = useI18n();
  const keys = content[page];
  return <Modal id="page-help-modal" labelledBy="page-help-title" describedBy="page-help-steps" isolateKeyboard focusPanel={page === 'home'} onClose={onClose}>
    <p className="result-kicker">{t('help')}</p>
    <h2 className="modal-title" id="page-help-title">{t(keys.title)}</h2>
    <ol className="page-help-steps" id="page-help-steps">
      {messages[keys.steps].map((step, index) => <li key={index}><Markdown className="page-help-step" text={step} /></li>)}
    </ol>
    {page === 'home' && <section className="page-help-shortcuts" aria-labelledby="page-help-shortcuts-title">
      <h3 id="page-help-shortcuts-title">{t('helpShortcutsTitle')}</h3>
      <dl className="page-help-shortcut-list">
        {shortcuts.map(shortcut => <div className="page-help-shortcut" key={shortcut.description}>
          <dt>{shortcut.keys.map(key => <kbd className="page-help-key" key={key}>{key === 'Space' ? t('helpSpaceKey') : key}</kbd>)}</dt>
          <dd>{t(shortcut.description)}</dd>
        </div>)}
      </dl>
    </section>}
    <button className="action-button" id="close-page-help" type="button" onClick={onClose}>{t('gotIt')}</button>
  </Modal>;
}
