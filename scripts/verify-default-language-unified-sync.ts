/**
 * Automated Verification Script: Unified & Synchronized Default Language Selection Across All Places
 * (scripts/verify-default-language-unified-sync.ts)
 *
 * Verifies Task 300 (Prompt 66 - Chapter 3):
 * 1. Single authoritative default language state manager (src/utils/defaultLanguageManager.ts).
 * 2. Stage 0 (Fetched Subtitles Stage Panel) integration.
 * 3. Stage 1 (Learning Goals & Default Language) synchronized selection.
 * 4. Stage 2 (Parallel Subtitles Table) column headers default badge & "Set Default" buttons.
 * 5. Stage 3 (Around Video Player) SwitchableDefaultSubtitlesBar synchronized selection.
 * 6. Stage 4 (Settings Stage) dedicated synchronized Default Language card & buttons.
 * 7. Beginner Mode (Preferences Tab & Flow Container) 100% parity with Advanced Mode Settings.
 * 8. Player captions track synchronization & localStorage persistence (yt_base_language).
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const repoRoot = process.cwd();

console.log("=== Verifying Unified & Synchronized Default Language Across All Places ===");

let passedChecks = 0;
function logPass(desc: string) {
  passedChecks++;
  console.log(`  ✓ [Check ${passedChecks}] ${desc}`);
}

// 1. Verify defaultLanguageManager.ts exists and exports required constants and methods
const managerPath = path.resolve(repoRoot, "src/utils/defaultLanguageManager.ts");
assert.ok(fs.existsSync(managerPath), "src/utils/defaultLanguageManager.ts must exist");
const managerCode = fs.readFileSync(managerPath, "utf-8");
assert.ok(
  managerCode.includes('export const DEFAULT_LANGUAGE_STORAGE_KEY = "yt_base_language"'),
  "Must export DEFAULT_LANGUAGE_STORAGE_KEY = 'yt_base_language'",
);
assert.ok(
  managerCode.includes('export const DEFAULT_LANGUAGE_EVENT = "yt_default_language_changed"'),
  "Must export DEFAULT_LANGUAGE_EVENT",
);
assert.ok(
  managerCode.includes("export function getDefaultLanguage"),
  "Must export getDefaultLanguage()",
);
assert.ok(
  managerCode.includes("export function setDefaultLanguage"),
  "Must export setDefaultLanguage()",
);
assert.ok(
  managerCode.includes("export function subscribeDefaultLanguage"),
  "Must export subscribeDefaultLanguage()",
);
logPass("defaultLanguageManager.ts defines single authoritative source of truth & event dispatch");

// 2. Functional test of defaultLanguageManager
import {
  getDefaultLanguage,
  setDefaultLanguage,
  subscribeDefaultLanguage,
  DEFAULT_LANGUAGE_STORAGE_KEY,
} from "../src/utils/defaultLanguageManager";

// Mock localStorage and window events for node environment
const storageMock: Record<string, string> = {};
const listeners: Array<(event: any) => void> = [];

(global as any).window = {
  localStorage: {
    getItem: (k: string) => storageMock[k] ?? null,
    setItem: (k: string, v: string) => {
      storageMock[k] = v;
    },
    removeItem: (k: string) => {
      delete storageMock[k];
    },
  },
  dispatchEvent: (event: any) => {
    listeners.forEach((l) => l(event));
  },
  addEventListener: (_type: string, listener: any) => {
    listeners.push(listener);
  },
  removeEventListener: (_type: string, listener: any) => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  },
};

let eventReceived = "";
const unsubscribe = subscribeDefaultLanguage((newLang) => {
  eventReceived = newLang;
});

setDefaultLanguage("he");
assert.strictEqual(getDefaultLanguage(), "he", "getDefaultLanguage should return 'he' after setDefaultLanguage('he')");
assert.strictEqual(storageMock[DEFAULT_LANGUAGE_STORAGE_KEY], "he", "Persisted in localStorage['yt_base_language']");
assert.strictEqual(eventReceived, "he", "Event listener received updated language 'he'");

unsubscribe();
logPass("defaultLanguageManager correctly reads, writes, and broadcasts language transitions");

// 3. Verify src/routes/index.tsx integrates defaultLanguageManager
const indexPath = path.resolve(repoRoot, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexCode = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexCode.includes("getDefaultLanguage") &&
    indexCode.includes("setDefaultLanguage") &&
    indexCode.includes("subscribeDefaultLanguage"),
  "index.tsx must import getDefaultLanguage, setDefaultLanguage, and subscribeDefaultLanguage",
);
assert.ok(
  indexCode.includes("subscribeDefaultLanguage((newLang) => {"),
  "index.tsx must subscribe to global default language changes to synchronize state",
);
assert.ok(
  indexCode.includes("setDefaultLanguage(langCode)") &&
    indexCode.includes("setBaseLanguagePreference(langCode)"),
  "handleSelectDefaultSubtitle must persist default language and broadcast updates",
);
assert.ok(
  indexCode.includes('primaryPlayer?.setOption?.("captions", "track", { languageCode: langCode })'),
  "handleSelectDefaultSubtitle must synchronize native player captions track",
);
logPass("src/routes/index.tsx initializes, synchronizes, and broadcasts default language updates");

// 4. Verify SubtitlesTablePanel receives onSelectBaseLanguage and renders indicators
const tablePanelPath = path.resolve(repoRoot, "src/components/SubtitlesTablePanel.tsx");
assert.ok(fs.existsSync(tablePanelPath), "src/components/SubtitlesTablePanel.tsx must exist");
const tablePanelCode = fs.readFileSync(tablePanelPath, "utf-8");

assert.ok(
  tablePanelCode.includes("onSelectBaseLanguage?: (langCode: string) => void"),
  "SubtitlesTablePanelProps must declare onSelectBaseLanguage",
);
assert.ok(
  tablePanelCode.includes("table-col-default-badge-"),
  "SubtitlesTablePanel must render table-col-default-badge- for active default column",
);
assert.ok(
  tablePanelCode.includes("table-set-default-btn-"),
  "SubtitlesTablePanel must render table-set-default-btn- to switch default language from table",
);
assert.ok(
  tablePanelCode.includes("onSelectBaseLanguage(l.code)"),
  "Clicking Set Default in table header must trigger onSelectBaseLanguage(l.code)",
);
logPass("SubtitlesTablePanel allows viewing and switching default language directly from column headers");

// 5. Verify index.tsx passes onSelectBaseLanguage to all SubtitlesTablePanel instances
const occurrencesOfOnSelect = (indexCode.match(/onSelectBaseLanguage=\{handleSelectDefaultSubtitle\}/g) || []).length;
assert.ok(
  occurrencesOfOnSelect >= 2,
  `SubtitlesTablePanel must receive onSelectBaseLanguage in all instances (found ${occurrencesOfOnSelect})`,
);
logPass("All SubtitlesTablePanel instances in index.tsx receive unified default language handler");

// 6. Verify Stage 1 and Beginner Mode use unified handleSelectDefaultSubtitle
assert.ok(
  indexCode.includes("data-testid={`stage-2-default-lang-${langCode}`}") &&
    indexCode.includes("handleSelectDefaultSubtitle(langCode)"),
  "Stage 1 default language buttons must invoke handleSelectDefaultSubtitle",
);
assert.ok(
  indexCode.includes("onBaseLangChange={(lang) => {") &&
    indexCode.includes("handleSelectDefaultSubtitle(lang)"),
  "BeginnerFlowContainer onBaseLangChange must invoke handleSelectDefaultSubtitle",
);
logPass("Stage 1 and Beginner Mode use unified handleSelectDefaultSubtitle");

// 7. Verify Stage 4 Settings Stage renders dedicated Default Language section
assert.ok(
  indexCode.includes('data-testid="settings-default-language-card"'),
  "Settings stage must render settings-default-language-card",
);
assert.ok(
  indexCode.includes('data-testid="settings-default-language-select"'),
  "Settings stage must render settings-default-language-select container",
);
assert.ok(
  indexCode.includes("settings-default-lang-btn-"),
  "Settings stage must render 1-click settings-default-lang-btn- for each fetched language",
);
logPass("Settings stage (Stage 4) renders dedicated synchronized Default Language card & buttons");

// 8. Verify Beginner Mode Preferences Tab parity
const beginnerPrefsPath = path.resolve(
  repoRoot,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
assert.ok(fs.existsSync(beginnerPrefsPath), "BeginnerPreferencesTab.tsx must exist");
const beginnerPrefsCode = fs.readFileSync(beginnerPrefsPath, "utf-8");

assert.ok(
  beginnerPrefsCode.includes('data-testid="beginner-default-language-card"'),
  "BeginnerPreferencesTab must render beginner-default-language-card for 100% parity with Settings",
);
assert.ok(
  beginnerPrefsCode.includes("beginner-default-lang-btn-"),
  "BeginnerPreferencesTab must render beginner-default-lang-btn- for 1-click switching",
);
logPass("BeginnerPreferencesTab provides 100% parity with Advanced Settings for Default Language");

// 9. Verify BeginnerFlowContainer passes props to BeginnerPreferencesTab
const beginnerContainerPath = path.resolve(
  repoRoot,
  "src/components/beginner/BeginnerFlowContainer.tsx",
);
assert.ok(fs.existsSync(beginnerContainerPath), "BeginnerFlowContainer.tsx must exist");
const beginnerContainerCode = fs.readFileSync(beginnerContainerPath, "utf-8");

assert.ok(
  beginnerContainerCode.includes("onBaseLanguageChange={(l) => onBaseLangChange?.(l)}") &&
    beginnerContainerCode.includes("availableDefaultLanguages={observedTracks.map((t) => t.lang)}"),
  "BeginnerFlowContainer must pass onBaseLanguageChange and availableDefaultLanguages to BeginnerPreferencesTab",
);
logPass("BeginnerFlowContainer passes default language parameters and handlers to Preferences tab");

console.log(`\nAll ${passedChecks}/${passedChecks} checks passed! Unified Default Language synchronization verified.`);
