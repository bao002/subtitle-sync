import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Removal of Redundant Enabled-Languages Status Card (Task 241)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const pkgPath = path.join(rootDir, "package.json");
const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const appConfigPath = path.join(rootDir, "src/config/appConfig.ts");
const apkUpdaterPath = path.join(rootDir, "src/utils/apkUpdater.ts");
const appSettingsPath = path.join(rootDir, "src/utils/appSettings.ts");

assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// Check 1: enabled-languages-status-card is removed from Languages accordion
console.log("--> [Check 1] Verifying enabled-languages-status-card is removed...");
assert.ok(
  !indexContent.includes('data-testid="enabled-languages-status-card"'),
  "src/routes/index.tsx must NOT contain enabled-languages-status-card",
);
assert.ok(
  !indexContent.includes('data-testid="quick-add-favorite-select"'),
  "src/routes/index.tsx must NOT contain quick-add-favorite-select in Languages accordion",
);
assert.ok(
  !indexContent.includes('data-testid="reset-video-to-favorites-btn"'),
  "src/routes/index.tsx must NOT contain duplicate reset-video-to-favorites-btn in Languages accordion",
);
assert.ok(
  !indexContent.includes('data-testid="save-current-as-favorites-btn"'),
  "src/routes/index.tsx must NOT contain duplicate save-current-as-favorites-btn in Languages accordion",
);
console.log("✅ PASS: Redundant card and duplicate buttons successfully removed.");

// Check 2: LanguageBoxesSelector remains to select which languages to enable for current video
console.log("--> [Check 2] Verifying LanguageBoxesSelector remains active in Languages accordion...");
assert.ok(
  indexContent.includes("<LanguageBoxesSelector"),
  "src/routes/index.tsx must render LanguageBoxesSelector in Languages accordion",
);
assert.ok(
  indexContent.includes("selectedLanguages={targetLanguages}"),
  "LanguageBoxesSelector must receive selectedLanguages={targetLanguages}",
);
assert.ok(
  indexContent.includes("onSelectionChange={handleTargetLanguagesChange}"),
  "LanguageBoxesSelector must receive onSelectionChange={handleTargetLanguagesChange}",
);
console.log("✅ PASS: LanguageBoxesSelector is properly present for current-video selection.");

// Check 3: Favorite languages configuration remains available in Settings accordion
console.log("--> [Check 3] Verifying Favorite list creation and management remains in Settings...");
assert.ok(
  indexContent.includes('data-testid="settings-reset-video-to-favorites-btn"'),
  "Settings accordion must provide settings-reset-video-to-favorites-btn",
);
assert.ok(
  indexContent.includes('data-testid="settings-save-current-as-favorites-btn"'),
  "Settings accordion must provide settings-save-current-as-favorites-btn",
);
assert.ok(
  indexContent.includes('data-testid="settings-favorites-languages-card"'),
  "Settings accordion must provide settings-favorites-languages-card",
);
console.log("✅ PASS: Settings accordion preserves favorite languages management.");

// Check 4: Version synchronization across all 5 files to 2.0.36
console.log("--> [Check 4] Verifying version bump across all 5 files to 2.0.36...");
const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
assert.strictEqual(pkgJson.version, "2.0.36", "package.json version must be 2.0.36");

const gradleContent = fs.readFileSync(gradlePath, "utf-8");
assert.ok(gradleContent.includes('versionName = "2.0.36"'), "build.gradle.kts must have versionName 2.0.36");
assert.ok(gradleContent.includes("versionCode = 20036"), "build.gradle.kts must have versionCode 20036");

const appConfigContent = fs.readFileSync(appConfigPath, "utf-8");
assert.ok(appConfigContent.includes('APP_VERSION = "2.0.36"'), "appConfig.ts must have APP_VERSION 2.0.36");

const apkUpdaterContent = fs.readFileSync(apkUpdaterPath, "utf-8");
assert.ok(apkUpdaterContent.includes('CURRENT_APK_VERSION = "v2.0.36"'), "apkUpdater.ts must have CURRENT_APK_VERSION v2.0.36");

const appSettingsContent = fs.readFileSync(appSettingsPath, "utf-8");
assert.ok(appSettingsContent.includes('version: "2.0.36"'), "appSettings.ts must have version 2.0.36");
console.log("✅ PASS: All 5 files consistently updated to version 2.0.36.");

console.log("=========================================================================");
console.log("🎉 ALL REDUNDANT LANGUAGES STATUS CARD REMOVAL CHECKS PASSED (100%)!");
console.log("=========================================================================");
