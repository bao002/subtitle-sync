import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { parseJson3 } from "../src/lib/native-captions";
import { parseRawCaptionData } from "../src/utils/captionParser";
import {
  isValidJsonSubtitleResponse,
  saveCachedSubtitles,
  getCachedSubtitles,
  saveCachedTargetSubtitles,
  getCachedTargetSubtitles,
  saveCachedRawJson3,
  getCachedRawJson3,
  clearSubtitleCache,
} from "../src/utils/subtitleCache";

console.log("==================================================================");
console.log("🧪 Running Strict JSON3-Only Response Validation & Caching Test");
console.log("==================================================================");

const rootDir = process.cwd();

// Setup local storage mock for Node environment
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, String(v)),
  removeItem: (k: string) => storage.delete(k),
  clear: () => storage.clear(),
  length: 0,
  key: (_i: number) => null,
};
(globalThis as unknown as { window: unknown }).window = { localStorage: localStorageMock };
(globalThis as unknown as { localStorage: unknown }).localStorage = localStorageMock;

// 1. Non-JSON3 samples that MUST be rejected as errored / bad responses
const nonJson3Payloads = [
  // XML transcripts (formerly converted or parsed, now strictly rejected)
  '<transcript><text start="0" dur="2">Hello world</text></transcript>',
  '<timedtext><p t="0" d="2000">Subtitle line</p></timedtext>',
  '<xml><text start="1.5" dur="3.0">Some caption</text></xml>',
  // HTML error pages
  "<!DOCTYPE html><html><head><title>404 Not Found</title></head><body>Error</body></html>",
  "<html><body><h1>429 Too Many Requests</h1></body></html>",
  "<!doctype html><div>Access Denied</div>",
  // Plain text error responses
  "Error: Rate limit exceeded",
  "Unauthorized request",
  "404 Not Found",
  // Empty or non-JSON payloads
  "",
  "   ",
  "null",
  "undefined",
  "[]",
  "{}",
  // JSON but NOT JSON3 subtitle schema
  '{"error": {"code": 403, "message": "Forbidden"}}',
  '{"status": "fail"}',
  '{"events": []}', // zero cues
  '{"events": [{"tStartMs": 0, "dDurationMs": 1000}]}', // no segs
  '{"events": [{"tStartMs": 0, "dDurationMs": 1000, "segs": []}]}', // empty segs
  '{"events": [{"tStartMs": 0, "dDurationMs": 1000, "segs": [{"utf8": ""}]}]}', // empty text
  '{"events": [{"tStartMs": 0, "dDurationMs": 1000, "segs": [{"utf8": "   "}]}]}', // whitespace only
];

// Verify parseJson3 in src/lib/native-captions.ts rejects every non-JSON3 payload
for (const payload of nonJson3Payloads) {
  assert.strictEqual(
    parseJson3(payload),
    null,
    `parseJson3 must return null for non-JSON3 payload: ${payload.slice(0, 40)}`,
  );
}
console.log("✅ PASS: parseJson3 strictly rejects all XML, HTML, plain text, and non-JSON3 payloads");

// Verify parseRawCaptionData in src/utils/captionParser.ts rejects every non-JSON3 payload
for (const payload of nonJson3Payloads) {
  const parsed = parseRawCaptionData(payload);
  assert.strictEqual(
    parsed.format,
    "unknown",
    `parseRawCaptionData format must be unknown for: ${payload.slice(0, 40)}`,
  );
  assert.strictEqual(
    parsed.cues.length,
    0,
    `parseRawCaptionData must produce 0 cues for: ${payload.slice(0, 40)}`,
  );
}
console.log("✅ PASS: parseRawCaptionData strictly rejects all XML, HTML, and non-JSON3 payloads");

// Verify isValidJsonSubtitleResponse strictly returns false for every non-JSON3 payload
for (const payload of nonJson3Payloads) {
  assert.strictEqual(
    isValidJsonSubtitleResponse(payload),
    false,
    `isValidJsonSubtitleResponse must return false for non-JSON3 payload: ${payload.slice(0, 40)}`,
  );
}
console.log("✅ PASS: isValidJsonSubtitleResponse strictly returns false for all non-JSON3 payloads");

// 2. Authentic JSON3 verification
const validJson3Payload = JSON.stringify({
  events: [
    {
      tStartMs: 1000,
      dDurationMs: 2500,
      segs: [{ utf8: "Authentic YouTube subtitle line" }],
    },
    {
      tStartMs: 3800,
      dDurationMs: 3000,
      segs: [{ utf8: "Second line of valid caption track" }],
    },
  ],
});

assert.strictEqual(isValidJsonSubtitleResponse(validJson3Payload), true);
const parsedNative = parseJson3(validJson3Payload);
assert(parsedNative !== null, "Authentic JSON3 must parse successfully");
assert.strictEqual(parsedNative.events?.length, 2);

const parsedParser = parseRawCaptionData(validJson3Payload);
assert.strictEqual(parsedParser.format, "json3");
assert.strictEqual(parsedParser.cues.length, 2);
assert.strictEqual(parsedParser.cues[0].text, "Authentic YouTube subtitle line");
console.log("✅ PASS: Authentic JSON3 passes parsing and validation across all utilities");

// 3. Prohibit caching of non-JSON3 responses
clearSubtitleCache();
const testVid = "strictJson3Video";

for (const payload of nonJson3Payloads) {
  const saved = saveCachedRawJson3(testVid, "en", payload);
  assert.strictEqual(
    saved,
    false,
    `saveCachedRawJson3 must return false and refuse to cache non-JSON3 payload: ${payload.slice(0, 40)}`,
  );
  assert.strictEqual(
    getCachedRawJson3(testVid, "en"),
    null,
    "Non-JSON3 payload must not exist in cache",
  );
}
console.log("✅ PASS: saveCachedRawJson3 strictly refuses to cache every non-JSON3 payload");

// Caching authentic JSON3 must succeed
const savedValid = saveCachedRawJson3(testVid, "en", validJson3Payload);
assert.strictEqual(savedValid, true, "saveCachedRawJson3 must succeed for valid JSON3");
assert.strictEqual(getCachedRawJson3(testVid, "en"), validJson3Payload);
console.log("✅ PASS: Authentic JSON3 is cached and retrieved cleanly");

// 4. Read-time eviction of non-JSON3 corrupted records
const rawKey = `yt_subtitles_raw_${testVid}_he`;
storage.set(rawKey, '<transcript><text start="0">Corrupted XML</text></transcript>');
assert.strictEqual(
  getCachedRawJson3(testVid, "he"),
  null,
  "Corrupted XML record must return null on read",
);
assert.strictEqual(
  storage.has(rawKey),
  false,
  "Corrupted XML record must be evicted from storage on read",
);

storage.set(rawKey, "<html><body>HTML in cache</body></html>");
assert.strictEqual(getCachedRawJson3(testVid, "he"), null);
assert.strictEqual(storage.has(rawKey), false, "HTML entry must be evicted on read");
console.log("✅ PASS: Read-time eviction purges non-JSON3 entries from storage");

// 5. Verify MainActivity.kt has no XML conversion and strictly enforces JSON3
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  !mainActivityContent.includes("convertXmlToJson3"),
  "MainActivity.kt must not contain convertXmlToJson3 (XML conversion eliminated)",
);
assert(
  mainActivityContent.includes("isValidJsonSubtitle(body)"),
  "MainActivity.kt must enforce isValidJsonSubtitle in proactiveDetectSubtitles",
);
assert(
  mainActivityContent.includes("isValidJsonSubtitle(bodyString)"),
  "MainActivity.kt must enforce isValidJsonSubtitle in executeTimedTextRepetition and saveCaptionToFile",
);
assert(
  mainActivityContent.includes("val events = JSONObject(trimmed).optJSONArray(\"events\")"),
  "countCaptionCues in MainActivity.kt must only parse JSON3 events",
);
console.log("✅ PASS: MainActivity.kt strictly enforces JSON3 and contains no XML conversion");

// 6. Verify index.tsx guards and caches only valid JSON3
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

assert(
  indexContent.includes("saveCachedRawJson3(videoId, code, raw)"),
  "index.tsx must save valid JSON3 responses to cache upon successful fetch",
);
assert(
  indexContent.includes("saveCachedRawJson3(videoId, lang, payload.rawData)"),
  "index.tsx must save valid JSON3 responses to cache upon native interception",
);
console.log("✅ PASS: src/routes/index.tsx integrates saveCachedRawJson3 for valid responses");

console.log("==================================================================");
console.log("🎉 ALL STRICT JSON3-ONLY VALIDATION & CACHING ASSERTIONS PASSED!");
console.log("==================================================================");
