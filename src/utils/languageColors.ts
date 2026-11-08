/**
 * Language Color Palette Utility
 * Assigns distinct, accessible, and subtle visual color identities to each subtitle language column
 * so that users can track parallel translations effortlessly across rows and columns.
 */

export interface LanguageColorPalette {
  code: string;
  name: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  cellBg: string;
  cellBorder: string;
  cellActiveBg: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
  dot?: string;
}

export const LANGUAGE_COLOR_MAP: Record<string, LanguageColorPalette> = {
  en: {
    code: "en",
    name: "English",
    headerBg: "bg-sky-500/10 dark:bg-sky-950/40",
    headerBorder: "border-sky-500/30",
    headerText: "text-sky-700 dark:text-sky-300",
    cellBg: "bg-sky-500/[0.03] dark:bg-sky-950/[0.15]",
    cellBorder: "border-sky-500/20",
    cellActiveBg: "bg-sky-500/[0.12] dark:bg-sky-900/[0.30]",
    badgeBg: "bg-sky-500/20",
    badgeText: "text-sky-700 dark:text-sky-300",
    accentBar: "bg-sky-500",
  },
  he: {
    code: "he",
    name: "Hebrew",
    headerBg: "bg-indigo-500/10 dark:bg-indigo-950/40",
    headerBorder: "border-indigo-500/30",
    headerText: "text-indigo-700 dark:text-indigo-300",
    cellBg: "bg-indigo-500/[0.03] dark:bg-indigo-950/[0.15]",
    cellBorder: "border-indigo-500/20",
    cellActiveBg: "bg-indigo-500/[0.12] dark:bg-indigo-900/[0.30]",
    badgeBg: "bg-indigo-500/20",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    accentBar: "bg-indigo-500",
  },
  es: {
    code: "es",
    name: "Spanish",
    headerBg: "bg-amber-500/10 dark:bg-amber-950/40",
    headerBorder: "border-amber-500/30",
    headerText: "text-amber-700 dark:text-amber-300",
    cellBg: "bg-amber-500/[0.03] dark:bg-amber-950/[0.15]",
    cellBorder: "border-amber-500/20",
    cellActiveBg: "bg-amber-500/[0.12] dark:bg-amber-900/[0.30]",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-300",
    accentBar: "bg-amber-500",
  },
  ar: {
    code: "ar",
    name: "Arabic",
    headerBg: "bg-emerald-500/10 dark:bg-emerald-950/40",
    headerBorder: "border-emerald-500/30",
    headerText: "text-emerald-700 dark:text-emerald-300",
    cellBg: "bg-emerald-500/[0.03] dark:bg-emerald-950/[0.15]",
    cellBorder: "border-emerald-500/20",
    cellActiveBg: "bg-emerald-500/[0.12] dark:bg-emerald-900/[0.30]",
    badgeBg: "bg-emerald-500/20",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    accentBar: "bg-emerald-500",
  },
  it: {
    code: "it",
    name: "Italian",
    headerBg: "bg-rose-500/10 dark:bg-rose-950/40",
    headerBorder: "border-rose-500/30",
    headerText: "text-rose-700 dark:text-rose-300",
    cellBg: "bg-rose-500/[0.03] dark:bg-rose-950/[0.15]",
    cellBorder: "border-rose-500/20",
    cellActiveBg: "bg-rose-500/[0.12] dark:bg-rose-900/[0.30]",
    badgeBg: "bg-rose-500/20",
    badgeText: "text-rose-700 dark:text-rose-300",
    accentBar: "bg-rose-500",
  },
  ru: {
    code: "ru",
    name: "Russian",
    headerBg: "bg-purple-500/10 dark:bg-purple-950/40",
    headerBorder: "border-purple-500/30",
    headerText: "text-purple-700 dark:text-purple-300",
    cellBg: "bg-purple-500/[0.03] dark:bg-purple-950/[0.15]",
    cellBorder: "border-purple-500/20",
    cellActiveBg: "bg-purple-500/[0.12] dark:bg-purple-900/[0.30]",
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-700 dark:text-purple-300",
    accentBar: "bg-purple-500",
  },
  "pt-BR": {
    code: "pt-BR",
    name: "Portuguese (Brazil)",
    headerBg: "bg-teal-500/10 dark:bg-teal-950/40",
    headerBorder: "border-teal-500/30",
    headerText: "text-teal-700 dark:text-teal-300",
    cellBg: "bg-teal-500/[0.03] dark:bg-teal-950/[0.15]",
    cellBorder: "border-teal-500/20",
    cellActiveBg: "bg-teal-500/[0.12] dark:bg-teal-900/[0.30]",
    badgeBg: "bg-teal-500/20",
    badgeText: "text-teal-700 dark:text-teal-300",
    accentBar: "bg-teal-500",
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    headerBg: "bg-teal-500/10 dark:bg-teal-950/40",
    headerBorder: "border-teal-500/30",
    headerText: "text-teal-700 dark:text-teal-300",
    cellBg: "bg-teal-500/[0.03] dark:bg-teal-950/[0.15]",
    cellBorder: "border-teal-500/20",
    cellActiveBg: "bg-teal-500/[0.12] dark:bg-teal-900/[0.30]",
    badgeBg: "bg-teal-500/20",
    badgeText: "text-teal-700 dark:text-teal-300",
    accentBar: "bg-teal-500",
  },
  de: {
    code: "de",
    name: "German",
    headerBg: "bg-orange-500/10 dark:bg-orange-950/40",
    headerBorder: "border-orange-500/30",
    headerText: "text-orange-700 dark:text-orange-300",
    cellBg: "bg-orange-500/[0.03] dark:bg-orange-950/[0.15]",
    cellBorder: "border-orange-500/20",
    cellActiveBg: "bg-orange-500/[0.12] dark:bg-orange-900/[0.30]",
    badgeBg: "bg-orange-500/20",
    badgeText: "text-orange-700 dark:text-orange-300",
    accentBar: "bg-orange-500",
  },
  fr: {
    code: "fr",
    name: "French",
    headerBg: "bg-blue-500/10 dark:bg-blue-950/40",
    headerBorder: "border-blue-500/30",
    headerText: "text-blue-700 dark:text-blue-300",
    cellBg: "bg-blue-500/[0.03] dark:bg-blue-950/[0.15]",
    cellBorder: "border-blue-500/20",
    cellActiveBg: "bg-blue-500/[0.12] dark:bg-blue-900/[0.30]",
    badgeBg: "bg-blue-500/20",
    badgeText: "text-blue-700 dark:text-blue-300",
    accentBar: "bg-blue-500",
  },
  ja: {
    code: "ja",
    name: "Japanese",
    headerBg: "bg-pink-500/10 dark:bg-pink-950/40",
    headerBorder: "border-pink-500/30",
    headerText: "text-pink-700 dark:text-pink-300",
    cellBg: "bg-pink-500/[0.03] dark:bg-pink-950/[0.15]",
    cellBorder: "border-pink-500/20",
    cellActiveBg: "bg-pink-500/[0.12] dark:bg-pink-900/[0.30]",
    badgeBg: "bg-pink-500/20",
    badgeText: "text-pink-700 dark:text-pink-300",
    accentBar: "bg-pink-500",
  },
  zh: {
    code: "zh",
    name: "Chinese",
    headerBg: "bg-red-500/10 dark:bg-red-950/40",
    headerBorder: "border-red-500/30",
    headerText: "text-red-700 dark:text-red-300",
    cellBg: "bg-red-500/[0.03] dark:bg-red-950/[0.15]",
    cellBorder: "border-red-500/20",
    cellActiveBg: "bg-red-500/[0.12] dark:bg-red-900/[0.30]",
    badgeBg: "bg-red-500/20",
    badgeText: "text-red-700 dark:text-red-300",
    accentBar: "bg-red-500",
  },
};

const FALLBACK_PALETTES: LanguageColorPalette[] = [
  LANGUAGE_COLOR_MAP.en,
  LANGUAGE_COLOR_MAP.he,
  LANGUAGE_COLOR_MAP.es,
  LANGUAGE_COLOR_MAP.ar,
  LANGUAGE_COLOR_MAP.it,
  LANGUAGE_COLOR_MAP.ru,
  LANGUAGE_COLOR_MAP["pt-BR"],
  LANGUAGE_COLOR_MAP.de,
  LANGUAGE_COLOR_MAP.fr,
  LANGUAGE_COLOR_MAP.ja,
];

/**
 * Returns a cohesive color palette for any language code
 */
export function getLanguageColorPalette(langCode: string): LanguageColorPalette {
  if (!langCode) return LANGUAGE_COLOR_MAP.en;
  if (LANGUAGE_COLOR_MAP[langCode]) {
    return LANGUAGE_COLOR_MAP[langCode];
  }
  const primaryPart = langCode.toLowerCase().split("-")[0];
  if (LANGUAGE_COLOR_MAP[primaryPart]) {
    return LANGUAGE_COLOR_MAP[primaryPart];
  }

  // Deterministic fallback based on charCode sum
  let sum = 0;
  for (let i = 0; i < langCode.length; i++) {
    sum += langCode.charCodeAt(i);
  }
  return FALLBACK_PALETTES[sum % FALLBACK_PALETTES.length] || LANGUAGE_COLOR_MAP.en;
}
