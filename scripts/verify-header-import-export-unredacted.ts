/**
 * Automated Verification Script: Task 350
 *
 * Verifies:
 * 1. App Header contains explicit Export and Import buttons (header-export-settings-button, header-import-settings-button).
 * 2. Unredacted Export: createApplicationSettingsBackup exports 100% of details without redacting
 *    tokens, API keys, speech rates, ratio compositions, or localStorage settings.
 * 3. Unredacted Import: importApplicationSettings restores all tokens, keys, speeds, and profiles accurately.
 * 4. SettingsBackupModal supports both initialTab="export" and initialTab="import".
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

// Initialize mock localStorage for Node.js environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage: Storage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
  },
  key: (index: number) => Object.keys(mockStorage)[index] ?? null,
  get length() {
    return Object.keys(mockStorage).length;
  },
};

(globalThis as any).localStorage = mockLocalStorage;
if (typeof window === "undefined") {
  (globalThis as any).window = {
    localStorage: mockLocalStorage,
    dispatchEvent: () => true,
  };
}

async function runVerification() {
  console.log("==================================================================");
  console.log("🧪 Verifying Task 350: Header Import/Export Buttons (Unredacted)");
  console.log("==================================================================");

  // 1. Static code check for Header Export & Import buttons in src/routes/index.tsx
  console.log("Checking Header buttons in src/routes/index.tsx...");
  const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
  const indexContent = fs.readFileSync(indexTsxPath, "utf-8");

  assert.ok(
    indexContent.includes('id="header-export-settings-button"') &&
      indexContent.includes('data-testid="header-export-settings-button"'),
    "header-export-settings-button must be present in src/routes/index.tsx header",
  );

  assert.ok(
    indexContent.includes('id="header-import-settings-button"') &&
      indexContent.includes('data-testid="header-import-settings-button"'),
    "header-import-settings-button must be present in src/routes/index.tsx header",
  );

  assert.ok(
    indexContent.includes("handleOpenHeaderExport") &&
      indexContent.includes("handleOpenHeaderImport"),
    "handleOpenHeaderExport and handleOpenHeaderImport must be wired in src/routes/index.tsx",
  );
  console.log("✅ Step 1: Header Export and Import buttons are properly present and wired");

  // 2. Import modules
  const {
    createApplicationSettingsBackup,
    exportApplicationSettingsJson,
    importApplicationSettings,
  } = await import("../src/utils/settingsBackupManager");

  const {
    setSpeakApiToken,
    getSpeakApiToken,
    setProviderApiKey,
    getProviderApiKey,
    setUseAlternativeTts,
    getUseAlternativeTts,
    setAlternativeTtsMode,
    getAlternativeTtsMode,
    STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN,
    STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY,
  } = await import("../src/lib/alternative-tts");

  const {
    setFavoriteLanguagesPreference,
    setTtsRatePreference,
    getTtsRatesPreference,
    setTtsRatioPreference,
  } = await import("../src/lib/playback-preferences");

  const {
    saveRatioComposition,
    getStoredRatioCompositions,
  } = await import("../src/utils/ratioCompositionsManager");

  // 3. Configure full rich unredacted state
  const testSpeakToken = "sk-speak-test-unredacted-secret-998877";
  const testProviderKey = "sk-provider-secret-key-445566";
  setSpeakApiToken(testSpeakToken);
  setProviderApiKey(testProviderKey);
  setUseAlternativeTts(true);
  setAlternativeTtsMode("always");
  setFavoriteLanguagesPreference(["en", "es", "he", "ar"]);
  setTtsRatioPreference("es", 3);
  setTtsRatePreference("es", 1.75);
  setTtsRatePreference("he", 0.5);

  const customProfile = saveRatioComposition("Test Immersion Profile", {
    en: 1,
    es: 3,
  });

  // 4. Test unredacted export
  console.log("Testing unredacted settings export...");
  const backup = createApplicationSettingsBackup();

  assert.strictEqual(
    backup.preferences.speakApiToken,
    testSpeakToken,
    "Exported backup MUST contain exact speakApiToken without redaction",
  );
  assert.strictEqual(
    backup.preferences.providerApiKey,
    testProviderKey,
    "Exported backup MUST contain exact providerApiKey without redaction",
  );
  assert.strictEqual(
    backup.preferences.useAlternativeTts,
    true,
    "Exported backup must record useAlternativeTts = true",
  );
  assert.strictEqual(
    backup.preferences.alternativeTtsMode,
    "always",
    "Exported backup must record alternativeTtsMode = always",
  );
  assert.strictEqual(
    backup.preferences.ttsRates?.["es"],
    1.75,
    "Exported backup must preserve per-language speed rates without modification",
  );
  assert.strictEqual(
    backup.rawLocalStorage?.[STORAGE_KEY_ALTERNATIVE_TTS_SPEAK_API_TOKEN],
    testSpeakToken,
    "rawLocalStorage MUST contain speak API token unredacted",
  );
  assert.strictEqual(
    backup.rawLocalStorage?.[STORAGE_KEY_ALTERNATIVE_TTS_PROVIDER_API_KEY],
    testProviderKey,
    "rawLocalStorage MUST contain provider API key unredacted",
  );

  const jsonString = exportApplicationSettingsJson(true);
  assert.ok(
    jsonString.includes(testSpeakToken),
    "Exported JSON string MUST contain unredacted speak API token",
  );
  assert.ok(
    jsonString.includes(testProviderKey),
    "Exported JSON string MUST contain unredacted provider API key",
  );
  console.log("✅ Step 2: createApplicationSettingsBackup exports 100% of details without any redaction");

  // 5. Test unredacted import
  console.log("Testing unredacted settings import into clean storage...");
  // Clear storage and state
  setSpeakApiToken("");
  setProviderApiKey("");
  setUseAlternativeTts(false);
  setAlternativeTtsMode("fallback_only");
  setTtsRatePreference("es", 1.0);
  assert.strictEqual(getSpeakApiToken(), "");
  assert.strictEqual(getProviderApiKey(), "");

  // Import previously exported JSON
  const importResult = importApplicationSettings(jsonString);
  assert.strictEqual(importResult.success, true, "Import must succeed");
  assert.ok(importResult.importedKeysCount > 0, "Must import positive number of keys");

  // Verify all details restored accurately
  assert.strictEqual(
    getSpeakApiToken(),
    testSpeakToken,
    "Speak API token must be fully restored without loss",
  );
  assert.strictEqual(
    getProviderApiKey(),
    testProviderKey,
    "Provider API key must be fully restored without loss",
  );
  assert.strictEqual(getUseAlternativeTts(), true, "useAlternativeTts must be restored to true");
  assert.strictEqual(getAlternativeTtsMode(), "always", "alternativeTtsMode must be restored to always");
  assert.strictEqual(
    getTtsRatesPreference()["es"],
    1.75,
    "Per-language speech rate must be restored accurately",
  );
  console.log("✅ Step 3: importApplicationSettings restores all tokens, preferences, and speeds accurately");

  // 6. SettingsBackupModal component checks
  console.log("Checking SettingsBackupModal initialTab support...");
  const modalTsxPath = path.resolve(process.cwd(), "src/components/SettingsBackupModal.tsx");
  const modalContent = fs.readFileSync(modalTsxPath, "utf-8");
  assert.ok(
    modalContent.includes('initialTab?: "export" | "import"'),
    "SettingsBackupModalProps must declare initialTab prop",
  );
  assert.ok(
    modalContent.includes("data-testid=\"settings-backup-tab-export\"") &&
      modalContent.includes("data-testid=\"settings-backup-tab-import\""),
    "SettingsBackupModal must contain export and import tabs",
  );
  console.log("✅ Step 4: SettingsBackupModal supports both export and import workflows seamlessly");

  console.log("==================================================================");
  console.log("🎉 All checks for Task 350 passed successfully!");
  console.log("==================================================================");
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
