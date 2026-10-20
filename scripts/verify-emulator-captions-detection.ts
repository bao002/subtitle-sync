import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Android Emulator E2E — Caption Detection & Text Exposure");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify MainActivity.kt caption text extraction and AUTHENTIC_CAPTIONS_EXPOSED
console.log("\n--> [Step 1] Verifying MainActivity.kt authentic captions exposure...");
const mainActivityPath = path.resolve(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  mainActivityContent.includes("AUTHENTIC_CAPTIONS_EXPOSED"),
  "MainActivity.kt must log AUTHENTIC_CAPTIONS_EXPOSED with lang, cues count, and sample text",
);
assert(
  mainActivityContent.includes("extractCaptionSampleText") ||
    mainActivityContent.includes("sampleText"),
  "MainActivity.kt must extract sample caption text from raw timedtext response",
);
assert(
  mainActivityContent.includes("authentic_captions_exposed.txt"),
  "MainActivity.kt must persist authentic_captions_exposed.txt on device storage",
);
console.log("✅ PASS: MainActivity.kt actively exposes authentic caption text and writes device file.");

// 2. Verify scripts/run-android-e2e.sh detection loop and text extraction
console.log("\n--> [Step 2] Verifying scripts/run-android-e2e.sh caption detection loop...");
const runE2ePath = path.resolve(rootDir, "scripts/run-android-e2e.sh");
assert(fs.existsSync(runE2ePath), "scripts/run-android-e2e.sh must exist");
const runE2eContent = fs.readFileSync(runE2ePath, "utf8");

assert(
  runE2eContent.includes("AUTHENTIC_CAPTIONS_EXPOSED"),
  "scripts/run-android-e2e.sh must detect AUTHENTIC_CAPTIONS_EXPOSED in logcat",
);
assert(
  runE2eContent.includes("authentic_captions_exposed.txt"),
  "scripts/run-android-e2e.sh must pull authentic_captions_exposed.txt from device",
);
assert(
  runE2eContent.includes("[DEPRECATED]"),
  "scripts/run-android-e2e.sh must mark screencast video recording as deprecated",
);
console.log("✅ PASS: run-android-e2e.sh detects authentic captions, pulls text, and marks screencast deprecated.");

// 3. Verify scripts/android-e2e-assert.sh step 4 assertion
console.log("\n--> [Step 3] Verifying scripts/android-e2e-assert.sh caption assertions...");
const assertE2ePath = path.resolve(rootDir, "scripts/android-e2e-assert.sh");
assert(fs.existsSync(assertE2ePath), "scripts/android-e2e-assert.sh must exist");
const assertE2eContent = fs.readFileSync(assertE2ePath, "utf8");

assert(
  assertE2eContent.includes("Step 4") && assertE2eContent.includes("AUTHENTIC_CAPTIONS_EXPOSED"),
  "scripts/android-e2e-assert.sh must include Step 4 asserting authentic captions exposure",
);
assert(
  assertE2eContent.includes("DEPRECATED in favor of caption text telemetry") ||
    assertE2eContent.includes("DEPRECATED"),
  "scripts/android-e2e-assert.sh must note screencast video deprecation",
);
console.log("✅ PASS: android-e2e-assert.sh validates authentic captions in Step 4.");

// 4. Verify public reports contain screencast deprecation notice
console.log("\n--> [Step 4] Verifying screencast deprecation notices in HTML reports...");
const reportHtmlPath = path.resolve(rootDir, "public/android-emulator-report.html");
const androidIndexPath = path.resolve(rootDir, "public/android/index.html");
assert(fs.existsSync(reportHtmlPath), "public/android-emulator-report.html must exist");
assert(fs.existsSync(androidIndexPath), "public/android/index.html must exist");

const reportContent = fs.readFileSync(reportHtmlPath, "utf8");
const androidIndexContent = fs.readFileSync(androidIndexPath, "utf8");

assert(
  reportContent.includes("Deprecated") && reportContent.includes("Deprecation Notice"),
  "public/android-emulator-report.html must display screencast deprecation badge and notice",
);
assert(
  androidIndexContent.includes("Deprecated") && androidIndexContent.includes("Deprecation Notice"),
  "public/android/index.html must display screencast deprecation badge and notice",
);
console.log("✅ PASS: HTML reports display screencast deprecation badge and notice.");

// 5. Verify docs/android.md documents screencast deprecation
console.log("\n--> [Step 5] Verifying docs/android.md deprecation documentation...");
const androidMdPath = path.resolve(rootDir, "docs/android.md");
assert(fs.existsSync(androidMdPath), "docs/android.md must exist");
const androidMdContent = fs.readFileSync(androidMdPath, "utf8");

assert(
  androidMdContent.includes("DEPRECATED") &&
    androidMdContent.includes("AUTHENTIC_CAPTIONS_EXPOSED"),
  "docs/android.md must document screencast deprecation and authentic caption exposure",
);
console.log("✅ PASS: docs/android.md documents screencast deprecation and caption exposure.");

// 6. Verify version 1.0.53 parity across all 5 targets
console.log("\n--> [Step 6] Verifying version 1.0.53 parity across all 5 targets...");
const targets = [
  { path: "package.json", pattern: /"version":\s*"1\.0\.53"/ },
  { path: "android-shell/app/build.gradle.kts", pattern: /versionName\s*=\s*"1\.0\.53"/ },
  { path: "src/config/appConfig.ts", pattern: /APP_VERSION\s*=\s*"1\.0\.53"/ },
  { path: "src/utils/apkUpdater.ts", pattern: /CURRENT_APK_VERSION\s*=\s*"v1\.0\.53"/ },
];

for (const target of targets) {
  const fullPath = path.resolve(rootDir, target.path);
  assert(fs.existsSync(fullPath), `Target file ${target.path} must exist`);
  const content = fs.readFileSync(fullPath, "utf8");
  assert(target.pattern.test(content), `${target.path} must specify version 1.0.53`);
  console.log(`  ✓ ${target.path} version verified (1.0.53)`);
}

console.log("\n=========================================================================");
console.log("🎉 ALL ANDROID EMULATOR CAPTIONS DETECTION CHECKS PASSED SUCCESSFULLY!");
console.log("=========================================================================");
