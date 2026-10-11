import { SmokeBackground } from './SmokeBackground';
import type { SmokeSettings } from '../lib/smokeSettings';
import type { SmokeTint } from '../lib/smokeRenderer';

export function Background({ active, smokeSettings, smokeTint }: { active: boolean; smokeSettings: SmokeSettings; smokeTint: SmokeTint | null }) {
  return <>
    <SmokeBackground active={active} settings={smokeSettings} tint={smokeTint} />
    <div className="forensic-noise" aria-hidden="true" />
  </>;
}
