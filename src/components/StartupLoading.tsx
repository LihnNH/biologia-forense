export function StartupLoading({ completed, total, failed, waitingForDna, onRetry, onContinue }: {
  completed: number;
  total: number;
  failed: number;
  waitingForDna: boolean;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const finished = completed === total;
  const percent = Math.round(completed / total * 100);
  return <section className="startup-screen" aria-labelledby="startup-title" aria-busy={!finished}>
    <div className="startup-content">
      <span className="startup-kicker">Biologia Forense</span>
      <h1 className="startup-title" id="startup-title">Preparando a investigação</h1>
      <p className="startup-copy" role="status">{finished && failed
        ? 'Alguns recursos não carregaram. Você pode tentar novamente ou continuar.'
        : waitingForDna && completed >= total - 1 ? 'Preparando a visualização do DNA…' : 'Carregando fotos, fontes e recursos…'}</p>
      <div className="startup-progress-row">
        <progress className="startup-progress" value={completed} max={total} aria-label="Carregamento inicial" />
        <span className="startup-percent" aria-hidden="true">{percent}%</span>
      </div>
      {finished && failed > 0 && <div className="startup-actions">
        <button className="action-button" type="button" onClick={onRetry}>Tentar novamente</button>
        <button className="back-button" type="button" onClick={onContinue}>Continuar</button>
      </div>}
    </div>
  </section>;
}
