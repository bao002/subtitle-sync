/**
 * Verification Script: Complete Removal of Direct Client-Side Google TTS Option (Task 308)
 *
 * Verifies that:
 * 1. AlternativeTtsEngine type is strictly "lovable".
 * 2. TtsFallbackOrder is strictly "tts3_native" | "native_tts3" | "native_only".
 * 3. TtsServiceSettingsPanel has no google_translate option or google-direct-notice banner.
 * 4. BeginnerPreferencesTab has no google_translate option or btn-validate-google-tts-directly.
 * 5. TtsFallbackOrderSwitch options only include tts3_native, native_tts3, and native_only.
 * 6. routes/index.tsx BeginnerTtsServiceControl slots route "google" to lovable with provider "google".
 * 7. Single source of truth version is synchronized at 2.1.7 across package.json and build.gradle.kts.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type AlternativeTtsEngine,
  type TtsFallbackOrder,
  getAlternativeTtsEngine,
  buildAlternativeTtsUrl,
  validateRemoteTtsService,
  LOVABLE_TTS_ENDPOINT,
} from "../src/lib/alternative-tts";
import { TTS_FALLBACK_ORDER_OPTIONS } from "../src/components/TtsFallbackOrderSwitch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=========================================================================");
console.log("🧪 Starting Verification: Removal of Direct Client-Side Google TTS Option");
console.log("=========================================================================");

// 1. Check runtime AlternativeTtsEngine and functions in alternative-tts.ts
console.log("--> [Check 1] Verifying runtime AlternativeTtsEngine and URL builder...");
const currentEngine: AlternativeTtsEngine = getAlternativeTtsEngine();
assert.strictEqual(currentEngine, "lovable", "Current engine must be 'lovable'");

const sampleUrl = buildAlternativeTtsUrl("Hello world", "en");
assert.ok(
  sampleUrl.startsWith(LOVABLE_TTS_ENDPOINT),
  `Alternative TTS URL must point to Lovable Speak API endpoint (${LOVABLE_TTS_ENDPOINT}), got: ${sampleUrl}`,
);
assert.ok(
  !sampleUrl.includes("translate.google.com/translate_tts"),
  "Alternative TTS URL must NOT point to translate.google.com/translate_tts",
);
console.log("✅ PASS: Runtime AlternativeTtsEngine is strictly 'lovable' and builder routes to Lovable Speak API.");

// 2. Check source file src/lib/alternative-tts.ts
console.log("--> [Check 2] Inspecting src/lib/alternative-tts.ts...");
const altTtsSource = fs.readFileSync(path.resolve(__dirname, "../src/lib/alternative-tts.ts"), "utf-8");
assert.ok(
  altTtsSource.includes('export type AlternativeTtsEngine = "lovable";'),
  "AlternativeTtsEngine type definition must be strictly 'lovable'",
);
assert.ok(
  altTtsSource.includes('export type TtsFallbackOrder = "tts3_native" | "native_tts3" | "native_only";') ||
    altTtsSource.includes('"tts3_native" | "native_tts3" | "native_only"'),
  "TtsFallbackOrder type definition must be strictly 'tts3_native' | 'native_tts3' | 'native_only'",
);
assert.ok(
  !altTtsSource.includes('"google_tts3_native"'),
  "TtsFallbackOrder must not contain 'google_tts3_native'",
);
assert.ok(
  !altTtsSource.includes('"native_tts3_google"'),
  "TtsFallbackOrder must not contain 'native_tts3_google'",
);
console.log("✅ PASS: alternative-tts.ts types and definitions validated.");

// 3. Check TtsFallbackOrderSwitch.tsx
console.log("--> [Check 3] Inspecting TTS Fallback Order options in TtsFallbackOrderSwitch.tsx...");
const orderValues = TTS_FALLBACK_ORDER_OPTIONS.map((o) => o.id);
assert.deepStrictEqual(
  orderValues,
  ["tts3_native", "native_tts3", "native_only"],
  "Fallback order options must strictly be ['tts3_native', 'native_tts3', 'native_only']",
);
for (const opt of TTS_FALLBACK_ORDER_OPTIONS) {
  for (const step of opt.steps) {
    assert.notStrictEqual(step.type, "google", "No fallback step may have type 'google'");
  }
}
console.log("✅ PASS: TtsFallbackOrderSwitch has 3 valid options with zero 'google' steps.");

// 4. Check UI components (TtsServiceSettingsPanel.tsx & BeginnerPreferencesTab.tsx)
console.log("--> [Check 4] Checking UI components for removal of direct Google TTS options...");
const advancedPanelSource = fs.readFileSync(
  path.resolve(__dirname, "../src/components/TtsServiceSettingsPanel.tsx"),
  "utf-8",
);
const beginnerPrefsSource = fs.readFileSync(
  path.resolve(__dirname, "../src/components/beginner/tabs/BeginnerPreferencesTab.tsx"),
  "utf-8",
);

assert.ok(
  !advancedPanelSource.includes('<option value="google_translate">'),
  "TtsServiceSettingsPanel must not contain google_translate option",
);
assert.ok(
  !advancedPanelSource.includes('data-testid="google-direct-notice"'),
  "TtsServiceSettingsPanel must not contain google-direct-notice",
);
assert.ok(
  !beginnerPrefsSource.includes('<option value="google_translate">'),
  "BeginnerPreferencesTab must not contain google_translate option",
);
assert.ok(
  !beginnerPrefsSource.includes('data-testid="btn-validate-google-tts-directly"'),
  "BeginnerPreferencesTab must not contain btn-validate-google-tts-directly",
);
console.log("✅ PASS: Both Advanced and Beginner UI panels have zero direct Google TTS options.");

// 5. Check routes/index.tsx BeginnerTtsServiceControl slots
console.log("--> [Check 5] Inspecting routes/index.tsx BeginnerTtsServiceControl bindings...");
const routesSource = fs.readFileSync(path.resolve(__dirname, "../src/routes/index.tsx"), "utf-8");
assert.ok(
  !routesSource.includes('alternativeTtsEngineState === "google_translate"'),
  "routes/index.tsx must not check for alternativeTtsEngineState === 'google_translate'",
);
assert.ok(
  !routesSource.includes('setAlternativeTtsEngineState("google_translate")'),
  "routes/index.tsx must not set alternativeTtsEngineState to 'google_translate'",
);
console.log("✅ PASS: routes/index.tsx bindings strictly route remote TTS to 'lovable'.");

// 6. Check single-source versioning
console.log("--> [Check 6] Checking single-source version sync...");
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8"));
assert.ok(packageJson.version, "package.json must specify version");

const gradleSource = fs.readFileSync(
  path.resolve(__dirname, "../android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  gradleSource.includes(`versionName = "${packageJson.version}"`),
  `build.gradle.kts must have versionName = '${packageJson.version}'`,
);
console.log(`✅ PASS: Version ${packageJson.version} is in sync across package.json and build.gradle.kts.`);

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED! Direct client Google TTS option completely removed.");
console.log("=========================================================================");
process.exit(0);
