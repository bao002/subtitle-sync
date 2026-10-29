import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Prevention of Auto-Scroll and Focus Loss on Mouse Action (Task 242)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const selectorPath = path.join(rootDir, "src/components/LanguageBoxesSelector.tsx");
const tablePanelPath = path.join(rootDir, "src/components/SubtitlesTablePanel.tsx");
const pkgPath = path.join(rootDir, "package.json");
const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const appConfigPath = path.join(rootDir, "src/config/appConfig.ts");
const apkUpdaterPath = path.join(rootDir, "src/utils/apkUpdater.ts");
const appSettingsPath = path.join(rootDir, "src/utils/appSettings.ts");

assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
assert.ok(fs.existsSync(selectorPath), "src/components/LanguageBoxesSelector.tsx must exist");
assert.ok(fs.existsSync(tablePanelPath), "src/components/SubtitlesTablePanel.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf-8");
const selectorContent = fs.readFileSync(selectorPath, "utf-8");
const tablePanelContent = fs.readFileSync(tablePanelPath, "utf-8");

// Check 1: LanguageBoxesSelector preserves focus with preventScroll and records user interaction
console.log("--> [Check 1] Verifying LanguageBoxesSelector retains focus and blocks auto-scroll on mouse action...");
assert.ok(
  selectorContent.includes("recordUserInteraction"),
  "LanguageBoxesSelector must import and call recordUserInteraction",
);
assert.ok(
  selectorContent.includes("preventScroll: true"),
  "LanguageBoxesSelector must preserve focus with preventScroll: true to avoid scrolling",
);
assert.ok(
  selectorContent.includes('id={`lang-box-${lang.code}`}') &&
    selectorContent.includes('id={`expand-subtitles-url-${lang.code}`}'),
  "LanguageBoxesSelector must have stable element IDs for language boxes and expand buttons",
);
console.log("✅ PASS: LanguageBoxesSelector prevents auto-scroll and preserves focus on mouse action.");

// Check 2: Dedicated Scroll to Position button in SubtitlesTablePanel
console.log("--> [Check 2] Verifying dedicated Scroll to Position button in SubtitlesTablePanel...");
assert.ok(
  tablePanelContent.includes('id="scroll-to-position-btn"') &&
    tablePanelContent.includes('data-testid="scroll-to-position-btn"'),
  "SubtitlesTablePanel must render dedicated scroll-to-position-btn button",
);
assert.ok(
  tablePanelContent.includes("Scroll to Position"),
  "Dedicated button must have text 'Scroll to Position'",
);
assert.ok(
  tablePanelContent.includes("onScrollToActivePosition"),
  "SubtitlesTablePanel must accept onScrollToActivePosition prop",
);
console.log("✅ PASS: Dedicated button for auto-scroll to position verified.");

// Check 3: Auto-scroll effect in index.tsx does not scroll or shift focus during user focus / interaction
console.log("--> [Check 3] Verifying auto-scroll effect guards in src/routes/index.tsx...");
assert.ok(
  indexContent.includes("handleScrollToActivePosition"),
  "src/routes/index.tsx must define handleScrollToActivePosition",
);
assert.ok(
  indexContent.includes("onScrollToActivePosition={handleScrollToActivePosition}"),
  "src/routes/index.tsx must pass handleScrollToActivePosition to SubtitlesTablePanel",
);
assert.ok(
  indexContent.includes("isUserFocusActive") || indexContent.includes("document.activeElement"),
  "src/routes/index.tsx auto-scroll effect must guard against stealing focus from active elements",
);
assert.ok(
  indexContent.includes('panel.scrollTop +='),
  "src/routes/index.tsx must scroll inside panel.scrollTop instead of whole-window scrollIntoView during playback",
);
console.log("✅ PASS: Auto-scroll effect safely guards focus and keeps window stationary.");

// Check 4: Version synchronization across all 5 files to 2.0.37
console.log("--> [Check 4] Verifying version bump across all 5 files to 2.0.37...");
const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
assert.strictEqual(pkgJson.version, "2.0.37", "package.json version must be 2.0.37");

const gradleContent = fs.readFileSync(gradlePath, "utf-8");
assert.ok(gradleContent.includes('versionName = "2.0.37"'), "build.gradle.kts must have versionName 2.0.37");
assert.ok(gradleContent.includes("versionCode = 20037"), "build.gradle.kts must have versionCode 20037");

const appConfigContent = fs.readFileSync(appConfigPath, "utf-8");
assert.ok(appConfigContent.includes('APP_VERSION = "2.0.37"'), "appConfig.ts must have APP_VERSION 2.0.37");

const apkUpdaterContent = fs.readFileSync(apkUpdaterPath, "utf-8");
assert.ok(apkUpdaterContent.includes('CURRENT_APK_VERSION = "v2.0.37"'), "apkUpdater.ts must have CURRENT_APK_VERSION v2.0.37");

const appSettingsContent = fs.readFileSync(appSettingsPath, "utf-8");
assert.ok(appSettingsContent.includes('version: "2.0.37"'), "appSettings.ts must have version 2.0.37");
console.log("✅ PASS: All 5 files consistently updated to version 2.0.37.");

console.log("=========================================================================");
console.log("🎉 ALL AUTO-SCROLL & FOCUS PREVENTION CHECKS PASSED (100%)!");
console.log("=========================================================================");
