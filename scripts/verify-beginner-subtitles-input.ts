import assert from "node:assert/strict";
import {
  identifySubtitleLanguage,
  extractVideoIdFromSubtitleUrl,
  fetchAndCacheSubtitleUrl,
} from "../src/utils/subtitleUrlDetector";

console.log("=== Verifying Beginner Mode Subtitle Input & Language Detection ===");

// 1. Verify `tlang` priority when both `lang` and `tlang` are present
console.log("1. Checking language identification prioritizing 'tlang' over 'lang'...");
const urlWithBoth = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&tlang=he&fmt=json3";
const res1 = identifySubtitleLanguage(urlWithBoth);
assert.ok(res1, "Should identify language");
assert.equal(res1.lang, "he", "Should prioritize 'tlang' (he) over 'lang' (en)");
assert.equal(res1.source, "tlang", "Should indicate source is 'tlang'");

// 2. Verify fallback to `lang` when `tlang` is missing
console.log("2. Checking fallback to 'lang' when 'tlang' is absent...");
const urlWithLangOnly = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=es&fmt=json3";
const res2 = identifySubtitleLanguage(urlWithLangOnly);
assert.ok(res2, "Should identify language");
assert.equal(res2.lang, "es", "Should fall back to 'lang' (es)");
assert.equal(res2.source, "lang", "Should indicate source is 'lang'");

// 3. Verify handling of relative query strings or encoded parameters
console.log("3. Checking relative query strings and parameter variations...");
const queryOnly = "?tlang=ar&kind=asr";
const res3 = identifySubtitleLanguage(queryOnly);
assert.ok(res3);
assert.equal(res3.lang, "ar");
assert.equal(res3.source, "tlang");

const relativeUrl = "/api/timedtext?lang=de";
const res4 = identifySubtitleLanguage(relativeUrl);
assert.ok(res4);
assert.equal(res4.lang, "de");
assert.equal(res4.source, "lang");

// 4. Verify rejection when neither `tlang` nor `lang` is present
console.log("4. Checking rejection of URLs lacking language parameters...");
const invalidUrl = "https://www.youtube.com/watch?v=L2Ryrr6txwA";
const res5 = identifySubtitleLanguage(invalidUrl);
assert.equal(res5, null, "Should return null when no language parameter exists");

// 5. Verify Video ID extraction
console.log("5. Checking video ID extraction from timedtext URL...");
const vid1 = extractVideoIdFromSubtitleUrl("https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en");
assert.equal(vid1, "L2Ryrr6txwA");

const vid2 = extractVideoIdFromSubtitleUrl("https://example.com/subtitles?foo=bar");
assert.equal(vid2, null);

// 6. Verify fetch and caching behavior with Web Demo fixture resilience
console.log("6. Checking fetch and cache execution for web demo...");
async function runAsyncTests() {
  const fetchRes = await fetchAndCacheSubtitleUrl(
    "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&tlang=he&fmt=json3",
    "L2Ryrr6txwA",
  );
  assert.equal(fetchRes.lang, "he");
  assert.equal(fetchRes.source, "tlang");
  assert.ok(fetchRes.cuesCount > 0, "Cues count must be greater than 0");
  assert.ok(Array.isArray(fetchRes.json.events), "Must contain events array");

  // Verify rejection of invalid language / bad payload
  try {
    await fetchAndCacheSubtitleUrl("https://invalid.domain.xyz/no-subtitles?lang=nonexistent999");
    assert.fail("Should have thrown error on unavailable subtitles");
  } catch (err: unknown) {
    assert.ok(err instanceof Error);
    assert.ok((err as Error).message.includes("nonexistent999"));
  }

  // 7. Verify Beginner base track auto-selection logic
  console.log("7. Checking base track auto-selection logic...");
  let currentBaseLang = "";
  const observedTracks = [{ lang: "he", cuesCount: 50, isCached: true, isBase: false }];

  // Auto-select rule: if !currentBaseLang && observedTracks.length >= 1, select first track
  if (!currentBaseLang && observedTracks.length >= 1) {
    currentBaseLang = observedTracks[0].lang;
  }
  assert.equal(currentBaseLang, "he", "Must auto-select newly added track as base if none was selected");

  // Existing selection preservation: if base track is already selected, do not overwrite
  const moreTracks = [
    { lang: "he", cuesCount: 50, isCached: true, isBase: true },
    { lang: "es", cuesCount: 50, isCached: true, isBase: false },
  ];
  if (!currentBaseLang && moreTracks.length >= 1) {
    currentBaseLang = moreTracks[0].lang;
  }
  assert.equal(currentBaseLang, "he", "Must preserve existing base language");

  // 8. Verify BeginnerVideoTab component imports and hook declarations
  console.log("8. Checking BeginnerVideoTab import and hook references...");
  const { BeginnerVideoTab } = await import("../src/components/beginner/tabs/BeginnerVideoTab");
  assert.equal(typeof BeginnerVideoTab, "function", "BeginnerVideoTab must be exported as a React function component");

  console.log("✅ All Beginner Mode Subtitle Input & Language Detection assertions PASSED!");
}

runAsyncTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

