import type { ContentLanguage } from './types.js';

/** Bengali (Bangla) Unicode block, U+0980–U+09FF. */
export const BENGALI_RANGE = /[\u0980-\u09FF]/g;
/** Arabic / Hebrew script, used to spot RTL content. */
export const RTL_RANGE = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
const LATIN_RANGE = /[A-Za-z]/g;

function count(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

/**
 * Detect the dominant script of a text sample.
 *
 * - `bn` when Bengali characters dominate the alphabetic content.
 * - `rtl` when Arabic/Hebrew characters dominate.
 * - `mixed` when Bengali and Latin are both substantial (>= 20% each).
 * - `en` when Latin dominates.
 * - `unknown` when there is almost no alphabetic text.
 */
export function detectContentLanguage(text: string): ContentLanguage {
  const bengali = count(text, BENGALI_RANGE);
  const latin = count(text, LATIN_RANGE);
  const rtl = count(text, RTL_RANGE);
  const total = bengali + latin + rtl;
  if (total < 10) return 'unknown';
  if (rtl / total > 0.5) return 'rtl';
  const bengaliShare = bengali / total;
  const latinShare = latin / total;
  if (bengaliShare >= 0.2 && latinShare >= 0.2) return 'mixed';
  if (bengaliShare > latinShare) return 'bn';
  return 'en';
}

/** Languages accepted for the HTML `lang` attribute in this toolkit. */
export const KNOWN_LANGS = new Set(['ar', 'bn', 'de', 'en', 'es', 'fa', 'fr', 'he', 'hi', 'ur']);

/**
 * Normalise a lang value (`bn-BD` -> `bn`) and check it is a language we
 * recognise. Unknown-but-well-formed values are not flagged as errors by the
 * engine; they are only flagged when they contradict the page content.
 */
export function normaliseLang(lang: string | null | undefined): string | null {
  if (!lang) return null;
  const primary = lang.trim().toLowerCase().split('-')[0];
  return primary === undefined || primary === '' ? null : primary;
}

export function isKnownLang(lang: string | null | undefined): boolean {
  const primary = normaliseLang(lang);
  return primary !== null && KNOWN_LANGS.has(primary);
}
