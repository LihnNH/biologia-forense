import dna from '../../assets/svg/dna.svg';
import fingerprint from '../../assets/svg/finger-print.svg';
import knife from '../../assets/svg/knife.svg';
import poison from '../../assets/svg/poison.svg';
import hammer from '../../assets/svg/hammer.svg';
import rope from '../../assets/svg/rope.svg';
import dnaStatic from '../../assets/dna-static-image.png';
import type { CaseId } from './cases';

export const artwork = { dna, fingerprint, dnaStatic };
export const caseIcons: Record<CaseId, string> = {
  Faca: knife,
  Veneno: poison,
  Martelo: hammer,
  Corda: rope,
};
