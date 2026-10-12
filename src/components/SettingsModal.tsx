import type { CSSProperties } from 'react';
import { useI18n } from '../i18n/I18n';
import { defaultSmokeSettings, smokeRanges, type SmokeSettings } from '../lib/smokeSettings';
import { Modal } from './Modal';
import { OfflineStatus } from './OfflineStatus';
import { clearOfflineData, useOffline } from '../lib/offline';
import { FairStatistics } from './FairStatistics';

const sliderLabels = { fps: 'smokeFps', quality: 'smokeQuality', strength: 'smokeStrength', speed: 'smokeSpeed' } as const;

export function SettingsModal({ statisticsSaveError, smokeSettings, onSmokeChange, closing, onExited, onClose }: {
  statisticsSaveError: boolean;
  smokeSettings: SmokeSettings;
  onSmokeChange: (settings: SmokeSettings) => void;
  closing: boolean;
  onExited: () => void;
  onClose: () => void;
}) {
  const { language, setLanguage, t } = useI18n();
  const { phase: offlinePhase } = useOffline();
  const english = language === 'en';
  return <Modal id="settings-modal" labelledBy="settings-title" closing={closing} isolateKeyboard onExited={onExited} onClose={onClose}>
    <h2 className="modal-title settings-title" id="settings-title">{t('settings')}</h2>
    <div className="settings-row">
      <p className="settings-label" id="settings-language-label">{t('language')}</p>
      <button className="language-switch" type="button" role="switch" aria-checked={english}
        aria-labelledby="settings-language-label" aria-describedby="settings-language-value"
        onClick={() => setLanguage(english ? 'pt-BR' : 'en')}>
        <span className="language-switch-thumb" aria-hidden="true" />
        <span className={english ? '' : 'is-selected'} lang="pt-BR">PT-BR</span>
        <span className={english ? 'is-selected' : ''} lang="en">English</span>
      </button>
      <span className="sr-only" id="settings-language-value">{t('selectedLanguage', { language: english ? 'English' : 'PT-BR' })}</span>
    </div>
    <section className="smoke-settings" aria-labelledby="settings-smoke-title">
      <div className="settings-section-heading">
        <h3 id="settings-smoke-title">{t('smoke')}</h3>
        <button className="settings-toggle" type="button" role="switch" aria-label={t('smoke')}
          aria-checked={smokeSettings.enabled} onClick={() => onSmokeChange({ ...smokeSettings, enabled: !smokeSettings.enabled })}>
          <span className="settings-toggle-dot" aria-hidden="true" />
          {t(smokeSettings.enabled ? 'enabled' : 'disabled')}
        </button>
      </div>
      <div className="settings-sliders">
        {(Object.keys(smokeRanges) as (keyof typeof smokeRanges)[]).map(key => {
          const { min, max, step } = smokeRanges[key];
          const value = smokeSettings[key];
          const formatted = `${value}${key === 'fps' ? ' FPS' : '%'}`;
          return <div className="settings-slider-row" key={key}>
            <div className="settings-slider-heading">
              <label htmlFor={`smoke-${key}`}>{t(sliderLabels[key])}</label>
              <output htmlFor={`smoke-${key}`}>{formatted}</output>
            </div>
            <input className="settings-slider" id={`smoke-${key}`} type="range" min={min} max={max} step={step}
              value={value} aria-valuetext={formatted}
              style={{ '--range-progress': `${(value - min) / (max - min) * 100}%` } as CSSProperties}
              onChange={event => onSmokeChange({ ...smokeSettings, [key]: Number(event.target.value) })} />
          </div>;
        })}
      </div>
      <button className="settings-reset" type="button" onClick={() => onSmokeChange({ ...defaultSmokeSettings })}>{t('restoreDefaults')}</button>
    </section>
    <section className="offline-data-settings" aria-labelledby="settings-offline-title">
      <div className="settings-section-heading">
        <h3 id="settings-offline-title">{t('offlineData')}</h3>
        <button className="settings-reset" type="button" id="clear-offline-data"
          disabled={offlinePhase === 'clearing' || offlinePhase === 'cleared'}
          onClick={() => { void clearOfflineData().catch(() => {}); }}>
          {t(offlinePhase === 'clearing' ? 'clearingOfflineData' : 'clearOfflineData')}
        </button>
      </div>
      <p className="settings-offline-hint">{t('clearOfflineHint')}</p>
    </section>
    <div className="settings-debug">
      <span className="settings-debug-label">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M14.6 6.4a5 5 0 0 0-6.5 6.5L3 18l3 3 5.1-5.1a5 5 0 0 0 6.5-6.5L14 13l-3-3 3.6-3.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        {t('debugTools')}
      </span>
      <a className="settings-debug-link" href="./debug/index.html" target="_blank" rel="noopener noreferrer" aria-label={t('openDebug')}>
        {t('open')}
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true"><path d="M14 4h6v6m0-6-9 9M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </a>
    </div>
    <OfflineStatus language={language} />
    <FairStatistics saveError={statisticsSaveError} />
  </Modal>;
}
