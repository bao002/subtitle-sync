/**
 * Zero Knowledge Word Learning Manager
 * When a user has zero knowledge in a language, learning single words is far more effective
 * than listening to full sentences.
 *
 * Provides:
 * 1. Extraction of distinct words from continuous sentence subtitles across all scripts.
 * 2. Word selection strategies: "longest" (most informative/content-rich) vs "random".
 * 3. Fast caching and translation fetching for the picked word into user's base language.
 */

import { translateWithGoogle, normalizeLanguage } from "./onDemandTranslationManager";
import { removeSpecialCharacters } from "./captionParser";
import { logWarn } from "./logBuffer";
import type { PickWordStrategy } from "../lib/playback-preferences";

// In-memory cache for translated words: key `${fromLang}:${toLang}:${word.toLowerCase()}` -> translation
const wordTranslationCache = new Map<string, string>();
const inFlightWordTranslations = new Map<string, Promise<string>>();

export function getWordTranslationCacheKey(
  word: string,
  fromLang: string,
  toLang: string,
): string | null {
  const trimmed = word.trim();
  if (!trimmed) return null;
  const normalizedFrom = normalizeLanguage(fromLang);
  const normalizedTo = normalizeLanguage(toLang);
  if (!normalizedFrom || !normalizedTo || normalizedFrom === normalizedTo) {
    return null;
  }
  return `${normalizedFrom}:${normalizedTo}:${trimmed.toLowerCase()}`;
}

export function getCachedWordTranslation(
  word: string,
  fromLang: string,
  toLang: string,
): string | null {
  const cacheKey = getWordTranslationCacheKey(word, fromLang, toLang);
  if (!cacheKey) return null;
  return wordTranslationCache.get(cacheKey) ?? null;
}

/**
 * Extracts clean words from a sentence, stripping punctuation, symbols, and whitespace.
 * Supports Latin, Hebrew, Arabic, Cyrillic, CJK, and all Unicode alphabets.
 */
export function extractWordsFromSentence(sentence: string): string[] {
  if (!sentence) return [];
  const clean = removeSpecialCharacters(sentence);
  if (!clean.trim()) return [];

  // Match sequences of Unicode letters, marks, or numbers
  const matched = clean.match(/[\p{L}\p{M}\p{N}]+/gu);
  if (!matched) {
    // Fallback: split by whitespace and strip non-alphanumeric punctuation
    return clean
      .split(/\s+/)
      .map((w) => w.replace(/[^\p{L}\p{M}\p{N}]/gu, "").trim())
      .filter((w) => w.length > 0);
  }
  return matched.map((w) => w.trim()).filter((w) => w.length > 0);
}

/**
 * Picks a single word from a sentence according to the configured strategy:
 * - "longest": selects the word with maximum character length (prioritizes key vocabulary).
 * - "random": randomly picks any word from the sentence.
 */
export function pickWordFromSentence(
  sentence: string,
  strategy: PickWordStrategy = "longest",
): string {
  const words = extractWordsFromSentence(sentence);
  if (words.length === 0) {
    return sentence.trim();
  }
  if (words.length === 1) {
    return words[0];
  }

  if (strategy === "random") {
    const idx = Math.floor(Math.random() * words.length);
    return words[idx] || words[0];
  }

  // Default: "longest" word
  let longest = words[0];
  for (let i = 1; i < words.length; i++) {
    if (words[i].length > longest.length) {
      longest = words[i];
    }
  }
  return longest;
}

/**
 * Translates a single picked word into the target/base language with aggressive in-memory caching
 * and concurrent request deduplication.
 */
export async function getWordTranslation(
  word: string,
  fromLang: string,
  toLang: string,
): Promise<string> {
  const trimmed = word.trim();
  if (!trimmed) return "";
  const normalizedFrom = normalizeLanguage(fromLang);
  const normalizedTo = normalizeLanguage(toLang);

  if (normalizedFrom === normalizedTo) {
    return trimmed;
  }

  const cacheKey = getWordTranslationCacheKey(trimmed, normalizedFrom, normalizedTo);
  if (!cacheKey) return "";

  if (wordTranslationCache.has(cacheKey)) {
    return wordTranslationCache.get(cacheKey)!;
  }

  const existingInFlight = inFlightWordTranslations.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const requestPromise = (async () => {
    try {
      const translated = await translateWithGoogle({
        text: trimmed,
        fromLang: normalizedFrom,
        toLang: normalizedTo,
      });
      const result = translated.trim();
      if (result) {
        wordTranslationCache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      logWarn(
        "ZeroKnowledge",
        `Word translation failed for "${trimmed}" (${normalizedFrom} -> ${normalizedTo}): ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      inFlightWordTranslations.delete(cacheKey);
    }
    return "";
  })();

  inFlightWordTranslations.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Clear the word translation cache (e.g. for testing or memory resets).
 */
export function clearWordTranslationCache(): void {
  wordTranslationCache.clear();
  inFlightWordTranslations.clear();
}
