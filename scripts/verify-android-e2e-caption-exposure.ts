/**
 * Dedicated Verification Test for Task 162:
 * Android Emulator E2E Caption Detection & Text Exposure (Deprecate Screencast Generation)
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Android E2E Caption Exposure & Screencast Deprecation");
console.log("=========================================================================");

// Test 1: Verify run-android-e2e.sh screencast deprecation & caption text extraction
console.log("Test 1: Auditing scripts/run-android-e2e.sh...");
const runScriptPath = path.resolve(process.cwd(), "scripts/run-android-e2e.sh");
assert.ok(fs.existsSync(runScriptPath), "scripts/run-android-e2e.sh must exist");
const runScript = fs.readFileSync(runScriptPath, "utf-8");

assert.ok(
  runScript.includes('ENABLE_DEPRECATED_SCREENCAST="${ENABLE_DEPRECATED_SCREENCAST:-false}"'),
  "run-android-e2e.sh must default ENABLE_DEPRECATED_SCREENCAST to false",
);
assert.ok(
  runScript.includes("AUTHENTIC_CAPTIONS_EXPOSED"),
  "run-android-e2e.sh must actively detect AUTHENTIC_CAPTIONS_EXPOSED in logcat",
);
assert.ok(
  runScript.includes("authentic_captions_exposed.txt"),
  "run-android-e2e.sh must pull authentic_captions_exposed.txt from device",
);
assert.ok(
  runScript.includes("NO FIXTURES"),
  "run-android-e2e.sh must mandate NO FIXTURES on live target video",
);
console.log("✅ PASS: scripts/run-android-e2e.sh verified");

// Test 2: Auditing scripts/android-e2e-assert.sh
console.log("Test 2: Auditing scripts/android-e2e-assert.sh...");
const assertScriptPath = path.resolve(process.cwd(), "scripts/android-e2e-assert.sh");
assert.ok(fs.existsSync(assertScriptPath), "scripts/android-e2e-assert.sh must exist");
const assertScript = fs.readFileSync(assertScriptPath, "utf-8");

assert.ok(
  assertScript.includes('grep -q "AUTHENTIC_CAPTIONS_EXPOSED"'),
  "android-e2e-assert.sh must check AUTHENTIC_CAPTIONS_EXPOSED in logcat",
);
assert.ok(
  assertScript.includes("authentic_captions_exposed.txt"),
  "android-e2e-assert.sh must pull and verify authentic_captions_exposed.txt",
);
assert.ok(
  assertScript.includes("public/screenshots/authentic_captions_exposed.txt"),
  "android-e2e-assert.sh must copy authentic_captions_exposed.txt to public/screenshots",
);
assert.ok(
  assertScript.includes("This page didn't load"),
  "android-e2e-assert.sh must assert absence of error screen",
);
console.log("✅ PASS: scripts/android-e2e-assert.sh verified");

// Test 3: Auditing MainActivity.kt authentic caption logging & file exposure
console.log("Test 3: Auditing MainActivity.kt caption exposure implementation...");
const mainActivityPath = path.resolve(
  process.cwd(),
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert.ok(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const mainActivity = fs.readFileSync(mainActivityPath, "utf-8");

assert.ok(
  mainActivity.includes('Log.i(TAG, "AUTHENTIC_CAPTIONS_EXPOSED'),
  "MainActivity.kt must log AUTHENTIC_CAPTIONS_EXPOSED with dialogue sample",
);
assert.ok(
  mainActivity.includes('File(targetBaseDir, "authentic_captions_exposed.txt")'),
  "MainActivity.kt must write authentic_captions_exposed.txt on device",
);
console.log("✅ PASS: MainActivity.kt authentic caption exposure verified");

// Test 4: Auditing .github/workflows/emulation.yml
console.log("Test 4: Auditing .github/workflows/emulation.yml...");
const workflowPath = path.resolve(process.cwd(), ".github/workflows/emulation.yml");
assert.ok(fs.existsSync(workflowPath), ".github/workflows/emulation.yml must exist");
const workflow = fs.readFileSync(workflowPath, "utf-8");

assert.ok(
  workflow.includes("authentic_captions_exposed.txt"),
  "emulation.yml must check, upload, and stage authentic_captions_exposed.txt",
);
assert.ok(
  workflow.includes("Authentic Live Caption Text Exposed (No Fixtures)"),
  "emulation.yml must display exposed caption text in Job Summary",
);
assert.ok(
  workflow.includes(
    "Screencast video generation deprecated in favor of authentic screenshots and logcat telemetry",
  ),
  "emulation.yml must declare screencast video deprecation in verification step",
);
console.log("✅ PASS: .github/workflows/emulation.yml verified");

// Test 5: Auditing docs/android.md documentation
console.log("Test 5: Auditing docs/android.md documentation...");
const docsPath = path.resolve(process.cwd(), "docs/android.md");
assert.ok(fs.existsSync(docsPath), "docs/android.md must exist");
const docs = fs.readFileSync(docsPath, "utf-8");

assert.ok(
  docs.includes("Screencast Video Deprecation & Authentic Live Caption Text Exposure"),
  "docs/android.md Section 5 title must reflect screencast deprecation and live caption text exposure",
);
assert.ok(
  docs.includes("ENABLE_DEPRECATED_SCREENCAST=false"),
  "docs/android.md must state ENABLE_DEPRECATED_SCREENCAST=false default",
);
assert.ok(
  docs.includes("AUTHENTIC_CAPTIONS_EXPOSED"),
  "docs/android.md must document AUTHENTIC_CAPTIONS_EXPOSED telemetry",
);
assert.ok(
  docs.includes("authentic_captions_exposed.txt"),
  "docs/android.md must document authentic_captions_exposed.txt",
);
console.log("✅ PASS: docs/android.md documentation verified");

console.log("=========================================================================");
console.log("🎉 ALL Task 162 (Android E2E Caption Exposure) TESTS PASSED (100%)!");
console.log("=========================================================================");
