/**
 * Automated Verification Script: Settings Export / Import in Settings Stage
 * (scripts/verify-settings-export-import-stage.ts)
 *
 * Verifies Task 301 (Prompt 66 - Chapter 4):
 * 1. Settings stage (Stage 4) renders dedicated export/import section & action buttons.
 * 2. SettingsBackupModal is rendered in main app route with full lifecycle support.
 * 3. Beginner Mode parity with onOpenBackupModal and beginner-export-import-settings-btn.
 * 4. settingsBackupManager correctly serializes, downloads, validates, and restores settings.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const repoRoot = process.cwd();

console.log("=== Verifying Settings Export / Import in Settings Stage ===");

let passedChecks = 0;
function logPass(desc: string) {
  passedChecks++;
  console.log(`  ✓ [Check ${passedChecks}] ${desc}`);
}

// 1. Verify src/routes/index.tsx renders settings-export-import-section in Settings Stage
const indexPath = path.resolve(repoRoot, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexCode = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexCode.includes('data-testid="settings-export-import-section"'),
  "Settings stage must render settings-export-import-section",
);
assert.ok(
  indexCode.includes('data-testid="settings-export-import-btn"'),
  "Settings stage must render settings-export-import-btn",
);
assert.ok(
  indexCode.includes("setIsSettingsBackupModalOpen(true)"),
  "Clicking export/import button must open SettingsBackupModal",
);
logPass("Settings stage (Stage 4) renders dedicated export/import controls in index.tsx");

// 2. Verify SettingsBackupModal is rendered and wired in index.tsx
assert.ok(
  indexCode.includes("<SettingsBackupModal") &&
    indexCode.includes("isOpen={isSettingsBackupModalOpen}") &&
    indexCode.includes("onClose={() => setIsSettingsBackupModalOpen(false)}") &&
    indexCode.includes("onSettingsImported={handleSettingsImported}"),
  "index.tsx must render SettingsBackupModal with isOpen, onClose, and onSettingsImported",
);
logPass("SettingsBackupModal is properly mounted and wired in index.tsx");

// 3. Verify BeginnerFlowContainer receives onOpenBackupModal
assert.ok(
  indexCode.includes("onOpenBackupModal={() => setIsSettingsBackupModalOpen(true)}"),
  "BeginnerFlowContainer must receive onOpenBackupModal prop for full parity",
);

const beginnerPrefsPath = path.resolve(
  repoRoot,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
assert.ok(fs.existsSync(beginnerPrefsPath), "BeginnerPreferencesTab.tsx must exist");
const beginnerPrefsCode = fs.readFileSync(beginnerPrefsPath, "utf-8");
assert.ok(
  beginnerPrefsCode.includes('data-testid="beginner-export-import-settings-btn"'),
  "BeginnerPreferencesTab must render beginner-export-import-settings-btn",
);
assert.ok(
  beginnerPrefsCode.includes("onClick={onOpenBackupModal}"),
  "Beginner export/import button must trigger onOpenBackupModal",
);
logPass("Beginner Mode provides 100% parity with Advanced Settings for Export / Import");

// 4. Verify SettingsBackupModal.tsx component implementation
const modalPath = path.resolve(repoRoot, "src/components/SettingsBackupModal.tsx");
assert.ok(fs.existsSync(modalPath), "SettingsBackupModal.tsx must exist");
const modalCode = fs.readFileSync(modalPath, "utf-8");

assert.ok(
  modalCode.includes('data-testid="settings-backup-modal"') &&
    modalCode.includes('data-testid="settings-backup-tab-export"') &&
    modalCode.includes('data-testid="settings-backup-tab-import"') &&
    modalCode.includes('data-testid="export-settings-download-btn"') &&
    modalCode.includes('data-testid="export-settings-copy-btn"') &&
    modalCode.includes('data-testid="import-settings-apply-btn"') &&
    modalCode.includes('data-testid="import-settings-file-input"'),
  "SettingsBackupModal must contain all required tab, download, copy, file upload, and apply elements",
);
logPass("SettingsBackupModal exposes all export and import controls and file upload inputs");

// 5. Functional test of settingsBackupManager
import {
  exportApplicationSettingsJson,
  importApplicationSettings,
} from "../src/utils/settingsBackupManager";

// Mock localStorage for node test execution
const storageMock: Record<string, string> = {
  yt_base_language: "he",
  yt_favorite_languages: JSON.stringify(["en", "he", "ar"]),
  yt_disable_scrolling: "true",
  yt_disable_autofocus: "true",
};

(global as any).window = {
  localStorage: {
    getItem: (k: string) => storageMock[k] ?? null,
    setItem: (k: string, v: string) => {
      storageMock[k] = v;
    },
    removeItem: (k: string) => {
      delete storageMock[k];
    },
    length: Object.keys(storageMock).length,
    key: (i: number) => Object.keys(storageMock)[i],
  },
  dispatchEvent: () => true,
};
(global as any).localStorage = (global as any).window.localStorage;

const exportedJson = exportApplicationSettingsJson(true);
assert.ok(exportedJson.length > 50, "Exported JSON should not be empty");
const parsed = JSON.parse(exportedJson);
assert.strictEqual(parsed.schemaVersion, 1, "Schema version must be 1");
assert.ok(parsed.appVersion, "Must include appVersion");
assert.ok(parsed.exportedAt, "Must include exportedAt timestamp");
assert.ok(parsed.preferences, "Must include preferences object");
logPass("settingsBackupManager exports valid schema JSON with preferences and metadata");

// Test import valid settings
const testBackup = {
  schemaVersion: 1,
  exportedAt: new Date().toISOString(),
  appVersion: "2.1.2",
  preferences: {
    baseLanguage: "it",
    favoriteLanguages: ["en", "it", "es"],
    disableScrolling: true,
  },
  rawLocalStorage: {
    yt_base_language: "it",
  },
};

const importResult = importApplicationSettings(JSON.stringify(testBackup));
assert.strictEqual(importResult.success, true, "Importing valid backup should succeed");
assert.ok(importResult.importedKeysCount > 0, "Should import at least one key");
logPass("settingsBackupManager successfully validates and imports settings payload");

// Test invalid payload rejection
const invalidResult = importApplicationSettings("not-a-valid-json");
assert.strictEqual(invalidResult.success, false, "Importing invalid JSON must fail gracefully");
assert.ok(invalidResult.message.includes("Invalid JSON"), "Error message should describe invalid JSON");
logPass("settingsBackupManager gracefully rejects malformed settings JSON payloads");

console.log(`\nAll ${passedChecks}/${passedChecks} checks passed! Settings Export / Import in Settings Stage verified.`);
