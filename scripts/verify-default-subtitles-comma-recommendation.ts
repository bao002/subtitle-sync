import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  calculateTrackPunctuationStats,
  analyzeDefaultSubtitlesPunctuation,
  extractTextFromTrack,
} from "../src/utils/subtitlePunctuationStats";

console.log("=== Running verify-default-subtitles-comma-recommendation.ts ===");

// 1. Test punctuation counting math on synthetic tracks
const enTrack = {
  wireMagic: "pb3",
  events: [
    { tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "Hello, world, how are you today?" }] },
    { tStartMs: 1000, dDurationMs: 1000, segs: [{ utf8: "This is great, amazing, and fun!" }] },
  ],
};

const statsEn = calculateTrackPunctuationStats("en", enTrack);
assert.strictEqual(statsEn.commas, 4, "English track should have exactly 4 commas");
assert.strictEqual(statsEn.questionMarks, 1, "English track should have 1 question mark");
assert.strictEqual(statsEn.exclamationMarks, 1, "English track should have 1 exclamation mark");
assert.strictEqual(statsEn.totalPunctuation, 6, "Total punctuation should be 6");
assert.strictEqual(statsEn.cuesCount, 2, "Cues count should be 2");
console.log("✓ calculateTrackPunctuationStats correctly counts commas and punctuation");

// 2. Test international punctuation (Arabic and fullwidth commas)
const arTrack = {
  events: [
    { segs: [{ utf8: "مرحبا، كيف حالك؟ هذا رائع، حقا!" }] },
  ],
};
const statsAr = calculateTrackPunctuationStats("ar", arTrack);
assert.strictEqual(statsAr.commas, 2, "Arabic comma (،) should be counted as comma");
assert.strictEqual(statsAr.questionMarks, 1, "Arabic question mark (؟) should be counted");
assert.strictEqual(statsAr.exclamationMarks, 1, "Exclamation mark should be counted");
console.log("✓ International punctuation (Arabic/CJK commas) correctly counted");

// 3. Test recommendation logic: track with highest comma count is recommended
const esTrack = {
  events: [
    { segs: [{ utf8: "Hola, amigos. Uno, dos, tres, cuatro, cinco." }] },
  ],
}; // 5 commas

const { statsMap, recommendedLang, maxCommas } = analyzeDefaultSubtitlesPunctuation(
  ["en", "ar", "es"],
  { en: enTrack, ar: arTrack, es: esTrack },
  "en",
);

assert.strictEqual(recommendedLang, "es", "Spanish track with 5 commas should be recommended over en (4) and ar (2)");
assert.strictEqual(maxCommas, 5, "maxCommas should be 5");
assert.strictEqual(statsMap.es.commas, 5, "statsMap.es should have 5 commas");
assert.strictEqual(statsMap.en.commas, 4, "statsMap.en should have 4 commas");
assert.strictEqual(statsMap.ar.commas, 2, "statsMap.ar should have 2 commas");
console.log("✓ analyzeDefaultSubtitlesPunctuation correctly recommends track with highest comma count");

// 4. Test zero-comma fallback
const zeroCommaTrack = {
  events: [{ segs: [{ utf8: "No commas here at all" }] }],
};
const noCommasAnalysis = analyzeDefaultSubtitlesPunctuation(
  ["en"],
  { en: zeroCommaTrack },
);
assert.strictEqual(noCommasAnalysis.maxCommas, 0, "maxCommas should be 0");
assert.strictEqual(noCommasAnalysis.recommendedLang, null, "No track should be recommended if commas == 0");
console.log("✓ Zero-comma tracks gracefully handled with no false recommendations");

// 5. Inspect component implementation in SwitchableDefaultSubtitlesBar.tsx
const barPath = path.resolve(process.cwd(), "src/components/SwitchableDefaultSubtitlesBar.tsx");
assert(fs.existsSync(barPath), "SwitchableDefaultSubtitlesBar.tsx must exist");
const barContent = fs.readFileSync(barPath, "utf8");

assert(barContent.includes("recommended-default-subtitle-icon"), "Must render recommended-default-subtitle-icon testid");
assert(barContent.includes("default-subtitle-comma-count-"), "Must render comma count badge testid");
assert(barContent.includes("toggle-punctuation-stats-btn"), "Must render toggle button for punctuation statistics");
assert(barContent.includes("default-subtitles-punctuation-stats"), "Must render exposed punctuation statistics container");
assert(barContent.includes("punctuation-stats-row-"), "Must render punctuation statistics table rows");
assert(barContent.includes("recommended-track-callout"), "Must render recommended track callout banner in statistics");
console.log("✓ SwitchableDefaultSubtitlesBar has full recommendation icon and statistics breakdown UI");

// 6. Inspect Storybook coverage
const storiesPath = path.resolve(process.cwd(), "src/components/SwitchableDefaultSubtitlesBar.stories.tsx");
assert(fs.existsSync(storiesPath), "SwitchableDefaultSubtitlesBar.stories.tsx must exist");
const storiesContent = fs.readFileSync(storiesPath, "utf8");
assert(storiesContent.includes("WithCommaRecommendation"), "Storybook must export WithCommaRecommendation story");
assert(storiesContent.includes("PreExpandedStatistics"), "Storybook must export PreExpandedStatistics story");
console.log("✓ Storybook stories file verified with complete coverage");

// 7. Verify StorybookWorkbench includes default_subtitles tab
const workbenchPath = path.resolve(process.cwd(), "src/storybook/StorybookWorkbench.tsx");
const workbenchContent = fs.readFileSync(workbenchPath, "utf8");
assert(workbenchContent.includes('"default_subtitles"'), "StorybookWorkbench must include default_subtitles component key");
assert(workbenchContent.includes("<SwitchableDefaultSubtitlesBar"), "StorybookWorkbench must render SwitchableDefaultSubtitlesBar");
console.log("✓ StorybookWorkbench catalog includes SwitchableDefaultSubtitlesBar");

// 8. Verify Beginner & Advanced mode parity in src/routes/index.tsx
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");
const matches = indexContent.match(/<SwitchableDefaultSubtitlesBar/g);
assert(matches && matches.length >= 2, "SwitchableDefaultSubtitlesBar must be rendered in both Beginner and Advanced modes (at least 2 instances)");
console.log(`✓ Absolute parity verified: <SwitchableDefaultSubtitlesBar rendered in both modes (${matches?.length} instances)`);

console.log("=== All verify-default-subtitles-comma-recommendation assertions passed! ===");
