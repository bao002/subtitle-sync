import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying docs/e2e-android.md Specification & Milestone Screenshot Pipeline");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify existence of docs/e2e-android.md and no duplicate in root
console.log("--> [Step 1] Verifying docs/e2e-android.md location and zero-duplicate compliance...");
const rootE2eAndroidPath = path.resolve(rootDir, "e2e-android.md");
const docsE2eAndroidPath = path.resolve(rootDir, "docs/e2e-android.md");

assert(!fs.existsSync(rootE2eAndroidPath), "e2e-android.md must not exist in repository root (canonical location is docs/e2e-android.md)");
assert(fs.existsSync(docsE2eAndroidPath), "docs/e2e-android.md must exist under docs/");

const docContent = fs.readFileSync(docsE2eAndroidPath, "utf8");
assert(docContent.length > 1500, "docs/e2e-android.md must provide comprehensive specification details");
console.log("✅ PASS: docs/e2e-android.md exists canonically under docs/ with 0 root duplicates.");

// 2. Verify Core Architecture & Testing Principles
console.log("\n--> [Step 2] Auditing core testing principles and 10-point unmocked test matrix...");
const requiredConcepts = [
  "Zero Mocking & Authentic Runtime Execution",
  "Pre-Test Android Emulator Navigation: Exposing \"About Phone\" & Developer Details",
  "DEVICE_INFO_SETTINGS",
  "step-01-about-phone.png",
  "step-02-app-launch.png",
  "step-03-action-view.png",
  "step-04-action-send.png",
  "step-05-captions-subtitles.png",
  "android-emulator-screenshot.png",
  "Local Asset Hydration",
  "appassets.androidplatform.net",
  "ACTION_VIEW",
  "ACTION_SEND",
  "shouldInterceptRequest",
  "tlang",
  "TextToSpeech",
  "BackgroundAudioService",
  "MediaSession",
];

for (const concept of requiredConcepts) {
  assert(
    docContent.includes(concept),
    `docs/e2e-android.md must document required concept: "${concept}"`,
  );
  console.log(`   ✓ Verified concept: "${concept}"`);
}
console.log("✅ PASS: docs/e2e-android.md contains all 10 unmocked test capabilities.");

// 3. Verify scripts/run-android-e2e.sh includes pre-test navigation and step screenshots
console.log("\n--> [Step 3] Auditing scripts/run-android-e2e.sh implementation...");
const runScriptPath = path.resolve(rootDir, "scripts/run-android-e2e.sh");
assert(fs.existsSync(runScriptPath), "scripts/run-android-e2e.sh must exist");
const runScriptContent = fs.readFileSync(runScriptPath, "utf8");

assert(
  runScriptContent.includes("DEVICE_INFO_SETTINGS") || runScriptContent.includes("android.settings.SETTINGS"),
  "run-android-e2e.sh must dispatch intent to open Settings / About Phone",
);
assert(
  runScriptContent.includes("step-01-about-phone.png"),
  "run-android-e2e.sh must capture step-01-about-phone.png",
);
assert(
  runScriptContent.includes("step-02-app-launch.png"),
  "run-android-e2e.sh must capture step-02-app-launch.png",
);
assert(
  runScriptContent.includes("step-05-captions-subtitles.png"),
  "run-android-e2e.sh must capture step-05-captions-subtitles.png",
);
console.log("✅ PASS: run-android-e2e.sh contains pre-test About Phone navigation and milestone captures.");

// 4. Verify scripts/android-e2e-assert.sh includes milestone screenshots
console.log("\n--> [Step 4] Auditing scripts/android-e2e-assert.sh milestone captures...");
const assertScriptPath = path.resolve(rootDir, "scripts/android-e2e-assert.sh");
assert(fs.existsSync(assertScriptPath), "scripts/android-e2e-assert.sh must exist");
const assertScriptContent = fs.readFileSync(assertScriptPath, "utf8");

assert(
  assertScriptContent.includes("step-02-app-launch.png"),
  "android-e2e-assert.sh must capture step-02-app-launch.png",
);
assert(
  assertScriptContent.includes("step-03-action-view.png"),
  "android-e2e-assert.sh must capture step-03-action-view.png",
);
assert(
  assertScriptContent.includes("step-04-action-send.png"),
  "android-e2e-assert.sh must capture step-04-action-send.png",
);
assert(
  assertScriptContent.includes("step-05-captions-subtitles.png"),
  "android-e2e-assert.sh must capture step-05-captions-subtitles.png",
);
console.log("✅ PASS: android-e2e-assert.sh captures milestone steps 2 through 5.");

// 5. Verify package.json script registration
console.log("\n--> [Step 5] Auditing package.json test script...");
const packageJsonPath = path.resolve(rootDir, "package.json");
assert(fs.existsSync(packageJsonPath), "package.json must exist");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

assert(
  packageJson.scripts && packageJson.scripts["test:e2e-android-doc"],
  "package.json must register 'test:e2e-android-doc' script",
);
console.log("✅ PASS: package.json script 'test:e2e-android-doc' verified.");

console.log("\n=========================================================================");
console.log("🎉 ALL ANDROID E2E SPECIFICATION & SCREENSHOT PIPELINE AUDITS PASSED 100%!");
console.log("=========================================================================");
