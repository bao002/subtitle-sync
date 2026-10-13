/**
 * Winner Promotion Tracker & Persistence
 *
 * Persists winning attempt strategy results across all past videos in localStorage,
 * allowing users and developers to inspect which fetch style (tlang vs lang)
 * and transport (session vs anon) succeeded for each video.
 */

import { SubtitleRequestMode } from "../lib/playback-preferences";
import { SendMode } from "../lib/subtitle-fetch-plan";

export interface WinnerPromotionRecord {
  id: string;
  videoId: string;
  lang: string;
  mode: SubtitleRequestMode;
  send: SendMode;
  timestamp: number;
  videoTitle?: string;
  cuesCount?: number;
}

export interface WinnerPromotionStats {
  totalWins: number;
  uniqueVideos: number;
  modeCounts: {
    tlang: number;
    lang: number;
  };
  sendCounts: {
    session: number;
    anon: number;
  };
  combinationCounts: {
    "tlang/session": number;
    "lang/session": number;
    "tlang/anon": number;
    "lang/anon": number;
  };
  topCombination: string;
  recentWins: WinnerPromotionRecord[];
}

const STORAGE_KEY = "yt_winner_promotion_history_v1";
const MAX_RECORDS = 200;

function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

let inMemoryHistory: WinnerPromotionRecord[] = [];

/**
 * Loads all winner promotion records from localStorage.
 */
export function getWinnerPromotionHistory(): WinnerPromotionRecord[] {
  if (!isStorageAvailable()) {
    return [...inMemoryHistory];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...inMemoryHistory];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryHistory = parsed;
      return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [...inMemoryHistory];
}

/**
 * Persists records list to localStorage.
 */
function saveHistory(records: WinnerPromotionRecord[]): void {
  const bounded = records.slice(0, MAX_RECORDS);
  inMemoryHistory = bounded;
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
  } catch (e) {
    console.warn("[WinnerPromotionTracker] Failed to persist winner history:", e);
  }
}

/**
 * Records a new winning attempt event.
 */
export function recordWinnerPromotion(data: {
  videoId: string;
  lang: string;
  mode: SubtitleRequestMode;
  send: SendMode;
  videoTitle?: string;
  cuesCount?: number;
  timestamp?: number;
}): WinnerPromotionRecord {
  const timestamp = data.timestamp || Date.now();
  const id = `${data.videoId}_${data.lang}_${timestamp}`;

  const record: WinnerPromotionRecord = {
    id,
    videoId: String(data.videoId || "").trim(),
    lang: String(data.lang || "").trim().toLowerCase(),
    mode: data.mode === "lang" ? "lang" : "tlang",
    send: data.send === "session" ? "session" : "anon",
    timestamp,
    videoTitle: data.videoTitle,
    cuesCount: data.cuesCount,
  };

  const current = getWinnerPromotionHistory();
  // Filter out exact duplicate for same video and lang within 10 seconds
  const deduplicated = current.filter(
    (item) =>
      !(
        item.videoId === record.videoId &&
        item.lang === record.lang &&
        Math.abs(item.timestamp - record.timestamp) < 10000
      ),
  );

  const updated = [record, ...deduplicated];
  saveHistory(updated);

  // Dispatch custom event for reactive UI updates
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(
        new CustomEvent("winner-promotion-updated", { detail: record }),
      );
    } catch {}
  }

  return record;
}

/**
 * Clears all winner promotion records.
 */
export function clearWinnerPromotionHistory(): void {
  inMemoryHistory = [];
  if (isStorageAvailable()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    try {
      window.dispatchEvent(new CustomEvent("winner-promotion-updated"));
    } catch {}
  }
}

/**
 * Computes aggregate summary statistics from the promotion history.
 */
export function getWinnerPromotionStats(): WinnerPromotionStats {
  const history = getWinnerPromotionHistory();
  const uniqueVideosSet = new Set<string>();

  const modeCounts = { tlang: 0, lang: 0 };
  const sendCounts = { session: 0, anon: 0 };
  const combinationCounts = {
    "tlang/session": 0,
    "lang/session": 0,
    "tlang/anon": 0,
    "lang/anon": 0,
  };

  for (const item of history) {
    if (item.videoId) uniqueVideosSet.add(item.videoId);

    if (item.mode === "lang") modeCounts.lang++;
    else modeCounts.tlang++;

    if (item.send === "session") sendCounts.session++;
    else sendCounts.anon++;

    const comboKey = `${item.mode}/${item.send}` as keyof typeof combinationCounts;
    if (comboKey in combinationCounts) {
      combinationCounts[comboKey]++;
    }
  }

  let topCombination = "tlang/session";
  let maxComboCount = -1;
  for (const [combo, count] of Object.entries(combinationCounts)) {
    if (count > maxComboCount) {
      maxComboCount = count;
      topCombination = combo;
    }
  }

  return {
    totalWins: history.length,
    uniqueVideos: uniqueVideosSet.size,
    modeCounts,
    sendCounts,
    combinationCounts,
    topCombination,
    recentWins: history.slice(0, 50),
  };
}
