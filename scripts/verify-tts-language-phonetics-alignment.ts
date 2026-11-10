import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildLovableTtsUrl,
  buildLovableTtsRequestBody,
  setLovableTtsTargetLang,
} from "../src/lib/alternative-tts";
import { getSampleTextForLanguage, matchesLanguageCode } from "../src/utils/speechVoiceUtils";

console.log("=========================================================================");
console.log("🧪 Verifying Task 369: TTS Service Language Phonetic Alignment");
console.log("=========================================================================");

// Section 1: Verify getSampleTextForLanguage returns authentic native text
console.log("\n🌐 Section 1: Validating Language-Matched Sample Text Generation");
assert.equal(typeof getSampleTextForLanguage, "function", "getSampleTextForLanguage must be a function");

const hebrewSample = getSampleTextForLanguage("he");
assert.ok(/[\u0590-\u05FF]/.test(hebrewSample), "Hebrew sample text must contain authentic Hebrew characters");

const spanishSample = getSampleTextForLanguage("es");
assert.ok(spanishSample.includes("Hola") || spanishSample.includes("prueba"), "Spanish sample text must be in Spanish");

const arabicSample = getSampleTextForLanguage("ar");
assert.ok(/[\u0600-\u06FF]/.test(arabicSample), "Arabic sample text must contain authentic Arabic characters");

const russianSample = getSampleTextForLanguage("ru");
assert.ok(/[\u0400-\u04FF]/.test(russianSample), "Russian sample text must contain authentic Cyrillic characters");

const englishSample = getSampleTextForLanguage("en");
assert.ok(englishSample.toLowerCase().includes("subtitle") || englishSample.toLowerCase().includes("hello"), "English sample must be in English");

console.log("✅ PASS: Language-matched sample sentences validated for multiple languages.");

// Section 2: Verify buildLovableTtsUrl and buildLovableTtsRequestBody do NOT leak global target_lang
console.log("\n🎯 Section 2: Validating Remote TTS Requests Free of Global target_lang Pollution");

// Simulate a stored target language in settings
setLovableTtsTargetLang("he");

// 2a. Speaking English text without explicit target_lang
const urlEn = buildLovableTtsUrl("Hello world", "en");
const parsedEn = new URL(urlEn);
assert.equal(parsedEn.searchParams.get("lang"), "en", "Text language must be 'en'");
assert.equal(
  parsedEn.searchParams.get("target_lang"),
  null,
  "buildLovableTtsUrl must NOT inject global target_lang when not explicitly requested",
);

// 2b. Speaking Spanish text without explicit target_lang
const bodyEs = buildLovableTtsRequestBody("Hola mundo", "es");
assert.equal(bodyEs.lang, "es", "Text language must be 'es'");
assert.equal(
  bodyEs.target_lang,
  undefined,
  "buildLovableTtsRequestBody must NOT inject global target_lang when not explicitly requested",
);

// 2c. Explicit target_lang translation request (should be included)
const urlWithTarget = buildLovableTtsUrl("Hello world", "en", { target_lang: "fr" });
const parsedWithTarget = new URL(urlWithTarget);
assert.equal(parsedWithTarget.searchParams.get("target_lang"), "fr", "Explicit target_lang must be included");

// 2d. Explicit target_lang matching source language (redundant, should be excluded)
const urlSameTarget = buildLovableTtsUrl("Hello world", "en", { target_lang: "en" });
const parsedSameTarget = new URL(urlSameTarget);
assert.equal(parsedSameTarget.searchParams.get("target_lang"), null, "Redundant target_lang matching source must be omitted");

console.log("✅ PASS: Remote TTS requests prevent cross-language phonetic pollution.");

// Section 3: Verify Web Speech API voice matching in src/routes/index.tsx
console.log("\n🗣️ Section 3: Validating Web Speech Voice-to-Language Guard in src/routes/index.tsx");
const indexContent = fs.readFileSync(path.resolve(process.cwd(), "src/routes/index.tsx"), "utf-8");

assert.ok(
  indexContent.includes("matchesLanguageCode(rawChosenVoice.lang, lang)") ||
    indexContent.includes("matchesLanguageCode(chosenVoice.lang, lang)"),
  "src/routes/index.tsx must guard chosenVoice with matchesLanguageCode against target text lang",
);

assert.ok(
  indexContent.includes("getSampleTextForLanguage"),
  "src/routes/index.tsx must use getSampleTextForLanguage in onTestAudio",
);

// Section 4: Verify Beginner Mode parity in BeginnerPreferencesTab.tsx
console.log("\n🎯 Section 4: Validating Beginner Mode Parity in BeginnerPreferencesTab.tsx");
const beginnerPrefContent = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/beginner/tabs/BeginnerPreferencesTab.tsx"),
  "utf-8",
);

assert.ok(
  beginnerPrefContent.includes("getSampleTextForLanguage(baseLanguage)"),
  "BeginnerPreferencesTab.tsx must use getSampleTextForLanguage for handleTestVoice",
);

assert.ok(
  beginnerPrefContent.includes("getSampleTextForLanguage(baseLanguage || \"en\")"),
  "BeginnerPreferencesTab.tsx must use getSampleTextForLanguage in btn-test-alternative-tts",
);

console.log("=========================================================================");
console.log("🎉 ALL TASK 369 CHECKS PASSED: TTS Language Phonetic Alignment Verified!");
console.log("=========================================================================");
