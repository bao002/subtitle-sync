import assert from "node:assert/strict";
import fs from "node:fs";
import { getPlaybackSectionId } from "../src/lib/playback-section-identity";

const route = fs.readFileSync("src/routes/index.tsx", "utf8");

const spokenSection = { start: 12_000, end: 15_500, texts: { en: "A section." } };
const rowsAfterTranslationArrival = [
  { start: 4_000, end: 7_000, texts: { it: "Translated earlier section." } },
  spokenSection,
  { start: 15_500, end: 19_000, texts: { en: "The next section." } },
];
const playedSectionIds = new Set([getPlaybackSectionId(spokenSection)]);

assert.equal(
  getPlaybackSectionId(rowsAfterTranslationArrival[1]!),
  getPlaybackSectionId(spokenSection),
  "Adding earlier translated rows must not change the spoken section identity",
);
assert(
  playedSectionIds.has(getPlaybackSectionId(rowsAfterTranslationArrival[1]!)),
  "A section already spoken must remain marked after subtitle rows are updated",
);
assert.notEqual(
  getPlaybackSectionId(rowsAfterTranslationArrival[2]!),
  getPlaybackSectionId(spokenSection),
  "The next timed section must remain eligible for speech",
);
assert.match(route, /const playedTtsRecords = useRef<Set<string>>/);
assert.match(route, /playedTtsRecords\.current\.clear\(\);[\s\S]*?\}, \[videoId\]\);/);
assert.match(route, /getPlaybackSectionId\(rows\[rowIdx\]!\)/);

console.log("PASS: TTS completion cannot replay the same timed video section after row updates.");
