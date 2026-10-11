import { useEffect, useEffectEvent, useRef, type ReactNode } from 'react';

export function Modal({ id, labelledBy, ariaLabel, describedBy, alert = false, closing = false, isolateKeyboard = false, onExited, onClose, children }: {
  id: string;
  labelledBy?: string;
  ariaLabel?: string;
  describedBy?: string;
  alert?: boolean;
  closing?: boolean;
  isolateKeyboard?: boolean;
  onExited?: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useEffectEvent(onClose);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const container = panel.current;
    if (!container) return;
    const focusable = () => [...container.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')];
    (focusable()[0] ?? container).focus();
    const onKey = (event: KeyboardEvent) => {
      if (isolateKeyboard) event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first) { event.preventDefault(); container.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    const keyboardTarget = isolateKeyboard ? container : document;
    keyboardTarget.addEventListener('keydown', onKey as EventListener);
    return () => {
      keyboardTarget.removeEventListener('keydown', onKey as EventListener);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [id, isolateKeyboard]);

  return <div className={`modal is-active${closing ? ' is-closing' : ''}`} id={id} role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={labelledBy} aria-label={ariaLabel} aria-describedby={describedBy}
    onAnimationEnd={event => { if (closing && event.target === event.currentTarget) onExited?.(); }}>
    <div className="modal-panel" ref={panel} tabIndex={-1}>{children}</div>
  </div>;
}
