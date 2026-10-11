import type { CaseId } from '../data/cases';
import { useI18n } from '../i18n/I18n';
import { Markdown } from './Markdown';

export function ResultScreen({ caseId, onHome }: { caseId: CaseId; onHome: () => void }) {
  const { t, caseLabels, caseResults } = useI18n();
  const result = caseResults[caseId];
  return <article className="screen-panel done-panel">
    <p className="result-kicker" id="result-kicker">{t('confirmed')}</p>
    <h2 className="screen-title" id="result-title">{t('solved', { case: caseLabels[caseId] })}</h2>
    <div className="culprit-card">
      <p className="culprit-label">{t('culprit')}</p>
      <h3 className="culprit-name" id="culprit-name">{result.culprit}</h3>
      <Markdown className="result-explanation" id="result-explanation" text={`${t('bothCorrect')}\n\n${result.explanation}`} />
    </div>
    <button className="action-button" type="button" id="done-home" onClick={onHome}>{t('backHome')}</button>
  </article>;
}
