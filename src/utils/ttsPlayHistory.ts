export type TtsPlayHistorySource =
  | "auto_playback"
  | "subtitle_table_cue"
  | "learning_or_alternative_view"
  | "zero_knowledge";

export interface TtsPlayHistoryEntry {
  id: string;
  timestamp: number;
  formattedTime: string;
  videoId: string;
  videoTitle: string;
  videoTimeSec: number;
  rowIndex: number;
  sentence: string;
  playedText: string;
  spokenLang: string;
  baseLang: string;
  translationText: string;
  translationLang: string;
  ttsProvider: string;
  source: TtsPlayHistorySource;
}

export interface RecordTtsPlayHistoryInput {
  timestamp?: number;
  videoId: string;
  videoTitle?: string;
  videoTimeSec?: number;
  rowIndex?: number;
  sentence: string;
  playedText?: string;
  spokenLang: string;
  baseLang?: string;
  translationText?: string;
  translationLang?: string;
  ttsProvider?: string;
  source?: TtsPlayHistorySource;
}

export const TTS_PLAY_HISTORY_STORAGE_KEY = "yt_tts_play_history_v1";
const MAX_TTS_PLAY_HISTORY_ENTRIES = 300;

type Listener = () => void;

const listeners = new Set<Listener>();
let cachedSnapshot: readonly TtsPlayHistoryEntry[] | null = null;
let sequenceCounter = 0;

function safeReadFromStorage(): TtsPlayHistoryEntry[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(TTS_PLAY_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is TtsPlayHistoryEntry =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.timestamp === "number" &&
        typeof item.sentence === "string" &&
        typeof item.videoId === "string",
    );
  } catch {
    return [];
  }
}

function safeWriteToStorage(entries: readonly TtsPlayHistoryEntry[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(TTS_PLAY_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage quota errors
  }
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getTtsPlayHistorySnapshot(): readonly TtsPlayHistoryEntry[] {
  if (cachedSnapshot === null) {
    cachedSnapshot = safeReadFromStorage();
  }
  return cachedSnapshot;
}

export function subscribeToTtsPlayHistory(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function recordTtsPlayHistory(input: RecordTtsPlayHistoryInput): TtsPlayHistoryEntry {
  const ts = typeof input.timestamp === "number" && Number.isFinite(input.timestamp)
    ? input.timestamp
    : Date.now();
  const formattedTime = new Date(ts).toISOString();
  sequenceCounter += 1;

  const entry: TtsPlayHistoryEntry = {
    id: `tts-hist-${ts}-${sequenceCounter}`,
    timestamp: ts,
    formattedTime,
    videoId: input.videoId || "unknown",
    videoTitle: (input.videoTitle || "").trim() || input.videoId || "Unknown Video",
    videoTimeSec:
      typeof input.videoTimeSec === "number" && Number.isFinite(input.videoTimeSec)
        ? Math.max(0, Math.round(input.videoTimeSec * 10) / 10)
        : 0,
    rowIndex: typeof input.rowIndex === "number" ? input.rowIndex : -1,
    sentence: input.sentence || input.playedText || "",
    playedText: input.playedText || input.sentence || "",
    spokenLang: input.spokenLang || "en",
    baseLang: input.baseLang || input.spokenLang || "en",
    translationText: input.translationText ?? "",
    translationLang: input.translationLang || input.spokenLang || "",
    ttsProvider: input.ttsProvider || "default",
    source: input.source || "auto_playback",
  };

  const current = getTtsPlayHistorySnapshot();
  const next = [entry, ...current].slice(0, MAX_TTS_PLAY_HISTORY_ENTRIES);
  cachedSnapshot = next;
  safeWriteToStorage(next);
  notifyListeners();
  return entry;
}

export function clearTtsPlayHistory(): void {
  cachedSnapshot = [];
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(TTS_PLAY_HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  notifyListeners();
}

export function formatVideoTimestampSec(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem.toString().padStart(2, "0")}`;
}

export function formatTtsPlayHistoryDebugReport(
  entries: readonly TtsPlayHistoryEntry[],
  filterVideoId?: string,
): string {
  const scoped = filterVideoId
    ? entries.filter((entry) => entry.videoId === filterVideoId)
    : entries;
  const header = [
    "# TTS-Play History Debug & Reproduction Report",
    `Generated: ${new Date().toISOString()}`,
    `Records: ${scoped.length}`,
    filterVideoId ? `Scoped Video ID: ${filterVideoId}` : "Scope: All Videos",
    "",
  ];

  const lines = scoped.map((entry, idx) => {
    const pos = `${formatVideoTimestampSec(entry.videoTimeSec)} (${entry.videoTimeSec}s)`;
    const rowLabel = entry.rowIndex >= 0 ? `Row #${entry.rowIndex + 1}` : "Ad-hoc";
    return [
      `${idx + 1}. [${entry.formattedTime}] Video: ${entry.videoTitle} (${entry.videoId}) @ ${pos} [${rowLabel}]`,
      `   Sentence (${entry.baseLang}): ${entry.sentence}`,
      `   Translation Used (${entry.translationLang}): ${entry.translationText || "(none)"}`,
      `   Spoken (${entry.spokenLang}): ${entry.playedText} | Source: ${entry.source} | Provider: ${entry.ttsProvider}`,
    ].join("\n");
  });

  return [...header, ...lines].join("\n");
}
