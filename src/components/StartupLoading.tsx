import { useI18n } from '../i18n/I18n';

export function StartupLoading({ completed, total, failed, waitingForDna, onRetry, onContinue }: {
  completed: number;
  total: number;
  failed: number;
  waitingForDna: boolean;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const { t } = useI18n();
  const finished = completed === total;
  const percent = Math.round(completed / total * 100);
  return <section className="startup-screen" aria-labelledby="startup-title" aria-busy={!finished}>
    <div className="startup-content">
      <span className="startup-kicker">{t('appTitle')}</span>
      <h1 className="startup-title" id="startup-title">{t('preparing')}</h1>
      <p className="startup-copy" role="status">{finished && failed
        ? t('assetsFailed')
        : waitingForDna && completed >= total - 1 ? t('preparingDna') : t('loadingAssets')}</p>
      <div className="startup-progress-row">
        <progress className="startup-progress" value={completed} max={total} aria-label={t('initialLoading')} />
        <span className="startup-percent" aria-hidden="true">{percent}%</span>
      </div>
      {finished && failed > 0 && <div className="startup-actions">
        <button className="action-button" type="button" onClick={onRetry}>{t('retry')}</button>
        <button className="back-button" type="button" onClick={onContinue}>{t('continue')}</button>
      </div>}
    </div>
  </section>;
}
