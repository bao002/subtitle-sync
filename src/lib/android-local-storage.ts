/**
 * Android WebView localStorage Cross-Installation Persistence Bridge
 *
 * Ensures WebView localStorage survives Android APK updates, WebView storage clears,
 * and signature/downgrade collision reinstalls (via native SharedPreferences,
 * filesDir/localstorage_backup.json, Android Auto Backup rules, and ADB run-as).
 */

export interface LocalStorageSnapshotPayload {
  version: 1;
  updatedAt: number;
  entries: Record<string, string>;
}

const MAX_VALUE_LENGTH_BYTES = 512 * 1024; // 512 KB cap per entry
const MAX_TOTAL_SNAPSHOT_BYTES = 3 * 1024 * 1024; // 3 MB safety cap for SharedPreferences + JSON file
const SYNC_DEBOUNCE_MS = 350;

let isBridgeInstalled = false;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function isPrioritySettingsKey(key: string): boolean {
  return (
    key.startsWith("yt_app_settings") ||
    key.startsWith("yt_vsettings_") ||
    key.startsWith("yt_parser_settings") ||
    key.startsWith("yt_floating_") ||
    key.startsWith("yt_tts_") ||
    key.startsWith("yt_openrouter_") ||
    key.startsWith("yt_alternative_tts_") ||
    key.startsWith("subtitle_sync_")
  );
}

/**
 * Parses either a wrapped LocalStorageSnapshotPayload or a flat key-value JSON map.
 */
export function parseLocalStorageBackupJson(raw: string): Record<string, string> | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed) as Partial<LocalStorageSnapshotPayload> &
      Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    const source =
      "entries" in parsed && parsed.entries && typeof parsed.entries === "object"
        ? (parsed.entries as Record<string, unknown>)
        : (parsed as Record<string, unknown>);

    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(source)) {
      if (typeof key === "string" && typeof val === "string") {
        if (key === "version" || key === "updatedAt") continue;
        result[key] = val;
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Serializes current Storage entries into a compact LocalStorageSnapshotPayload JSON string.
 * Prioritizes core app/user settings keys if storage contains large transient caches.
 */
export function serializeStorageToSnapshotJson(storage: Storage): string | null {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (typeof k === "string" && k.length > 0) {
        keys.push(k);
      }
    }
    if (keys.length === 0) return null;

    // Sort priority user settings first so size caps never drop core preferences
    keys.sort((a, b) => {
      const pa = isPrioritySettingsKey(a) ? 0 : 1;
      const pb = isPrioritySettingsKey(b) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b);
    });

    const entries: Record<string, string> = {};
    let totalBytes = 64;
    for (const key of keys) {
      const value = storage.getItem(key);
      if (typeof value !== "string") continue;
      if (value.length > MAX_VALUE_LENGTH_BYTES) continue;
      const entryCost = key.length + value.length + 8;
      if (totalBytes + entryCost > MAX_TOTAL_SNAPSHOT_BYTES) continue;
      entries[key] = value;
      totalBytes += entryCost;
    }

    if (Object.keys(entries).length === 0) return null;
    const payload: LocalStorageSnapshotPayload = {
      version: 1,
      updatedAt: Date.now(),
      entries,
    };
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

/**
 * Synchronously hydrates missing localStorage keys from a serialized native backup JSON string.
 * Existing local keys are preserved; only missing keys are restored.
 */
export function restoreStorageFromBackupJson(
  storage: Storage,
  rawBackupJson: string,
  setItemFn?: (key: string, value: string) => void,
): number {
  const entries = parseLocalStorageBackupJson(rawBackupJson);
  if (!entries) return 0;

  let restoredCount = 0;
  const writer = setItemFn || ((k: string, v: string) => storage.setItem(k, v));

  for (const [key, value] of Object.entries(entries)) {
    try {
      if (storage.getItem(key) === null) {
        writer(key, value);
        restoredCount++;
      }
    } catch {
      // Ignore quota or restricted storage write errors per key
    }
  }
  return restoredCount;
}

/**
 * Flushes current window.localStorage to AndroidNativeShell native persistence.
 */
export function flushAndroidLocalStorageBackup(): boolean {
  if (typeof window === "undefined") return false;
  const shell = window.AndroidNativeShell;
  if (!shell?.saveLocalStorageBackup) return false;

  try {
    const json = serializeStorageToSnapshotJson(window.localStorage);
    if (!json) return false;
    return Boolean(shell.saveLocalStorageBackup(json));
  } catch {
    return false;
  }
}

function scheduleBackupFlush(): void {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    flushAndroidLocalStorageBackup();
  }, SYNC_DEBOUNCE_MS);
}

/**
 * Runs synchronously at client startup before React initializes:
 * 1. Restores missing localStorage entries from AndroidNativeShell backup (if running inside Android APK).
 * 2. Wraps Storage mutations on window.localStorage to keep native backup up to date across installations.
 */
export function setupAndroidLocalStoragePersistence(): {
  restoredCount: number;
  hookInstalled: boolean;
} {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return { restoredCount: 0, hookInstalled: false };
  }

  const shell = window.AndroidNativeShell;
  let restoredCount = 0;

  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;
  const nativeClear = Storage.prototype.clear;

  if (shell?.readLocalStorageBackup) {
    try {
      const backupRaw = shell.readLocalStorageBackup();
      if (backupRaw && backupRaw.trim().startsWith("{")) {
        restoredCount = restoreStorageFromBackupJson(window.localStorage, backupRaw, (k, v) =>
          nativeSetItem.call(window.localStorage, k, v),
        );
      } else if (window.localStorage.length > 0 && shell.saveLocalStorageBackup) {
        // Seed native backup immediately when upgrading from an older APK with existing WebView storage
        flushAndroidLocalStorageBackup();
      }
    } catch {
      // Keep app boot resilient even if bridge read fails
    }
  }

  if (restoredCount > 0 && shell?.saveLocalStorageBackup) {
    flushAndroidLocalStorageBackup();
  }

  if (!isBridgeInstalled && shell?.saveLocalStorageBackup) {
    isBridgeInstalled = true;

    Storage.prototype.setItem = function (key: string, value: string): void {
      nativeSetItem.call(this, key, value);
      if (this === window.localStorage) {
        scheduleBackupFlush();
      }
    };

    Storage.prototype.removeItem = function (key: string): void {
      nativeRemoveItem.call(this, key);
      if (this === window.localStorage) {
        scheduleBackupFlush();
      }
    };

    Storage.prototype.clear = function (): void {
      nativeClear.call(this);
      if (this === window.localStorage) {
        scheduleBackupFlush();
      }
    };

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushAndroidLocalStorageBackup();
      }
    });
    window.addEventListener("pagehide", () => {
      flushAndroidLocalStorageBackup();
    });
    window.addEventListener("beforeunload", () => {
      flushAndroidLocalStorageBackup();
    });
  }

  return { restoredCount, hookInstalled: isBridgeInstalled };
}
