import { useEffect, useRef } from 'react';
import { CASE_LABELS, type CaseId } from '../data/cases';
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

  const status = !selectedGuess ? 'Escolha um suspeito antes de inserir o código.'
    : verdict ? 'Verificando palpite...' : 'Aguardando código...';

  return <article className="screen-panel">
    <div className="screen-topbar">
      <h2 className="screen-title" id="guess-title">Código - {CASE_LABELS[caseId]}</h2>
      <button className="back-button" type="button" id="back-to-case" onClick={onBack}>Voltar</button>
    </div>
    <form className="guess-form" id="guess-form" autoComplete="off" onSubmit={event => event.preventDefault()}>
      <div className={`guess-selection${selectedGuess ? '' : ' is-empty'}`} id="guess-selection">
        <div className="guess-selection-copy">
          <span className="guess-selection-label">Seu palpite</span>
          <strong className="guess-selection-name" id="guess-selected-name">{selectedGuess || 'Nenhum suspeito marcado'}</strong>
        </div>
      </div>
      <p className="code-instructions">Digite o código de quatro caracteres obtido na investigação. A verificação acontece automaticamente.</p>
      <div className="code-inputs" id="code-inputs" aria-label="Código de quatro caracteres">
        {['Primeiro', 'Segundo', 'Terceiro', 'Quarto'].map((label, index) => <input
          key={label} ref={element => { inputs.current[index] = element; }}
          className={`code-input${code[index] ? ' filled' : ''}`} type="text" inputMode="text" maxLength={1}
          pattern="[ATCGatcg]" autoCapitalize="characters" autoComplete="off" spellCheck={false}
          aria-label={`${label} caractere do código`} disabled={!selectedGuess} value={code[index]}
          onChange={event => update(index, event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Backspace' && !code[index] && index > 0) {
              event.preventDefault();
              const next = [...code];
              next[index - 1] = '';
              onCode(next);
              inputs.current[index - 1]?.focus();
            }
            if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
            if (event.key === 'ArrowRight' && index < 3) inputs.current[index + 1]?.focus();
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
      <div className="helper-tip">Esqueceu de onde saiu o ATCG?</div>
      <button className="helper-link" id="open-dna-info-guess" type="button" onClick={onInfo}>Ver explicação rápida do DNA</button>
      <button className="action-button sr-only" type="submit" tabIndex={-1}>Verificar código</button>
    </form>
  </article>;
}
