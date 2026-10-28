import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { APP_VERSION } from "../src/config/appConfig";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Verification: Refined Language Settings (Task 265)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

// Test 1: Rate dropdown (0.5 - 1.0) in unified languages table
console.log("\n[Test 1] Verifying rate dropdown (0.5 to 1.0) in unified languages table...");
assert.ok(
  indexContent.includes('data-testid={`tts-rate-select-${lang.code}`}'),
  "Unified table must render <select> with data-testid='tts-rate-select-${lang.code}'",
);
assert.ok(
  indexContent.includes("[0.5, 0.6, 0.7, 0.8, 0.9, 1.0]"),
  "Rate options must strictly cover 0.5 to 1.0",
);
console.log("✅ PASS: Rate select dropdown configured with 0.5 to 1.0 options");

// Test 2: Play button that pronounced the language name is removed from table
console.log("\n[Test 2] Verifying speech test play button for language name is removed...");
assert.ok(
  !indexContent.includes('title={`Test ${lang.name} voice`}'),
  "Play button pronouncing language name must be removed from unified table row",
);
assert.ok(
  !indexContent.includes('aria-label={`Test ${lang.name} voice`}'),
  "Play button aria-label must be removed from unified table row",
);
console.log("✅ PASS: Language pronunciation play button is completely removed");

// Test 3: Click language name to set primary & dedicated Primary column eliminated
console.log("\n[Test 3] Verifying clickable language name for primary and removal of Primary column...");
assert.ok(
  !/<th[^>]*>\s*Primary\s*<\/th>/.test(indexContent),
  "Dedicated Primary column header must be removed from the table",
);
assert.ok(
  indexContent.includes('data-testid={`tts-switch-primary-${lang.code}`}'),
  "Language name button must have data-testid='tts-switch-primary-${lang.code}'",
);
assert.ok(
  indexContent.includes('title={`Click to set ${lang.name} as Primary`}'),
  "Language name button must have tooltip indicating clicking sets Primary",
);
assert.ok(
  indexContent.includes('data-testid={`tts-role-badge-${lang.code}`}'),
  "Active primary language must display Primary role badge",
);
console.log("✅ PASS: Language name is clickable to set Primary; dedicated Primary column removed");

// Test 4: Rate can be updated on the main settings
console.log("\n[Test 4] Verifying rate update on main settings (Settings accordion)...");
assert.ok(
  indexContent.includes('data-testid="lovable-tts-native-speed-notice"'),
  "Main settings must preserve lovable-tts-native-speed-notice",
);
assert.ok(
  indexContent.includes('data-testid="main-settings-tts-rate-select"'),
  "Main settings must include rate select dropdown data-testid='main-settings-tts-rate-select'",
);
console.log("✅ PASS: Main settings allows updating speech rate directly via dropdown");

// Test 5: Beginner mode parity
console.log("\n[Test 5] Verifying Beginner mode parity...");
const beginnerPerLangPath = path.resolve(
  rootDir,
  "src/components/beginner/PerLanguageTtsPreferences.tsx",
);
const beginnerPerLangContent = fs.readFileSync(beginnerPerLangPath, "utf-8");
assert.ok(
  beginnerPerLangContent.includes('data-testid={`beginner-tts-speed-${language.code}`}'),
  "Beginner per-language settings must render speed select dropdown",
);
assert.ok(
  beginnerPerLangContent.includes("[0.5, 0.6, 0.7, 0.8, 0.9, 1.0]"),
  "Beginner per-language rate options must cover 0.5 to 1.0",
);
assert.ok(
  beginnerPerLangContent.includes('data-testid={`tts-switch-primary-${language.code}`}'),
  "Beginner mode language name must be clickable to set Primary",
);

const beginnerTabPath = path.resolve(
  rootDir,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerTabContent = fs.readFileSync(beginnerTabPath, "utf-8");
assert.ok(
  beginnerTabContent.includes('data-testid="beginner-main-settings-tts-rate-select"'),
  "BeginnerPreferencesTab must allow updating rate via beginner-main-settings-tts-rate-select",
);
console.log("✅ PASS: Beginner mode maintains 100% parity with Advanced mode");

// Test 6: Version 2.0.32 synchronization across all 5 targets
console.log("\n[Test 6] Verifying version 2.0.32 synchronization across all 5 targets...");
assert.strictEqual(APP_VERSION, "2.0.32", "appConfig.ts APP_VERSION must be 2.0.32");

const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkg.version, "2.0.32", "package.json version must be 2.0.32");

const gradleContent = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(gradleContent.includes("versionCode = 20032"), "build.gradle.kts versionCode must be 20032");
assert.ok(gradleContent.includes('versionName = "2.0.32"'), 'build.gradle.kts versionName must be "2.0.32"');

const apkUpdaterContent = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(apkUpdaterContent.includes('CURRENT_APK_VERSION = "v2.0.32"'), 'apkUpdater.ts must be "v2.0.32"');

const appSettingsContent = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(appSettingsContent.includes('version: "2.0.32"'), 'appSettings.ts must be "2.0.32"');

console.log("✅ PASS: Version 2.0.32 / 20032 synchronized across all 5 canonical files");

console.log("\n=========================================================================");
console.log("🎉 ALL REFINED LANGUAGE SETTINGS CHECKS PASSED 100%!");
console.log("=========================================================================");
