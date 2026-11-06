/**
 * Language Usage Tracker
 *
 * Tracks and persists usage parameters for each language in localStorage:
 * 1. startDate / addedAt: the date the language was first added
 * 2. ratioLastUpdated / ratioUpdatedAt: timestamp of the ratio's last update
 */

export interface LanguageUsageRecord {
  langCode: string;
  startDate: string;
  ratioLastUpdated?: string;
  addedAt: number;
  ratioUpdatedAt?: number;
}

export const LANGUAGE_USAGE_STORAGE_KEY = "yt_language_usage_v1";

const memoryStorage = new Map<string, string>();

function getStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void } {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
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

/**
 * Normalizes language codes to lower-case trimmed string.
 */
function normalizeLangCode(code: string): string {
  if (!code) return "";
  return String(code).trim().toLowerCase();
}

/**
 * Loads all recorded language usage records from localStorage.
 */
export function getAllLanguagesUsage(): Record<string, LanguageUsageRecord> {
  const storage = getStorage();
  try {
    const raw = storage.getItem(LANGUAGE_USAGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("[LanguageUsageTracker] Failed to load usage records:", err);
  }
  return {};
}

/**
 * Saves all language usage records to localStorage.
 */
function saveAllLanguagesUsage(records: Record<string, LanguageUsageRecord>): void {
  const storage = getStorage();
  try {
    storage.setItem(LANGUAGE_USAGE_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn("[LanguageUsageTracker] Failed to persist usage records:", err);
  }
}

/**
 * Retrieves the usage tracking info for a specific language.
 */
export function getLanguageUsage(langCode: string): LanguageUsageRecord | null {
  const code = normalizeLangCode(langCode);
  if (!code) return null;

  const storage = getStorage();
  // Check individual key first for fast direct lookup
  try {
    const directRaw = storage.getItem(`yt_lang_usage_${code}`);
    if (directRaw) {
      const direct = JSON.parse(directRaw);
      if (direct && typeof direct === "object") {
        return direct as LanguageUsageRecord;
      }
    }
  } catch {
    // fallback to main map
  }

  const all = getAllLanguagesUsage();
  return all[code] || null;
}

/**
 * Records that a language has been added.
 * Preserves the original startDate if the language was already recorded earlier.
 */
export function recordLanguageAdded(
  langCode: string,
  timestamp?: string | number,
): LanguageUsageRecord {
  const code = normalizeLangCode(langCode);
  const nowMs = typeof timestamp === "number" ? timestamp : Date.now();
  const dateIso =
    typeof timestamp === "string" ? timestamp : new Date(nowMs).toISOString();

  const all = getAllLanguagesUsage();
  const existing = all[code] || getLanguageUsage(code);

  const updated: LanguageUsageRecord = {
    langCode: code,
    startDate: existing?.startDate || dateIso,
    addedAt: existing?.addedAt || nowMs,
    ratioLastUpdated: existing?.ratioLastUpdated,
    ratioUpdatedAt: existing?.ratioUpdatedAt,
  };

  all[code] = updated;
  saveAllLanguagesUsage(all);

  const storage = getStorage();
  try {
    storage.setItem(`yt_lang_usage_${code}`, JSON.stringify(updated));
    if (!storage.getItem(`yt_lang_start_date_${code}`)) {
      storage.setItem(`yt_lang_start_date_${code}`, updated.startDate);
    }
  } catch {
    // ignore
  }

  return updated;
}

/**
 * Records a ratio update for a language.
 */
export function recordLanguageRatioUpdated(
  langCode: string,
  timestamp?: string | number,
): LanguageUsageRecord {
  const code = normalizeLangCode(langCode);
  const nowMs = typeof timestamp === "number" ? timestamp : Date.now();
  const dateIso =
    typeof timestamp === "string" ? timestamp : new Date(nowMs).toISOString();

  const all = getAllLanguagesUsage();
  const existing = all[code] || getLanguageUsage(code);

  const updated: LanguageUsageRecord = {
    langCode: code,
    startDate: existing?.startDate || dateIso,
    addedAt: existing?.addedAt || nowMs,
    ratioLastUpdated: dateIso,
    ratioUpdatedAt: nowMs,
  };

  all[code] = updated;
  saveAllLanguagesUsage(all);

  const storage = getStorage();
  try {
    storage.setItem(`yt_lang_usage_${code}`, JSON.stringify(updated));
    storage.setItem(`yt_lang_ratio_updated_${code}`, dateIso);
  } catch {
    // ignore
  }

  return updated;
}

/**
 * Batch-initializes usage tracking for a list of active or favorite languages.
 */
export function recordLanguagesUsageBatch(
  langCodes: string[],
): Record<string, LanguageUsageRecord> {
  const all = getAllLanguagesUsage();
  let changed = false;
  const nowMs = Date.now();
  const dateIso = new Date(nowMs).toISOString();

  for (const rawCode of langCodes) {
    const code = normalizeLangCode(rawCode);
    if (!code) continue;
    if (!all[code]) {
      all[code] = {
        langCode: code,
        startDate: dateIso,
        addedAt: nowMs,
      };
      changed = true;
      try {
        const storage = getStorage();
        storage.setItem(`yt_lang_usage_${code}`, JSON.stringify(all[code]));
        storage.setItem(`yt_lang_start_date_${code}`, dateIso);
      } catch {
        // ignore
      }
    }
  }

  if (changed) {
    saveAllLanguagesUsage(all);
  }

  return all;
}
