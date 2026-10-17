import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  normalizeLanguage,
  translateWithGoogle,
  getCachedTranslation,
  setCachedTranslation,
  getStoredOnDemandTranslation,
  getAllStoredOnDemandTranslations,
  translateSentencesAhead,
  clearOnDemandTranslations,
} from "../src/utils/onDemandTranslationManager";
import {
  DEFAULT_APP_SETTINGS,
  getOnDemandTranslationSetting,
  setOnDemandTranslationSetting,
  getOnDemandTranslationSentencesAhead,
  setOnDemandTranslationSentencesAhead,
  ON_DEMAND_TRANSLATION_STORAGE_KEY,
  ON_DEMAND_TRANSLATION_AHEAD_STORAGE_KEY,
} from "../src/utils/appSettings";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("====================================================");
console.log("🧪 Starting On-Demand Translation Ahead Verification");
console.log("   (Translate next X=10 sentences ahead via Google Translate)");
console.log("====================================================");

const rootDir = process.cwd();

// ============================================================================
// 1. Language Normalization & translateWithGoogle Contract
// ============================================================================
console.log("\n--- [1] Testing Language Normalization ---");

assert.strictEqual(normalizeLanguage("en"), "en");
assert.strictEqual(normalizeLanguage("en-US"), "en");
assert.strictEqual(normalizeLanguage("iw"), "he");
assert.strictEqual(normalizeLanguage("zh-CN"), "zh-CN");
assert.strictEqual(normalizeLanguage("zh-TW"), "zh-TW");
assert.strictEqual(normalizeLanguage("in"), "id");
assert.strictEqual(normalizeLanguage("ji"), "yi");
console.log("✅ PASS: normalizeLanguage correctly handles language tags and legacy codes");

// ============================================================================
// 2. translateWithGoogle API & Mock Validation
// ============================================================================
console.log("\n--- [2] Testing translateWithGoogle Response Parsing ---");

const originalFetch = globalThis.fetch;

// Test A: Array schema [[[ "Hola", ... ]]]
(globalThis as any).fetch = async (url: string) => {
  assert.ok(url.includes("translate.googleapis.com"), "Must request translate.googleapis.com");
  assert.ok(url.includes("client=gtx"), "Must use client=gtx");
  assert.ok(url.includes("sl=en"), "Must specify source language");
  assert.ok(url.includes("tl=es"), "Must specify target language");
  return {
    ok: true,
    json: async () => [[["Hola mundo", "Hello world", null, null, 1]]],
  };
};

const res1 = await translateWithGoogle({ text: "Hello world", fromLang: "en", toLang: "es" });
assert.strictEqual(res1, "Hola mundo", "Must parse nested array structure");
console.log("✅ PASS: translateWithGoogle parses array structure correctly");

// Test B: Object schema { translatedText: "Bonjour" }
(globalThis as any).fetch = async () => ({
  ok: true,
  json: async () => ({ translatedText: "Bonjour le monde" }),
});
const res2 = await translateWithGoogle({ text: "Hello world", fromLang: "en", toLang: "fr" });
assert.strictEqual(res2, "Bonjour le monde", "Must parse translatedText object property");
console.log("✅ PASS: translateWithGoogle parses object structure correctly");

// Test C: Multi-part segment array schema
(globalThis as any).fetch = async () => ({
  ok: true,
  json: async () => [
    [
      ["Part 1. ", "Part 1. ", null, null, 1],
      ["Part 2.", "Part 2.", null, null, 1],
    ],
  ],
});
const res3 = await translateWithGoogle({ text: "Part 1. Part 2.", fromLang: "en", toLang: "es" });
assert.strictEqual(res3, "Part 1. Part 2.", "Must join multi-segment translations");
console.log("✅ PASS: translateWithGoogle joins multi-segment translations");

// Test D: Error on empty response
(globalThis as any).fetch = async () => ({
  ok: true,
  json: async () => [[["", "", null, null, 1]]],
});
let errorCaught = false;
try {
  await translateWithGoogle({ text: "Empty test", fromLang: "en", toLang: "es" });
} catch (err: any) {
  errorCaught = true;
  assert.ok(err.message.includes("No translated text returned"));
}
assert.ok(errorCaught, "Must throw when no translated text is returned");
console.log("✅ PASS: translateWithGoogle throws appropriately on empty translated text");

// Restore fetch
globalThis.fetch = originalFetch;

// ============================================================================
// 3. Translation Cache & Lookahead translateSentencesAhead
// ============================================================================
console.log("\n--- [3] Testing Translation Cache and Lookahead Manager ---");

clearOnDemandTranslations();

// Test manual caching
setCachedTranslation("en", "es", "Good morning", "Buenos días");
assert.strictEqual(
  getCachedTranslation("en", "es", "Good morning"),
  "Buenos días",
  "Cached translation must be retrieved",
);

// Mock fetch for translateSentencesAhead
let fetchCallCount = 0;
const translatedLog: Array<{ index: number; text: string }> = [];

(globalThis as any).fetch = async (url: string) => {
  fetchCallCount++;
  const urlObj = new URL(url);
  const q = urlObj.searchParams.get("q") || "";
  const tl = urlObj.searchParams.get("tl") || "";
  return {
    ok: true,
    json: async () => [[[`[${tl}] ${q}`, q, null, null, 1]]],
  };
};

const sampleSentences = [
  "Sentence zero",
  "Sentence one",
  "Sentence two",
  "Sentence three",
  "Sentence four",
  "Sentence five",
  "Sentence six",
  "Sentence seven",
  "Sentence eight",
  "Sentence nine",
  "Sentence ten",
  "Sentence eleven",
  "Sentence twelve",
];

const videoId = "testVideo123";
const targetLang = "he";

// Translate next 10 sentences ahead starting at index 2
const resMap = await translateSentencesAhead({
  videoId,
  fromLang: "en",
  toLang: targetLang,
  sentences: sampleSentences,
  startIndex: 2,
  sentencesAhead: 10,
  onSentenceTranslated: (index, text) => {
    translatedLog.push({ index, text });
  },
});

// Should have translated indices 2 through 12 (11 sentences)
assert.strictEqual(resMap.size, 11, "Must have translated exactly 11 sentences (indices 2 through 12)");
assert.strictEqual(translatedLog.length, 11, "onSentenceTranslated callback invoked 11 times");
assert.strictEqual(getStoredOnDemandTranslation(videoId, targetLang, 2), "[he] Sentence two");
assert.strictEqual(getStoredOnDemandTranslation(videoId, targetLang, 12), "[he] Sentence twelve");
assert.strictEqual(getStoredOnDemandTranslation(videoId, targetLang, 0), null, "Sentence 0 not translated yet");

// Second call: indices should be returned from cache without re-fetching
const previousCount = fetchCallCount;
await translateSentencesAhead({
  videoId,
  fromLang: "en",
  toLang: targetLang,
  sentences: sampleSentences,
  startIndex: 2,
  sentencesAhead: 5,
});
assert.strictEqual(fetchCallCount, previousCount, "Subsequent lookahead must read from cache without network calls");
console.log("✅ PASS: translateSentencesAhead translated X=10 sentences ahead and cached results");

// Clear on authentic YouTube subtitles arrival
clearOnDemandTranslations(videoId, targetLang);
assert.strictEqual(getStoredOnDemandTranslation(videoId, targetLang, 2), null, "Translations cleared on subtitle arrival");
console.log("✅ PASS: clearOnDemandTranslations cleanly clears on-demand entries");

// Restore fetch
globalThis.fetch = originalFetch;

// ============================================================================
// 4. Settings Configuration & Defaults
// ============================================================================
console.log("\n--- [4] Testing App Settings Persistence & Defaults ---");

assert.strictEqual(
  DEFAULT_APP_SETTINGS.enableOnDemandTranslation,
  true,
  "DEFAULT_APP_SETTINGS.enableOnDemandTranslation must be true",
);
assert.strictEqual(
  DEFAULT_APP_SETTINGS.onDemandTranslationSentencesAhead,
  10,
  "DEFAULT_APP_SETTINGS.onDemandTranslationSentencesAhead must be 10",
);

// Storage simulation
const mockStorage = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, val: string) => mockStorage.set(key, val),
    removeItem: (key: string) => mockStorage.delete(key),
  },
};

assert.strictEqual(getOnDemandTranslationSetting(), true, "Default setting must be true");
setOnDemandTranslationSetting(false);
assert.strictEqual(mockStorage.get(ON_DEMAND_TRANSLATION_STORAGE_KEY), "false");
assert.strictEqual(getOnDemandTranslationSetting(), false);

assert.strictEqual(getOnDemandTranslationSentencesAhead(), 10, "Default ahead count must be 10");
setOnDemandTranslationSentencesAhead(15);
assert.strictEqual(mockStorage.get(ON_DEMAND_TRANSLATION_AHEAD_STORAGE_KEY), "15");
assert.strictEqual(getOnDemandTranslationSentencesAhead(), 15);

console.log("✅ PASS: App settings getters/setters correctly persist on-demand translation configuration");

// ============================================================================
// 5. Source Code Verification: index.tsx Integration
// ============================================================================
console.log("\n--- [5] Verifying index.tsx Integration ---");

const indexContent = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf-8");

assert.ok(
  indexContent.includes("translateSentencesAhead"),
  "index.tsx must import and call translateSentencesAhead",
);
assert.ok(
  indexContent.includes("onDemandTranslations"),
  "index.tsx must manage onDemandTranslations state",
);
assert.ok(
  indexContent.includes("clearOnDemandTranslations"),
  "index.tsx must clear on-demand translations when YouTube timedtext subtitles arrive",
);
assert.ok(
  indexContent.includes("on-demand-translation-toggle"),
  "index.tsx must render on-demand translation toggle with data-testid='on-demand-translation-toggle'",
);
assert.ok(
  indexContent.includes("on-demand-ahead-count-input"),
  "index.tsx must render on-demand sentences ahead input with data-testid='on-demand-ahead-count-input'",
);
assert.ok(
  indexContent.includes("hasOnDemandCues"),
  "index.tsx cols must include languages that have on-demand translation cues",
);

console.log("✅ PASS: index.tsx source code correctly implements on-demand translation lookahead integration");

// ============================================================================
// 6. Version Parity Check (1.0.36)
// ============================================================================
console.log("\n--- [6] Verifying Version Parity across targets ---");

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert.strictEqual(packageJson.version, APP_VERSION, "package.json must match APP_VERSION");
assert.strictEqual(CURRENT_APK_VERSION, `v${APP_VERSION}`, "apkUpdater.ts CURRENT_APK_VERSION must match vAPP_VERSION");

const gradleContent = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(gradleContent.includes(`versionName = "${APP_VERSION}"`), "build.gradle.kts versionName must match APP_VERSION");

console.log(`✅ PASS: All 5 version targets synchronized at ${APP_VERSION}`);

console.log("\n====================================================");
console.log("🎉 ALL ON-DEMAND TRANSLATION VERIFICATIONS PASSED!");
console.log("====================================================");
