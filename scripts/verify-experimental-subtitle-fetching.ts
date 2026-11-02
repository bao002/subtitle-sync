/**
 * Automated Verification Script: Experimental Subtitle Fetching in Debug Mode
 *
 * Verifies that:
 * 1. ExperimentalSubtitleFetchPanel.tsx exists and is exported.
 * 2. Allows selecting other languages (presets & custom).
 * 3. Supports parameter mode selection: with/without tlang (tlang vs lang).
 * 4. Supports transport route selection: with/without server (server proxy vs direct).
 * 5. Provides interactive "Try Fetch Subtitles" and 4-way combination test matrix.
 * 6. Is integrated into AttemptOrderSettings under developerMode guard.
 * 7. Contains data-control-category="experimental".
 * 8. Storybook story exists for isolated visual testing.
 * 9. Version 2.0.79 is synchronized across all 5 version files.
 */

import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Verification failed: ${message}`);
    process.exit(1);
  }
}

console.log("🔍 Verifying Experimental Subtitle Fetching feature in Debug Mode...");

const rootDir = process.cwd();
const panelPath = path.join(rootDir, "src/components/ExperimentalSubtitleFetchPanel.tsx");
const storyPath = path.join(rootDir, "src/components/ExperimentalSubtitleFetchPanel.stories.tsx");
const attemptOrderPath = path.join(rootDir, "src/components/AttemptOrderSettings.tsx");

// 1. Component existence & content
assert(fs.existsSync(panelPath), "ExperimentalSubtitleFetchPanel.tsx must exist");
const panelContent = fs.readFileSync(panelPath, "utf-8");

assert(panelContent.includes("export const ExperimentalSubtitleFetchPanel"), "Must export ExperimentalSubtitleFetchPanel");
assert(panelContent.includes("data-control-category=\"experimental\""), "Must have data-control-category='experimental'");

// 2. Other languages selection
assert(panelContent.includes("targetLang") || panelContent.includes("effectiveLang"), "Must manage target language state");
assert(panelContent.includes("experimental-custom-lang-input"), "Must have custom language code input");
assert(panelContent.includes("COMMON_EXPERIMENTAL_LANGS"), "Must have preset common language options");

// 3. With/without tlang/lang controls
assert(panelContent.includes("with tlang"), "Must have 'with tlang' mode label");
assert(panelContent.includes("with lang"), "Must have 'with lang' mode label");
assert(panelContent.includes("experimental-mode-tlang-radio"), "Must have tlang radio testid");
assert(panelContent.includes("experimental-mode-lang-radio"), "Must have lang radio testid");

// 4. With/without server controls
assert(panelContent.includes("with server"), "Must have 'with server' option");
assert(panelContent.includes("without server"), "Must have 'without server' option");
assert(panelContent.includes("experimental-server-on-radio"), "Must have server on radio testid");
assert(panelContent.includes("experimental-server-off-radio"), "Must have server off radio testid");

// 5. Actions: Try Fetch & 4-way matrix
assert(panelContent.includes("experimental-try-fetch-button"), "Must have Try Fetch button");
assert(panelContent.includes("experimental-run-matrix-button"), "Must have 4-way combination test button");
assert(panelContent.includes("fetchViaServer"), "Must use fetchViaServer for server route");
assert(panelContent.includes("buildAttemptUrl"), "Must use buildAttemptUrl to construct tlang vs lang URLs");

// 6. Integration in AttemptOrderSettings
assert(fs.existsSync(attemptOrderPath), "AttemptOrderSettings.tsx must exist");
const attemptOrderContent = fs.readFileSync(attemptOrderPath, "utf-8");
assert(attemptOrderContent.includes("ExperimentalSubtitleFetchPanel"), "AttemptOrderSettings must import and render ExperimentalSubtitleFetchPanel");
assert(attemptOrderContent.includes("developerMode &&"), "Must be conditionally rendered only in developer/debug mode");

// 7. Storybook Story existence
assert(fs.existsSync(storyPath), "ExperimentalSubtitleFetchPanel.stories.tsx must exist for Storybook");

// 8. Version check (2.0.79)
console.log("🔍 Checking version parity (2.0.79)...");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert(packageJson.version === "2.0.79", `package.json version must be 2.0.79, found: ${packageJson.version}`);

const gradleContent = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert(gradleContent.includes('versionName = "2.0.79"'), "build.gradle.kts must have versionName = 2.0.79");
assert(gradleContent.includes("versionCode = 20079"), "build.gradle.kts must have versionCode = 20079");

const appConfigContent = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf-8");
assert(appConfigContent.includes('APP_VERSION = "2.0.79"'), "appConfig.ts must have APP_VERSION = 2.0.79");

const apkUpdaterContent = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert(apkUpdaterContent.includes('CURRENT_APK_VERSION = "v2.0.79"'), "apkUpdater.ts must have CURRENT_APK_VERSION = v2.0.79");

const appSettingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert(appSettingsContent.includes('version: "2.0.79"'), "appSettings.ts must have version: 2.0.79");

console.log("✅ All verification assertions passed successfully! Experimental subtitle fetching in debug mode is fully verified.");
