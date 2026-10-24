import assert from "node:assert";
import { isYouTubeTranslatedSubtitle } from "../src/lib/subtitle-fetch-plan";

console.log("====================================================");
console.log("🧪 Starting YouTube Translation Indicator Verification");
console.log("====================================================");

const validTranslationUrl =
  "https://www.youtube.com/api/timedtext?lang=en&fmt=json3&tlang=he&caps=asr";
assert.strictEqual(
  isYouTubeTranslatedSubtitle(validTranslationUrl, "he"),
  true,
  "YouTube timedtext URL with tlang=he should be marked as translated for he",
);
assert.strictEqual(
  isYouTubeTranslatedSubtitle(validTranslationUrl, "en"),
  false,
  "The same translation URL should not be marked for the source language",
);

const directCaptionUrl = "https://www.youtube.com/api/timedtext?lang=he&fmt=json3";
assert.strictEqual(
  isYouTubeTranslatedSubtitle(directCaptionUrl, "he"),
  false,
  "Direct language-only YouTube captions should not be marked as translated",
);

const unrelatedUrl = "https://example.com/api/timedtext?lang=he&tlang=fr";
assert.strictEqual(
  isYouTubeTranslatedSubtitle(unrelatedUrl, "he"),
  false,
  "Non-YouTube URLs should never be marked as translated",
);

console.log("✅ PASS: translation indicator detection matches YouTube tlang semantics");
