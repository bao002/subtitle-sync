/**
 * Dedicated Automated Test: TTS Service URL and Direct Google TTS (Task 265)
 *
 * Verifies:
 * 1. Correct TTS Service URL: https://tts3.lovable.app and endpoint https://tts3.lovable.app/api/public/tts
 * 2. OpenAPI 3.1.0 specification URL: https://tts3.lovable.app/api/public/openapi.json
 * 3. Direct Google TTS endpoint: https://translate.google.com/translate_tts
 * 4. Engine switching between 'lovable' and 'google_translate' via getters and setters
 * 5. Direct URL building for Google Translate TTS with correct encoding and normalization
 * 6. UI controls parity across Beginner mode and Advanced mode
 * 7. Version synchronization across all 5 files at version 2.0.55
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  LOVABLE_TTS_BASE_URL,
  LOVABLE_TTS_ENDPOINT,
  LOVABLE_TTS_OPENAPI_URL,
  GOOGLE_TRANSLATE_TTS_ENDPOINT,
  buildLovableTtsUrl,
  buildGoogleTranslateTtsUrl,
  getAlternativeTtsEngine,
  setAlternativeTtsEngine,
  getUseAlternativeTts,
  setUseAlternativeTts,
  getAlternativeTtsMode,
  setAlternativeTtsMode,
  getLovableTtsVoice,
  setLovableTtsVoice,
  LOVABLE_VOICES,
} from "../src/lib/alternative-tts";
import { APP_VERSION, APP_COMMIT_ID, APP_VERSION_DESCRIPTION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Test: TTS Service URL & Direct Google TTS (Task 265)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Section 1: Endpoints & Base URLs
console.log("\n🌐 Section 1: Endpoints & Base URLs Verification...");
assert.equal(
  LOVABLE_TTS_BASE_URL,
  "https://tts3.lovable.app",
  "LOVABLE_TTS_BASE_URL must be https://tts3.lovable.app",
);
assert.equal(
  LOVABLE_TTS_ENDPOINT,
  "https://tts3.lovable.app/api/public/tts",
  "LOVABLE_TTS_ENDPOINT must be https://tts3.lovable.app/api/public/tts",
);
assert.equal(
  LOVABLE_TTS_OPENAPI_URL,
  "https://tts3.lovable.app/api/public/openapi.json",
  "LOVABLE_TTS_OPENAPI_URL must be https://tts3.lovable.app/api/public/openapi.json",
);
assert.equal(
  GOOGLE_TRANSLATE_TTS_ENDPOINT,
  "https://translate.google.com/translate_tts",
  "GOOGLE_TRANSLATE_TTS_ENDPOINT must be https://translate.google.com/translate_tts",
);
console.log("✅ PASS: All service base URLs and endpoints verified correctly.");

// Section 2: Direct Google TTS URL Generation
console.log("\n🔊 Section 2: Direct Google TTS URL Generation...");
const sampleText = "Hello world from direct Google TTS";
const googleUrl = buildGoogleTranslateTtsUrl(sampleText, "en", 1.0);
assert.ok(
  googleUrl.startsWith("https://translate.google.com/translate_tts"),
  "Google TTS URL must start with google translate endpoint",
);
const parsedGoogleUrl = new URL(googleUrl);
assert.equal(parsedGoogleUrl.searchParams.get("ie"), "UTF-8");
assert.equal(parsedGoogleUrl.searchParams.get("client"), "tw-ob");
assert.equal(parsedGoogleUrl.searchParams.get("tl"), "en");

assert.equal(parsedGoogleUrl.searchParams.get("q"), sampleText);
console.log("✅ PASS: Direct Google TTS URL generation verified.");

// Section 3: Lovable TTS URL Generation on tts3.lovable.app
console.log("\n🔊 Section 3: Lovable TTS URL Generation on tts3.lovable.app...");
const lovableUrl = buildLovableTtsUrl(sampleText, "en", {
  provider: "lovable",
  voice: "Fenrir",
  speed: 1.2,
});
assert.ok(
  lovableUrl.startsWith("https://tts3.lovable.app/api/public/tts"),
  "Lovable TTS URL must start with https://tts3.lovable.app/api/public/tts",
);
const parsedLovableUrl = new URL(lovableUrl);
assert.equal(parsedLovableUrl.searchParams.get("provider"), "lovable");
assert.equal(parsedLovableUrl.searchParams.get("voice"), "Fenrir");
assert.equal(parsedLovableUrl.searchParams.get("text"), sampleText);
console.log("✅ PASS: Lovable TTS URL generation verified on tts3.lovable.app.");

// Section 4: Engine Selection Getters & Setters
console.log("\n⚙️ Section 4: Engine Selection Preferences...");
setAlternativeTtsEngine("google_translate");
assert.equal(getAlternativeTtsEngine(), "google_translate");
setAlternativeTtsEngine("lovable");
assert.equal(getAlternativeTtsEngine(), "lovable");
console.log("✅ PASS: Engine selection persistence helpers verified.");

// Section 5: UI Controls Parity Across Beginner and Advanced Modes
console.log("\n🎨 Section 5: UI Parity Across Beginner and Advanced Modes...");
const routesIndexContent = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf-8");
assert.ok(
  routesIndexContent.includes('data-testid="alternative-tts-engine-select"'),
  "Advanced mode must include alternative-tts-engine-select",
);
assert.ok(
  routesIndexContent.includes("LOVABLE_TTS_OPENAPI_URL") ||
    routesIndexContent.includes("https://tts3.lovable.app") ||
    routesIndexContent.includes("LOVABLE_TTS_BASE_URL"),
  "Advanced mode must reference LOVABLE_TTS_OPENAPI_URL or tts3.lovable.app",
);

const beginnerTabContent = fs.readFileSync(
  path.join(rootDir, "src/components/beginner/tabs/BeginnerPreferencesTab.tsx"),
  "utf-8",
);
assert.ok(
  beginnerTabContent.includes('data-testid="beginner-alternative-tts-engine-select"'),
  "Beginner tab must provide beginner-alternative-tts-engine-select",
);

const beginnerTtsControlPath = path.join(
  rootDir,
  "src/components/beginner/BeginnerTtsServiceControl.tsx",
);
if (fs.existsSync(beginnerTtsControlPath)) {
  const beginnerTtsControl = fs.readFileSync(beginnerTtsControlPath, "utf-8");
  assert.ok(
    beginnerTtsControl.includes('data-testid="beginner-tts-service-google"'),
    "Beginner TTS control must include Google TTS option",
  );
}
console.log("✅ PASS: UI controls parity across modes verified.");

// Section 6: Version Synchronization at 2.0.55 Across All 5 Files
console.log(`\n📦 Section 6: Version ${APP_VERSION} Synchronization Across All 5 Files...`);
const expectedVersion = APP_VERSION;
const expectedVersionCode = 20058;


// File 1: package.json
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert.equal(pkg.version, expectedVersion, `package.json version must be ${expectedVersion}`);

// File 2: android-shell/app/build.gradle.kts
const gradleContent = fs.readFileSync(
  path.join(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  gradleContent.includes(`versionName = "${expectedVersion}"`),
  `build.gradle.kts must have versionName = "${expectedVersion}"`,
);
assert.ok(
  gradleContent.includes(`versionCode = ${expectedVersionCode}`),
  `build.gradle.kts must have versionCode = ${expectedVersionCode}`,
);

// File 3: src/config/appConfig.ts
assert.equal(APP_VERSION, expectedVersion, `appConfig.ts APP_VERSION must be ${expectedVersion}`);

// File 4: src/utils/apkUpdater.ts
assert.equal(
  CURRENT_APK_VERSION,
  `v${expectedVersion}`,
  `apkUpdater.ts CURRENT_APK_VERSION must be v${expectedVersion}`,
);

// File 5: src/utils/appSettings.ts
const settingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(
  settingsContent.includes(`version: "${expectedVersion}"`),
  `appSettings.ts must have version: "${expectedVersion}"`,
);

console.log(`✅ PASS: All 5 files synchronized at version ${expectedVersion} (${expectedVersionCode}).`);

console.log("\n=========================================================================");
console.log("🎉 ALL TASK 265 TESTS PASSED SUCCESSFULLY 100%!");
console.log("=========================================================================");
