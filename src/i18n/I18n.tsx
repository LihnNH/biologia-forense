import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { CASES, CASE_LABELS, CASE_RESULTS } from '../data/cases';
import { hotspots } from '../data/dna';
import { caseLabelsEn, caseResultsEn, casesEn, hotspotDetailsEn } from './content.en';
import { en, pt, type MessageKey } from './messages';

export type Language = 'pt-BR' | 'en';
const storageKey = 'forensic-language';

function readLanguage(): Language {
  try { return localStorage.getItem(storageKey) === 'en' ? 'en' : 'pt-BR'; }
  catch { return 'pt-BR'; }
}

function localizedContent(language: Language) {
  return language === 'en'
    ? { messages: en, cases: casesEn, caseLabels: caseLabelsEn, caseResults: caseResultsEn,
      hotspots: hotspots.map((hotspot, index) => ({ ...hotspot, ...hotspotDetailsEn[index] })) }
    : { messages: pt, cases: CASES, caseLabels: CASE_LABELS, caseResults: CASE_RESULTS, hotspots };
}

interface I18nValue extends ReturnType<typeof localizedContent> {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readLanguage);
  const content = localizedContent(language);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${content.messages.appTitle} — ${content.messages.subtitle}`;
    try { localStorage.setItem(storageKey, language); } catch { /* The setting still works when storage is unavailable. */ }
  }, [language, content.messages]);
  const t: I18nValue['t'] = (key, values = {}) => content.messages[key].replace(/\{(\w+)\}/g, (placeholder, name: string) => String(values[name] ?? placeholder));
  return <I18nContext value={{ ...content, language, setLanguage, t }}>{children}</I18nContext>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
