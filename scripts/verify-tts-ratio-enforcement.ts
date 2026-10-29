import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  getLanguageTtsRatio,
  isLanguageSpoken,
  isSubtitleInstanceEligibleForTTS,
} from "../src/lib/playback-preferences";

console.log("====================================================");
console.log("🧪 Running Dedicated TTS Ratio Enforcement Test Suite");
console.log("====================================================");

// ----------------------------------------------------
// Test 1: getLanguageTtsRatio Normalization & Aliases
// ----------------------------------------------------
console.log("1. Verifying getLanguageTtsRatio with aliases and dialects...");

const sampleRatios = {
  he: 3,
  es: 2,
  "pt-BR": 4,
  en: 1,
  fr: 5,
};

// Exact match
assert.equal(getLanguageTtsRatio(sampleRatios, "es"), 2);
assert.equal(getLanguageTtsRatio(sampleRatios, "fr"), 5);

// Case insensitive
assert.equal(getLanguageTtsRatio(sampleRatios, "ES"), 2);
assert.equal(getLanguageTtsRatio(sampleRatios, "  es  "), 2);

// Hebrew alias: "iw" -> looks up "he"
assert.equal(getLanguageTtsRatio(sampleRatios, "iw"), 3);
assert.equal(getLanguageTtsRatio(sampleRatios, "il"), 3);

// Dialect match: "pt" -> looks up "pt-BR"
assert.equal(getLanguageTtsRatio(sampleRatios, "pt"), 4);

// Dialect lookup: ratios with "en", track has "en-US"
assert.equal(getLanguageTtsRatio(sampleRatios, "en-US"), 1);

// Fallbacks
assert.equal(getLanguageTtsRatio(sampleRatios, "de"), 1, "Unconfigured lang defaults to ratio 1");
assert.equal(getLanguageTtsRatio(null, "es"), 1, "Null ratios defaults to 1");
assert.equal(getLanguageTtsRatio(undefined, "es"), 1, "Undefined ratios defaults to 1");

console.log("✅ PASS: getLanguageTtsRatio resolves aliases and dialects correctly");

// ----------------------------------------------------
// Test 2: isLanguageSpoken Normalization & Aliases
// ----------------------------------------------------
console.log("2. Verifying isLanguageSpoken with aliases and dialects...");

const spokenList = ["en", "he", "pt-BR"];

assert.equal(isLanguageSpoken("en", spokenList), true);
assert.equal(isLanguageSpoken("EN", spokenList), true);
assert.equal(isLanguageSpoken("iw", spokenList), true, "iw matches he in spoken list");
assert.equal(isLanguageSpoken("il", spokenList), true, "il matches he in spoken list");
assert.equal(isLanguageSpoken("pt", spokenList), true, "pt matches pt-BR in spoken list");
assert.equal(isLanguageSpoken("es", spokenList), false, "es is not in spoken list");
assert.equal(isLanguageSpoken("de", spokenList), false, "de is not in spoken list");

console.log("✅ PASS: isLanguageSpoken handles aliases and dialects correctly");

// ----------------------------------------------------
// Test 3: Multi-Language TTS Ratio Playback Session Simulation
// ----------------------------------------------------
console.log(
  "3. Simulating playback session with multiple spoken languages and individual ratios...",
);

// Setup 3 languages checked for TTS-play:
// - English (base / not spoken or base skipped)
// - Spanish: ratio 1 (speaks every row)
// - Hebrew: ratio 3 (speaks rows 0, 3, 6, 9)
// - Russian: ratio 2 (speaks rows 0, 2, 4, 6, 8)
const sessionSpoken = ["es", "he", "ru"];
const sessionRatios = {
  es: 1,
  he: 3,
  ru: 2,
};

const sessionLangs = [
  { code: "en", name: "English", tts: "en-US" },
  { code: "es", name: "Spanish", tts: "es-ES" },
  { code: "he", name: "Hebrew", tts: "he-IL" },
  { code: "ru", name: "Russian", tts: "ru-RU" },
];

const simulateEligibleLangsForRow = (rowIdx: number, baseLang = "en") => {
  return sessionLangs.filter(
    (l) =>
      l.code !== baseLang &&
      isLanguageSpoken(l.code, sessionSpoken) &&
      isSubtitleInstanceEligibleForTTS(rowIdx, getLanguageTtsRatio(sessionRatios, l.code)),
  );
};

// Row 0: All three should speak
const row0Langs = simulateEligibleLangsForRow(0).map((l) => l.code);
assert.deepEqual(row0Langs, ["es", "he", "ru"], "Row 0: all 3 spoken languages are eligible");

// Row 1: Only Spanish should speak (ratio 1)
const row1Langs = simulateEligibleLangsForRow(1).map((l) => l.code);
assert.deepEqual(row1Langs, ["es"], "Row 1: only es speaks (ru ratio 2 and he ratio 3 skipped)");

// Row 2: Spanish (ratio 1) and Russian (ratio 2) should speak
const row2Langs = simulateEligibleLangsForRow(2).map((l) => l.code);
assert.deepEqual(row2Langs, ["es", "ru"], "Row 2: es and ru speak (he skipped)");

// Row 3: Spanish (ratio 1) and Hebrew (ratio 3) should speak
const row3Langs = simulateEligibleLangsForRow(3).map((l) => l.code);
assert.deepEqual(row3Langs, ["es", "he"], "Row 3: es and he speak (ru skipped)");

// Row 4: Spanish (ratio 1) and Russian (ratio 2) should speak
const row4Langs = simulateEligibleLangsForRow(4).map((l) => l.code);
assert.deepEqual(row4Langs, ["es", "ru"], "Row 4: es and ru speak (he skipped)");

// Row 5: Only Spanish should speak
const row5Langs = simulateEligibleLangsForRow(5).map((l) => l.code);
assert.deepEqual(row5Langs, ["es"], "Row 5: only es speaks");

// Row 6: All three should speak again (0 % 1 === 0, 6 % 2 === 0, 6 % 3 === 0)
const row6Langs = simulateEligibleLangsForRow(6).map((l) => l.code);
assert.deepEqual(row6Langs, ["es", "he", "ru"], "Row 6: all 3 speak again (lcm of 1, 2, 3)");

console.log(
  "✅ PASS: Multi-language ratio enforcement correctly calculates per-row speech candidates",
);

// ----------------------------------------------------
// Test 4: Codebase Audit for Correct Ratio Enforcement Integration
// ----------------------------------------------------
console.log("4. Auditing codebase integration for TTS ratio enforcement...");

const indexPath = path.resolve(__dirname, "../src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexContent.includes("getLanguageTtsRatio"),
  "src/routes/index.tsx must import and use getLanguageTtsRatio",
);

assert.ok(
  indexContent.includes("isLanguageSpoken(l.code, spoken)"),
  "src/routes/index.tsx getEligibleLangs must use isLanguageSpoken",
);

assert.ok(
  indexContent.includes(
    "isSubtitleInstanceEligibleForTTS(rowIdx, getLanguageTtsRatio(currentTtsRatios, l.code))",
  ),
  "src/routes/index.tsx getEligibleLangs must evaluate isSubtitleInstanceEligibleForTTS with getLanguageTtsRatio",
);

assert.ok(
  indexContent.includes("const ratio = getLanguageTtsRatio(currentTtsRatios, l.code);") &&
    indexContent.includes("if (!isSubtitleInstanceEligibleForTTS(rowIdx, ratio)) {"),
  "src/routes/index.tsx speakRow must re-check eligibility with getLanguageTtsRatio per language",
);

const subtitleRowPath = path.resolve(__dirname, "../src/components/SubtitleRow.tsx");
const subtitleRowContent = fs.readFileSync(subtitleRowPath, "utf-8");
assert.ok(
  subtitleRowContent.includes("getLanguageTtsRatio(ttsRatios, l.code)"),
  "src/components/SubtitleRow.tsx must use getLanguageTtsRatio for ratio calculations",
);

const beginnerPrefsPath = path.resolve(
  __dirname,
  "../src/components/beginner/PerLanguageTtsPreferences.tsx",
);
const beginnerPrefsContent = fs.readFileSync(beginnerPrefsPath, "utf-8");
assert.ok(
  beginnerPrefsContent.includes("getLanguageTtsRatio(ratios, language.code)"),
  "src/components/beginner/PerLanguageTtsPreferences.tsx must use getLanguageTtsRatio",
);

console.log("✅ PASS: Codebase audit confirmed full integration across all components and routes");

console.log("====================================================");
console.log("🎉 ALL TTS Ratio Enforcement tests PASSED successfully!");
console.log("====================================================");
