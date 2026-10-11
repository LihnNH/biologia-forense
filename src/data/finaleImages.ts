import type { CaseId } from './cases';
import type { SmokeTint } from '../lib/smokeRenderer';
import rafael from '../../assets/finale/rafael-oliveira-finale.png';
import gustavo from '../../assets/finale/gustavo-almeida-finale.png';
import laura from '../../assets/finale/laura-almeida-finale.png';
import marcos from '../../assets/finale/marcos-vinicius-finale.png';

export const finaleImages: Record<CaseId, string> = {
  Faca: rafael,
  Veneno: gustavo,
  Martelo: laura,
  Corda: marcos,
};

// Dominant RGB colors extracted with the same 16-color quantization as cor-frequente.
export const finaleColors: Record<CaseId, SmokeTint> = {
  Faca: [222, 43, 19],
  Veneno: [80, 35, 7],
  Martelo: [81, 97, 28],
  Corda: [26, 13, 8],
};
