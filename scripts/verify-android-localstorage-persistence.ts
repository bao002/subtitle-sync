/**
 * Verification Suite for Task 399: Keep localStorage Data Between Android Installations
 *
 * Validates:
 * 1. Runtime unit behavior of src/lib/android-local-storage.ts (parsing, priority serialization,
 *    non-clobbering synchronous restoration, mutation hooking, and lifecycle flush).
 * 2. Client entrypoint bootstrap order in src/client.tsx (setupAndroidLocalStoragePersistence before getRouter).
 * 3. Type declarations in src/types.ts for AndroidNativeShell backup methods.
 * 4. Native Android shell bridge & lifecycle persistence in MainActivity.kt.
 * 5. Android Auto Backup XML rules and AndroidManifest.xml attributes for WebView/files/sharedprefs.
 * 6. Non-destructive in-place upgrade + collision backup/restore in update.apk.sh and install-apk.sh.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  parseLocalStorageBackupJson,
  serializeStorageToSnapshotJson,
  restoreStorageFromBackupJson,
  flushAndroidLocalStorageBackup,
  setupAndroidLocalStoragePersistence,
} from "../src/lib/android-local-storage";

console.log("====================================================");
console.log("🧪 Running Task 399: Android localStorage Persistence Verification");
console.log("====================================================");

// -----------------------------------------------------------------------------
// Helper: In-memory Storage implementation for Node runtime unit tests
// -----------------------------------------------------------------------------
class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) ?? null) : null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

// -----------------------------------------------------------------------------
// Test 1: Pure helper parsing, priority sorting, and non-clobbering restore
// -----------------------------------------------------------------------------
console.log("Test 1: Runtime unit checks for parse/serialize/restore helpers...");

assert.strictEqual(parseLocalStorageBackupJson(""), null, "Empty string returns null");
assert.strictEqual(parseLocalStorageBackupJson("<html>not json</html>"), null, "HTML returns null");

const parsedWrapped = parseLocalStorageBackupJson(
  JSON.stringify({
    version: 1,
    updatedAt: 1700000000000,
    entries: {
      yt_app_settings_v4: '{"autoPlayTTS":true}',
      yt_vsettings_L2Ryrr6txwA: '{"sourceLang":"en"}',
    },
  }),
);
assert.ok(parsedWrapped, "Wrapped snapshot must parse cleanly");
assert.strictEqual(parsedWrapped.yt_app_settings_v4, '{"autoPlayTTS":true}');
assert.strictEqual(parsedWrapped.yt_vsettings_L2Ryrr6txwA, '{"sourceLang":"en"}');
assert.strictEqual("version" in parsedWrapped, false, "Metadata keys must be excluded");

const parsedFlat = parseLocalStorageBackupJson('{"yt_app_settings_v4":"{\\"theme\\":\\"midnight\\"}"}');
assert.deepStrictEqual(parsedFlat, { yt_app_settings_v4: '{"theme":"midnight"}' });

const storageA = new MemoryStorage();
storageA.setItem("zzz_misc_cache", "cache-value");
storageA.setItem("yt_app_settings_v4", '{"favoriteLanguages":["en","es","he"]}');
storageA.setItem("yt_vsettings_abc123", '{"targetLangs":["he"]}');

const serialized = serializeStorageToSnapshotJson(storageA);
assert.ok(serialized, "Snapshot JSON must serialize");
const snapshotObj = JSON.parse(serialized) as {
  version: number;
  updatedAt: number;
  entries: Record<string, string>;
};
assert.strictEqual(snapshotObj.version, 1);
assert.ok(snapshotObj.updatedAt > 0);
const entryKeys = Object.keys(snapshotObj.entries);
assert.ok(
  entryKeys.indexOf("yt_app_settings_v4") < entryKeys.indexOf("zzz_misc_cache"),
  "Priority settings keys must be serialized ahead of misc cache keys",
);

const storageB = new MemoryStorage();
storageB.setItem("yt_app_settings_v4", '{"existing":true}');
const restoredCount = restoreStorageFromBackupJson(storageB, serialized);
assert.strictEqual(restoredCount, 2, "Should restore only the 2 missing keys without overwriting existing");
assert.strictEqual(
  storageB.getItem("yt_app_settings_v4"),
  '{"existing":true}',
  "Existing key must never be clobbered",
);
assert.strictEqual(storageB.getItem("yt_vsettings_abc123"), '{"targetLangs":["he"]}');
assert.strictEqual(storageB.getItem("zzz_misc_cache"), "cache-value");

console.log("✅ PASS: Helper parsing, priority ordering, and non-clobbering restore verified");

// -----------------------------------------------------------------------------
// Test 2: Mocked AndroidNativeShell pre-render hydration + mutation/flush bridge
// -----------------------------------------------------------------------------
console.log("Test 2: Runtime AndroidNativeShell hydration, Storage interception & flush...");

let savedNativeSnapshot = JSON.stringify({
  version: 1,
  updatedAt: Date.now() - 5000,
  entries: {
    yt_app_settings_v4: '{"autoPlayTTS":true,"baseLanguage":"es"}',
    yt_openrouter_api_key: "sk-or-test-key",
  },
});

const listeners = new Map<string, Array<() => void>>();
const mockStorage = new MemoryStorage();

const prevWindow = (globalThis as Record<string, unknown>).window;
const prevDocument = (globalThis as Record<string, unknown>).document;
const prevStorage = (globalThis as Record<string, unknown>).Storage;

try {
  class MockStorageProto {}
  MockStorageProto.prototype.setItem = function (this: MemoryStorage, k: string, v: string) {
    MemoryStorage.prototype.setItem.call(this, k, v);
  };
  MockStorageProto.prototype.removeItem = function (this: MemoryStorage, k: string) {
    MemoryStorage.prototype.removeItem.call(this, k);
  };
  MockStorageProto.prototype.clear = function (this: MemoryStorage) {
    MemoryStorage.prototype.clear.call(this);
  };
  Object.setPrototypeOf(mockStorage, MockStorageProto.prototype);
  // Ensure inner map exists on instance
  (mockStorage as unknown as { map: Map<string, string> }).map = new Map<string, string>();
  mockStorage.getItem = MemoryStorage.prototype.getItem;
  mockStorage.key = MemoryStorage.prototype.key;
  Object.defineProperty(mockStorage, "length", {
    get() {
      return (this as unknown as { map: Map<string, string> }).map.size;
    },
  });

  (globalThis as Record<string, unknown>).Storage = MockStorageProto;
  (globalThis as Record<string, unknown>).document = { visibilityState: "hidden" };
  (globalThis as Record<string, unknown>).window = {
    localStorage: mockStorage,
    AndroidNativeShell: {
      isNativeShell: () => true,
      showToast: () => {},
      readLocalStorageBackup: () => savedNativeSnapshot,
      saveLocalStorageBackup: (json: string) => {
        savedNativeSnapshot = json;
        return true;
      },
    },
    addEventListener: (event: string, cb: () => void) => {
      const list = listeners.get(event) ?? [];
      list.push(cb);
      listeners.set(event, list);
    },
  };

  const bootResult = setupAndroidLocalStoragePersistence();
  assert.strictEqual(bootResult.restoredCount, 2, "Must hydrate both keys synchronously on boot");
  assert.strictEqual(bootResult.hookInstalled, true, "Must install Storage mutation hooks");
  assert.strictEqual(
    mockStorage.getItem("yt_app_settings_v4"),
    '{"autoPlayTTS":true,"baseLanguage":"es"}',
  );
  assert.strictEqual(mockStorage.getItem("yt_openrouter_api_key"), "sk-or-test-key");

  // Mutate storage and verify visibilitychange triggers immediate native save
  mockStorage.setItem("yt_vsettings_newVid", '{"active":true}');
  const visHandlers = listeners.get("visibilitychange") ?? [];
  assert.ok(visHandlers.length > 0, "visibilitychange listener must be registered");
  visHandlers.forEach((h) => h());

  const flushedObj = JSON.parse(savedNativeSnapshot) as { entries: Record<string, string> };
  assert.strictEqual(flushedObj.entries.yt_vsettings_newVid, '{"active":true}');
  assert.strictEqual(flushAndroidLocalStorageBackup(), true);
} finally {
  if (prevWindow === undefined) delete (globalThis as Record<string, unknown>).window;
  else (globalThis as Record<string, unknown>).window = prevWindow;
  if (prevDocument === undefined) delete (globalThis as Record<string, unknown>).document;
  else (globalThis as Record<string, unknown>).document = prevDocument;
  if (prevStorage === undefined) delete (globalThis as Record<string, unknown>).Storage;
  else (globalThis as Record<string, unknown>).Storage = prevStorage;
}

console.log("✅ PASS: Mocked AndroidNativeShell hydration and flush verified");

// -----------------------------------------------------------------------------
// Test 3: Client bootstrap ordering & TypeScript types
// -----------------------------------------------------------------------------
console.log("Test 3: Checking src/client.tsx bootstrap order and src/types.ts contracts...");
const rootDir = process.cwd();
const clientTsx = fs.readFileSync(path.resolve(rootDir, "src/client.tsx"), "utf-8");
const setupPos = clientTsx.indexOf("setupAndroidLocalStoragePersistence()");
const routerPos = clientTsx.indexOf("getRouter()");
assert.ok(setupPos !== -1, "src/client.tsx must call setupAndroidLocalStoragePersistence()");
assert.ok(routerPos !== -1, "src/client.tsx must call getRouter()");
assert.ok(
  setupPos < routerPos,
  "setupAndroidLocalStoragePersistence() must execute strictly BEFORE getRouter()",
);

const typesTs = fs.readFileSync(path.resolve(rootDir, "src/types.ts"), "utf-8");
assert.ok(
  typesTs.includes("saveLocalStorageBackup?: (snapshotJson: string) => boolean;"),
  "src/types.ts must declare saveLocalStorageBackup on AndroidNativeShell",
);
assert.ok(
  typesTs.includes("readLocalStorageBackup?: () => string;"),
  "src/types.ts must declare readLocalStorageBackup on AndroidNativeShell",
);
console.log("✅ PASS: Client bootstrap order and TypeScript declarations verified");

// -----------------------------------------------------------------------------
// Test 4: MainActivity.kt native backup bridge, SharedPrefs/filesDir & onPause flush
// -----------------------------------------------------------------------------
console.log("Test 4: Checking MainActivity.kt persistence implementation...");
const mainActivity = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt"),
  "utf-8",
);
for (const marker of [
  "domStorageEnabled = true",
  "databaseEnabled = true",
  "PREFS_LOCAL_STORAGE_BACKUP",
  "KEY_LOCAL_STORAGE_SNAPSHOT",
  "LOCAL_STORAGE_BACKUP_FILENAME",
  "fun persistLocalStorageSnapshot(",
  "fun loadBestLocalStorageSnapshot(",
  "fun saveLocalStorageBackup(",
  "fun readLocalStorageBackup(",
  "window.AndroidNativeShell.saveLocalStorageBackup",
]) {
  assert.ok(mainActivity.includes(marker), `MainActivity.kt must contain: ${marker}`);
}
console.log("✅ PASS: MainActivity.kt persistence bridge verified");

// -----------------------------------------------------------------------------
// Test 5: AndroidManifest.xml & Auto Backup XML rules
// -----------------------------------------------------------------------------
console.log("Test 5: Checking AndroidManifest.xml & XML backup rules...");
const manifestXml = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/src/main/AndroidManifest.xml"),
  "utf-8",
);
assert.ok(manifestXml.includes('android:allowBackup="true"'));
assert.ok(manifestXml.includes('android:fullBackupContent="@xml/backup_rules"'));
assert.ok(manifestXml.includes('android:dataExtractionRules="@xml/data_extraction_rules"'));
assert.ok(manifestXml.includes('android:requestLegacyExternalStorage="true"'));

const backupRulesXml = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/src/main/res/xml/backup_rules.xml"),
  "utf-8",
);
const dataExtractionXml = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/src/main/res/xml/data_extraction_rules.xml"),
  "utf-8",
);
for (const [label, xml] of [
  ["backup_rules.xml", backupRulesXml],
  ["data_extraction_rules.xml", dataExtractionXml],
]) {
  assert.ok(xml.includes('<include domain="sharedpref" path="." />'), `${label} includes sharedpref`);
  assert.ok(xml.includes('<include domain="file" path="." />'), `${label} includes filesDir`);
  assert.ok(xml.includes('<include domain="root" path="app_webview" />'), `${label} includes app_webview`);
}
console.log("✅ PASS: AndroidManifest.xml and XML Auto Backup rules verified");

// -----------------------------------------------------------------------------
// Test 6: ADB scripts avoid upfront wipe and backup/restore across collision purge
// -----------------------------------------------------------------------------
console.log("Test 6: Checking update.apk.sh & install-apk.sh non-destructive upgrade logic...");
for (const scriptName of ["update.apk.sh", "install-apk.sh"]) {
  const scriptContent = fs.readFileSync(path.resolve(rootDir, scriptName), "utf-8");
  assert.ok(
    scriptContent.includes("backup_local_storage_data"),
    `${scriptName} must define/call backup_local_storage_data`,
  );
  assert.ok(
    scriptContent.includes("restore_local_storage_data"),
    `${scriptName} must define/call restore_local_storage_data`,
  );
  assert.ok(
    scriptContent.includes("files/localstorage_backup.json"),
    `${scriptName} must backup/restore files/localstorage_backup.json via run-as`,
  );

  // Verify pm clear and adb uninstall ONLY appear inside deep_purge_package
  const deepPurgeStart = scriptContent.indexOf("deep_purge_package()");
  const deepPurgeEnd = scriptContent.indexOf("has_collision_error()");
  assert.ok(deepPurgeStart !== -1 && deepPurgeEnd > deepPurgeStart);

  const beforePurge = scriptContent.slice(0, deepPurgeStart);
  const afterPurgeFn = scriptContent.slice(deepPurgeEnd);
  assert.ok(
    !beforePurge.includes("pm clear") && !afterPurgeFn.includes("pm clear"),
    `${scriptName} must NOT call pm clear outside deep_purge_package`,
  );
  assert.ok(
    !beforePurge.includes("uninstall") && !afterPurgeFn.includes("uninstall"),
    `${scriptName} must NOT uninstall package outside deep_purge_package`,
  );
}
console.log("✅ PASS: update.apk.sh & install-apk.sh preserve localStorage on upgrade/reinstall");

console.log("====================================================");
console.log("🎉 Task 399 Android localStorage Persistence Verification PASSED!");
console.log("====================================================");
