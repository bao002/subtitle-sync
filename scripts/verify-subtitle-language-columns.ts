import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  addUniqueSubtitleColumn,
  findFetchedSubtitleLanguage,
  mergeOnDemandSubtitleRows,
  subtitleLanguageIdentity,
} from "../src/utils/subtitleLanguageColumns";
import type { Json3, Row } from "../src/lib/subtitles";

assert.equal(subtitleLanguageIdentity("iw"), subtitleLanguageIdentity("he"));
assert.equal(subtitleLanguageIdentity("il"), subtitleLanguageIdentity("he"));
assert.equal(subtitleLanguageIdentity("en-US"), subtitleLanguageIdentity("en"));
assert.notEqual(subtitleLanguageIdentity("pt-BR"), subtitleLanguageIdentity("pt"));
assert.notEqual(subtitleLanguageIdentity("zh-CN"), subtitleLanguageIdentity("zh-TW"));

const fetchedHebrew: Json3 = {
  events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "Fetched Hebrew" }] }],
};
const tracks = { iw: fetchedHebrew };
assert.equal(findFetchedSubtitleLanguage(tracks, "he"), "iw");

const columns: { code: string; isYouTubeOrJson: boolean }[] = [
  { code: "he", isYouTubeOrJson: false },
];
addUniqueSubtitleColumn(columns, { code: "iw", isYouTubeOrJson: true });
assert.equal(columns.length, 1, "Hebrew aliases must produce only one column");
assert.deepEqual(
  columns[0],
  { code: "iw", isYouTubeOrJson: true },
  "A fetched track must replace its on-demand column",
);
addUniqueSubtitleColumn(columns, { code: "he", isYouTubeOrJson: false });
assert.equal(columns.length, 1, "Late on-demand aliases must not duplicate fetched columns");

const rows: Row[] = [
  { start: 0, end: 1000, texts: { iw: "Complete fetched file" } },
  { start: 1000, end: 2000, texts: { iw: "" } },
];
const translations = { he: { 0: "On-demand text", 1: "Stale translation" } };
assert.deepEqual(
  mergeOnDemandSubtitleRows(rows, translations, tracks),
  rows,
  "A fetched track must remain authoritative, even where its aligned cue is blank",
);
assert.equal(
  mergeOnDemandSubtitleRows(
    [{ start: 0, end: 1000, texts: { en: "Source" } }],
    { es: { 0: "<translated>" } },
    { en: { events: [{ segs: [{ utf8: "Source" }] }] } },
  )[0]?.texts.es,
  "translated",
  "On-demand translations remain available until that language track is fetched",
);

const route = fs.readFileSync(path.resolve("src/routes/index.tsx"), "utf8");
assert.ok(
  route.includes("findFetchedSubtitleLanguage(tracksRef.current, targetLang)"),
  "Late translation callbacks must not restore translations after a track is fetched",
);
assert.ok(
  route.includes("!findFetchedSubtitleLanguage(tracks, code)"),
  "Lookahead translation must skip language aliases with a fetched track",
);

console.log(
  "PASS: Columns deduplicate language aliases and fetched tracks replace on-demand data.",
);
