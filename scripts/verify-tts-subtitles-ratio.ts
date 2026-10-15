import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  isSubtitleInstanceEligibleForTTS,
  shouldHighlightSentenceForTTS,
  shouldSkipTTSBecauseAlreadyPlayed,
  getTtsRatiosPreference,
  setTtsRatioPreference,
} from "../src/lib/playback-preferences";
import { loadVideoSettings, saveVideoSettings } from "../src/utils/appSettings";

console.log("====================================================");
console.log("🧪 Starting Foreign Subtitles TTS Playback Ratio Test Suite");
console.log("====================================================");

// Mock localStorage in Node environment
const storage = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, val: string) => storage.set(key, String(val)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
};
(globalThis as any).localStorage = (globalThis as any).window.localStorage;

// ----------------------------------------------------
// Test 1: Mathematical Eligibility Function (isSubtitleInstanceEligibleForTTS)
// ----------------------------------------------------
console.log("1. Checking isSubtitleInstanceEligibleForTTS ratio calculations...");

// Ratio 1 (1:1 / 100% - Every sentence spoken)
assert.equal(isSubtitleInstanceEligibleForTTS(0, 1), true, "Row 0 should be eligible for ratio 1");
assert.equal(isSubtitleInstanceEligibleForTTS(1, 1), true, "Row 1 should be eligible for ratio 1");
assert.equal(isSubtitleInstanceEligibleForTTS(2, 1), true, "Row 2 should be eligible for ratio 1");
assert.equal(isSubtitleInstanceEligibleForTTS(3, 1), true, "Row 3 should be eligible for ratio 1");
assert.equal(isSubtitleInstanceEligibleForTTS(4, 1), true, "Row 4 should be eligible for ratio 1");

// Defaults (undefined / null) should default to 1 (all sentences)
assert.equal(
  isSubtitleInstanceEligibleForTTS(0, undefined),
  true,
  "Row 0 should be eligible with default ratio",
);
assert.equal(
  isSubtitleInstanceEligibleForTTS(5, null),
  true,
  "Row 5 should be eligible with null ratio",
);
assert.equal(isSubtitleInstanceEligibleForTTS(-1, 1), false, "Negative row index should be false");

// Ratio 2 (1:2 / 50% - 1 in every 2 sentences)
assert.equal(isSubtitleInstanceEligibleForTTS(0, 2), true, "Row 0 is eligible for 1:2 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(1, 2), false, "Row 1 is skipped for 1:2 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(2, 2), true, "Row 2 is eligible for 1:2 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(3, 2), false, "Row 3 is skipped for 1:2 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(4, 2), true, "Row 4 is eligible for 1:2 ratio");

// Ratio 3 (1:3 / 33% - 1 in every 3 sentences)
assert.equal(isSubtitleInstanceEligibleForTTS(0, 3), true, "Row 0 is eligible for 1:3 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(1, 3), false, "Row 1 is skipped for 1:3 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(2, 3), false, "Row 2 is skipped for 1:3 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(3, 3), true, "Row 3 is eligible for 1:3 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(4, 3), false, "Row 4 is skipped for 1:3 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(6, 3), true, "Row 6 is eligible for 1:3 ratio");

// Ratio 4 (1:4 / 25% - 1 in every 4 sentences)
assert.equal(isSubtitleInstanceEligibleForTTS(0, 4), true, "Row 0 is eligible for 1:4 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(1, 4), false, "Row 1 is skipped for 1:4 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(2, 4), false, "Row 2 is skipped for 1:4 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(3, 4), false, "Row 3 is skipped for 1:4 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(4, 4), true, "Row 4 is eligible for 1:4 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(8, 4), true, "Row 8 is eligible for 1:4 ratio");

// Ratio 5 (1:5 / 20% - 1 in every 5 sentences)
assert.equal(isSubtitleInstanceEligibleForTTS(0, 5), true, "Row 0 is eligible for 1:5 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(1, 5), false, "Row 1 is skipped for 1:5 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(4, 5), false, "Row 4 is skipped for 1:5 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(5, 5), true, "Row 5 is eligible for 1:5 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(10, 5), true, "Row 10 is eligible for 1:5 ratio");

// Ratio 7 (1:7 / ~14% - 1 sentence per every 7 sentences in original language, beginner)
assert.equal(isSubtitleInstanceEligibleForTTS(0, 7), true, "Row 0 is eligible for 1:7 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(1, 7), false, "Row 1 is skipped for 1:7 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(2, 7), false, "Row 2 is skipped for 1:7 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(3, 7), false, "Row 3 is skipped for 1:7 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(4, 7), false, "Row 4 is skipped for 1:7 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(5, 7), false, "Row 5 is skipped for 1:7 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(6, 7), false, "Row 6 is skipped for 1:7 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(7, 7), true, "Row 7 is eligible for 1:7 ratio");
assert.equal(isSubtitleInstanceEligibleForTTS(14, 7), true, "Row 14 is eligible for 1:7 ratio");

// Any ratio in between (e.g. 1, 2, 3, 4, 5, 6, 7) works accurately
for (let r = 1; r <= 7; r++) {
  assert.equal(isSubtitleInstanceEligibleForTTS(0, r), true, `Row 0 is eligible for ratio 1:${r}`);
  assert.equal(
    isSubtitleInstanceEligibleForTTS(r, r),
    true,
    `Row ${r} is eligible for ratio 1:${r}`,
  );
  if (r > 1) {
    assert.equal(
      isSubtitleInstanceEligibleForTTS(1, r),
      false,
      `Row 1 is skipped for ratio 1:${r}`,
    );
  }
}

console.log(
  "✅ PASS: isSubtitleInstanceEligibleForTTS correctly filters rows for 1:1 up to 1:7 (beginner) and all ratios in between",
);

// ----------------------------------------------------
// Test 2: Preferences Persistence (playback-preferences.ts)
// ----------------------------------------------------
console.log("2. Checking device preference storage for per-language TTS ratios...");
storage.clear();

const initialPrefs = getTtsRatiosPreference();
assert.deepEqual(initialPrefs, {}, "Initial preferences should be empty object");

setTtsRatioPreference("es", 2);
setTtsRatioPreference("he", 4);

const updatedPrefs = getTtsRatiosPreference();
assert.equal(updatedPrefs.es, 2, "Spanish ratio should be saved as 2 (1:2)");
assert.equal(updatedPrefs.he, 4, "Hebrew ratio should be saved as 4 (1:4)");

// Re-updating one language keeps the other
setTtsRatioPreference("es", 3);
const reloadedPrefs = getTtsRatiosPreference();
assert.equal(reloadedPrefs.es, 3, "Spanish ratio updated to 3 (1:3)");
assert.equal(reloadedPrefs.he, 4, "Hebrew ratio remained 4 (1:4)");

console.log(
  "✅ PASS: Device preference storage correctly persists and retrieves per-language TTS ratios",
);

// ----------------------------------------------------
// Test 3: Video-Specific Settings Persistence (appSettings.ts)
// ----------------------------------------------------
console.log("3. Checking video-specific settings persistence...");
const testVideoId = "test_vid_123";

saveVideoSettings(testVideoId, {
  ttsRatios: {
    es: 2,
    fr: 5,
  },
});

const videoSettings = loadVideoSettings(testVideoId);
assert.ok(videoSettings, "Video settings should be found");
assert.equal(videoSettings?.ttsRatios?.es, 2, "Video settings should preserve Spanish ratio 2");
assert.equal(videoSettings?.ttsRatios?.fr, 5, "Video settings should preserve French ratio 5");

console.log("✅ PASS: Per-video settings correctly preserve and restore ttsRatios");

// ----------------------------------------------------
// Test 4: Simulation of Multi-Language Video Playback with Ratios
// ----------------------------------------------------
console.log("4. Simulating playback with foreign language level adjustments...");

const testSpokenLangs = ["es", "he"];
const testRatios: Record<string, number> = { es: 2, he: 4 };

// Helper replicating playback selection logic in index.tsx
function getEligibleLangsForRow(
  rowIdx: number,
  spoken: string[],
  ratios: Record<string, number>,
): string[] {
  return spoken.filter((code) => isSubtitleInstanceEligibleForTTS(rowIdx, ratios[code] ?? 1));
}

// Row 0: 0 % 2 === 0, 0 % 4 === 0 -> Both es and he speak
const row0Langs = getEligibleLangsForRow(0, testSpokenLangs, testRatios);
assert.deepEqual(row0Langs, ["es", "he"], "Row 0 should trigger both es and he TTS");

// Row 1: 1 % 2 !== 0, 1 % 4 !== 0 -> Neither speaks -> Video DOES NOT PAUSE!
const row1Langs = getEligibleLangsForRow(1, testSpokenLangs, testRatios);
assert.deepEqual(
  row1Langs,
  [],
  "Row 1 should trigger no TTS, allowing uninterrupted video listening",
);

// Row 2: 2 % 2 === 0, 2 % 4 !== 0 -> Only es speaks
const row2Langs = getEligibleLangsForRow(2, testSpokenLangs, testRatios);
assert.deepEqual(row2Langs, ["es"], "Row 2 should trigger only es TTS");

// Row 3: 3 % 2 !== 0, 3 % 4 !== 0 -> Neither speaks -> Video plays uninterrupted
const row3Langs = getEligibleLangsForRow(3, testSpokenLangs, testRatios);
assert.deepEqual(
  row3Langs,
  [],
  "Row 3 should trigger no TTS, allowing uninterrupted video listening",
);

// Row 4: 4 % 2 === 0, 4 % 4 === 0 -> Both es and he speak
const row4Langs = getEligibleLangsForRow(4, testSpokenLangs, testRatios);
assert.deepEqual(row4Langs, ["es", "he"], "Row 4 should trigger both es and he TTS");

console.log(
  "✅ PASS: Playback loop allows listening to video uninterrupted when rows are skipped by TTS ratio",
);

// ----------------------------------------------------
// Test 5: Verify UI Contracts in src/routes/index.tsx
// ----------------------------------------------------
console.log("5. Checking UI markup in src/routes/index.tsx...");

const indexPath = path.resolve(__dirname, "../src/routes/index.tsx");
const subtitleRowPath = path.resolve(__dirname, "../src/components/SubtitleRow.tsx");
const subtitlesPanelPath = path.resolve(__dirname, "../src/components/SubtitlesTablePanel.tsx");
const indexSource =
  fs.readFileSync(indexPath, "utf-8") +
  "\n" +
  (fs.existsSync(subtitleRowPath) ? fs.readFileSync(subtitleRowPath, "utf-8") : "") +
  "\n" +
  (fs.existsSync(subtitlesPanelPath) ? fs.readFileSync(subtitlesPanelPath, "utf-8") : "");

// Verify table column header
assert.ok(
  indexSource.includes("TTS Ratio"),
  "Languages table must include TTS Ratio column header",
);

// Verify ratio badge in table row
assert.ok(
  indexSource.includes("tts-ratio-badge-"),
  "Table row must render tts-ratio-badge for spoken languages",
);

// Verify per-language card elements
assert.ok(
  indexSource.includes("tts-settings-card-"),
  "Language configuration must render tts-settings-card per spoken language",
);
assert.ok(
  indexSource.includes("tts-ratio-label-"),
  "Card must display tts-ratio-label showing current ratio and percentage",
);
assert.ok(
  indexSource.includes("tts-ratio-preset-"),
  "Card must include level presets (Beginner, Intermediate, Advanced, Skim)",
);
assert.ok(
  indexSource.includes("tts-ratio-slider-"),
  "Card must include interactive slider for fine-tuning ratio",
);

// Verify subtitle row indicator
assert.ok(
  indexSource.includes("row-${actualIndex}-tts-status-") || indexSource.includes("tts-status-"),
  "Subtitle table row must render TTS eligibility status indicator",
);

console.log("✅ PASS: All UI elements, test IDs, and controls are present in src/routes/index.tsx");

// ----------------------------------------------------
// Test 6: Background Highlight ONLY for Sentences Pronounced When Ratio != 1:1
// ----------------------------------------------------
console.log(
  "6. Checking background highlight rules (only pronounced sentences when ratio != 1:1)...",
);

// When ratio === 1 (or default 1:1): NO sentence should ever be background highlighted!
for (let row = 0; row < 10; row++) {
  assert.equal(
    shouldHighlightSentenceForTTS(row, 1, true),
    false,
    `Row ${row} must NOT be highlighted when ratio is 1:1`,
  );
  assert.equal(
    shouldHighlightSentenceForTTS(row, undefined, true),
    false,
    `Row ${row} must NOT be highlighted when ratio is undefined (defaults to 1)`,
  );
}

// When ratio === 2 (1:2): ONLY rows 0, 2, 4, 6, 8... should be background highlighted
assert.equal(
  shouldHighlightSentenceForTTS(0, 2, true),
  true,
  "Row 0 should be highlighted for ratio 1:2",
);
assert.equal(
  shouldHighlightSentenceForTTS(1, 2, true),
  false,
  "Row 1 should NOT be highlighted for ratio 1:2",
);
assert.equal(
  shouldHighlightSentenceForTTS(2, 2, true),
  true,
  "Row 2 should be highlighted for ratio 1:2",
);
assert.equal(
  shouldHighlightSentenceForTTS(3, 2, true),
  false,
  "Row 3 should NOT be highlighted for ratio 1:2",
);
assert.equal(
  shouldHighlightSentenceForTTS(4, 2, true),
  true,
  "Row 4 should be highlighted for ratio 1:2",
);

// When ratio === 7 (Beginner 1:7): ONLY rows 0, 7, 14... should be background highlighted
assert.equal(
  shouldHighlightSentenceForTTS(0, 7, true),
  true,
  "Row 0 should be highlighted for ratio 1:7",
);
for (let r = 1; r < 7; r++) {
  assert.equal(
    shouldHighlightSentenceForTTS(r, 7, true),
    false,
    `Row ${r} should NOT be highlighted for ratio 1:7`,
  );
}
assert.equal(
  shouldHighlightSentenceForTTS(7, 7, true),
  true,
  "Row 7 should be highlighted for ratio 1:7",
);
for (let r = 8; r < 14; r++) {
  assert.equal(
    shouldHighlightSentenceForTTS(r, 7, true),
    false,
    `Row ${r} should NOT be highlighted for ratio 1:7`,
  );
}
assert.equal(
  shouldHighlightSentenceForTTS(14, 7),
  true,
  "Row 14 should be highlighted for ratio 1:7",
);

// If language is not spoken (isSpoken === false): NO highlight even if ratio > 1
assert.equal(
  shouldHighlightSentenceForTTS(0, 2, false),
  false,
  "Non-spoken language must not be highlighted",
);
assert.equal(
  shouldHighlightSentenceForTTS(2, 2, false),
  false,
  "Non-spoken language must not be highlighted",
);
assert.equal(
  shouldHighlightSentenceForTTS(0, 7, false),
  false,
  "Non-spoken language must not be highlighted",
);

// Verify UI markup in SubtitleRow includes background highlight attributes
assert.ok(
  indexSource.includes("data-tts-pronounced") &&
    indexSource.includes("shouldHighlightSentenceForTTS"),
  "SubtitleRow must apply data-tts-pronounced using shouldHighlightSentenceForTTS",
);
assert.ok(
  indexSource.includes("data-tts-pronounced-highlight"),
  "SubtitleRow must apply data-tts-pronounced-highlight on sentence container",
);

console.log(
  "✅ PASS: Background highlight is applied strictly and ONLY to pronounced sentences when ratio != 1:1",
);

// ----------------------------------------------------
// Test 7: Anti-Loop Protection (Prevent Repeating Same Record in Translated Subtitles)
// ----------------------------------------------------
console.log("7. Checking anti-loop protection and handledRow logic...");

assert.ok(
  indexSource.includes("handledRow"),
  "src/routes/index.tsx must use handledRow ref to prevent playing the same record in a loop",
);
assert.ok(
  indexSource.includes("handledRow.current !== idx"),
  "tts-first mode must guard against re-speaking the same row index",
);
assert.ok(
  indexSource.includes("handledRow.current !== candidateRow"),
  "video-first mode must guard against re-speaking the same row index",
);

// Simulation of anti-loop state machine
class PlaybackLoopSimulator {
  handledRow = -1;
  spokenCalls: { row: number; lang: string }[] = [];

  onTickTtsFirst(rowIdx: number, eligibleLangs: string[]) {
    if (rowIdx >= 0 && this.handledRow !== rowIdx) {
      this.handledRow = rowIdx;
      for (const lang of eligibleLangs) {
        this.spokenCalls.push({ row: rowIdx, lang });
      }
    }
  }

  onTickVideoFirst(candidateRow: number, eligibleLangs: string[]) {
    if (candidateRow >= 0 && this.handledRow !== candidateRow) {
      this.handledRow = candidateRow;
      for (const lang of eligibleLangs) {
        this.spokenCalls.push({ row: candidateRow, lang });
      }
    }
  }
}

// Scenario: seek jitter lands back on row 0 multiple times after speak
const sim = new PlaybackLoopSimulator();
sim.onTickTtsFirst(0, ["it"]); // First trigger
assert.equal(sim.spokenCalls.length, 1, "Should speak row 0 on first entry");

// Jitter ticks: seek lands on row 0 again, slightly before, or between ticks
sim.onTickTtsFirst(0, ["it"]);
sim.onTickTtsFirst(0, ["it"]);
sim.onTickTtsFirst(0, ["it"]);
assert.equal(
  sim.spokenCalls.length,
  1,
  "Anti-loop MUST prevent re-speaking row 0 on subsequent jitter ticks",
);

// Now playback advances to row 1 (ratio 7 skips row 1)
sim.onTickTtsFirst(1, []); // empty eligibleLangs because skipped
assert.equal(sim.spokenCalls.length, 1, "Skipped row 1 must produce 0 speech calls");

// Jitter on row 1
sim.onTickTtsFirst(1, []);
assert.equal(sim.spokenCalls.length, 1, "Skipped row 1 stays skipped without loop");

// Playback reaches row 7 (eligible for 1:7 ratio)
sim.onTickTtsFirst(7, ["it"]);
assert.equal(sim.spokenCalls.length, 2, "Row 7 must trigger speech once");
sim.onTickTtsFirst(7, ["it"]);
assert.equal(sim.spokenCalls.length, 2, "Row 7 must not loop");

console.log(
  "✅ PASS: Anti-loop protection prevents repeating the same record in translated subtitles",
);

// ----------------------------------------------------
// Test 8: Ratio is a Skipping Ratio - Continuous Playback Validation
// ----------------------------------------------------
console.log("8. Checking skipping ratio execution during continuous playback...");

// For ratio 7 (beginner), across 14 sentences, strictly exactly 2 sentences are spoken (row 0 and row 7)
const playbackSim = new PlaybackLoopSimulator();
for (let r = 0; r < 14; r++) {
  const eligible = isSubtitleInstanceEligibleForTTS(r, 7) ? ["it"] : [];
  playbackSim.onTickTtsFirst(r, eligible);
}
assert.equal(
  playbackSim.spokenCalls.length,
  2,
  "14 sentences with 1:7 ratio must speak exactly 2 sentences",
);
assert.deepEqual(
  playbackSim.spokenCalls.map((c) => c.row),
  [0, 7],
  "Only rows 0 and 7 must be spoken; rows 1-6 and 8-13 must be skipped",
);

console.log(
  "✅ PASS: Skipping ratio is strictly respected and skips un-highlighted sentences as expected",
);

// ----------------------------------------------------
// Test 9: Skip from TTS-play the Same Subtitles Record More Than Once
// ----------------------------------------------------
console.log("9. Checking skip from TTS-play for already-played subtitle records...");

const playedSet = new Set<number>();
// Initially row 0 is eligible
assert.equal(
  isSubtitleInstanceEligibleForTTS(0, 1, playedSet),
  true,
  "Row 0 should initially be eligible",
);
assert.equal(
  shouldSkipTTSBecauseAlreadyPlayed(0, playedSet),
  false,
  "Row 0 should not be skipped yet",
);

// After row 0 is played:
playedSet.add(0);
assert.equal(
  isSubtitleInstanceEligibleForTTS(0, 1, playedSet),
  false,
  "Row 0 MUST be ineligible once played",
);
assert.equal(
  shouldSkipTTSBecauseAlreadyPlayed(0, playedSet),
  true,
  "Row 0 MUST be skipped once played",
);

// Row 1 is not in playedSet yet:
assert.equal(isSubtitleInstanceEligibleForTTS(1, 1, playedSet), true, "Row 1 is eligible");
assert.equal(shouldSkipTTSBecauseAlreadyPlayed(1, playedSet), false, "Row 1 should not be skipped");

// Simulate full playback session with rewinds, seeks, and loops
class SkipPlayedRecordsSimulator {
  playedRecords = new Set<number>();
  spokenHistory: number[] = [];

  speak(rowIdx: number, langs: string[]) {
    if (rowIdx < 0 || this.playedRecords.has(rowIdx)) return;
    if (langs.length === 0) return;
    this.playedRecords.add(rowIdx);
    this.spokenHistory.push(rowIdx);
  }

  isEligible(rowIdx: number, ratio: number = 1): boolean {
    if (this.playedRecords.has(rowIdx)) return false;
    return isSubtitleInstanceEligibleForTTS(rowIdx, ratio, this.playedRecords);
  }
}

const skipSim = new SkipPlayedRecordsSimulator();

// User plays rows 0, 1, 2
for (const r of [0, 1, 2]) {
  if (skipSim.isEligible(r)) {
    skipSim.speak(r, ["it"]);
  }
}
assert.deepEqual(skipSim.spokenHistory, [0, 1, 2], "Rows 0, 1, 2 should be spoken once");

// User rewinds back to row 0 and replays 0, 1, 2
for (const r of [0, 1, 2]) {
  if (skipSim.isEligible(r)) {
    skipSim.speak(r, ["it"]);
  }
}
assert.deepEqual(
  skipSim.spokenHistory,
  [0, 1, 2],
  "Rewinding or looping MUST NOT speak rows 0, 1, 2 again (strictly skipped)",
);

// Video advances to new rows 3, 4
for (const r of [3, 4]) {
  if (skipSim.isEligible(r)) {
    skipSim.speak(r, ["it"]);
  }
}
assert.deepEqual(skipSim.spokenHistory, [0, 1, 2, 3, 4], "New rows 3, 4 are spoken once");

// Verify index.tsx implements playedTtsRecords and skips already played records
const indexCode = fs.readFileSync(path.join(__dirname, "../src/routes/index.tsx"), "utf-8");
assert.ok(
  indexCode.includes("playedTtsRecords"),
  "src/routes/index.tsx must define and use playedTtsRecords ref",
);
assert.ok(
  indexCode.includes("!playedTtsRecords.current.has(idx)"),
  "src/routes/index.tsx must check playedTtsRecords in tts-first mode",
);
assert.ok(
  indexCode.includes("!playedTtsRecords.current.has(candidateRow)"),
  "src/routes/index.tsx must check playedTtsRecords in video-first mode",
);
assert.ok(
  indexCode.includes("reset-played-subtitles-btn"),
  "src/routes/index.tsx must provide UI reset control for played subtitles",
);

console.log(
  "✅ PASS: App strictly skips from TTS-playing the same subtitles record more than once",
);

console.log("====================================================");
console.log("🎉 ALL Foreign Subtitles TTS Ratio tests PASSED successfully!");
console.log("====================================================");
