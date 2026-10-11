import { SmokeBackground } from './SmokeBackground';
import type { SmokeSettings } from '../lib/smokeSettings';

export function Background({ active, smokeSettings }: { active: boolean; smokeSettings: SmokeSettings }) {
  return <>
    <SmokeBackground active={active} settings={smokeSettings} />
    <div className="forensic-noise" aria-hidden="true" />
  </>;
}
