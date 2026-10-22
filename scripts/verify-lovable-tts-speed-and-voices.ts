import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  LOVABLE_TTS_BASE_URL,
  LOVABLE_TTS_ENDPOINT,
  LOVABLE_TTS_OPENAPI_URL,
  LOVABLE_TTS_PROVIDERS,
  LOVABLE_VOICES,
  OPENROUTER_VOICES,
  buildLovableTtsUrl,
  buildLovableTtsRequestBody,
  getLovableTtsSpeed,
  setLovableTtsSpeed,
  getLovableTtsOptions,
  setLovableTtsOptions,
  getLovableTtsVoice,
  setLovableTtsVoice,
} from "../src/lib/alternative-tts";
import { APP_VERSION, APP_VERSION_DESCRIPTION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("=========================================================================");
console.log("🧪 Verifying Lovable Speak API Extended Features: Speed, Voices & Options");
console.log("=========================================================================");

const rootDir = process.cwd();

// Section 1: Voice Catalogs & Extended Voices
console.log("\n🎙️ Section 1: Voice Catalogs & Extended Voice Types");
assert.ok(
  LOVABLE_VOICES.includes("Charon" as any),
  "LOVABLE_VOICES must include Gemini voice 'Charon'",
);
assert.ok(
  LOVABLE_VOICES.includes("Kore" as any),
  "LOVABLE_VOICES must include Gemini voice 'Kore'",
);
assert.ok(
  LOVABLE_VOICES.includes("Puck" as any),
  "LOVABLE_VOICES must include Gemini voice 'Puck'",
);
assert.ok(
  LOVABLE_VOICES.includes("Fenrir" as any),
  "LOVABLE_VOICES must include Gemini voice 'Fenrir'",
);
assert.ok(
  LOVABLE_VOICES.includes("Aoede" as any),
  "LOVABLE_VOICES must include Gemini voice 'Aoede'",
);

assert.ok(OPENROUTER_VOICES.includes("alloy" as any), "OPENROUTER_VOICES must include 'alloy'");
assert.ok(OPENROUTER_VOICES.includes("echo" as any), "OPENROUTER_VOICES must include 'echo'");
assert.ok(OPENROUTER_VOICES.includes("fable" as any), "OPENROUTER_VOICES must include 'fable'");
assert.ok(OPENROUTER_VOICES.includes("onyx" as any), "OPENROUTER_VOICES must include 'onyx'");
assert.ok(OPENROUTER_VOICES.includes("nova" as any), "OPENROUTER_VOICES must include 'nova'");
assert.ok(OPENROUTER_VOICES.includes("shimmer" as any), "OPENROUTER_VOICES must include 'shimmer'");

// Check custom voice forwarding
const customVoiceUrl = buildLovableTtsUrl("Custom voice test", "en", {
  provider: "lovable",
  voice: "Zephyr",
});
const customVoiceParsed = new URL(customVoiceUrl);
assert.equal(
  customVoiceParsed.searchParams.get("voice"),
  "Zephyr",
  "Must pass custom voice name in query",
);

const customVoiceBody = buildLovableTtsRequestBody("Custom voice test", "en", {
  provider: "lovable",
  voice: "Zephyr",
});
assert.equal(customVoiceBody.voice, "Zephyr", "Must pass custom voice name in POST body");
console.log(
  "✅ PASS: Gemini voices (including Charon), OpenAI voices, and custom voices verified.",
);

// Section 2: Speed Multiplier (0.25 - 4.0)
console.log("\n⚡ Section 2: TTS Speed Multiplier Parameter (0.25 - 4.0)");
// Default speed (1.0) should not pollute URL unnecessarily
const defaultSpeedUrl = buildLovableTtsUrl("Default speed test", "en", { speed: 1.0 });
const defaultSpeedParsed = new URL(defaultSpeedUrl);
assert.equal(
  defaultSpeedParsed.searchParams.get("speed"),
  null,
  "Default speed 1.0 should omit redundant param",
);

// Non-default speed (0.75x) in GET URL
const speed075Url = buildLovableTtsUrl("Speed 0.75 test", "en", { speed: 0.75 });
const speed075Parsed = new URL(speed075Url);
assert.equal(
  speed075Parsed.searchParams.get("speed"),
  "0.75",
  "Must serialize speed 0.75 in query",
);

// Non-default speed (2.5x) in POST body
const speed25Body = buildLovableTtsRequestBody("Speed 2.5 test", "en", { speed: 2.5 });
assert.equal(speed25Body.speed, 2.5, "Must include numeric speed 2.5 in POST body");

// Range clamping: minimum 0.25
const minClampedUrl = buildLovableTtsUrl("Min speed test", "en", { speed: 0.1 });
const minClampedParsed = new URL(minClampedUrl);
assert.equal(minClampedParsed.searchParams.get("speed"), "0.25", "Must clamp below 0.25 to 0.25");

// Range clamping: maximum 4.0
const maxClampedBody = buildLovableTtsRequestBody("Max speed test", "en", { speed: 8.0 });
assert.equal(maxClampedBody.speed, 4.0, "Must clamp above 4.0 to 4.0");

// Persistence helpers
setLovableTtsSpeed(1.25);
assert.equal(getLovableTtsSpeed(), 1.25, "getLovableTtsSpeed must return 1.25");
setLovableTtsSpeed(1.0);
console.log("✅ PASS: Speed parameter serialization, clamping, and storage verified.");

// Section 3: Provider Options Parameter
console.log("\n🔧 Section 3: Provider-Specific Options Parameter");
const optsObj = { model: "google/gemini-2.0-flash" };
const optsJson = JSON.stringify(optsObj);

const optionsGetUrl = buildLovableTtsUrl("Options test", "en", { options: optsObj });
const optionsGetParsed = new URL(optionsGetUrl);
assert.equal(
  optionsGetParsed.searchParams.get("options"),
  optsJson,
  "Must serialize options JSON in query",
);

const optionsPostBody = buildLovableTtsRequestBody("Options test", "en", { options: optsJson });
assert.deepEqual(
  optionsPostBody.options,
  optsObj,
  "Must parse JSON string into object in body.options",
);

setLovableTtsOptions('{"pacing": "slow"}');
assert.equal(getLovableTtsOptions(), '{"pacing": "slow"}');
setLovableTtsOptions("");
console.log("✅ PASS: Options query encoding, body parsing, and storage verified.");

// Section 4: Absolute UI Parity Between Advanced & Beginner Modes
console.log("\n🎨 Section 4: Absolute UI Parity in Advanced & Beginner Modes");
const indexPath = path.join(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf-8");
const beginnerPath = path.join(rootDir, "src/components/beginner/tabs/BeginnerPreferencesTab.tsx");
const beginnerContent = fs.readFileSync(beginnerPath, "utf-8");

// Advanced Mode Controls
assert.ok(
  indexContent.includes('data-testid="lovable-tts-speed-slider"'),
  "Advanced mode must have speed slider",
);
assert.ok(
  indexContent.includes('data-testid="lovable-tts-speed-val"'),
  "Advanced mode must display speed value",
);
assert.ok(
  indexContent.includes('data-testid="lovable-tts-custom-voice-input"'),
  "Advanced mode must have custom voice input",
);
assert.ok(
  indexContent.includes('data-testid="lovable-tts-options-input"'),
  "Advanced mode must have options input",
);

// Beginner Mode Controls
assert.ok(
  beginnerContent.includes('data-testid="beginner-lovable-tts-speed-slider"'),
  "Beginner mode must have speed slider",
);
assert.ok(
  beginnerContent.includes('data-testid="beginner-lovable-tts-speed-val"'),
  "Beginner mode must display speed value",
);
assert.ok(
  beginnerContent.includes('data-testid="beginner-lovable-tts-custom-voice-input"'),
  "Beginner mode must have custom voice input",
);
assert.ok(
  beginnerContent.includes('data-testid="beginner-lovable-tts-options-input"'),
  "Beginner mode must have options input",
);
console.log("✅ PASS: 100% UI parity between Advanced and Beginner mode controls verified.");

// Section 5: Version 1.0.67 Verification
console.log("\n📦 Section 5: Version 1.0.67 Across All Targets");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert.equal(pkg.version, "1.0.67", "package.json must be 1.0.67");
assert.equal(APP_VERSION, "1.0.67", "appConfig.ts APP_VERSION must be 1.0.67");
assert.equal(CURRENT_APK_VERSION, "v1.0.67", "apkUpdater.ts CURRENT_APK_VERSION must be v1.0.67");

const gradleContent = fs.readFileSync(
  path.join(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  gradleContent.includes('versionName = "1.0.67"'),
  "build.gradle.kts must have versionName 1.0.67",
);
assert.ok(
  gradleContent.includes("versionCode = 10067"),
  "build.gradle.kts must have versionCode 10067",
);

const settingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(
  settingsContent.includes('version: "1.0.67"'),
  "appSettings.ts must have snapshot version 1.0.67",
);
console.log("✅ PASS: Version 1.0.67 verified across all 5 project targets.");

console.log("\n=========================================================================");
console.log("🎉 ALL LOVABLE SPEAK API EXTENDED FEATURE ASSERTIONS PASSED 100%!");
console.log("=========================================================================");
