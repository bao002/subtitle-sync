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
console.log("🧪 Running HTML Response Guard & Caching Verification Test");
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

// 1. Verify parseJson3 in src/lib/native-captions.ts rejects HTML error pages
const htmlErrorResponses = [
  "<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><text>Error occurred</text></body></html>",
  "<html><body><p>Access Denied</p><text start=\"0\" dur=\"5\">Bot detected</text></body></html>",
  "<HTML><BODY>Too Many Requests</BODY></HTML>",
  "<!doctype html><div>Blocked</div>",
];

for (const html of htmlErrorResponses) {
  assert.strictEqual(
    parseJson3(html),
    null,
    `parseJson3 must return null for HTML error response: ${html.slice(0, 40)}...`,
  );
}
console.log("✅ PASS: parseJson3 in native-captions.ts strictly rejects all HTML error responses");

// 2. Verify parseRawCaptionData in src/utils/captionParser.ts rejects HTML
for (const html of htmlErrorResponses) {
  const result = parseRawCaptionData(html);
  assert.strictEqual(result.format, "unknown");
  assert.strictEqual(result.cues.length, 0);
}
console.log("✅ PASS: parseRawCaptionData in captionParser.ts strictly rejects all HTML error responses");

// 3. Verify isValidJsonSubtitleResponse
assert.strictEqual(isValidJsonSubtitleResponse(""), false);
assert.strictEqual(isValidJsonSubtitleResponse("   "), false);
assert.strictEqual(isValidJsonSubtitleResponse("<!DOCTYPE html><html></html>"), false);
assert.strictEqual(isValidJsonSubtitleResponse("<html><body>Error</body></html>"), false);
assert.strictEqual(isValidJsonSubtitleResponse("Not a json at all"), false);
assert.strictEqual(isValidJsonSubtitleResponse(JSON.stringify({ events: [] })), false);
assert.strictEqual(
  isValidJsonSubtitleResponse(
    JSON.stringify({
      events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "Valid subtitle text" }] }],
    }),
  ),
  true,
);
console.log("✅ PASS: isValidJsonSubtitleResponse accepts authentic JSON3 and rejects HTML/malformed payloads");

// 4. Verify caching refuses invalid or HTML responses and performs read-time eviction
clearSubtitleCache();
const testVid = "testVideo123";

// Attempt to cache HTML via saveCachedSubtitles
// @ts-expect-error test invalid cue type
saveCachedSubtitles(testVid, [{ id: "bad", text: "", start: 0, duration: 0 }]);
assert.strictEqual(getCachedSubtitles(testVid), null, "Invalid cues must not be cached");

// Test saveCachedRawJson3 with HTML
const savedHtml = saveCachedRawJson3(testVid, "en", "<!DOCTYPE html><html>404</html>");
assert.strictEqual(savedHtml, false, "saveCachedRawJson3 must return false and refuse HTML");
assert.strictEqual(getCachedRawJson3(testVid, "en"), null, "getCachedRawJson3 must return null for HTML");

// Test read-time eviction of corrupt entries in localStorage
const targetKey = `yt_subtitles_${testVid}_he`;
storage.set(targetKey, "<!DOCTYPE html><html>Corrupted entry</html>");
const readEvicted = getCachedTargetSubtitles(testVid, "he");
assert.strictEqual(readEvicted, null, "Corrupted entry must return null on read");
assert.strictEqual(storage.has(targetKey), false, "Corrupted entry must be evicted from localStorage on read");

const rawKey = `yt_subtitles_raw_${testVid}_es`;
storage.set(rawKey, "<html><body>Invalid raw json</body></html>");
const rawEvicted = getCachedRawJson3(testVid, "es");
assert.strictEqual(rawEvicted, null, "Invalid raw JSON must return null on read");
assert.strictEqual(storage.has(rawKey), false, "Invalid raw JSON must be evicted from localStorage on read");

console.log("✅ PASS: SubtitleCache refuses invalid data and evicts corrupted entries on read");

// 5. Verify MainActivity.kt has HTML guards and checks response.isSuccessful before caching
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  mainActivityContent.includes("response.isSuccessful && isValidJsonSubtitle(rawBodyString)"),
  "MainActivity.kt must check response.isSuccessful && isValidJsonSubtitle before caching and JS dispatch",
);
assert(
  !mainActivityContent.includes("convertXmlToJson3"),
  "MainActivity.kt must eliminate convertXmlToJson3 and reject all non-JSON3 responses as bad responses",
);
assert(
  mainActivityContent.includes("isValidJsonSubtitle(body)") &&
    mainActivityContent.includes("countCaptionCues(body)"),
  "MainActivity.kt must strictly validate JSON3 before counting cues and dispatching",
);
console.log("✅ PASS: MainActivity.kt validates response status and rejects non-JSON3 responses");

// 6. Verify src/routes/index.tsx guards native bridge callbacks with isValidJsonSubtitleResponse
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

assert(
  indexContent.includes("isValidJsonSubtitleResponse(payload.rawData)"),
  "src/routes/index.tsx must guard onNativeCaptionsInterceptedBase64 with isValidJsonSubtitleResponse",
);
assert(
  indexContent.includes("raw && isValidJsonSubtitleResponse(raw)"),
  "src/routes/index.tsx must guard fetchTranslatedCaptionsWithUrl with isValidJsonSubtitleResponse",
);
console.log("✅ PASS: src/routes/index.tsx guards all bridge subtitle ingestion with isValidJsonSubtitleResponse");

console.log("==================================================================");
console.log("🎉 ALL HTML RESPONSE GUARD AND CACHING CHECKS PASSED SUCCESSFULLY!");
console.log("==================================================================");
