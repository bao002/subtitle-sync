import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  buildTranslatedCaptionUrl,
  decodeInterceptedCaption,
  parseJson3,
  timedTextVideoId,
} from "../src/lib/native-captions";

console.log("====================================================");
console.log("🧪 Starting Native Captions & tlang Replacement Test");
console.log("====================================================");

// 1. Verify URL building when targetLanguage matches original lang
const baseEnUrl = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3";
const sameLangResult = buildTranslatedCaptionUrl(baseEnUrl, "en");
const parsedSame = new URL(sameLangResult);

assert.strictEqual(
  parsedSame.searchParams.get("tlang"),
  null,
  "When target language is identical to original lang (en), tlang must NOT be appended",
);
assert.strictEqual(
  parsedSame.searchParams.get("lang"),
  "en",
  "Base language parameter must be preserved",
);
assert.strictEqual(parsedSame.searchParams.get("fmt"), "json3", "Format parameter must be json3");
console.log("✅ PASS: Native language fetching strips invalid tlang");

// 2. Verify URL building when targetLanguage is different from original lang
const translatedHebrew = buildTranslatedCaptionUrl(baseEnUrl, "he");
const parsedHe = new URL(translatedHebrew);

assert.strictEqual(
  parsedHe.searchParams.get("tlang"),
  "he",
  "Target language he must be set as tlang",
);
assert.strictEqual(
  parsedHe.searchParams.get("v"),
  "L2Ryrr6txwA",
  "Video ID must be preserved in translated URL",
);
console.log("✅ PASS: Translated target language sets tlang correctly (he)");

const translatedSpanish = buildTranslatedCaptionUrl(baseEnUrl, "es");
const parsedEs = new URL(translatedSpanish);

assert.strictEqual(
  parsedEs.searchParams.get("tlang"),
  "es",
  "Target language es must be set as tlang",
);
console.log("✅ PASS: Translated target language sets tlang correctly (es)");

// 3. Verify video ID extraction
assert.strictEqual(timedTextVideoId(baseEnUrl), "L2Ryrr6txwA");
console.log("✅ PASS: Video ID correctly extracted from timedtext URL");

// 4. Verify base64 intercepted caption decoding
const samplePayload = {
  url: baseEnUrl,
  rawData: JSON.stringify({
    events: [
      {
        tStartMs: 0,
        dDurationMs: 3000,
        segs: [{ utf8: "Authentic dialogue line" }],
      },
    ],
  }),
};

const base64Encoded = Buffer.from(JSON.stringify(samplePayload)).toString("base64");
const decoded = decodeInterceptedCaption(base64Encoded);
assert(decoded !== null, "Decoded payload must not be null");
assert.strictEqual(decoded.url, baseEnUrl);
const parsedJson = parseJson3(decoded.rawData);
assert(parsedJson !== null, "Parsed JSON3 must not be null");
assert.strictEqual(parsedJson.events?.[0]?.segs?.[0]?.utf8, "Authentic dialogue line");
console.log("✅ PASS: Intercepted base64 payload decoding and JSON3 parsing verified");

// 5. Verify MainActivity.kt has the originalLang check and SUBTITLE_FETCH telemetry
const mainActivityPath = path.join(
  process.cwd(),
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");
assert(
  mainActivityContent.includes('uri.getQueryParameter("lang")'),
  "MainActivity.kt must inspect original lang parameter to avoid invalid tlang",
);
assert(
  mainActivityContent.includes('val isLang = name.equals("lang", ignoreCase = true)'),
  "MainActivity.kt must exclude lang in queryParam iteration to prevent duplicate lang parameters",
);
assert(
  mainActivityContent.includes(
    'val originalLang = uri.getQueryParameter("lang")?.takeIf { it.isNotBlank() } ?: "en"',
  ),
  "MainActivity.kt must provide fallback originalLang ('en') when lang query parameter is missing or blank",
);
assert(
  mainActivityContent.includes('builder.appendQueryParameter("lang", originalLang)'),
  "MainActivity.kt must append originalLang to builder so lang is always present in repeated requests",
);
assert(
  mainActivityContent.includes("SUBTITLE_FETCH kind="),
  "MainActivity.kt must emit SUBTITLE_FETCH telemetry",
);
console.log("✅ PASS: MainActivity.kt Kotlin bridge and telemetry verified");

// 5b. Simulate executeTimedTextRepetition behavior matching Kotlin implementation
function simulateExecuteTimedTextRepetition(
  base: string,
  targetLang: string,
  format: string,
): string {
  const url = new URL(base);
  const searchParams = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    const isLang = key.toLowerCase() === "lang";
    const isTlang = key.toLowerCase() === "tlang";
    const isFmt = key.toLowerCase() === "fmt" && format.length > 0;
    if (!isLang && !isTlang && !isFmt) {
      searchParams.append(key, value);
    }
  }
  const originalLang = url.searchParams.get("lang")?.trim() || "en";
  searchParams.append("lang", originalLang);
  if (originalLang.toLowerCase() !== targetLang.toLowerCase()) {
    searchParams.append("tlang", targetLang);
  }
  if (format.length > 0) {
    searchParams.append("fmt", format);
  }
  url.search = searchParams.toString();
  return url.toString();
}

// Test case A: Base URL has lang=en, targetLang=es -> should produce lang=en, tlang=es, fmt=json3
const testA = simulateExecuteTimedTextRepetition(
  "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en",
  "es",
  "json3",
);
const parsedA = new URL(testA);
assert.strictEqual(parsedA.searchParams.get("lang"), "en", "Test A lang must be 'en'");
assert.strictEqual(parsedA.searchParams.get("tlang"), "es", "Test A tlang must be 'es'");
assert.strictEqual(
  parsedA.searchParams.getAll("lang").length,
  1,
  "Test A lang must not be duplicated",
);

// Test case B: Base URL has NO lang parameter, targetLang=es -> should fallback lang=en, tlang=es
const testB = simulateExecuteTimedTextRepetition(
  "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&caps=asr",
  "es",
  "json3",
);
const parsedB = new URL(testB);
assert.strictEqual(parsedB.searchParams.get("lang"), "en", "Test B lang must fallback to 'en'");
assert.strictEqual(parsedB.searchParams.get("tlang"), "es", "Test B tlang must be 'es'");

// Test case C: Base URL has lang=en, targetLang=en (same lang) -> should omit tlang
const testC = simulateExecuteTimedTextRepetition(
  "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en",
  "en",
  "json3",
);
const parsedC = new URL(testC);
assert.strictEqual(parsedC.searchParams.get("lang"), "en", "Test C lang must be 'en'");
assert.strictEqual(parsedC.searchParams.get("tlang"), null, "Test C tlang must not be appended");
console.log(
  "✅ PASS: executeTimedTextRepetition URL generation simulated and validated across all cases",
);

// 6. Verify no hardcoded default subtitle language
const appSettingsPath = path.join(process.cwd(), "src/utils/appSettings.ts");
const appSettingsContent = fs.readFileSync(appSettingsPath, "utf8");
assert(
  appSettingsContent.includes("learningLanguages: []"),
  "DEFAULT_APP_SETTINGS must configure empty list (no hardcoded default subtitle language)",
);

const indexRoutePath = path.join(process.cwd(), "src/routes/index.tsx");
const indexRouteContent = fs.readFileSync(indexRoutePath, "utf8");
assert(
  indexRouteContent.includes("getUserLearningLanguages()"),
  "index.tsx must initialize targetLanguages from getUserLearningLanguages()",
);
assert(
  indexRouteContent.includes("if (saved && saved.length > 0) return saved;"),
  "index.tsx must prioritize saved learning languages over Android defaults",
);
assert(
  indexRouteContent.includes('if (isAndroidEnv) return ["he", "it"];'),
  "index.tsx must keep the Android-only Hebrew and Italian defaults for native subtitle verification",
);
console.log(
  "✅ PASS: Saved languages override Android defaults; web app settings remain empty by default",
);

console.log("====================================================");
console.log("📊 NATIVE CAPTIONS TEST: All tests passed!");
console.log("====================================================");
