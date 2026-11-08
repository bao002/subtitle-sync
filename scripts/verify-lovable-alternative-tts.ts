import assert from "node:assert/strict";
import {
  LOVABLE_TTS_BASE_URL,
  LOVABLE_TTS_ENDPOINT,
  LOVABLE_TTS_OPENAPI_URL,
  GOOGLE_TRANSLATE_TTS_ENDPOINT,
  normalizeLanguageCode,
  buildLovableTtsUrl,
  buildGoogleTranslateTtsUrl,
  buildAlternativeTtsUrl,
  getUseAlternativeTts,
  setUseAlternativeTts,
  getAlternativeTtsMode,
  setAlternativeTtsMode,
  getAlternativeTtsEngine,
  setAlternativeTtsEngine,
  getLovableTtsProvider,
  setLovableTtsProvider,
  getLovableTtsVoice,
  setLovableTtsVoice,
} from "../src/lib/alternative-tts";

console.log("=== Verifying Lovable Speak API Alternative TTS Service ===");

// 1. Verify OpenAPI URLs and Endpoints
console.log("1. Checking API constants and endpoints...");
assert.equal(LOVABLE_TTS_BASE_URL, "https://tts3.lovable.app");
assert.equal(LOVABLE_TTS_ENDPOINT, "https://tts3.lovable.app/api/public/tts");
assert.equal(
  LOVABLE_TTS_OPENAPI_URL,
  "https://tts3.lovable.app/api/public/openapi.json",
  "Must point to the exact OpenAPI specification requested by user",
);
assert.equal(GOOGLE_TRANSLATE_TTS_ENDPOINT, "https://translate.google.com/translate_tts");

// 2. Language Code Normalization
console.log("2. Checking language code normalization...");
assert.equal(normalizeLanguageCode("en"), "en");
assert.equal(normalizeLanguageCode("en-US"), "en");
assert.equal(normalizeLanguageCode("he"), "he");
assert.equal(normalizeLanguageCode("iw"), "he", "Must convert legacy Hebrew 'iw' to 'he'");
assert.equal(normalizeLanguageCode("in"), "id", "Must convert legacy Indonesian 'in' to 'id'");
assert.equal(normalizeLanguageCode("ji"), "yi", "Must convert legacy Yiddish 'ji' to 'yi'");
assert.equal(normalizeLanguageCode("zh-CN"), "zh-CN");
assert.equal(normalizeLanguageCode("zh-TW"), "zh-TW");

// 3. Lovable Speak API URL Generation
console.log("3. Checking Lovable Speak API URL generation...");
const testUrl = buildLovableTtsUrl("Hello world", "en");
const parsed = new URL(testUrl);
assert.equal(parsed.origin, "https://tts3.lovable.app");
assert.equal(parsed.pathname, "/api/public/tts");
assert.equal(parsed.searchParams.get("text"), "Hello world");
assert.equal(parsed.searchParams.get("lang"), "en");
assert.equal(parsed.searchParams.get("format"), "binary");

// 4. Custom options (provider, voice, target_lang)
console.log("4. Checking custom provider, voice, and target_lang parameters...");
const customUrl = buildLovableTtsUrl("Subtitle phrase", "es", {
  provider: "lovable",
  voice: "Puck",
  target_lang: "fr",
  format: "binary",
});
const customParsed = new URL(customUrl);
assert.equal(customParsed.searchParams.get("provider"), "lovable");
// Note: per Task 310 / Prompt 80 prompt policy, voice parameter is suppressed in queries to TTS service
assert.equal(customParsed.searchParams.get("voice"), null);
assert.equal(customParsed.searchParams.get("target_lang"), "fr");
assert.equal(customParsed.searchParams.get("format"), "binary");

// 5. Google Translate TTS URL Generation (Deprecated - returns empty string)
console.log("5. Checking Google Translate TTS URL generation (deprecated)...");
const gUrl = buildGoogleTranslateTtsUrl("Hello world", "en");
assert.equal(gUrl, "", "Direct Google Translate TTS is deprecated and returns empty string");

// 6. Alternative TTS Engine Dispatch
console.log("6. Checking engine dispatch logic...");
const lovableEngineUrl = buildAlternativeTtsUrl("Sample phrase", "he");
assert.ok(lovableEngineUrl.startsWith("https://tts3.lovable.app/api/public/tts"));
assert.ok(lovableEngineUrl.includes("lang=he"));

// 7. Text Length Clamping (OpenAPI spec: max 5000 chars)
console.log("7. Checking text truncation up to OpenAPI 5000 limit...");
const longText = "a".repeat(6000);
const clampedUrl = buildLovableTtsUrl(longText, "en");
const clampedParsed = new URL(clampedUrl);
assert.equal(clampedParsed.searchParams.get("text")?.length, 5000);

// 8. Storage helpers in Node environment (graceful fallbacks)
console.log("8. Checking storage helper safety in headless environment...");
assert.equal(typeof getUseAlternativeTts(), "boolean");
assert.equal(typeof getAlternativeTtsMode(), "string");
assert.equal(typeof getAlternativeTtsEngine(), "string");
assert.equal(typeof getLovableTtsProvider(), "string");
assert.equal(typeof getLovableTtsVoice(), "string");

// Check setters don't throw in node
setUseAlternativeTts(true);
setAlternativeTtsMode("always");
setAlternativeTtsEngine("lovable");
setLovableTtsProvider("google");
setLovableTtsVoice("Alloy");

console.log("✅ All Lovable Speak API Alternative TTS assertions PASSED!");
