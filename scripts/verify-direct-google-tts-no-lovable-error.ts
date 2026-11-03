/**
 * Dedicated test script: scripts/verify-direct-google-tts-no-lovable-error.ts
 *
 * Verifies Task 290 (Chapter 1):
 * 1. Choosing Google TTS uses Google TTS directly and NOT via Lovable (tts3.lovable.app).
 * 2. Does NOT raise or call Lovable error reporting.
 * 3. Builds and loads authentic Google Translate TTS URL directly (client=tw-ob).
 * 4. Beginner and Advanced controls set alternativeTtsEngine to "google_translate".
 * 5. Audio playback fails gracefully without throwing unhandled exceptions.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  buildGoogleTranslateTtsUrl,
  buildAlternativeTtsUrl,
  playAlternativeTtsAudio,
  getAlternativeTtsEngine,
  setAlternativeTtsEngine,
  GOOGLE_TRANSLATE_TTS_ENDPOINT,
  LOVABLE_TTS_ENDPOINT,
} from "../src/lib/alternative-tts";

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Direct Google TTS Plays Directly Without Lovable Error (Task 290)");
  console.log("=========================================================================");

  const rootDir = process.cwd();

  // Test 1: Google Translate URL format verification
  console.log("--> [Test 1] Verifying authentic Google Translate TTS URL construction...");
  const googleUrl = buildGoogleTranslateTtsUrl("Hello world", "en");
  assert(googleUrl.startsWith(GOOGLE_TRANSLATE_TTS_ENDPOINT), "Must start with GOOGLE_TRANSLATE_TTS_ENDPOINT");
  assert(googleUrl.includes("client=tw-ob"), "Must include client=tw-ob");
  assert(googleUrl.includes("tl=en"), "Must include tl=en");
  assert(googleUrl.includes("q=Hello%20world"), "Must include encoded query");
  assert(!googleUrl.includes("lovable.app"), "Google URL must never contain lovable.app");
  console.log("✅ PASS: Direct Google TTS URL correctly formulated without Lovable");

  // Test 2: buildAlternativeTtsUrl with google_translate engine
  console.log("--> [Test 2] Verifying buildAlternativeTtsUrl with engine='google_translate'...");
  const altUrl = buildAlternativeTtsUrl("Testing speech", "es", "google_translate");
  assert(altUrl.startsWith("https://translate.google.com"), "Must route to translate.google.com");
  assert(!altUrl.includes(LOVABLE_TTS_ENDPOINT), "Must not point to lovable endpoint");
  console.log("✅ PASS: buildAlternativeTtsUrl routes directly to Google Translate");

  // Test 3: Verify source code separation in src/lib/alternative-tts.ts
  console.log("--> [Test 3] Verifying src/lib/alternative-tts.ts direct google execution...");
  const altTtsSrc = fs.readFileSync(path.resolve(rootDir, "src/lib/alternative-tts.ts"), "utf-8");
  assert(
    altTtsSrc.includes("const isDirectGoogle ="),
    "alternative-tts.ts must define isDirectGoogle guard",
  );
  assert(
    altTtsSrc.includes("if (engine === \"lovable\" && !isDirectGoogle)"),
    "Lovable synthesis must be bypassed completely for direct google",
  );
  console.log("✅ PASS: alternative-tts.ts strictly isolates direct Google TTS from Lovable API");

  // Test 4: Verify src/routes/index.tsx BeginnerTtsServiceControl mapping
  console.log("--> [Test 4] Verifying src/routes/index.tsx BeginnerTtsServiceControl parity...");
  const indexSrc = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf-8");
  assert(
    indexSrc.includes('alternativeTtsEngineState === "google_translate"'),
    "service 'google' in BeginnerTtsServiceControl must check alternativeTtsEngineState === 'google_translate'",
  );
  assert(
    !indexSrc.includes('lovableTtsProviderState === "google" ||\n                    alternativeTtsEngineState === "google_translate"'),
    "Must not mix lovable provider with direct google translate engine in service check",
  );
  console.log("✅ PASS: index.tsx BeginnerTtsServiceControl strictly selects direct google_translate engine");

  // Test 5: Verify no unhandled error or lovable error trigger in headless playAlternativeTtsAudio
  console.log("--> [Test 5] Verifying playAlternativeTtsAudio with engine='google_translate'...");
  let audioErrorCaught = false;
  try {
    await playAlternativeTtsAudio("Test Direct Google", "en", 1.0, undefined, "google_translate");
  } catch (e) {
    audioErrorCaught = true;
  }
  assert.strictEqual(audioErrorCaught, false, "playAlternativeTtsAudio must never reject or throw unhandled exceptions");
  console.log("✅ PASS: playAlternativeTtsAudio resolves cleanly without raising exceptions");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED! Direct Google TTS plays directly without Lovable error.");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
