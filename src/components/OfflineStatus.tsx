import { prepareOffline, useOffline } from '../lib/offline';
import type { Language } from '../i18n/I18n';
import '../styles/offline.css';

const labels = {
  'pt-BR': {
    preparing: 'Preparando acesso offline…', ready: 'Pronto para usar offline', active: 'Funcionando offline',
    error: 'Acesso offline ainda não preparado', unsupported: 'Offline indisponível neste navegador',
    development: 'Offline disponível na versão publicada', retry: 'Tentar novamente',
    clearing: 'Apagando dados offline…', cleared: 'Dados offline apagados', clearError: 'Não foi possível apagar todos os dados offline. Tente novamente.',
  },
  en: {
    preparing: 'Preparing offline access…', ready: 'Ready to use offline', active: 'Working offline',
    error: 'Offline access is not ready yet', unsupported: 'Offline unavailable in this browser',
    development: 'Offline available in the published version', retry: 'Try again',
    clearing: 'Deleting offline data…', cleared: 'Offline data deleted', clearError: 'Could not delete all offline data. Please try again.',
  },
};

export function OfflineStatus({ language = 'pt-BR' }: { language?: Language }) {
  const { phase, online } = useOffline();
  const text = labels[language];
  const label = phase === 'ready' ? text[online ? 'ready' : 'active'] : phase === 'unsupported' && import.meta.env.DEV ? text.development : text[phase];
  return <div className={`offline-status is-${phase}`} data-offline={phase}>
    <span className="offline-dot" aria-hidden="true" />
    <span role="status">{label}</span>
    {phase === 'error' && <button className="offline-retry" type="button" onClick={() => { void prepareOffline(); }}>{text.retry}</button>}
  </div>;
}
