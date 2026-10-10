import { SmokeBackground } from './SmokeBackground';

export function Background({ active }: { active: boolean }) {
  return <>
    <SmokeBackground active={active} />
    <div className="forensic-noise" aria-hidden="true" />
    <div className="watermark fingerprint" aria-hidden="true" />
  </>;
}
