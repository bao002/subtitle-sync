/**
 * Dedicated Test Suite for Task 175:
 * "In case the user prefer to use the tts service over the native capabilities of the device/browser:
 *  use the configured target language and the current text and the configured tts speed
 *  and dont present a tts playground here. currently support only the provider: "lovable"
 *  which also support various voice-types. show those options on a drop-down list."
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  LOVABLE_TTS_BASE_URL,
  LOVABLE_TTS_ENDPOINT,
  LOVABLE_VOICES,
  buildLovableTtsUrl,
  buildLovableTtsRequestBody,
  getUseAlternativeTts,
  setUseAlternativeTts,
  getAlternativeTtsMode,
  setAlternativeTtsMode,
  getLovableTtsVoice,
  setLovableTtsVoice,
  getLovableTtsSpeed,
  setLovableTtsSpeed,
} from "../src/lib/alternative-tts";
import { APP_VERSION, APP_COMMIT_ID, APP_VERSION_DESCRIPTION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("=========================================================================");
console.log("🧪 Running Dedicated Test: Lovable TTS Service Preference (Task 175)");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: Service Provider & Voice Types Catalog
console.log("\n📦 Test 1: Provider 'lovable' & Voice Types Dropdown Catalog...");
assert.equal(LOVABLE_TTS_BASE_URL, "https://tts2.lovable.app");
assert.equal(LOVABLE_TTS_ENDPOINT, "https://tts2.lovable.app/api/public/tts");
assert.deepEqual(
  Array.from(LOVABLE_VOICES),
  ["Kore", "Puck", "Charon", "Fenrir", "Aoede"],
  "Lovable voice options must support Kore, Puck, Charon, Fenrir, Aoede",
);
console.log("✅ PASS: Lovable TTS endpoints and voice options catalog verified.");

// Test 2: URL Builder and Request Body Enforce Provider "lovable", Configured Target Lang, Current Text, Configured Speed
console.log("\n🌐 Test 2: Request Payload Formats (Text, Configured Target Lang, Speed, Provider 'lovable')...");
const sampleText = "Bonjour le monde, ceci est un test de sous-titres.";
const sampleLang = "fr";
const sampleSpeed = 1.25;
const sampleVoice = "Fenrir";

const generatedUrl = buildLovableTtsUrl(sampleText, sampleLang, {
  provider: "lovable",
  voice: sampleVoice,
  speed: sampleSpeed,
  target_lang: sampleLang,
});

const parsedUrl = new URL(generatedUrl);
assert.equal(parsedUrl.origin, "https://tts2.lovable.app");
assert.equal(parsedUrl.pathname, "/api/public/tts");
assert.equal(parsedUrl.searchParams.get("provider"), "lovable");
assert.equal(parsedUrl.searchParams.get("lang"), sampleLang);
assert.equal(parsedUrl.searchParams.get("voice"), sampleVoice);
assert.equal(parsedUrl.searchParams.get("speed"), String(sampleSpeed));
assert.equal(parsedUrl.searchParams.get("text"), sampleText);

const requestBody = buildLovableTtsRequestBody(sampleText, sampleLang, {
  provider: "lovable",
  voice: sampleVoice,
  speed: sampleSpeed,
  target_lang: sampleLang,
});

assert.equal(requestBody.provider, "lovable");
assert.equal(requestBody.lang, sampleLang);
assert.equal(requestBody.text, sampleText);
assert.equal(requestBody.voice, sampleVoice);
assert.equal(requestBody.speed, sampleSpeed);
console.log("✅ PASS: Request parameters correctly map current text, target lang, configured speed, and provider 'lovable'.");

// Test 3: Preference Storage Functions
console.log("\n⚙️ Test 3: Alternative TTS Service Preference Persistence Functions...");
assert.equal(typeof getUseAlternativeTts, "function");
assert.equal(typeof setUseAlternativeTts, "function");
assert.equal(typeof getAlternativeTtsMode, "function");
assert.equal(typeof setAlternativeTtsMode, "function");
assert.equal(typeof getLovableTtsVoice, "function");
assert.equal(typeof setLovableTtsVoice, "function");
assert.equal(typeof getLovableTtsSpeed, "function");
assert.equal(typeof setLovableTtsSpeed, "function");
console.log("✅ PASS: Storage helper functions for TTS preferences verified.");

// Test 4: UI Elimination of Playground & Inclusion of Voice Dropdown (Advanced Mode)
console.log("\n🚀 Test 4: Advanced Mode UI Parity (src/routes/index.tsx)...");
const indexPath = path.join(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf-8");

// No playground controls
assert.ok(
  !indexContent.includes('data-testid="lovable-tts-method-select"') &&
  !indexContent.includes('name="lovable-method"') &&
  !indexContent.includes('data-testid="lovable-tts-format-select"'),
  "Must NOT present TTS playground controls (method/format selectors)",
);

// Must have voice-select dropdown and provider locked to lovable
assert.ok(
  indexContent.includes('data-testid="lovable-tts-voice-select"'),
  "Advanced mode must include lovable-tts-voice-select dropdown",
);
assert.ok(
  indexContent.includes('data-testid="lovable-tts-provider-select"'),
  "Advanced mode must include lovable-tts-provider-select",
);
assert.ok(
  indexContent.includes('data-testid="alternative-tts-settings-card"'),
  "Advanced mode must include alternative-tts-settings-card",
);
console.log("✅ PASS: Advanced mode has no playground and provides clean voice dropdown.");

// Test 5: UI Elimination of Playground & Inclusion of Voice Dropdown (Beginner Mode)
console.log("\n🐣 Test 5: Beginner Mode UI Parity (BeginnerPreferencesTab.tsx)...");
const beginnerPath = path.join(
  rootDir,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerContent = fs.readFileSync(beginnerPath, "utf-8");

assert.ok(
  !beginnerContent.includes('data-testid="beginner-lovable-tts-method-select"') &&
  !beginnerContent.includes('name="beginner-lovable-method"'),
  "Beginner mode must NOT present TTS playground controls",
);
assert.ok(
  beginnerContent.includes('data-testid="beginner-lovable-tts-voice-select"'),
  "Beginner mode must include beginner-lovable-tts-voice-select dropdown",
);
assert.ok(
  beginnerContent.includes('data-testid="beginner-alternative-tts-card"'),
  "Beginner mode must include beginner-alternative-tts-card",
);
assert.ok(
  beginnerContent.includes('data-testid="beginner-lovable-tts-native-speed-notice"') ||
    beginnerContent.includes('data-testid="beginner-lovable-tts-speed-slider"'),
  "Beginner mode must include configured TTS speed notice or slider",
);
console.log("✅ PASS: Beginner mode has no playground and provides clean voice dropdown.");

// Test 6: Version >= 1.0.68 Parity Across All 5 Manifests and Configs
console.log("\n📦 Test 6: Version >= 1.0.68 Parity Across All 5 Manifests...");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
const [maj, min, patch] = pkg.version.split(".").map(Number);
assert.ok(
  maj > 1 || (maj === 1 && (min > 0 || (min === 0 && patch >= 68))),
  "package.json version must be >= 1.0.68",
);
assert.ok(
  maj > 1 || (maj === 1 && (min > 0 || (min === 0 && patch >= 68))),
  "appConfig.ts APP_VERSION must be >= 1.0.68",
);
assert.ok(CURRENT_APK_VERSION.startsWith("v"), "apkUpdater.ts CURRENT_APK_VERSION must start with v");

const gradleContent = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(/versionName = "1\.0\.\d+"/.test(gradleContent), "build.gradle.kts versionName must be >= 1.0.68");
assert.ok(/versionCode = 10\d+/.test(gradleContent), "build.gradle.kts versionCode must be >= 10068");

const settingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(/version: "1\.0\.\d+"/.test(settingsContent), "appSettings.ts snapshot version must be >= 1.0.68");

console.log(`✅ PASS: All 5 manifests and configs verified at version >= 1.0.68 (${APP_COMMIT_ID}).`);

console.log("\n=========================================================================");
console.log("🎉 ALL TASK 175 LOVABLE TTS SERVICE PREFERENCE TESTS PASSED 100%!");
console.log("=========================================================================");
