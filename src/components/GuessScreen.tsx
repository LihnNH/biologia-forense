import { useEffect, useRef } from 'react';
import type { CaseId } from '../data/cases';
import { suspectNameImages } from '../data/suspectNameImages';
import { useI18n } from '../i18n/I18n';
import { sanitizeCode } from '../lib/investigation';

export function GuessScreen({ caseId, active, blocked, selectedGuess, code, verdict, onCode, onBack, onInfo }: {
  caseId: CaseId;
  active: boolean;
  blocked: boolean;
  selectedGuess: string;
  code: string[];
  verdict: 'correct' | 'incorrect' | null;
  onCode: (code: string[]) => void;
  onBack: () => void;
  onInfo: () => void;
}) {
  const { t, messages, caseLabels } = useI18n();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    if (active && !blocked && selectedGuess) inputs.current[0]?.focus();
  }, [active, blocked, selectedGuess]);

  function update(index: number, value: string) {
    const next = [...code];
    next[index] = sanitizeCode(value).slice(-1);
    onCode(next);
    if (next[index] && index < 3) inputs.current[index + 1]?.focus();
  }

  const status = t(!selectedGuess ? 'chooseBeforeCode' : verdict ? 'verifying' : 'awaitingCode');
  const selectedNameImage = suspectNameImages[caseId][selectedGuess];

  return <article className="screen-panel guess-panel">
    <div className="case-heading">
      <button className="back-button case-back" type="button" id="back-to-case" onClick={onBack} aria-label={t('back')} title={t('backToSuspects')}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <h2 className="screen-title" id="guess-title">{caseLabels[caseId]}</h2>
    </div>
    <form className="guess-form" id="guess-form" autoComplete="off" onSubmit={event => event.preventDefault()}>
      <div className={`guess-selection${selectedGuess ? '' : ' is-empty'}`} id="guess-selection">
        <div className="guess-selection-copy">
          <span className="guess-selection-label">{t('yourGuess')}</span>
          <strong className="guess-selection-name" id="guess-selected-name">
            {selectedNameImage ? <>
              <img draggable={false} className="guess-selection-name-image" src={selectedNameImage} alt="" />
              <span className="sr-only">{selectedGuess}</span>
            </> : selectedGuess || t('noSuspect')}
          </strong>
        </div>
      </div>
      <p className="code-instructions">{t('codeInstructions')}</p>
      <div className="code-inputs" id="code-inputs" aria-label={t('fourCharacterCode')}>
        {messages.codeCharacters.map((label, index) => <input
          key={index} ref={element => { inputs.current[index] = element; }}
          className={`code-input${code[index] ? ' filled' : ''}`} type="text" inputMode="text" maxLength={1}
          pattern="[ATCGatcg]" autoCapitalize="characters" autoComplete="off" spellCheck={false}
          aria-label={label} disabled={!selectedGuess || blocked} value={code[index]}
          onFocus={event => event.currentTarget.select()}
          onClick={event => event.currentTarget.select()}
          onChange={event => update(index, event.target.value)}
          onKeyDown={event => {
            if (/^[atcg]$/i.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
              event.preventDefault();
              update(index, event.key);
              return;
            }
            if (event.key === 'Backspace' && !code[index] && index > 0) {
              event.preventDefault();
              const next = [...code];
              next[index - 1] = '';
              onCode(next);
              inputs.current[index - 1]?.focus();
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              const target = Math.max(0, Math.min(3, index + (event.key === 'ArrowLeft' ? -1 : 1)));
              inputs.current[target]?.focus();
              inputs.current[target]?.select();
            }
          }}
          onPaste={event => {
            event.preventDefault();
            const pasted = sanitizeCode(event.clipboardData.getData('text')).slice(0, 4);
            if (!pasted) return;
            const next = Array.from({ length: 4 }, (_, i) => pasted[i] ?? '');
            onCode(next);
            const empty = next.findIndex(value => !value);
            inputs.current[empty === -1 ? 3 : empty]?.focus();
          }} />)}
      </div>
      <p className={`code-status${!selectedGuess ? ' is-error' : ''}`} id="code-status" role="status" aria-live="polite">{status}</p>
      <div className="helper-tip">{t('forgotAtcg')}</div>
      <button className="helper-link" id="open-dna-info-guess" type="button" onClick={onInfo}>{t('quickDna')}</button>
      <button className="action-button sr-only" type="submit" tabIndex={-1}>{t('verifyCode')}</button>
    </form>
  </article>;
}
