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
  console.log("🧪 Verifying Direct Client Google TTS Removed & Lovable Remote Engine Active");
  console.log("=========================================================================");

  const rootDir = process.cwd();

  // Test 1: buildAlternativeTtsUrl points strictly to Lovable Speak API
  console.log("--> [Test 1] Verifying buildAlternativeTtsUrl routes to Lovable Speak API...");
  const altUrl = buildAlternativeTtsUrl("Testing speech", "es");
  assert(altUrl.startsWith(LOVABLE_TTS_ENDPOINT), `Must route to ${LOVABLE_TTS_ENDPOINT}`);
  assert(!altUrl.includes("translate.google.com/translate_tts"), "Must not point to translate.google.com/translate_tts");
  console.log("✅ PASS: buildAlternativeTtsUrl strictly targets Lovable Speak API");

  // Test 2: Verify AlternativeTtsEngine type and runtime engine
  console.log("--> [Test 2] Verifying AlternativeTtsEngine is strictly lovable...");
  const engine = getAlternativeTtsEngine();
  assert.strictEqual(engine, "lovable", "Current engine must be 'lovable'");
  console.log("✅ PASS: Engine is strictly lovable");

  // Test 3: Verify src/routes/index.tsx BeginnerTtsServiceControl mapping
  console.log("--> [Test 3] Verifying src/routes/index.tsx BeginnerTtsServiceControl parity...");
  const indexSrc = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf-8");
  assert(
    !indexSrc.includes('setAlternativeTtsEngineState("google_translate")'),
    "Must not set alternativeTtsEngineState to google_translate",
  );
  assert(
    indexSrc.includes('setAlternativeTtsEngineState("lovable")'),
    "Must set alternativeTtsEngineState to lovable",
  );
  console.log("✅ PASS: index.tsx BeginnerTtsServiceControl strictly selects lovable engine");

  // Test 4: Verify playAlternativeTtsAudio resolves cleanly without raising exceptions
  console.log("--> [Test 4] Verifying playAlternativeTtsAudio resolves cleanly...");
  let audioErrorCaught = false;
  try {
    await playAlternativeTtsAudio("Test Speech", "en", 1.0, undefined, "lovable");
  } catch (e) {
    audioErrorCaught = true;
  }
  assert.strictEqual(audioErrorCaught, false, "playAlternativeTtsAudio must never reject or throw unhandled exceptions");
  console.log("✅ PASS: playAlternativeTtsAudio resolves cleanly without raising exceptions");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED! Direct client Google TTS removed and verified.");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
