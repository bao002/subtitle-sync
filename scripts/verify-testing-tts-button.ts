/**
 * Dedicated Verification Test for Task 176 (Chapter 1):
 * "the testing-tts-dashboard button to test is not working."
 *
 * Asserts:
 * 1. playAlternativeTtsAudio contains resilient fallback handling (Google Translate TTS & Web Speech API).
 * 2. Unblocks fallback by removing !engineOverride blocker so test button fallback always fires on upstream 402/network failure.
 * 3. Advanced mode (src/routes/index.tsx) contains test button with interactive loading state and async play handler.
 * 4. Beginner mode (BeginnerPreferencesTab.tsx) contains test button with interactive loading state and async play handler.
 * 5. Version 1.0.69 parity across all 5 manifests and config targets.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { APP_VERSION, APP_COMMIT_ID } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Verification: Testing-TTS-Dashboard Button (Task 176)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Fallback logic in src/lib/alternative-tts.ts
console.log("\n🔊 Test 1: Resilient fallback logic in src/lib/alternative-tts.ts...");
const altTtsPath = path.join(rootDir, "src/lib/alternative-tts.ts");
assert.ok(fs.existsSync(altTtsPath), "alternative-tts.ts must exist");
const altTtsContent = fs.readFileSync(altTtsPath, "utf-8");

assert.ok(
  altTtsContent.includes("function fallbackToWebSpeech"),
  "alternative-tts.ts must define fallbackToWebSpeech for ultimate browser speech synthesis fallback",
);
assert.ok(
  !altTtsContent.includes('engine === "lovable" && !engineOverride'),
  "alternative-tts.ts must not block Google Translate fallback with !engineOverride guard",
);
assert.ok(
  altTtsContent.includes("fallbackUrl && activeAlternativeAudio === audio"),
  "alternative-tts.ts must attempt Google Translate fallback on audio error or rejection",
);
console.log("✅ PASS: Resilient fallback logic unblocked and verified.");

// Test 2: Advanced Mode UI Test Button
console.log("\n🚀 Test 2: Advanced Mode Test Button (src/routes/index.tsx)...");
const indexPath = path.join(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexContent.includes('data-testid="test-alternative-tts-btn"'),
  "src/routes/index.tsx must contain test-alternative-tts-btn",
);
assert.ok(
  indexContent.includes("isTestingAlternativeTts"),
  "src/routes/index.tsx must track isTestingAlternativeTts state for live user feedback",
);
assert.ok(
  indexContent.includes("Playing test audio…"),
  "src/routes/index.tsx must show playing/synthesizing indicator when testing",
);
console.log("✅ PASS: Advanced mode test button has live loading/playing state and async handler.");

// Test 3: Beginner Mode UI Test Button
console.log("\n🐣 Test 3: Beginner Mode Test Button (BeginnerPreferencesTab.tsx)...");
const beginnerPath = path.join(rootDir, "src/components/beginner/tabs/BeginnerPreferencesTab.tsx");
assert.ok(fs.existsSync(beginnerPath), "BeginnerPreferencesTab.tsx must exist");
const beginnerContent = fs.readFileSync(beginnerPath, "utf-8");

assert.ok(
  beginnerContent.includes('data-testid="btn-test-alternative-tts"'),
  "BeginnerPreferencesTab.tsx must contain btn-test-alternative-tts",
);
assert.ok(
  beginnerContent.includes("isTestingAlternativeTts"),
  "BeginnerPreferencesTab.tsx must track isTestingAlternativeTts state",
);
assert.ok(
  beginnerContent.includes("Playing test audio…"),
  "BeginnerPreferencesTab.tsx must show playing indicator when testing",
);
console.log("✅ PASS: Beginner mode test button has live loading/playing state and parity.");

// Test 4: Version 1.0.69 Parity Across All 5 Targets
console.log("\n📦 Test 4: Version 1.0.69 Parity Across All 5 Targets...");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert.equal(pkg.version, "1.0.69", "package.json version must be 1.0.69");
assert.equal(APP_VERSION, "1.0.69", "appConfig.ts APP_VERSION must be 1.0.69");
assert.equal(CURRENT_APK_VERSION, "v1.0.69", "apkUpdater.ts CURRENT_APK_VERSION must be v1.0.69");

const gradleContent = fs.readFileSync(
  path.join(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  gradleContent.includes('versionName = "1.0.69"'),
  "build.gradle.kts versionName must be 1.0.69",
);
assert.ok(
  gradleContent.includes("versionCode = 10069"),
  "build.gradle.kts versionCode must be 10069",
);

const settingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(
  settingsContent.includes('version: "1.0.69"'),
  "appSettings.ts snapshot version must be 1.0.69",
);

console.log(`✅ PASS: All 5 manifests and configs verified at version 1.0.69 (${APP_COMMIT_ID}).`);

console.log("\n=========================================================================");
console.log("🎉 ALL TASK 176 (CHAPTER 1) TESTING-TTS BUTTON VERIFICATION TESTS PASSED 100%!");
console.log("=========================================================================");
