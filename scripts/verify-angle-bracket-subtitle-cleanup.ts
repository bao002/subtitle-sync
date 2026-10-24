import assert from "node:assert/strict";
import { align, type Json3 } from "../src/lib/subtitles";
import { removeAngleBrackets, removeSpecialCharacters } from "../src/utils/captionParser";

const text = "Read <this> &lt;carefully&gt;.";

assert.equal(removeAngleBrackets(text), "Read this carefully.");
assert.equal(
  removeSpecialCharacters(`${text} >`, { stripSpeakerBrackets: false, removeChars: [] }),
  "Read this carefully.",
);

const track: Json3 = {
  events: [
    {
      tStartMs: 0,
      dDurationMs: 2000,
      segs: [{ utf8: "Read <this> &lt;carefully&gt;." }],
    },
  ],
};
const rows = align({ en: track }, "en", ["sentence"]);
assert.equal(rows.length, 1);
assert.equal(rows[0]?.texts.en, "Read this carefully.");
assert.ok(!/[<>]/.test(rows[0]?.texts.en ?? ""), "Aligned display and TTS text must be clean");

console.log(
  "PASS: angle brackets and encoded angle brackets are removed before subtitle display/TTS.",
);
