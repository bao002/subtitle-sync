import type { Json3 } from "@/lib/subtitles";

export interface SubtitlePunctuationStats {
  langCode: string;
  commas: number;
  periods: number;
  questionMarks: number;
  exclamationMarks: number;
  colons: number;
  semicolons: number;
  totalPunctuation: number;
  cuesCount: number;
  wordsCount: number;
}

/**
 * Regex matching standard and international comma characters:
 * - standard ASCII comma `,` (\u002C)
 * - Arabic comma `،` (\u060C)
 * - Fullwidth comma `，` (\uFF0C)
 * - Ideographic comma `、` (\u3001)
 */
export const COMMA_REGEX = /[,\u060C\uFF0C\u3001]/g;

/**
 * Regex matching periods / full stops:
 * - standard ASCII dot `.` (\u002E)
 * - Arabic full stop `۔` (\u06D4)
 * - Ideographic full stop `。` (\u3002)
 */
export const PERIOD_REGEX = /[.\u06D4\u3002]/g;

/**
 * Regex matching question marks:
 * - standard ASCII `?` (\u003F)
 * - Arabic question mark `؟` (\u061F)
 * - Fullwidth question mark `？` (\uFF1F)
 */
export const QUESTION_REGEX = /[?\u061F\uFF1F]/g;

/**
 * Regex matching exclamation marks:
 * - standard ASCII `!` (\u0021)
 * - Fullwidth exclamation `！` (\uFF01)
 */
export const EXCLAMATION_REGEX = /[!\uFF01]/g;

/**
 * Regex matching colons:
 * - standard ASCII `:` (\u003A)
 * - Fullwidth colon `：` (\uFF1A)
 */
export const COLON_REGEX = /[:\uFF1A]/g;

/**
 * Regex matching semicolons:
 * - standard ASCII `;` (\u003B)
 * - Arabic semicolon `؛` (\u061B)
 * - Fullwidth semicolon `；` (\uFF1B)
 */
export const SEMICOLON_REGEX = /[;\u061B\uFF1B]/g;

/**
 * Extracts plain text string from any subtitle track representation
 * (YouTube Json3, array of cues, or raw string).
 */
export function extractTextFromTrack(track: unknown): { text: string; cuesCount: number } {
  if (!track) return { text: "", cuesCount: 0 };

  let combinedText = "";
  let cuesCount = 0;

  if (typeof track === "string") {
    try {
      const parsed = JSON.parse(track);
      return extractTextFromTrack(parsed);
    } catch {
      return { text: track, cuesCount: 1 };
    }
  }

  // Handle YouTube json3 format with `events`
  if (typeof track === "object" && track !== null && "events" in track) {
    const json3 = track as Json3;
    if (Array.isArray(json3.events)) {
      cuesCount = json3.events.length;
      for (const event of json3.events) {
        if (Array.isArray(event.segs)) {
          for (const seg of event.segs) {
            if (seg && typeof seg.utf8 === "string") {
              combinedText += seg.utf8 + " ";
            }
          }
        }
      }
    }
    return { text: combinedText, cuesCount };
  }

  // Handle array of cue objects with `text` property
  if (Array.isArray(track)) {
    cuesCount = track.length;
    for (const cue of track) {
      if (cue && typeof cue === "object") {
        if ("text" in cue && typeof (cue as { text: unknown }).text === "string") {
          combinedText += (cue as { text: string }).text + " ";
        } else if ("utf8" in cue && typeof (cue as { utf8: unknown }).utf8 === "string") {
          combinedText += (cue as { utf8: string }).utf8 + " ";
        }
      } else if (typeof cue === "string") {
        combinedText += cue + " ";
      }
    }
    return { text: combinedText, cuesCount };
  }

  return { text: combinedText, cuesCount };
}

/**
 * Calculates complete punctuation statistics for a given subtitle track.
 */
export function calculateTrackPunctuationStats(
  langCode: string,
  track: unknown,
): SubtitlePunctuationStats {
  const { text, cuesCount } = extractTextFromTrack(track);

  if (!text) {
    return {
      langCode,
      commas: 0,
      periods: 0,
      questionMarks: 0,
      exclamationMarks: 0,
      colons: 0,
      semicolons: 0,
      totalPunctuation: 0,
      cuesCount: 0,
      wordsCount: 0,
    };
  }

  const commas = (text.match(COMMA_REGEX) || []).length;
  const periods = (text.match(PERIOD_REGEX) || []).length;
  const questionMarks = (text.match(QUESTION_REGEX) || []).length;
  const exclamationMarks = (text.match(EXCLAMATION_REGEX) || []).length;
  const colons = (text.match(COLON_REGEX) || []).length;
  const semicolons = (text.match(SEMICOLON_REGEX) || []).length;
  const totalPunctuation =
    commas + periods + questionMarks + exclamationMarks + colons + semicolons;

  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordsCount = words.length;

  return {
    langCode,
    commas,
    periods,
    questionMarks,
    exclamationMarks,
    colons,
    semicolons,
    totalPunctuation,
    cuesCount,
    wordsCount,
  };
}

/**
 * Calculates punctuation statistics for multiple default subtitle tracks and
 * identifies the recommended default subtitle track having the highest number of commas.
 */
export function analyzeDefaultSubtitlesPunctuation(
  defaultLanguages: string[],
  tracks?: Record<string, unknown> | null,
  activeLanguage?: string,
): {
  statsMap: Record<string, SubtitlePunctuationStats>;
  recommendedLang: string | null;
  maxCommas: number;
} {
  const statsMap: Record<string, SubtitlePunctuationStats> = {};
  let recommendedLang: string | null = null;
  let maxCommas = 0;

  for (const lang of defaultLanguages) {
    if (!lang) continue;
    const normalized = lang === "iw" ? "he" : lang;
    const track = tracks?.[lang] || tracks?.[normalized];
    const stats = calculateTrackPunctuationStats(lang, track);
    statsMap[lang] = stats;

    // Track with more commas gets recommended
    if (stats.commas > maxCommas) {
      maxCommas = stats.commas;
      recommendedLang = lang;
    } else if (stats.commas === maxCommas && stats.commas > 0) {
      // If tied, prefer the currently active language if it's one of the tied winners
      if (activeLanguage && (activeLanguage === lang || activeLanguage === normalized)) {
        recommendedLang = lang;
      }
    }
  }

  return {
    statsMap,
    recommendedLang,
    maxCommas,
  };
}
