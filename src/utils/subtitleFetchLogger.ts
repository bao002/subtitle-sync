import { logBuffer } from "./logBuffer";

export type SubtitleFetchLogLevel = "info" | "success" | "warn" | "error" | "stats" | "cache";

export interface SubtitleFetchLogEntry {
  id: string;
  timestamp: string;
  level: SubtitleFetchLogLevel;
  message: string;
  details?: string;
  url?: string;
  lang?: string;
  status?: number;
}

const MAX_STORED_LOGS = 200;
let fetchLogsBuffer: SubtitleFetchLogEntry[] = [
  {
    id: "init-0",
    timestamp: new Date().toLocaleTimeString(),
    level: "info",
    message: "Subtitles Fetch Logger online and listening for timedtext requests",
    details: "Monitoring Quick Loader, Languages Panel, and Stage 0 actions",
  },
];

const subscribers = new Set<(logs: SubtitleFetchLogEntry[]) => void>();

function notifySubscribers() {
  const snapshot = [...fetchLogsBuffer];
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch {}
  });
}

export interface EmitSubtitleFetchLogParams {
  type?: SubtitleFetchLogLevel | "warning";
  level?: SubtitleFetchLogLevel | "warning";
  message: string;
  details?: string;
  url?: string;
  lang?: string;
  status?: number;
  cuesCount?: number;
}

/**
 * Emits a structured subtitle fetch log entry to all subscribers and mirrors to system logBuffer.
 * Supports both:
 * 1. emitSubtitleFetchLog(level, message, details?, meta?)
 * 2. emitSubtitleFetchLog({ type, message, details?, url?, lang?, status?, cuesCount? })
 */
export function emitSubtitleFetchLog(
  levelOrParams: SubtitleFetchLogLevel | EmitSubtitleFetchLogParams,
  message?: string,
  details?: string,
  meta?: { url?: string; lang?: string; status?: number; cuesCount?: number },
): SubtitleFetchLogEntry {
  let finalLevel: SubtitleFetchLogLevel = "info";
  let finalMessage = "";
  let finalDetails: string | undefined = undefined;
  let finalUrl: string | undefined = undefined;
  let finalLang: string | undefined = undefined;
  let finalStatus: number | undefined = undefined;

  if (typeof levelOrParams === "object" && levelOrParams !== null) {
    const rawLevel = levelOrParams.level || levelOrParams.type || "info";
    finalLevel = (rawLevel === "warning" ? "warn" : rawLevel) as SubtitleFetchLogLevel;
    finalMessage = levelOrParams.message || "";
    finalDetails =
      levelOrParams.details ||
      (levelOrParams.cuesCount !== undefined ? `Cues count: ${levelOrParams.cuesCount}` : undefined);
    finalUrl = levelOrParams.url;
    finalLang = levelOrParams.lang;
    finalStatus = levelOrParams.status;
  } else {
    finalLevel = levelOrParams;
    finalMessage = message || "";
    finalDetails = details;
    finalUrl = meta?.url;
    finalLang = meta?.lang;
    finalStatus = meta?.status;
  }

  const now = new Date();
  const entry: SubtitleFetchLogEntry = {
    id: `fetch-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toLocaleTimeString(),
    level: finalLevel,
    message: finalMessage,
    details: finalDetails,
    url: finalUrl,
    lang: finalLang,
    status: finalStatus,
  };

  fetchLogsBuffer = [...fetchLogsBuffer.slice(-(MAX_STORED_LOGS - 1)), entry];

  // Mirror to central logBuffer
  try {
    const systemLevel =
      finalLevel === "error"
        ? "ERROR"
        : finalLevel === "warn"
          ? "WARN"
          : finalLevel === "success"
            ? "SUCCESS"
            : "SUBTITLES";
    logBuffer.add({
      level: systemLevel,
      category: "SUBTITLES_FETCH",
      message: finalMessage,
      details: finalDetails,
      url: finalUrl,
      status: finalStatus,
    });
  } catch {}

  notifySubscribers();
  return entry;
}

/**
 * Gets a snapshot of all active subtitle fetch log entries.
 */
export function getSubtitleFetchLogs(): SubtitleFetchLogEntry[] {
  return [...fetchLogsBuffer];
}

/**
 * Subscribes to live subtitle fetch logs.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeSubtitleFetchLogs(
  callback: (logs: SubtitleFetchLogEntry[]) => void,
): () => void {
  subscribers.add(callback);
  // Initial immediate trigger with current buffer
  try {
    callback([...fetchLogsBuffer]);
  } catch {}
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Clears stored fetch logs.
 */
export function clearSubtitleFetchLogs(): void {
  fetchLogsBuffer = [];
  notifySubscribers();
}
