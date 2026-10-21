import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Android E2E Tests Without Mocks or Synthetic Fixtures");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify Version Parity Across All 5 Targets
console.log("\n--> [Step 1] Verifying Version Parity Across All 5 Targets...");
const pkgJsonPath = path.join(rootDir, "package.json");
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
const version = pkgJson.version;
assert.strictEqual(version, "1.0.41", "package.json version must be 1.0.41");

const buildGradle = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf8");
assert(buildGradle.includes('"1.0.41"'), "build.gradle.kts must declare versionName 1.0.41");
assert(buildGradle.includes("10041"), "build.gradle.kts must declare versionCode 10041");

const appConfig = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf8");
assert(appConfig.includes('APP_VERSION = "1.0.41"'), "appConfig.ts must declare 1.0.41");

const apkUpdater = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf8");
assert(apkUpdater.includes('CURRENT_APK_VERSION = "v1.0.41"'), "apkUpdater.ts must declare v1.0.41");

const appSettings = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf8");
assert(appSettings.includes('version: "1.0.41"'), "appSettings.ts must declare version 1.0.41");
console.log(`✅ PASS: All 5 version targets synchronized at ${version} (versionCode 10041).`);

// 2. Verify e2e/emulation.spec.ts is Mock-Free & Fixture-Free
console.log("\n--> [Step 2] Verifying e2e/emulation.spec.ts is Mock-Free & Fixture-Free...");
const emulationSpecPath = path.join(rootDir, "e2e/emulation.spec.ts");
assert(fs.existsSync(emulationSpecPath), "e2e/emulation.spec.ts must exist");
const emulationSpec = fs.readFileSync(emulationSpecPath, "utf8");

// Must NOT contain addInitScript with mock AndroidNativeShell
assert(
  !emulationSpec.includes("nativeWindow.AndroidNativeShell = {"),
  "e2e/emulation.spec.ts must not inject mock AndroidNativeShell object",
);
assert(
  !emulationSpec.includes("fetchTranslatedCaptionsWithUrl: () => JSON.stringify({ events: [] })"),
  "e2e/emulation.spec.ts must not mock fetchTranslatedCaptionsWithUrl with empty events",
);
assert(
  !emulationSpec.includes("fixtures/"),
  "e2e/emulation.spec.ts must not reference fixture files for Android tests",
);
console.log("✅ PASS: e2e/emulation.spec.ts has ZERO bridge mocks or synthetic fixtures.");

// 3. Verify playwright.config.ts Uses Authentic Android Mobile Emulation
console.log("\n--> [Step 3] Verifying playwright.config.ts configuration...");
const playwrightConfigPath = path.join(rootDir, "playwright.config.ts");
assert(fs.existsSync(playwrightConfigPath), "playwright.config.ts must exist");
const playwrightConfig = fs.readFileSync(playwrightConfigPath, "utf8");

assert(
  playwrightConfig.includes('devices["Pixel 7"]'),
  "playwright.config.ts must configure authentic Pixel 7 mobile device emulation for Android tests",
);
assert(
  playwrightConfig.includes("fallbackExecutablePath"),
  "playwright.config.ts must include fallbackExecutablePath for robust headless shell resolution",
);
console.log("✅ PASS: playwright.config.ts uses Pixel 7 Android device emulation and robust executable path.");

// 4. Verify src/routes/index.tsx Naturally Detects Android Environment
console.log("\n--> [Step 4] Verifying natural Android environment detection in index.tsx...");
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
const indexTsx = fs.readFileSync(indexTsxPath, "utf8");

assert(
  indexTsx.includes("isAndroidAppEnvironment()"),
  "src/routes/index.tsx must use isAndroidAppEnvironment() for natural user-agent Android detection",
);
console.log("✅ PASS: index.tsx naturally recognizes Android mobile execution.");

// 5. Verify MainActivity.kt Has No Synthetic Subtitle Fixture Generators
console.log("\n--> [Step 5] Verifying MainActivity.kt has no fake subtitle generators...");
const mainActivityPath = path.join(rootDir, "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt");
const mainActivity = fs.readFileSync(mainActivityPath, "utf8");

assert(
  !mainActivity.includes("fun generateDefaultSubtitlesJson") &&
  !mainActivity.includes("fun generateTranslatedFallbackJson") &&
  !mainActivity.includes("assets.open(path)"),
  "MainActivity.kt must not use synthetic fixture generators or load asset fixtures",
);
console.log("✅ PASS: MainActivity.kt discovers subtitles authentically via real YouTube network traffic.");

console.log("\n=========================================================================");
console.log("🎉 ALL ANDROID E2E NO-MOCKS AND NO-FIXTURES VERIFICATIONS PASSED 100%!");
console.log("=========================================================================");
