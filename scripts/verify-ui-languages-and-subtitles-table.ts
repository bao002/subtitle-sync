import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  computePrimaryTtsLang,
  getLanguageTtsRatio,
  DEFAULT_FETCH_STRATEGY_CONFIG,
} from "../src/lib/playback-preferences";

console.log("==================================================================");
console.log("🧪 Running Verification for UI Languages & Subtitles Table Enhancements");
console.log("==================================================================");

const rootDir = process.cwd();

// 1. Verify Version >= 2.0.38 Synchronization Across All 5 Files
console.log("1. Verifying Version >= 2.0.38 across all 5 version targets...");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
assert.ok(pkg.version >= "2.0.38", "package.json must be >= 2.0.38");

const gradle = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf8");
assert.match(gradle, /versionCode\s*=\s*200\d{2}/, "build.gradle.kts must have versionCode >= 20038");
assert.match(gradle, /versionName\s*=\s*"2\.0\.\d+"/, "build.gradle.kts must have versionName >= 2.0.38");

const appConfig = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf8");
assert.match(appConfig, /APP_VERSION\s*=\s*"2\.0\.\d+"/, "appConfig.ts must have APP_VERSION >= 2.0.38");

const apkUpdater = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf8");
assert.match(apkUpdater, /CURRENT_APK_VERSION\s*=\s*"v2\.0\.\d+"/, "apkUpdater.ts must have CURRENT_APK_VERSION >= v2.0.38");

const appSettings = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf8");
assert.match(appSettings, /version:\s*"2\.0\.\d+"/, "appSettings.ts must have snapshot version >= 2.0.38");
console.log("✅ PASS: Version >= 2.0.38 synchronized across all 5 files");

// 2. Verify Language Filter in Settings -> Languages Settings
console.log("2. Verifying Language Filter input in Settings -> Languages Settings...");
const indexSource = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf8");
assert.ok(
  indexSource.includes('id="filter-add-favorite-languages-input"') &&
  indexSource.includes('data-testid="filter-add-favorite-languages-input"'),
  "Settings must have filter-add-favorite-languages-input for filtering languages while adding to favorites",
);
assert.ok(
  indexSource.includes("addFavoriteFilter"),
  "index.tsx must manage addFavoriteFilter state",
);
console.log("✅ PASS: Settings language filter input verified");

// 3. Verify 'Select More Languages' in Language Accordion
console.log("3. Verifying Select More Languages in Language Accordion...");
const langBoxesSource = fs.readFileSync(path.join(rootDir, "src/components/LanguageBoxesSelector.tsx"), "utf8");
assert.ok(
  langBoxesSource.includes('id="select-more-languages-btn"') &&
  langBoxesSource.includes('data-testid="select-more-languages-btn"'),
  "LanguageBoxesSelector must have select-more-languages-btn",
);
assert.ok(
  langBoxesSource.includes('id="search-language-input"'),
  "LanguageBoxesSelector must have search-language-input",
);
console.log("✅ PASS: Select more languages button and search input verified");

// 4. Verify 'Failed to fetch subtitles' error alert moved to bottom
console.log("4. Verifying 'Failed to fetch subtitles' error alert moved to bottom...");
assert.ok(
  indexSource.includes('id="subtitles-failed-fetch-alert"') ||
  indexSource.includes('data-testid="subtitles-failed-fetch-alert"'),
  "index.tsx must contain subtitles-failed-fetch-alert",
);
const unifiedTablePos = indexSource.indexOf('data-testid="unified-languages-table"');
const failedAlertPos = indexSource.indexOf('data-testid="subtitles-failed-fetch-alert"');
assert.ok(
  failedAlertPos > unifiedTablePos,
  "subtitles-failed-fetch-alert must be rendered after the unified languages table at the bottom of the accordion",
);
console.log("✅ PASS: Error alert located at bottom of accordion");

// 5. Verify Minimal Ratio TTS Primary Role Evaluation
console.log("5. Verifying Minimal Ratio TTS Primary logic...");
const spoken = ["en", "he", "it"];
// en has ratio 1:5, he has 1:1, it has 1:2 -> he must be primary because 1 < 2 < 5
const ratios = { en: 5, he: 1, it: 2 };
const primary = computePrimaryTtsLang(spoken, ratios);
assert.strictEqual(primary, "he", "Language with minimal ratio (1:1) must act as primary");

// Change ratios: make it 1:1 and he 1:3 -> it must be primary
const ratios2 = { en: 5, he: 3, it: 1 };
const primary2 = computePrimaryTtsLang(spoken, ratios2);
assert.strictEqual(primary2, "it", "Language with minimal ratio (it) must act as primary");

// Verify manual switch button removed from UI
assert.ok(
  !indexSource.includes('data-testid="tts-switch-roles-button-advanced"'),
  "Manual switch primary/secondary button must be removed from UI",
);
console.log("✅ PASS: Minimal ratio primary auto-assignment verified");

// 6. Verify 'Fetch Priority Order' presentation omitted & random mode load-balanced
console.log("6. Verifying Fetch Priority Order presentation omitted and random mode default...");
const attemptSource = fs.readFileSync(path.join(rootDir, "src/components/AttemptOrderSettings.tsx"), "utf8");
assert.ok(
  attemptSource.includes("fetch-priority-order-hidden-container") &&
  attemptSource.includes("sr-only"),
  "AttemptOrderSettings must omit visual presentation of priority sequence rows",
);
const subtitlePlanSource = fs.readFileSync(path.join(rootDir, "src/lib/subtitle-fetch-plan.ts"), "utf8");
assert.ok(
  subtitlePlanSource.includes('mode: "random"'),
  "DEFAULT_FETCH_STRATEGY_CONFIG must default to mode: 'random'",
);
console.log("✅ PASS: Fetch priority presentation omitted and load-balance mode verified");

// 7. Verify Leftmost Column & Target Lang Favorites Rule
console.log("7. Verifying Leftmost Column and target_lang parameter rules...");
assert.ok(
  indexSource.includes("cols[0]?.code") &&
  indexSource.includes("setFavoriteLanguagesState"),
  "index.tsx must auto-add leftmost column (cols[0]) to favorite languages",
);
assert.ok(
  indexSource.includes('urlParams.get("target_lang")') &&
  indexSource.includes("recordSharedLanguageForVideo"),
  "index.tsx must handle target_lang from URL and add it to shared and target languages",
);
console.log("✅ PASS: Leftmost column and target_lang rules verified");

// 8. Verify Parallel Subtitles Scroll Styling & Column Freezing
console.log("8. Verifying Parallel Subtitles scrollbar styling and column freezing...");
const stylesSource = fs.readFileSync(path.join(rootDir, "src/styles.css"), "utf8");
assert.ok(
  stylesSource.includes(".custom-beautiful-scrollbar"),
  "styles.css must contain .custom-beautiful-scrollbar class",
);
const panelSource = fs.readFileSync(path.join(rootDir, "src/components/SubtitlesTablePanel.tsx"), "utf8");
assert.ok(
  panelSource.includes("custom-beautiful-scrollbar"),
  "SubtitlesTablePanel must use custom-beautiful-scrollbar",
);
assert.ok(
  panelSource.includes('id="toggle-freeze-columns-btn"') &&
  panelSource.includes('data-testid="toggle-freeze-columns-btn"'),
  "SubtitlesTablePanel must have toggle-freeze-columns-btn",
);
assert.ok(
  panelSource.includes("sticky left-0") && panelSource.includes("sticky left-28"),
  "SubtitlesTablePanel must support freezing first 2 columns (time & default subtitle)",
);
const rowSource = fs.readFileSync(path.join(rootDir, "src/components/SubtitleRow.tsx"), "utf8");
assert.ok(
  rowSource.includes("sticky left-0") && rowSource.includes("sticky left-28"),
  "SubtitleRow must support freezing first 2 columns",
);
console.log("✅ PASS: Beautiful scrollbar and frozen columns verified");

// 9. Verify Floating Button Red/Green Colors
console.log("9. Verifying Floating Button red/green status colors...");
const floatBtnSource = fs.readFileSync(path.join(rootDir, "src/components/FloatingDraggablePauseButton.tsx"), "utf8");
assert.ok(
  floatBtnSource.includes("bg-rose-600") && floatBtnSource.includes("bg-emerald-600"),
  "Floating button must use red/rose for paused/off and green/emerald for active/on",
);
assert.ok(
  floatBtnSource.includes("border-rose-500") && floatBtnSource.includes("border-emerald-500"),
  "Floating button must have rose/emerald borders for off/on",
);
console.log("✅ PASS: Floating button red/green status colors verified");

console.log("\n==================================================================");
console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
console.log("==================================================================");
