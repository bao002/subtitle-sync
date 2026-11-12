/**
 * Component Optimization Service (componentOptimizationService.ts)
 *
 * Centralized service for:
 * 1. Managing zero-processing lifecycles for inactive, collapsed, or hidden components.
 * 2. Pure business logic helpers extracted out of UI components.
 * 3. Visibility-aware animation loops and timers that pause when document or element is hidden.
 */

import { type Row } from "@/lib/subtitles";
import { countWords, isCompleteSentence } from "@/utils/newSubtitlesParser";
import { type LogEntry } from "@/utils/logBuffer";

/**
/**
 * Check if a subtitle row matches row criteria (max word limit and sentence completeness).
 * Pure service function extracted from SubtitlesTablePanel.
 */
export function isSubtitleRowMatchingCriteria(
  r: Row,
  baseLanguage: string | undefined,
  maxWords: number | undefined,
  skipIncomplete: boolean | undefined,
): boolean {
  if ((!maxWords || maxWords <= 0) && !skipIncomplete) {
    return true;
  }
  const text = (baseLanguage && r.texts[baseLanguage]) || Object.values(r.texts)[0] || "";
  if (typeof maxWords === "number" && maxWords > 0) {
    if (countWords(text) > maxWords) {
      return false;
    }
  }
  if (skipIncomplete && text && !isCompleteSentence(text)) {
    return false;
  }
  return true;
}

/**
 * Filter subtitle rows by max word limit and sentence completeness.
 * Pure service function extracted from SubtitlesTablePanel.
 */
export function filterSubtitleRowsByCriteria(
  rows: Row[],
  baseLanguage: string | undefined,
  maxWords: number | undefined,
  skipIncomplete: boolean | undefined,
): Row[] {
  if (!rows || rows.length === 0) return [];
  if ((!maxWords || maxWords <= 0) && !skipIncomplete) {
    return rows;
  }

  return rows.filter((r) =>
    isSubtitleRowMatchingCriteria(r, baseLanguage, maxWords, skipIncomplete),
  );
}

/**
 * Filter log entries only when viewer is actually expanded/shown.
 * When collapsed or hidden, returns empty array to consume 0 processing.
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
    return entries.filter((entry) => entry.level === "ACTION" || entry.level === "ERROR");
  }
  return entries;
}

/**
 * Tokenize sentence text into distinct word tokens with character bounds.
 * Pure service function extracted from AlternativeVideoPlayerView / WordBalloonLearningView.
 */
export function tokenizeSentenceToWordTokens(
  text: string,
): Array<{ word: string; start: number; end: number; index: number }> {
  if (!text) return [];
  const words: Array<{ word: string; start: number; end: number; index: number }> = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(text)) !== null) {
    words.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
      index: idx++,
    });
  }
  return words;
}

/**
 * Creates a resource-safe requestAnimationFrame loop that automatically pauses
 * when document.hidden is true (browser tab inactive) or element is not connected.
 */
export function createVisibilitySafeAnimationLoop(renderFrame: () => void): {
  start: () => void;
  stop: () => void;
  isActive: () => boolean;
} {
  let animId: number | null = null;
  let running = false;

  const tick = () => {
    if (!running) return;
    if (typeof document !== "undefined" && document.hidden) {
      // Pause frame scheduling when document is hidden
      return;
    }
    renderFrame();
    if (running) {
      animId = requestAnimationFrame(tick);
    }
  };

  const handleVisibilityChange = () => {
    if (!running) return;
    if (typeof document !== "undefined" && !document.hidden) {
      if (animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(tick);
    }
  };

  return {
    start: () => {
      if (running) return;
      running = true;
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }
      animId = requestAnimationFrame(tick);
    },
    stop: () => {
      running = false;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    },
    isActive: () => running,
  };
}

/**
 * Check whether a stage or component is currently visible to gate processing.
 */
export function shouldComponentProcess(
  isContainerShown: boolean,
  isElementVisible: boolean = true,
): boolean {
  if (!isContainerShown) return false;
  if (!isElementVisible) return false;
  if (typeof document !== "undefined" && document.hidden) return false;
  return true;
}
