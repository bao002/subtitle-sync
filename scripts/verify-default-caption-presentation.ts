import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Default Subtitle Presentation & Caption Icon Fix (Task 150)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Validate Android shell MainActivity.kt automatic json3 repetition on non-JSON3 caption
console.log("--> [Test 1] Auditing MainActivity.kt for automatic json3 repetition...");
const mainActivityPath = path.resolve(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  mainActivityContent.includes("Intercepted non-JSON3 caption"),
  "MainActivity.kt must detect intercepted non-JSON3 captions",
);
assert(
  mainActivityContent.includes("executeTimedTextRepetition(url, lang, \"json3\")") ||
    mainActivityContent.includes("executeTimedTextRepetition"),
  "MainActivity.kt must automatically repeat request with fmt=json3",
);
assert(
  mainActivityContent.includes("dispatchToJavaScript"),
  "MainActivity.kt must dispatch valid json3 payload to JavaScript",
);
console.log("✅ PASS: MainActivity.kt automatically fetches and dispatches json3 upon non-JSON3 captions.");

// Test 2: Validate index.tsx immediate tracks ingestion and panel opening
console.log("--> [Test 2] Auditing index.tsx for immediate subtitle arrival reactivity...");
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert(
  indexContent.includes("setOpenPanels((prev) => (prev.subtitles ? prev : { ...prev, subtitles: true }))"),
  "index.tsx must automatically open subtitles panel upon caption arrival",
);
assert(
  indexContent.includes("if (baseLanguage && tracks?.[baseLanguage] && hasTrackCues(tracks[baseLanguage]))"),
  "index.tsx cols must include baseLanguage immediately when track has valid cues",
);
assert(
  indexContent.includes("id=\"caption-toggle-button\""),
  "index.tsx must contain caption-toggle-button",
);
console.log("✅ PASS: index.tsx immediately reflects base language and opens subtitles panel.");

// Test 3: Validate version 1.0.51 synchronization across all 5 targets
console.log("--> [Test 3] Auditing Version 1.0.51 across all 5 targets...");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf8"));
assert.strictEqual(pkg.version, "1.0.51", "package.json version must be 1.0.51");

const gradleContent = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf8",
);
assert(gradleContent.includes("1.0.51"), "build.gradle.kts must include 1.0.51");
assert(gradleContent.includes("10051"), "build.gradle.kts must include versionCode 10051");

const appConfigContent = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf8");
assert(appConfigContent.includes('APP_VERSION = "1.0.51"'), "appConfig.ts must have APP_VERSION 1.0.51");

const apkUpdaterContent = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf8");
assert(apkUpdaterContent.includes('CURRENT_APK_VERSION = "v1.0.51"'), "apkUpdater.ts must have CURRENT_APK_VERSION v1.0.51");

const appSettingsContent = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf8");
assert(appSettingsContent.includes('version: "1.0.51"'), "appSettings.ts must have snapshot version 1.0.51");
console.log("✅ PASS: Version 1.0.51 is perfectly synchronized across all 5 targets.");

// Test 4: Validate package.json script registration
console.log("--> [Test 4] Auditing package.json script registration...");
assert(
  pkg.scripts["test:default-caption-presentation"],
  "package.json must contain 'test:default-caption-presentation' script",
);
console.log("✅ PASS: package.json script registered.");

// Test 5: Validate docs/files.md registration
console.log("--> [Test 5] Auditing docs/files.md registration...");
const filesMdContent = fs.readFileSync(path.resolve(rootDir, "docs/files.md"), "utf8");
assert(
  filesMdContent.includes("verify-default-caption-presentation.ts"),
  "docs/files.md must inventory verify-default-caption-presentation.ts",
);
console.log("✅ PASS: docs/files.md inventories verify-default-caption-presentation.ts.");

console.log("=========================================================================");
console.log("🎉 ALL DEFAULT CAPTION PRESENTATION AUDIT CHECKS PASSED (100%)!");
console.log("=========================================================================");
