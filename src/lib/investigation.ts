import { CASE_RESULTS, type CaseId } from '../data/cases';

export function sanitizeCode(text: string) {
  return text.replace(/[^ATCG]/gi, '').toUpperCase();
}

export function isCorrectGuess(caseId: CaseId, suspect: string, code: string) {
  const result = CASE_RESULTS[caseId];
  return code === result.code && suspect === result.culprit;
}
