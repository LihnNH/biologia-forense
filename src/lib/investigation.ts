import { CASE_RESULTS, type CaseId } from '../data/cases';

export function sanitizeCode(text: string) {
  return text.replace(/[^ATCG]/gi, '').toUpperCase();
}

export function isCorrectCode(caseId: CaseId, code: string) {
  return code === CASE_RESULTS[caseId].code;
}
