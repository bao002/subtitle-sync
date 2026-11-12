import type { LogEntry } from "@/utils/logBuffer";
import { countWords, isCompleteSentence } from "@/utils/newSubtitlesParser";
import { subtitleTextForColumn, type Row } from "@/lib/subtitles";

/**
 * Word token representation extracted from sentences for interactive word learning and highlighting.
 */
export interface WordToken {
  index: number;
  word: string;
  start: number;
  end: number;
}

/**
 * Animation loop interface with visibility-aware pausing.
 */
export interface VisibilitySafeAnimationLoop {
  start: () => void;
  stop: () => void;
}

/**
 * Tokenize a sentence string into individual word tokens with character offsets and indices.
 */
export function tokenizeSentenceToWordTokens(sentence: string): WordToken[] {
  if (!sentence || typeof sentence !== "string") return [];
  const tokens: WordToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = regex.exec(sentence)) !== null) {
    tokens.push({
      index,
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
    index++;
  }
  return tokens;
}

/**
 * Filter log buffer entries in an optimized manner.
 * When log viewer is collapsed or not visible, returns empty array to consume 0 processing.
 */
export function filterLogEntriesOptimized(
  entries: readonly LogEntry[] | LogEntry[],
  filterLevel: "ALL" | "ACTIONS_ERRORS",
  isExpanded: boolean,
): readonly LogEntry[] {
  if (!isExpanded || !entries || entries.length === 0) {
    return [];
  }
  if (filterLevel === "ACTIONS_ERRORS") {
    return entries.filter(
      (entry) =>
        entry.level === "ACTION" ||
        entry.level === "ERROR" ||
        entry.category === "action" ||
        entry.category === "error",
    );
  }
  return entries;
}

export interface SubtitleCriteriaOptions {
  baseLanguage?: string;
  maxWords?: number;
  skipIncomplete?: boolean;
  maxWordsPerLang?: Record<string, number>;
  languageMaxWords?: Record<string, number>;
}

/**
 * Pure evaluation function to check if a subtitle row matches current parser row criteria
 * (max words per sentence limit, per-language max words limits, and complete sentence punctuation requirements).
 */
export function isSubtitleRowMatchingCriteria(
  row: Row,
  baseLanguageOrOptions?: string | SubtitleCriteriaOptions,
  maxWords?: number,
  skipIncomplete?: boolean,
  maxWordsPerLang?: Record<string, number>,
): boolean {
  if (!row) return false;

  let baseLang = "";
  let wordLimit: number | undefined;
  let requireComplete = false;
  let perLangLimits: Record<string, number> | undefined;

  if (typeof baseLanguageOrOptions === "object" && baseLanguageOrOptions !== null) {
    baseLang = baseLanguageOrOptions.baseLanguage || "";
    wordLimit = baseLanguageOrOptions.maxWords;
    requireComplete = Boolean(baseLanguageOrOptions.skipIncomplete);
    perLangLimits = baseLanguageOrOptions.maxWordsPerLang || baseLanguageOrOptions.languageMaxWords;
  } else {
    baseLang = typeof baseLanguageOrOptions === "string" ? baseLanguageOrOptions : "";
    wordLimit = maxWords;
    requireComplete = Boolean(skipIncomplete);
    perLangLimits = maxWordsPerLang;
  }

  const text =
    subtitleTextForColumn(row, baseLang) ||
    (row.texts ? Object.values(row.texts)[0] || "" : "");

  if (typeof wordLimit === "number" && wordLimit > 0) {
    const words = countWords(text);
    if (words > wordLimit) {
      return false;
    }
  }

  if (perLangLimits && typeof perLangLimits === "object") {
    for (const [langCode, limit] of Object.entries(perLangLimits)) {
      if (typeof limit === "number" && limit > 0) {
        const langText = row.texts?.[langCode] || subtitleTextForColumn(row, langCode);
        if (langText && countWords(langText) > limit) {
          return false;
        }
      }
    }
  }

  if (requireComplete) {
    if (!isCompleteSentence(text)) {
      return false;
    }
  }

  return true;
}

/**
 * Filters a list of subtitle rows according to criteria.
 */
export function filterSubtitleRowsByCriteria(
  rows: Row[],
  baseLanguageOrOptions?: string | SubtitleCriteriaOptions,
  maxWords?: number,
  skipIncomplete?: boolean,
  maxWordsPerLang?: Record<string, number>,
): Row[] {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.filter((r) =>
    isSubtitleRowMatchingCriteria(r, baseLanguageOrOptions, maxWords, skipIncomplete, maxWordsPerLang)
  );
}

/**
 * Creates a 60 FPS requestAnimationFrame animation loop that halts execution
 * whenever the tab is hidden (document.hidden) or the loop is stopped.
 * Safe across both browser and Node/SSR test environments.
 */
export function createVisibilitySafeAnimationLoop(callback: () => void): VisibilitySafeAnimationLoop {
  let animId: number | null = null;
  let running = false;

  const requestFrame = (cb: () => void): number => {
    if (typeof requestAnimationFrame !== "undefined") {
      return requestAnimationFrame(cb);
    }
    return setTimeout(cb, 16) as unknown as number;
  };

  const cancelFrame = (id: number): void => {
    if (typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  };

  const frame = () => {
    if (!running) return;
    if (typeof document === "undefined" || !document.hidden) {
      callback();
    }
    animId = requestFrame(frame);
  };

  const handleVisibilityChange = () => {
    if (typeof document !== "undefined" && !document.hidden && running && animId === null) {
      animId = requestFrame(frame);
    }
  };

  return {
    start() {
      if (running) return;
      running = true;
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }
      animId = requestFrame(frame);
    },
    stop() {
      running = false;
      if (animId !== null) {
        cancelFrame(animId);
        animId = null;
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    },
  };
}

/**
 * Evaluates whether a component should perform active background work or updates.
 */
export function shouldComponentProcess(isVisible: boolean, isParentOpen?: boolean): boolean {
  if (!isVisible) return false;
  if (isParentOpen !== undefined && !isParentOpen) return false;
  return true;
}
