import assert from "node:assert";
import { extractVideoIdFromSubtitlesUrl } from "../src/utils/urlStateManager";
import { parseYouTubeUrl } from "../src/utils/youtube";

console.log("=========================================================================");
console.log("🧪 Verifying Task 269: Robust Video ID Extraction from Subtitles URLs");
console.log("=========================================================================");

// 1. Standard YouTube Timedtext URL
const timedtextUrl =
  "https://www.youtube.com/api/timedtext?v=vBURridJXZ0&ei=test&caps=asr&lang=iw&fmt=json3";
const id1 = extractVideoIdFromSubtitlesUrl(timedtextUrl);
assert.strictEqual(id1, "vBURridJXZ0", "Must extract vBURridJXZ0 from timedtext URL");
console.log("✅ PASS 1: Standard timedtext URL ->", id1);

// 2. Encoded Subtitles URL
const encodedSubUrl =
  "https%3A%2F%2Fwww.youtube.com%2Fapi%2Ftimedtext%3Fv%3DdQw4w9WgXcQ%26lang%3Den";
const id2 = extractVideoIdFromSubtitlesUrl(encodedSubUrl);
assert.strictEqual(id2, "dQw4w9WgXcQ", "Must extract dQw4w9WgXcQ from encoded subtitles URL");
console.log("✅ PASS 2: Encoded subtitles URL ->", id2);

// 3. Absolute Fixture URL
const fixtureAbs = "https://mostuf2556.github.io/subtitle-sync/fixtures/L2Ryrr6txwA/he.json";
const id3 = extractVideoIdFromSubtitlesUrl(fixtureAbs);
assert.strictEqual(id3, "L2Ryrr6txwA", "Must extract L2Ryrr6txwA from absolute fixture URL");
console.log("✅ PASS 3: Absolute fixture URL ->", id3);

// 4. Relative Fixture URL
const fixtureRel1 = "/fixtures/L2Ryrr6txwA/en.json";
const fixtureRel2 = "fixtures/L2Ryrr6txwA/en.json";
assert.strictEqual(extractVideoIdFromSubtitlesUrl(fixtureRel1), "L2Ryrr6txwA");
assert.strictEqual(extractVideoIdFromSubtitlesUrl(fixtureRel2), "L2Ryrr6txwA");
console.log("✅ PASS 4: Relative fixture URLs -> L2Ryrr6txwA");

// 5. Shared Link with subtitles_url parameter
const sharedLink =
  "https://mostuf2556.github.io/subtitle-sync?subtitles_url=https%3A%2F%2Fwww.youtube.com%2Fapi%2Ftimedtext%3Fv%3DHGEyIt2bMiE%26lang%3Den";
const id5 = extractVideoIdFromSubtitlesUrl(sharedLink);
assert.strictEqual(id5, "HGEyIt2bMiE", "Must extract HGEyIt2bMiE from shared link parameter");
console.log("✅ PASS 5: Shared link parameter ->", id5);

// 6. Universal parseYouTubeUrl with subtitles URL
const parsed1 = parseYouTubeUrl(timedtextUrl);
assert(parsed1 !== null, "parseYouTubeUrl must parse timedtext URL");
assert.strictEqual(parsed1.videoId, "vBURridJXZ0");

const parsed2 = parseYouTubeUrl(fixtureAbs);
assert(parsed2 !== null, "parseYouTubeUrl must parse fixture URL");
assert.strictEqual(parsed2.videoId, "L2Ryrr6txwA");
console.log("✅ PASS 6: parseYouTubeUrl successfully parses subtitles and fixture URLs");

console.log("\n=========================================================================");
console.log("🎉 ALL TASK 269 CHECKS PASSED 100%!");
console.log("=========================================================================");
