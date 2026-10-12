import { CASE_LABELS, CASE_ORDER } from '../data/cases';
import { useI18n } from '../i18n/I18n';
import { useFairStatistics } from '../lib/fairStatistics';

export function FairStatistics({ saveError }: { saveError: boolean }) {
  const { t, caseLabels, language } = useI18n();
  const statistics = useFairStatistics();
  const format = (value: string) => BigInt(value).toLocaleString(language);
  const exportJson = () => {
    const date = new Date().toISOString();
    const report = {
      exportado_em: date,
      visitantes_totais: statistics.visitors,
      grupos_atendidos: statistics.groups,
      grupos: statistics.groupHistory.map(group => ({ grupo: group.number, visitantes: group.visitors })),
      casos_solucionados: statistics.solved,
      casos_escolhidos: Object.fromEntries(CASE_ORDER.map(id => [id, { nome: CASE_LABELS[id], total: statistics.cases[id] }])),
      casos_solucionados_por_caso: Object.fromEntries(CASE_ORDER.map(id => [id, { nome: CASE_LABELS[id], total: statistics.solvedCases[id] }]))
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `estatisticas-feira-${date.slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="fair-statistics" aria-labelledby="fair-statistics-title">
    <div className="fair-statistics-header">
      <h3 id="fair-statistics-title">{t('fairStatistics')}</h3>
      <button id="export-fair-statistics" type="button" className="settings-toggle" onClick={exportJson}>{t('exportStatistics')}</button>
    </div>
    <dl className="fair-statistics-totals">
      <div><dt>{t('totalVisitors')}</dt><dd id="total-visitors">{format(statistics.visitors)}</dd></div>
      <div><dt>{t('groupsAttended')}</dt><dd id="total-groups">{format(statistics.groups)}</dd></div>
      <div><dt>{t('casesSolved')}</dt><dd id="total-solved">{format(statistics.solved)}</dd></div>
    </dl>
    <div className="fair-statistics-columns">
      {(['chosen', 'solved'] as const).map(kind => {
        const counts = kind === 'chosen' ? statistics.cases : statistics.solvedCases;
        const maximum = CASE_ORDER.reduce((max, id) => BigInt(counts[id]) > max ? BigInt(counts[id]) : max, 0n);
        return <section key={kind} data-statistic-kind={kind} aria-labelledby={`fair-statistics-${kind}`}>
          <h4 id={`fair-statistics-${kind}`}>{t(kind === 'chosen' ? 'casesChosen' : 'casesSolved')}</h4>
          <ul className="fair-statistics-cases">
            {CASE_ORDER.map(id => {
              const width = maximum > 0n ? Number(BigInt(counts[id]) * 10000n / maximum) / 100 : 0;
              return <li key={id} data-statistic-case={id}>
                <div className="fair-statistics-case-heading"><span>{caseLabels[id]}</span><span>{format(counts[id])}</span></div>
                <div className="fair-statistics-bar" aria-hidden="true"><span style={{ width: `${width}%` }} /></div>
              </li>;
            })}
          </ul>
        </section>;
      })}
    </div>
    {saveError && <p className="visitor-group-error" role="alert">{t('visitorSaveError')}</p>}
  </section>;
}
