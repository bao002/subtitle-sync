/**
 * Speech Synthesis Voice utilities
 * Provides voice deduplication, language filtering, ISO-639 alias normalization,
 * persistent voice caching, and unique key generation to prevent React duplicate key errors.
 */

export interface SpeechVoiceLike {
  voiceURI: string;
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
}

/**
 * ISO 639-1 / BCP-47 alias mappings for voice engines that use legacy or alternate codes.
 * E.g. Android & Java frequently report Hebrew as "iw" instead of "he", Indonesian as "in", etc.
 */
export const ISO_LANGUAGE_ALIASES: Record<string, string[]> = {
  he: ["he", "iw"],
  iw: ["he", "iw"],
  id: ["id", "in"],
  in: ["id", "in"],
  yi: ["yi", "ji"],
  ji: ["yi", "ji"],
};

/**
 * Normalizes a language code (e.g. "en_US" -> "en-us", "he-IL" -> "he-il").
 */
export function normalizeLanguageCode(code: string): string {
  if (!code) return "";
  return code.trim().replace(/_/g, "-").toLowerCase();
}

/**
 * Checks if a voice language matches a target subtitle language code,
 * accounting for dialect suffixes (en-US matching en) and ISO aliases (iw matching he).
 */
export function matchesLanguageCode(voiceLang: string, targetLang: string): boolean {
  if (!voiceLang || !targetLang) return false;
  const normalizedVoice = normalizeLanguageCode(voiceLang);
  const normalizedTarget = normalizeLanguageCode(targetLang);

  const voicePrefix = normalizedVoice.split("-")[0];
  const targetPrefix = normalizedTarget.split("-")[0];

  // Direct prefix match (e.g. "en-us" starts with "en" or "en" matches "en")
  if (voicePrefix === targetPrefix) return true;

  // Check aliases (e.g. target is "he", voice is "iw" or "iw-IL")
  const targetAliases = ISO_LANGUAGE_ALIASES[targetPrefix] || [targetPrefix];
  const voiceAliases = ISO_LANGUAGE_ALIASES[voicePrefix] || [voicePrefix];

  return targetAliases.some((alias) => voiceAliases.includes(alias));
}

/**
 * Module-level voice cache ensuring voices remain available across render cycles
 * and inside asynchronous speech execution closures even if speechSynthesis.getVoices()
 * returns an empty array momentarily.
 */
let moduleCachedVoices: SpeechVoiceLike[] = [];

export function setCachedVoices<T extends SpeechVoiceLike>(voices: T[]): void {
  if (Array.isArray(voices) && voices.length > 0) {
    moduleCachedVoices = deduplicateVoices(voices);
  }
}

export function getCachedVoices<T extends SpeechVoiceLike>(): T[] {
  return (moduleCachedVoices as T[]) || [];
}

/**
 * Deduplicates an array of SpeechSynthesisVoice items by voiceURI and name.
 * Browsers (especially Chromium / Windows / Android) frequently enumerate the
 * same voice multiple times (e.g. local vs remote or 32/64 bit SAPI).
 */
export function deduplicateVoices<T extends SpeechVoiceLike>(voices: T[]): T[] {
  if (!Array.isArray(voices)) return [];
  const seen = new Set<string>();
  return voices.filter((voice) => {
    // Unique signature based on voiceURI and name
    const signature = voice.voiceURI
      ? `uri:${voice.voiceURI}`
      : `name:${voice.name}|lang:${voice.lang}`;
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}

/**
 * Filters and deduplicates voices matching a target language code prefix or alias.
 * If fallbackToAll is true and no voices match the specific language, returns all available voices.
 */
export function getLanguageVoices<T extends SpeechVoiceLike>(
  voices: T[],
  langCode: string,
  fallbackToAll: boolean = false,
): T[] {
  if (!Array.isArray(voices)) return [];
  const deduplicated = deduplicateVoices(voices);
  if (!langCode) return deduplicated;

  const matching = deduplicated.filter((voice) => matchesLanguageCode(voice.lang, langCode));

  if (matching.length > 0) {
    return matching;
  }

  // If no language-specific match exists and fallback is enabled, provide all voices
  if (fallbackToAll) {
    return deduplicated;
  }

  return [];
}

/**
 * Finds a specific voice by voiceURI or name.
 */
export function findVoiceByUriOrName<T extends SpeechVoiceLike>(
  voices: T[],
  identifier: string,
): T | undefined {
  if (!Array.isArray(voices) || !identifier) return undefined;
  return (
    voices.find((v) => v.voiceURI === identifier) ||
    voices.find((v) => v.name === identifier) ||
    voices.find((v) => `${v.name} (${v.lang})` === identifier)
  );
}

/**
 * Produces a guaranteed unique React key for a voice option.
 */
export function getUniqueVoiceKey(voice: SpeechVoiceLike, index: number): string {
  const identifier = voice.voiceURI || voice.name || "voice";
  return `${identifier}__idx_${index}`;
}
