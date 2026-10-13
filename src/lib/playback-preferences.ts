/** Device-saved playback/fetch preferences (localStorage). */

export type SubtitleRequestMode = "tlang" | "lang";
export type SectionOrder = "video-first" | "tts-first";

const KEYS = {
  requestMode: "yt_subtitle_request_mode_v1",
  sectionOrder: "yt_section_order_v1",
  ttsRatios: "yt_tts_ratios_v1",
  autoRetrySubtitles: "yt_auto_retry_subtitles_v1",
  retryPacingMinSec: "yt_retry_pacing_min_sec_v1",
  retryPacingMaxSec: "yt_retry_pacing_max_sec_v1",
  backgroundAudio: "yt_background_audio_enabled_v1",
} as const;

const memoryStorage = new Map<string, string>();

function getStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void } {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
    if (
      typeof globalThis !== "undefined" &&
      (globalThis as unknown as { localStorage?: Storage }).localStorage
    ) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    // ignore
  }
  return {
    getItem: (k: string) => memoryStorage.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memoryStorage.set(k, v);
    },
  };
}

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const s = getStorage();
  if (!s) return fallback;
  try {
    const v = s.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: string) {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

/** Primary request mode; the other one is used as the fallback. */
export const getSubtitleRequestMode = () =>
  read<SubtitleRequestMode>(KEYS.requestMode, ["tlang", "lang"], "tlang");
export const setSubtitleRequestMode = (m: SubtitleRequestMode) => write(KEYS.requestMode, m);
/** Primary first, then fallback. */
export const subtitleRequestModeOrder = (primary: SubtitleRequestMode): SubtitleRequestMode[] =>
  primary === "tlang" ? ["tlang", "lang"] : ["lang", "tlang"];

export const getSectionOrder = () =>
  read<SectionOrder>(KEYS.sectionOrder, ["video-first", "tts-first"], "video-first");
export const setSectionOrder = (o: SectionOrder) => write(KEYS.sectionOrder, o);

export const getTtsRatiosPreference = (): Record<string, number> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEYS.ttsRatios);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setTtsRatioPreference = (langCode: string, ratio: number) => {
  if (typeof window === "undefined") return;
  try {
    const existing = getTtsRatiosPreference();
    existing[langCode] = Math.max(1, Math.round(ratio));
    window.localStorage.setItem(KEYS.ttsRatios, JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
};

/**
 * Evaluates whether a subtitle sentence row is eligible for TTS playback based on the ratio
 * and skipping records that have already been played.
 * - rowIdx < 0: false
 * - alreadyPlayedRecords contains rowIdx: false (skip from TTS-play more than once)
 * - ratio = 1 (1:1 / 100%): every row is spoken
 * - ratio = 2 (1:2 / 50%): rows 0, 2, 4, ... are spoken
 * - ratio = N: 1 in every N rows (rowIdx % N === 0)
 */
export const isSubtitleInstanceEligibleForTTS = (
  rowIdx: number,
  ratio?: number | null,
  alreadyPlayedRecords?: Set<number> | ReadonlySet<number>,
): boolean => {
  if (rowIdx < 0) return false;
  if (alreadyPlayedRecords?.has(rowIdx)) return false;
  const interval = Math.max(1, Math.round(ratio ?? 1));
  return rowIdx % interval === 0;
};

/**
 * Checks whether a subtitle record should be skipped from TTS playback because it has
 * already been played.
 */
export const shouldSkipTTSBecauseAlreadyPlayed = (
  rowIdx: number,
  alreadyPlayedRecords?: Set<number> | ReadonlySet<number>,
): boolean => {
  if (rowIdx < 0) return true;
  return Boolean(alreadyPlayedRecords?.has(rowIdx));
};

/**
 * Evaluates whether a subtitle sentence should be background highlighted for TTS pronunciation.
 * Highlight is strictly applied ONLY when:
 * 1. The ratio is not 1:1 (i.e. ratio > 1).
 * 2. The language is enabled for speech (isSpoken === true).
 * 3. The sentence row is eligible to be pronounced (isSubtitleInstanceEligibleForTTS(rowIdx, ratio) === true).
 */
export const shouldHighlightSentenceForTTS = (
  rowIdx: number,
  ratio?: number | null,
  isSpoken: boolean = true,
): boolean => {
  if (!isSpoken || rowIdx < 0) return false;
  const currentRatio = Math.max(1, Math.round(ratio ?? 1));
  if (currentRatio <= 1) return false; // Strictly highlight only when ratio is not 1:1
  return isSubtitleInstanceEligibleForTTS(rowIdx, currentRatio);
};

export const getAutoRetrySubtitles = (): boolean => {
  const s = getStorage();
  if (!s) return true;
  try {
    const v = s.getItem(KEYS.autoRetrySubtitles);
    return v === null ? true : v === "1"; // Default true: retry by default
  } catch {
    return true;
  }
};

export const setAutoRetrySubtitles = (enabled: boolean) => {
  write(KEYS.autoRetrySubtitles, enabled ? "1" : "0");
};

export const getRetryPacingMinSec = (): number => {
  const s = getStorage();
  if (!s) return 3;
  try {
    const raw = s.getItem(KEYS.retryPacingMinSec);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 3;
  } catch {
    return 3;
  }
};

export const setRetryPacingMinSec = (sec: number) => {
  const clamped = Math.max(1, Math.round(sec));
  write(KEYS.retryPacingMinSec, String(clamped));
};

export const getRetryPacingMaxSec = (): number => {
  const s = getStorage();
  if (!s) return 8;
  try {
    const raw = s.getItem(KEYS.retryPacingMaxSec);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 8;
  } catch {
    return 8;
  }
};

export const setRetryPacingMaxSec = (sec: number) => {
  const clamped = Math.max(1, Math.round(sec));
  write(KEYS.retryPacingMaxSec, String(clamped));
};

export const getRandomRetryDelayMs = (
  minSec: number = getRetryPacingMinSec(),
  maxSec: number = getRetryPacingMaxSec(),
): number => {
  const safeMin = Math.max(1, Math.min(minSec, maxSec));
  const safeMax = Math.max(safeMin, Math.max(minSec, maxSec));
  const diff = safeMax - safeMin;
  const randomSec = safeMin + Math.random() * diff;
  return Math.round(randomSec * 1000);
};

export const getBackgroundAudioEnabled = (): boolean => {
  const s = getStorage();
  if (!s) return true;
  try {
    const raw = s.getItem(KEYS.backgroundAudio);
    return raw !== null ? raw === "1" || raw === "true" : true;
  } catch {
    return true;
  }
};

export const setBackgroundAudioEnabled = (enabled: boolean) => {
  write(KEYS.backgroundAudio, enabled ? "1" : "0");
};
