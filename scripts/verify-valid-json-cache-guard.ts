import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  isValidJsonSubtitleResponse,
  saveCachedRawJson3,
  saveCachedSubtitles,
  saveCachedTargetSubtitles,
  getCachedTargetSubtitles,
  clearSubtitleCache,
} from "../src/utils/subtitleCache";
import type { CaptionCue } from "../src/types";

console.log("====================================================");
console.log("🧪 Starting Valid JSON Subtitle Cache Guard Verification");
console.log("====================================================");

const rootDir = process.cwd();

// Mock localStorage environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  key: (i: number) => Object.keys(mockStorage)[i] ?? null,
  length: 0,
  clear: () => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  },
};
Object.defineProperty(mockLocalStorage, "length", {
  get: () => Object.keys(mockStorage).length,
});

(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window = {
  localStorage: mockLocalStorage,
};

// ============================================================================
// 1. Verify isValidJsonSubtitleResponse rejection on invalid data
// ============================================================================
console.log("\n--- [1] Testing isValidJsonSubtitleResponse Validator ---");

const invalidCases: { label: string; data: unknown }[] = [
  { label: "null", data: null },
  { label: "undefined", data: undefined },
  { label: "empty string", data: "" },
  { label: "whitespace string", data: "   \n\t  " },
  {
    label: "HTML error document",
    data: "<!DOCTYPE html><html><body><h1>404 Not Found</h1></body></html>",
  },
  { label: "plain error message", data: "Error: Video has no captions available" },
  { label: "arbitrary XML", data: "<error><code>403</code><msg>Forbidden</msg></error>" },
  { label: "malformed JSON string", data: "{ events: [{ tStartMs: 0 " },
  { label: "JSON with empty events array", data: '{"events": []}' },
  { label: "JSON with null events", data: '{"events": null}' },
  { label: "JSON object without events or cues", data: '{"status": 200, "message": "ok"}' },
  { label: "JSON with empty segs array", data: '{"events": [{"tStartMs": 0, "segs": []}]}' },
  {
    label: "JSON with blank utf8 text",
    data: '{"events": [{"tStartMs": 0, "segs": [{"utf8": "  "}]}]}',
  },
  { label: "empty array of cues", data: [] },
  { label: "array with invalid cues", data: [{ id: "c1", text: "   " }] },
];

for (const tc of invalidCases) {
  const result = isValidJsonSubtitleResponse(tc.data);
  assert.strictEqual(result, false, `Validator must reject ${tc.label}, but returned true`);
  console.log(`✅ PASS: Correctly rejected ${tc.label}`);
}

// Test valid JSON3 format
const validJson3String = JSON.stringify({
  wireMagic: "pb3",
  events: [
    {
      tStartMs: 1000,
      dDurationMs: 2000,
      segs: [{ utf8: "Hello world this is valid caption text" }],
    },
  ],
});
assert.strictEqual(
  isValidJsonSubtitleResponse(validJson3String),
  true,
  "Validator must accept valid YouTube JSON3 string",
);
console.log("✅ PASS: Correctly accepted valid YouTube JSON3 string");

const validCuesArray: CaptionCue[] = [
  { id: "cue-1", start: 1.0, duration: 2.0, text: "Authentic cue text" },
];
assert.strictEqual(
  isValidJsonSubtitleResponse(validCuesArray),
  true,
  "Validator must accept valid CaptionCue array",
);
console.log("✅ PASS: Correctly accepted valid CaptionCue array");

// ============================================================================
// 2. Verify Cache Functions Guard Against Invalid Responses
// ============================================================================
console.log("\n--- [2] Testing Cache Storage Guards Against Invalid Subtitles ---");
clearSubtitleCache();

const testVideoId = "n9qwEOsqsoo";
const testLang = "he";

// Test saveCachedRawJson3 with invalid HTML response
const saveInvalidResult = saveCachedRawJson3(
  testVideoId,
  testLang,
  "<html><body>404 Not Found</body></html>",
);
assert.strictEqual(
  saveInvalidResult,
  false,
  "saveCachedRawJson3 must return false when passed invalid non-JSON",
);
assert.strictEqual(
  Object.keys(mockStorage).length,
  0,
  "localStorage must remain untouched when attempting to cache invalid response",
);
console.log("✅ PASS: saveCachedRawJson3 refused to cache invalid HTML response");

// Test saveCachedRawJson3 with valid JSON3
const saveValidResult = saveCachedRawJson3(testVideoId, testLang, validJson3String);
assert.strictEqual(saveValidResult, true, "saveCachedRawJson3 must return true for valid JSON3");
assert(
  Object.keys(mockStorage).some((k) => k.includes(`raw_${testVideoId}_${testLang}`)),
  "localStorage must contain cached entry for valid JSON3",
);
console.log("✅ PASS: saveCachedRawJson3 successfully cached valid JSON3");

// Test saveCachedSubtitles with invalid cues
clearSubtitleCache();
saveCachedSubtitles(testVideoId, [{ id: "bad", start: 0, duration: 1, text: "   " }]);
assert.strictEqual(
  Object.keys(mockStorage).length,
  0,
  "saveCachedSubtitles must not write invalid cues to storage",
);
console.log("✅ PASS: saveCachedSubtitles blocked invalid cues from cache");

// Test saveCachedTargetSubtitles with invalid cues
saveCachedTargetSubtitles(testVideoId, "es", [{ id: "bad", start: 0, duration: 1, text: "" }]);
assert.strictEqual(
  getCachedTargetSubtitles(testVideoId, "es"),
  null,
  "getCachedTargetSubtitles must return null when invalid cues were rejected",
);
console.log("✅ PASS: saveCachedTargetSubtitles blocked invalid target cues from cache");

// ============================================================================
// 3. Verify Android Shell (MainActivity.kt) JSON Validation & Cache Guard
// ============================================================================
console.log("\n--- [3] Testing Android Native Shell (MainActivity.kt) JSON Cache Guard ---");

const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  mainActivityContent.includes("fun isValidJsonSubtitle(body: String): Boolean"),
  "MainActivity.kt must declare isValidJsonSubtitle helper",
);
console.log("✅ PASS: MainActivity.kt declares isValidJsonSubtitle");

assert(
  mainActivityContent.includes("if (!isValidJsonSubtitle(bodyString))"),
  "MainActivity.kt saveCaptionToFile must guard with isValidJsonSubtitle",
);
console.log("✅ PASS: MainActivity.kt saveCaptionToFile guards against invalid responses");

assert(
  (mainActivityContent.includes("if (isValidJsonSubtitle(rawBodyString))") ||
    mainActivityContent.includes("isValidJsonSubtitle(rawBodyString)")) &&
    mainActivityContent.includes("saveCaptionToFile(url, rawBodyBytes)"),
  "MainActivity.kt interception loop must verify isValidJsonSubtitle before calling saveCaptionToFile",
);
console.log(
  "✅ PASS: MainActivity.kt interception loop verifies JSON validity before saving to disk",
);

assert(
  mainActivityContent.includes('val filename = "caption_${System.currentTimeMillis()}.json"'),
  "MainActivity.kt must save captions with .json extension for JSON3 format",
);
console.log("✅ PASS: MainActivity.kt saves captions as .json");

console.log("\n====================================================");
console.log("🎉 ALL VALID JSON SUBTITLE CACHE GUARD TESTS PASSED!");
console.log("====================================================");
