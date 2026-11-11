/**
 * Dedicated test script: scripts/verify-default-tts-rate-per-language.ts
 *
 * Validates:
 * 1. getDefaultLanguageTtsRate returns 1.0 for English ("en", "en-US", "en-GB")
 * 2. getDefaultLanguageTtsRate returns 1.0 for Hebrew ("he", "iw", "he-IL")
 * 3. getDefaultLanguageTtsRate returns 0.8 for all other languages ("es", "ar", "fr", "de", "ru", "ja", etc.)
 * 4. getDefaultLanguageTtsRate handles empty/null/undefined safely by returning 0.8
 * 5. getDefaultTtsRates correctly initializes language lists with their respective defaults
 * 6. src/routes/index.tsx imports and integrates getDefaultLanguageTtsRate in initial state and fallbacks
 * 7. src/components/beginner/PerLanguageTtsPreferences.tsx uses getDefaultLanguageTtsRate
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  getDefaultLanguageTtsRate,
  getDefaultTtsRates,
} from "../src/lib/playback-preferences";

console.log("=========================================================================");
console.log("🧪 Testing Default TTS Rate: 1.0 for EN/HE, 0.8 for All Other Languages");
console.log("=========================================================================");

// 1. English rates
assert.strictEqual(getDefaultLanguageTtsRate("en"), 1.0, "en must have default rate 1.0");
assert.strictEqual(getDefaultLanguageTtsRate("en-US"), 1.0, "en-US must have default rate 1.0");
assert.strictEqual(getDefaultLanguageTtsRate("en-GB"), 1.0, "en-GB must have default rate 1.0");
console.log("✅ PASS: English languages default to 1.0");

// 2. Hebrew rates
assert.strictEqual(getDefaultLanguageTtsRate("he"), 1.0, "he must have default rate 1.0");
assert.strictEqual(getDefaultLanguageTtsRate("iw"), 1.0, "iw must have default rate 1.0");
assert.strictEqual(getDefaultLanguageTtsRate("he-IL"), 1.0, "he-IL must have default rate 1.0");
console.log("✅ PASS: Hebrew languages default to 1.0");

// 3. Other languages
const otherLangs = ["es", "ar", "fr", "de", "it", "ru", "pt", "pt-BR", "ja", "ko", "zh", "hi", "tr"];
for (const code of otherLangs) {
  assert.strictEqual(
    getDefaultLanguageTtsRate(code),
    0.8,
    `${code} must have default rate 0.8`,
  );
}
console.log(`✅ PASS: Other languages (${otherLangs.join(", ")}) default to 0.8`);

// 4. Edge cases
assert.strictEqual(getDefaultLanguageTtsRate(undefined), 0.8, "undefined must default to 0.8");
assert.strictEqual(getDefaultLanguageTtsRate(null), 0.8, "null must default to 0.8");
assert.strictEqual(getDefaultLanguageTtsRate(""), 0.8, "empty string must default to 0.8");
console.log("✅ PASS: Edge cases safely return 0.8");

// 5. Batch initialization
const sampleLangs = [
  { code: "en", name: "English" },
  { code: "he", name: "Hebrew" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
];
const batchRates = getDefaultTtsRates(sampleLangs);
assert.strictEqual(batchRates["en"], 1.0, "Batch English rate must be 1.0");
assert.strictEqual(batchRates["he"], 1.0, "Batch Hebrew rate must be 1.0");
assert.strictEqual(batchRates["es"], 0.8, "Batch Spanish rate must be 0.8");
assert.strictEqual(batchRates["fr"], 0.8, "Batch French rate must be 0.8");
console.log("✅ PASS: Batch rates initialization matches requirements");

// 6. Source file integration checks
const rootDir = process.cwd();
const indexRouteContent = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf-8");
assert(
  indexRouteContent.includes("getDefaultLanguageTtsRate"),
  "src/routes/index.tsx must import and use getDefaultLanguageTtsRate",
);
console.log("✅ PASS: src/routes/index.tsx integrates getDefaultLanguageTtsRate");

const beginnerTtsContent = fs.readFileSync(
  path.resolve(rootDir, "src/components/beginner/PerLanguageTtsPreferences.tsx"),
  "utf-8",
);
assert(
  beginnerTtsContent.includes("getDefaultLanguageTtsRate"),
  "src/components/beginner/PerLanguageTtsPreferences.tsx must import and use getDefaultLanguageTtsRate",
);
console.log("✅ PASS: src/components/beginner/PerLanguageTtsPreferences.tsx integrates getDefaultLanguageTtsRate");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED: Default TTS rates per language verified successfully!");
console.log("=========================================================================");
