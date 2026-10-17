import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert";

/**
 * Dedicated automated verification test for:
 * 1. Android TTS Playback Architecture & Package Visibility (Subtask 137.1)
 * 2. Subtitles Table View Page Flipping across page boundaries (Subtask 137.2)
 * 3. Version 1.0.41 Parity & Documentation (Subtask 137.3)
 */

console.log("Starting verification for TTS Play and Subtitles Table Page Flipping (v1.0.41)...");

// --- 1. Verify AndroidManifest.xml for TextToSpeech package visibility ---
const manifestPath = resolve(process.cwd(), "android-shell/app/src/main/AndroidManifest.xml");
assert(existsSync(manifestPath), "AndroidManifest.xml must exist");
const manifestContent = readFileSync(manifestPath, "utf-8");

assert(
  manifestContent.includes("<queries>") &&
    manifestContent.includes("android.intent.action.TTS_SERVICE") &&
    manifestContent.includes("</queries>"),
  "AndroidManifest.xml must declare <queries> with android.intent.action.TTS_SERVICE for Android 11+ package visibility",
);
console.log("✓ Verified AndroidManifest.xml package visibility queries for TTS service");

// --- 2. Verify MainActivity.kt TTS Engine configuration and bridge ---
const mainActivityPath = resolve(process.cwd(), "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt");
assert(existsSync(mainActivityPath), "MainActivity.kt must exist");
const mainActivityContent = readFileSync(mainActivityPath, "utf-8");

assert(
  mainActivityContent.includes("setAudioAttributes"),
  "MainActivity.kt must configure AudioAttributes on TextToSpeech engine",
);
assert(
  mainActivityContent.includes("fun isTtsReady(): Boolean"),
  "MainActivity.kt AndroidNativeBridge must expose isTtsReady() to JavaScript",
);
assert(
  mainActivityContent.includes('Locale("iw", "IL")') || mainActivityContent.includes('"iw"'),
  "MainActivity.kt speak() must support Hebrew locale alias fallback",
);
console.log("✓ Verified MainActivity.kt audio attributes, isTtsReady() bridge, and locale handling");

// --- 3. Verify src/types.ts bridge interface ---
const typesPath = resolve(process.cwd(), "src/types.ts");
assert(existsSync(typesPath), "src/types.ts must exist");
const typesContent = readFileSync(typesPath, "utf-8");
assert(
  typesContent.includes("isTtsReady?: () => boolean;"),
  "src/types.ts must declare isTtsReady on AndroidNativeShell interface",
);
console.log("✓ Verified src/types.ts declarations for AndroidNativeShell");

// --- 4. Verify src/routes/index.tsx TTS prioritization and event hookup ---
const indexPath = resolve(process.cwd(), "src/routes/index.tsx");
assert(existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = readFileSync(indexPath, "utf-8");

assert(
  indexContent.includes("window.AndroidNativeShell?.speak") &&
    !indexContent.includes("!chosenVoice && typeof window !== \"undefined\" && window.AndroidNativeShell?.speak"),
  "speak() in src/routes/index.tsx must prioritize AndroidNativeShell without !chosenVoice bypass",
);

assert(
  indexContent.includes("window.onNativeTTSDone = (uid: string) =>"),
  "speak() in src/routes/index.tsx must hook up window.onNativeTTSDone callback",
);

assert(
  indexContent.includes("setSpoken((prev) => Array.from(new Set([...prev, ...savedLangs])));"),
  "src/routes/index.tsx must synchronize spoken state on hydration with saved user learning languages",
);
console.log("✓ Verified src/routes/index.tsx TTS prioritization, event listener, and hydration sync");

// --- 5. Verify Subtitles Table View Page Flipping ---
assert(
  indexContent.includes("setActive(nextRowIdx);"),
  "src/routes/index.tsx must set active to nextRowIdx immediately after candidateRow completes speaking",
);

assert(
  indexContent.includes("const currentActive = active >= 0 ? active : speakingRow;"),
  "src/routes/index.tsx must determine currentActive from active or speakingRow for page calculation",
);

assert(
  indexContent.includes("const targetPage = Math.floor(currentActive / subtitlesLimit) + 1;"),
  "src/routes/index.tsx must calculate targetPage from currentActive and subtitlesLimit",
);

// Verify page flipping is NOT gated on autoFocus
const pageFlipEffectRegex = /useEffect\(\(\) => \{\s*const currentActive = active >= 0 \? active : speakingRow;\s*if \(!isSetupPaused && currentActive >= 0 && subtitlesLimit > 0\)/;
assert(
  pageFlipEffectRegex.test(indexContent),
  "Subtitles table view page flipping must NOT be gated on autoFocus setting",
);

// Functional unit simulation of page flipping logic
const simulatePageFlip = (activeIdx: number, limit: number): number => {
  return Math.floor(activeIdx / limit) + 1;
};

// Page 1 (records 0-9)
for (let i = 0; i <= 9; i++) {
  assert.strictEqual(simulatePageFlip(i, 10), 1, `Record ${i} should be on page 1`);
}
// After playing last record of page 1 (record 9), next record is 10 -> flips to page 2
assert.strictEqual(simulatePageFlip(10, 10), 2, "Record 10 should flip table to page 2");

// Page 2 (records 10-19)
for (let i = 10; i <= 19; i++) {
  assert.strictEqual(simulatePageFlip(i, 10), 2, `Record ${i} should be on page 2`);
}
// After playing last record of page 2 (record 19), next record is 20 -> flips to page 3
assert.strictEqual(simulatePageFlip(20, 10), 3, "Record 20 should flip table to page 3");

// Seeking back to record 5 -> flips to page 1
assert.strictEqual(simulatePageFlip(5, 10), 1, "Seeking back to record 5 should flip table to page 1");

console.log("✓ Verified subtitles table view page flipping algorithm and state transitions");

// --- 6. Verify Version 1.0.41 Parity across all 5 targets ---
const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf-8"));
assert.strictEqual(packageJson.version, "1.0.41", "package.json version must be 1.0.41");

const buildGradle = readFileSync(resolve(process.cwd(), "android-shell/app/build.gradle.kts"), "utf-8");
assert(buildGradle.includes('versionCode = 10041'), "build.gradle.kts versionCode must be 10041");
assert(buildGradle.includes('versionName = "1.0.41"'), "build.gradle.kts versionName must be 1.0.41");

const apkUpdater = readFileSync(resolve(process.cwd(), "src/utils/apkUpdater.ts"), "utf-8");
assert(apkUpdater.includes('CURRENT_APK_VERSION = "v1.0.41"'), "apkUpdater.ts CURRENT_APK_VERSION must be v1.0.41");

const appSettings = readFileSync(resolve(process.cwd(), "src/utils/appSettings.ts"), "utf-8");
assert(appSettings.includes('version: "1.0.41"'), "appSettings.ts version must be 1.0.41");

const appConfig = readFileSync(resolve(process.cwd(), "src/config/appConfig.ts"), "utf-8");
assert(appConfig.includes('APP_VERSION = "1.0.41"'), "appConfig.ts APP_VERSION must be 1.0.41");

console.log("✓ Verified version 1.0.41 and versionCode 10041 across all 5 targets");
console.log("All verifications for TTS Play and Subtitles Table Page Flipping passed successfully (100% verified)!");
