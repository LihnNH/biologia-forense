import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { CaseId } from '../data/cases';
import { useI18n } from '../i18n/I18n';
import { parseGroupSize } from '../lib/fairStatistics';
import { Modal } from './Modal';

export function VisitorGroupModal({ caseId, onConfirm, onClose }: {
  caseId: CaseId;
  onConfirm: (visitors: bigint) => Promise<void>;
  onClose: () => void;
}) {
  const { t, caseLabels } = useI18n();
  const [value, setValue] = useState('0');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const submitting = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const visitors = parseGroupSize(value);

  useEffect(() => { input.current?.focus(); input.current?.select(); }, []);

  const step = (change: bigint) => {
    setValue(previous => ((parseGroupSize(previous) ?? 0n) + change).toString());
    setSaveError(false);
    input.current?.focus();
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || visitors === null) return;
    submitting.current = true;
    setSaving(true);
    setSaveError(false);
    try { await onConfirm(visitors); }
    catch { setSaveError(true); }
    finally { submitting.current = false; setSaving(false); }
  };

  return <Modal id="visitor-group-modal" labelledBy="visitor-group-title" describedBy="visitor-group-hint" onClose={() => { if (!submitting.current) onClose(); }}>
    <p className="result-kicker">{caseLabels[caseId]}</p>
    <h2 className="modal-title visitor-group-title" id="visitor-group-title">{t('groupVisitorsTitle')}</h2>
    <form onSubmit={event => { void submit(event); }}>
      <label className="settings-label" htmlFor="group-visitors">{t('groupVisitors')}</label>
      <div className="visitor-stepper">
        <button className="action-button visitor-step" type="button" disabled={saving} aria-label={t('removeVisitor')} onClick={() => step(-1n)}>−</button>
        <input id="group-visitors" className="visitor-count-input" ref={input} type="text" inputMode="numeric" autoComplete="off"
          value={value} disabled={saving} aria-invalid={visitors === null} aria-describedby="visitor-group-hint visitor-group-error"
          onChange={event => { setValue(event.target.value); setSaveError(false); }}
          onKeyDown={event => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); step(event.key === 'ArrowUp' ? 1n : -1n); }
          }} />
        <button className="action-button visitor-step" type="button" disabled={saving} aria-label={t('addVisitor')} onClick={() => step(1n)}>+</button>
      </div>
      <p className="settings-offline-hint" id="visitor-group-hint">{t('groupVisitorsHint')}</p>
      <p className="visitor-group-error" id="visitor-group-error" role="alert">{saveError ? t('visitorSaveError') : visitors === null ? t('visitorIntegerError') : ''}</p>
      <div className="visitor-group-actions">
        <button className="back-button" type="button" disabled={saving} onClick={onClose}>{t('cancel')}</button>
        <button className="action-button" type="submit" id="confirm-group-visitors" disabled={saving || visitors === null}>{t(saving ? 'savingVisitors' : 'startCase')}</button>
      </div>
    </form>
  </Modal>;
}
