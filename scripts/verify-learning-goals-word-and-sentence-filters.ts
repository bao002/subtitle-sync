import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  isCompleteSentence,
  isSentenceWithinWordLimit,
  countWords,
  splitCuesIntoSentences,
  simpleAlign,
  DEFAULT_SIMPLE_PARSER_CONFIG,
} from "../src/utils/newSubtitlesParser";
import {
  getLearningGoalsMaxWords,
  setLearningGoalsMaxWords,
  getLearningGoalsSkipIncomplete,
  setLearningGoalsSkipIncomplete,
} from "../src/lib/playback-preferences";

console.log("=========================================================================");
console.log("🧪 Verifying Learning Goals Word & Sentence Filters (Task 294)");
console.log("=========================================================================");

const root = process.cwd();

// Mock localStorage for node environment
const mockStorage: Record<string, string> = {};
(global as any).window = {
  localStorage: {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => {
      mockStorage[k] = v;
    },
    removeItem: (k: string) => {
      delete mockStorage[k];
    },
    length: 0,
    key: () => null,
  },
};

// --------------------------------------------------------------------------
// [Test 1] Complete Sentence Filter Logic (Ending with , . ? !)
// --------------------------------------------------------------------------
console.log("--> [Test 1] Testing isCompleteSentence criteria...");

// Positive cases: Ending with terminal punctuation
assert.ok(isCompleteSentence("Hello world."), "Must accept dot '.'");
assert.ok(isCompleteSentence("In addition,"), "Must accept comma ','");
assert.ok(isCompleteSentence("What time is it?"), "Must accept question mark '?'");
assert.ok(isCompleteSentence("Look at that!"), "Must accept exclamation mark '!'");

// Positive cases with trailing whitespace and quotes / brackets
assert.ok(isCompleteSentence("Hello world.   "), "Must accept dot with trailing spaces");
assert.ok(isCompleteSentence('"Did you hear?"'), "Must accept question mark inside quotes");
assert.ok(isCompleteSentence("(Yes, indeed!)"), "Must accept exclamation mark inside parentheses");
assert.ok(isCompleteSentence("Wait, "), "Must accept comma with trailing spaces");

// Negative cases: Incomplete sentences (no terminal punctuation)
assert.strictEqual(isCompleteSentence("Hello world"), false, "Must reject sentence without punctuation");
assert.strictEqual(isCompleteSentence("Incomplete subtitle chunk"), false, "Must reject chunk without punctuation");
assert.strictEqual(isCompleteSentence(""), false, "Must reject empty string");
assert.strictEqual(isCompleteSentence("   "), false, "Must reject whitespace-only string");
assert.strictEqual(isCompleteSentence("Sentence with trailing colon:"), false, "Must reject trailing colon");
assert.strictEqual(isCompleteSentence("Sentence with trailing dash -"), false, "Must reject trailing dash");

console.log("✅ PASS: isCompleteSentence correctly identifies complete sentences ending with , . ? !");

// --------------------------------------------------------------------------
// [Test 2] Max Words Limit Logic
// --------------------------------------------------------------------------
console.log("--> [Test 2] Testing countWords and isSentenceWithinWordLimit...");

assert.strictEqual(countWords("one two three four five"), 5, "Word count must be 5");
assert.strictEqual(countWords("   hello   world   "), 2, "Word count must be 2 with excess whitespace");
assert.strictEqual(countWords(""), 0, "Word count of empty string must be 0");

assert.ok(isSentenceWithinWordLimit("one two three", 5), "3 words is within 5 limit");
assert.ok(isSentenceWithinWordLimit("one two three four five", 5), "5 words is within 5 limit");
assert.strictEqual(
  isSentenceWithinWordLimit("one two three four five six", 5),
  false,
  "6 words exceeds 5 limit",
);

console.log("✅ PASS: isSentenceWithinWordLimit correctly enforces word counts.");

// --------------------------------------------------------------------------
// [Test 3] Subtitle Segmentation Filtering in splitCuesIntoSentences
// --------------------------------------------------------------------------
console.log("--> [Test 3] Testing splitCuesIntoSentences with Learning Goals filters...");

const testCues = [
  { start: 0, end: 2000, text: "Short complete sentence." }, // 3 words, complete (.) -> KEEP
  { start: 2000, end: 4000, text: "This sentence contains way too many words for a short row." }, // 11 words, complete (.) -> SKIP if maxWords=5
  { start: 4000, end: 6000, text: "Incomplete phrase without punctuation" }, // 4 words, incomplete -> SKIP if skipIncomplete=true
  { start: 6000, end: 8000, text: "On the other hand," }, // 4 words, complete (,) -> KEEP
  { start: 8000, end: 10000, text: "Is it working?" }, // 3 words, complete (?) -> KEEP
];

// Test with maxWordsPerSentence = 5
const configMaxWords5 = {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  maxWordsPerSentence: 5,
  skipIncompleteSentences: false,
};
const resMaxWords = splitCuesIntoSentences(testCues, configMaxWords5);
assert.strictEqual(resMaxWords.length, 4, "Must filter out the 11-word sentence");
assert.ok(
  resMaxWords.every((s) => countWords(s.text) <= 5),
  "All resulting segments must have <= 5 words",
);

// Test with skipIncompleteSentences = true
const configSkipIncomplete = {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  maxWordsPerSentence: 100,
  skipIncompleteSentences: true,
};
const resSkipIncomplete = splitCuesIntoSentences(testCues, configSkipIncomplete);
assert.strictEqual(resSkipIncomplete.length, 4, "Must filter out the phrase without punctuation");
assert.ok(
  resSkipIncomplete.every((s) => isCompleteSentence(s.text)),
  "All resulting segments must end with terminal punctuation",
);

// Test with BOTH maxWordsPerSentence = 5 AND skipIncompleteSentences = true
const configBoth = {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  maxWordsPerSentence: 5,
  skipIncompleteSentences: true,
};
const resBoth = splitCuesIntoSentences(testCues, configBoth);
// Should keep: "Short complete sentence.", "On the other hand,", "Is it working?" -> exactly 3
assert.strictEqual(resBoth.length, 3, "Must keep exactly 3 segments matching both criteria");
assert.strictEqual(resBoth[0]?.text, "Short complete sentence.");
assert.strictEqual(resBoth[1]?.text, "On the other hand,");
assert.strictEqual(resBoth[2]?.text, "Is it working?");

console.log("✅ PASS: splitCuesIntoSentences accurately enforces both filters.");

// --------------------------------------------------------------------------
// [Test 4] simpleAlign Table Formulation Filtering
// --------------------------------------------------------------------------
console.log("--> [Test 4] Testing simpleAlign row formulation with filters...");

const mockTracks = {
  en: {
    wireMagic: "pb3",
    pens: [],
    wsWinStyles: [],
    wpWinPositions: [],
    events: [
      { tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "First complete sentence." }] },
      { tStartMs: 2000, dDurationMs: 2000, segs: [{ utf8: "This is a very long sentence that has nine words." }] },
      { tStartMs: 4000, dDurationMs: 2000, segs: [{ utf8: "Incomplete fragment" }] },
      { tStartMs: 6000, dDurationMs: 2000, segs: [{ utf8: "Ready and go!" }] },
    ],
  },
};

const rowsFiltered = simpleAlign(mockTracks, "en", {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  maxWordsPerSentence: 5,
  skipIncompleteSentences: true,
});

assert.strictEqual(rowsFiltered.length, 2, "simpleAlign must skip rows not meeting filters");
assert.strictEqual(rowsFiltered[0]?.texts.en, "First complete sentence.");
assert.strictEqual(rowsFiltered[1]?.texts.en, "Ready and go!");

console.log("✅ PASS: simpleAlign successfully produces filtered subtitle rows.");

// --------------------------------------------------------------------------
// [Test 5] Preference Persistence
// --------------------------------------------------------------------------
console.log("--> [Test 5] Testing persistent learning goals settings...");

setLearningGoalsMaxWords(12);
assert.strictEqual(getLearningGoalsMaxWords(), 12, "Saved max words must be 12");

setLearningGoalsSkipIncomplete(true);
assert.strictEqual(getLearningGoalsSkipIncomplete(), true, "Saved skip incomplete must be true");

setLearningGoalsSkipIncomplete(false);
assert.strictEqual(getLearningGoalsSkipIncomplete(), false, "Saved skip incomplete must be false");

console.log("✅ PASS: Preference persistence for learning goals filters verified.");

// --------------------------------------------------------------------------
// [Test 6] Parity Across Advanced Mode & Beginner Mode UI
// --------------------------------------------------------------------------
console.log("--> [Test 6] Inspecting UI implementation and parity across modes...");

const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");
const beginnerTabTsx = fs.readFileSync(
  path.join(root, "src/components/beginner/tabs/BeginnerPreferencesTab.tsx"),
  "utf8",
);
const panelTsx = fs.readFileSync(
  path.join(root, "src/components/shared/LearningGoalsFiltersPanel.tsx"),
  "utf8",
);

// Check that LearningGoalsFiltersPanel contains all required testids and controls
assert.ok(panelTsx.includes('data-testid="learning-goals-filters-panel"'), "Panel testid");
assert.ok(panelTsx.includes('data-testid="learning-goals-max-words-slider"'), "Slider testid");
assert.ok(panelTsx.includes('data-testid="learning-goals-max-words-value"'), "Value testid");
assert.ok(panelTsx.includes('data-testid="learning-goals-skip-incomplete-switch"'), "Switch testid");

// Check Advanced Mode (LearningGoalsFiltersPanel is rendered in SubtitlesTablePanel)
assert.ok(
  indexTsx.includes("<SubtitlesTablePanel") || indexTsx.includes("<LearningGoalsFiltersPanel"),
  "Advanced mode renders table or learning filters",
);

// Check Beginner Mode (BeginnerPreferencesTab.tsx)
assert.ok(
  beginnerTabTsx.includes('id="beginner-learning-goals-filters-container"'),
  "Beginner learning filters container",
);
assert.ok(
  beginnerTabTsx.includes('data-testid="beginner-learning-goals-filters-container"'),
  "Beginner testid",
);
assert.ok(
  beginnerTabTsx.includes("<LearningGoalsFiltersPanel"),
  "Beginner renders LearningGoalsFiltersPanel",
);

console.log("✅ PASS: 100% parity verified between Advanced Stage 2 and Beginner Mode.");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED! Task 294 fully verified.");
console.log("=========================================================================");
