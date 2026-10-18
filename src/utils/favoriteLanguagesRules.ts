import {
  getFavoriteLanguages,
  setFavoriteLanguages,
  getUserLearningLanguages,
  setUserLearningLanguages,
  FAVORITE_LANGUAGES_KEY,
} from "./appSettings";

/**
 * Extracts a detected language code from a link, query string, or returns fallback.
 */
export function extractDetectedLanguage(linkOrCode?: string, fallback = "en"): string {
  if (!linkOrCode || typeof linkOrCode !== "string") return fallback;
  const trimmed = linkOrCode.trim();
  if (!trimmed) return fallback;

  // If directly passed a short language code (e.g. "en", "es", "he", "iw", "zh-Hans")
  if (/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)?$/.test(trimmed)) {
    const code = trimmed.toLowerCase();
    return code === "iw" ? "he" : code;
  }

  // Parse as URL or query string
  try {
    const urlString = trimmed.startsWith("http")
      ? trimmed
      : `https://www.youtube.com/watch?${trimmed.startsWith("?") ? trimmed.slice(1) : trimmed}`;
    const url = new URL(urlString);
    const langParam =
      url.searchParams.get("lang") ||
      url.searchParams.get("subLang") ||
      url.searchParams.get("hl") ||
      url.searchParams.get("tlang");
    if (langParam) {
      const code = langParam.trim().toLowerCase();
      return code === "iw" ? "he" : code;
    }
  } catch {
    // URL parsing failed, use fallback
  }

  return fallback;
}

export interface VideoSharingRulesResult {
  orderedFavorites: string[];
  spokenLanguages: string[];
  topLanguage: string | null;
  bottomLanguage: string;
}

export interface VideoSharingRulesOptions {
  currentFavorites?: string[];
  isAndroid?: boolean;
  persist?: boolean;
}

/**
 * Applies the 4 mandatory rules upon sharing a video link with the app:
 * a. Add the default/detected language at the bottom of the favorite language list.
 * b. Remove any tts-play checkbox selection - and checkbox-select only the language at the top.
 * c. The order should be stored on localStorage.
 * d. Allow multi-selection (spoken & targetLanguages support multiple selections).
 */
export function applyVideoSharingFavoriteLanguageRules(
  linkOrDetected?: string,
  options: VideoSharingRulesOptions = {},
): VideoSharingRulesResult {
  const detected = extractDetectedLanguage(linkOrDetected, "en");

  // Determine starting favorite languages
  let baseList: string[] = [];
  if (options.currentFavorites && options.currentFavorites.length > 0) {
    baseList = [...options.currentFavorites];
  } else {
    baseList = getFavoriteLanguages();
    if (!baseList || baseList.length === 0) {
      baseList = getUserLearningLanguages();
    }
  }

  // If still empty, provide clean default learning languages (e.g. Hebrew and Italian)
  if (!baseList || baseList.length === 0) {
    baseList = ["he", "it"];
  }

  // Rule a: Add default/detected language at the bottom
  // Remove detected language from earlier positions if already present
  const withoutDetected = baseList.filter((code) => code.toLowerCase() !== detected.toLowerCase());

  // Guarantee there is at least one language ahead of the detected language if baseList was only the detected language
  if (withoutDetected.length === 0) {
    // e.g. If detected is "en", add "he" as the primary target language on top
    const fallbackTop = detected === "en" ? "he" : "en";
    withoutDetected.push(fallbackTop);
  }

  // Detected language goes strictly at the bottom (end of the array)
  const orderedFavorites = [...withoutDetected, detected];

  // Rule b: Remove any tts-play checkbox selection - and checkbox-select only the language at the top
  const topLanguage = orderedFavorites.length > 0 ? orderedFavorites[0]! : null;
  const spokenLanguages = topLanguage ? [topLanguage] : [];

  // Rule c: The order should be stored on the localStorage
  if (options.persist !== false) {
    try {
      setFavoriteLanguages(orderedFavorites);
      setUserLearningLanguages(orderedFavorites);
      if (typeof window !== "undefined") {
        localStorage.setItem(FAVORITE_LANGUAGES_KEY, JSON.stringify(orderedFavorites));
      }
    } catch (e) {
      console.warn("[favoriteLanguagesRules] Failed to persist to localStorage:", e);
    }
  }

  return {
    orderedFavorites,
    spokenLanguages,
    topLanguage,
    bottomLanguage: detected,
  };
}
