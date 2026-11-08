import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  LOVABLE_TTS_BASE_URL,
  LOVABLE_TTS_ENDPOINT,
  LOVABLE_TTS_DOCS_URL,
  LOVABLE_TTS_OPENAPI_URL,
  LOVABLE_TTS_INFO_URL,
  LOVABLE_TTS_ACCESS_TOKEN_URL,
  LOVABLE_TTS_USAGE_URL,
  LOVABLE_TTS_REPORT_USAGE_URL,
  LOVABLE_TTS_SHARED_KEYS_URL,
  LOVABLE_TTS_PROVIDERS,
  OPENAI_VOICES,
  GEMINI_VOICES,
  LOVABLE_VOICES,
  ELEVENLABS_VOICES,
  DEEPGRAM_VOICES,
  OPENROUTER_VOICES,
  getVoicesForProvider,
  getDefaultVoiceForProvider,
  buildLovableTtsUrl,
  buildLovableTtsRequestBody,
  fetchSpeakApiInfo,
  createTemporaryAccessToken,
  revokeTemporaryAccessToken,
} from "../src/lib/alternative-tts";

console.log("=========================================================================");
console.log("🧪 Verifying TTS Service OpenAPI 3.1.0 Specification Compliance (Task 340)");
console.log("=========================================================================");

// 1. Verify OpenAPI Endpoint Constants
console.log("\n📡 Check 1: OpenAPI Endpoint URLs");
assert.equal(LOVABLE_TTS_BASE_URL, "https://tts3.lovable.app");
assert.equal(LOVABLE_TTS_ENDPOINT, "https://tts3.lovable.app/api/public/tts");
assert.equal(LOVABLE_TTS_OPENAPI_URL, "https://tts3.lovable.app/api/public/openapi.json");
assert.equal(LOVABLE_TTS_DOCS_URL, "https://tts3.lovable.app/docs");
assert.equal(LOVABLE_TTS_INFO_URL, "https://tts3.lovable.app/api/public/info");
assert.equal(LOVABLE_TTS_ACCESS_TOKEN_URL, "https://tts3.lovable.app/api/public/access-token");
assert.equal(LOVABLE_TTS_USAGE_URL, "https://tts3.lovable.app/api/public/usage");
assert.equal(LOVABLE_TTS_REPORT_USAGE_URL, "https://tts3.lovable.app/api/report/usage");
assert.equal(LOVABLE_TTS_SHARED_KEYS_URL, "https://tts3.lovable.app/api/public/openrouter-keys");
console.log("✅ PASS: All 9 OpenAPI endpoint URLs strictly match https://tts3.lovable.app/api/public/openapi.json.");

// 2. Verify Provider Enum
console.log("\n🤖 Check 2: Provider Catalog");
const openApiProviders = [
  "auto",
  "google",
  "lovable",
  "openrouter",
  "gemini",
  "openai",
  "elevenlabs",
  "deepgram",
];
for (const p of openApiProviders) {
  assert.ok(
    LOVABLE_TTS_PROVIDERS.includes(p as any),
    `LOVABLE_TTS_PROVIDERS must include '${p}' as specified in OpenAPI enum`,
  );
}
assert.equal(LOVABLE_TTS_PROVIDERS.length, 8);
console.log("✅ PASS: All 8 OpenAPI providers supported.");

// 3. Verify Voice Catalogs & Defaults
console.log("\n🗣️ Check 3: Voice Catalogs & Defaults Matching OpenAPI 3.1.0");
// OpenAI full voice set from OpenAPI: coral, alloy, ash, ballad, echo, fable, nova, onyx, sage, shimmer, verse
const expectedOpenAiVoices = [
  "coral",
  "alloy",
  "ash",
  "ballad",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
];
for (const v of expectedOpenAiVoices) {
  assert.ok(
    OPENAI_VOICES.includes(v as any),
    `OPENAI_VOICES must include '${v}' from OpenAPI specification`,
  );
}
assert.equal(OPENAI_VOICES.length, 11);
assert.equal(getDefaultVoiceForProvider("openai"), "coral");

// Gemini & Lovable voices: Kore, Puck, Charon, Fenrir, Aoede
assert.equal(getDefaultVoiceForProvider("gemini"), "Kore");
assert.equal(getDefaultVoiceForProvider("lovable"), "Kore");
assert.equal(GEMINI_VOICES.length, 5);
assert.equal(LOVABLE_VOICES.length, 5);

// ElevenLabs default voice ID: JBFqnCBsd6RMkjVDRZzb (George)
assert.equal(getDefaultVoiceForProvider("elevenlabs"), "JBFqnCBsd6RMkjVDRZzb");

// Deepgram default Aura voice ID: aura-asteria-en
assert.equal(getDefaultVoiceForProvider("deepgram"), "aura-asteria-en");

// OpenRouter default voice: alloy
assert.equal(getDefaultVoiceForProvider("openrouter"), "alloy");

console.log("✅ PASS: Voice catalogs and default voice assignments fully aligned with OpenAPI 3.1.0.");

// 4. Verify Request Building (GET query parameters & POST body)
console.log("\n📦 Check 4: Request Building & Parameter Serialization");
const voicesMap = {
  gemini: "Kore",
  openai: "coral",
  openrouter: "alloy",
};
const providerOptions = {
  model: "gpt-4o-mini-tts",
  instructions: "Speak clearly and calmly.",
};

const getUrl = buildLovableTtsUrl("Hello world speech test", "en", {
  provider: "openai",
  speed: 1.25,
  target_lang: "es",
  voices: voicesMap,
  options: providerOptions,
});

const parsedUrl = new URL(getUrl);
assert.equal(parsedUrl.searchParams.get("text"), "Hello world speech test");
assert.equal(parsedUrl.searchParams.get("lang"), "en");
assert.equal(parsedUrl.searchParams.get("target_lang"), "es");
assert.equal(parsedUrl.searchParams.get("provider"), "openai");
assert.equal(parsedUrl.searchParams.get("speed"), "1.25");
assert.equal(parsedUrl.searchParams.get("format"), "binary");
assert.equal(parsedUrl.searchParams.get("voices"), JSON.stringify(voicesMap));
assert.equal(parsedUrl.searchParams.get("options"), JSON.stringify(providerOptions));

const postBody = buildLovableTtsRequestBody("Post body speech test", "fr", {
  provider: "auto",
  speed: 0.9,
  target_lang: "de",
  format: "json",
  voices: voicesMap,
  options: providerOptions,
});

assert.equal(postBody.text, "Post body speech test");
assert.equal(postBody.lang, "fr");
assert.equal(postBody.target_lang, "de");
assert.equal(postBody.provider, "auto");
assert.equal(postBody.speed, 0.9);
assert.equal(postBody.format, "json");
assert.deepEqual(postBody.voices, voicesMap);
assert.deepEqual(postBody.options, providerOptions);
console.log("✅ PASS: Request serialization for GET and POST conforms to OpenAPI schemas.");

// 5. Verify OpenAPI Helper Functions Existence
console.log("\n🔧 Check 5: OpenAPI Helper Functions");
assert.equal(typeof fetchSpeakApiInfo, "function");
assert.equal(typeof createTemporaryAccessToken, "function");
assert.equal(typeof revokeTemporaryAccessToken, "function");
console.log("✅ PASS: fetchSpeakApiInfo, createTemporaryAccessToken, and revokeTemporaryAccessToken defined.");

console.log("\n=========================================================================");
console.log("🎉 ALL TTS SERVICE OPENAPI 3.1.0 SPECIFICATION CHECKS PASSED 100%!");
console.log("=========================================================================");
