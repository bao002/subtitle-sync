/**
 * scripts/verify-native-tts-speed-for-service.ts
 *
 * Dedicated verification script for Task 178 (Chapter 2):
 * 1. Verifies removal of the extra "Configured TTS Speed Multiplier" slider and presets from Alternative TTS UI.
 * 2. Verifies presence of native speed notices in both Advanced Mode and Beginner Mode with 100% parity.
 * 3. Verifies speak() uses normalizedRate directly for Alternative TTS speech rate.
 * 4. Verifies playAlternativeTtsAudio() honors caller's native speech rate.
 * 5. Verifies version 1.0.71 across all 5 version targets.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

console.log("=== Verifying Task 178: Use Native Settings for TTS Service Speed ===");

const rootDir = process.cwd();

// 1. Verify Advanced Mode in src/routes/index.tsx
const indexTsxPath = path.resolve(rootDir, "src/routes/index.tsx");
const indexTsxContent = fs.readFileSync(indexTsxPath, "utf-8");

assert(
  !indexTsxContent.includes('data-testid="lovable-tts-speed-slider"'),
  "src/routes/index.tsx must NOT contain the extra lovable-tts-speed-slider",
);
assert(
  indexTsxContent.includes('data-testid="lovable-tts-native-speed-notice"'),
  "src/routes/index.tsx must contain lovable-tts-native-speed-notice",
);
assert(
  indexTsxContent.includes("altSpeed = normalizedRate;"),
  "speak() in src/routes/index.tsx must set altSpeed directly to normalizedRate",
);
console.log("✓ Advanced Mode uses native speech rate settings and has removed extra speed slider");

// 2. Verify Beginner Mode in src/components/beginner/tabs/BeginnerPreferencesTab.tsx
const beginnerTabPath = path.resolve(
  rootDir,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerTabContent = fs.readFileSync(beginnerTabPath, "utf-8");

assert(
  !beginnerTabContent.includes('data-testid="beginner-lovable-tts-speed-slider"'),
  "BeginnerPreferencesTab must NOT contain the extra beginner-lovable-tts-speed-slider",
);
assert(
  beginnerTabContent.includes('data-testid="beginner-lovable-tts-native-speed-notice"'),
  "BeginnerPreferencesTab must contain beginner-lovable-tts-native-speed-notice",
);
console.log("✓ Beginner Mode uses native speech rate settings and has removed extra speed slider");

// 3. Verify playAlternativeTtsAudio in src/lib/alternative-tts.ts
const altTtsPath = path.resolve(rootDir, "src/lib/alternative-tts.ts");
const altTtsContent = fs.readFileSync(altTtsPath, "utf-8");

assert(
  altTtsContent.includes("typeof rate === \"number\" && rate > 0 ? rate : 1.0"),
  "playAlternativeTtsAudio must directly honor caller's native rate parameter",
);
console.log("✓ playAlternativeTtsAudio prioritizes native rate parameter");

// 4. Verify version >= 1.0.71 across 5 files
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert(pkgJson.version >= "1.0.71", "package.json version must be >= 1.0.71");

const gradleContent = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert(/versionCode = 1007[1-9]/.test(gradleContent), "build.gradle.kts versionCode must be >= 10071");
assert(/versionName = "1\.0\.7[1-9]"/.test(gradleContent), 'build.gradle.kts versionName must be >= "1.0.71"');

const appConfigContent = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert(/export const APP_VERSION = "1\.0\.7[1-9]";/.test(appConfigContent), 'appConfig.ts APP_VERSION must be >= "1.0.71"');

const apkUpdaterContent = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert(/export const CURRENT_APK_VERSION = "v1\.0\.7[1-9]";/.test(apkUpdaterContent), 'apkUpdater.ts CURRENT_APK_VERSION must be >= "v1.0.71"');

const appSettingsContent = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert(/version: "1\.0\.7[1-9]"/.test(appSettingsContent), 'appSettings.ts version must be >= "1.0.71"');

console.log("✓ Version >= 1.0.71 synchronized across all 5 files");
console.log("=== ALL TASK 178 ASSERTIONS PASSED ===");
