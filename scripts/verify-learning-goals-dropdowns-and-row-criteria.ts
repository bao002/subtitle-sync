import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { countWords, isCompleteSentence, simpleAlign } from "../src/utils/newSubtitlesParser";

console.log("=========================================================================");
console.log("🧪 Verifying Task 388: Visible Global Row-Criteria, Dropdown Lists & Default Lang Filtering");
console.log("=========================================================================");

const rootDir = process.cwd();

// --- Test 1: SubtitlesTablePanel.tsx Visible Global Row-Criteria ---
console.log("\nTest 1: Auditing SubtitlesTablePanel.tsx for visible Row-Criteria and filtering...");
const tablePanelSource = fs.readFileSync(
  path.resolve(rootDir, "src/components/SubtitlesTablePanel.tsx"),
  "utf8",
);

assert.ok(
  !tablePanelSource.includes("false && showRowCriteria"),
  "SubtitlesTablePanel.tsx must NOT suppress showRowCriteria with false &&",
);

assert.ok(
  tablePanelSource.includes("showRowCriteria && ("),
  "SubtitlesTablePanel.tsx must render LearningGoalsFiltersPanel when showRowCriteria is true",
);

assert.ok(
  tablePanelSource.includes("effectiveDisplayedRows"),
  "SubtitlesTablePanel.tsx must compute effectiveDisplayedRows applying default language criteria",
);

assert.ok(
  tablePanelSource.includes("countWords(defText) > maxWords"),
  "SubtitlesTablePanel.tsx must filter out records exceeding maxWords in default language",
);

assert.ok(
  tablePanelSource.includes("effectiveDisplayedRows.length === 0"),
  "Table bodies must check effectiveDisplayedRows for empty notice and mapping",
);

console.log("✅ PASS: SubtitlesTablePanel.tsx has visible global Row-Criteria and filters by default language words.");

// --- Test 2: LearningGoalsFiltersPanel.tsx Dropdown Lists ---
console.log("\nTest 2: Auditing LearningGoalsFiltersPanel.tsx for dropdown lists...");
const filtersPanelSource = fs.readFileSync(
  path.resolve(rootDir, "src/components/shared/LearningGoalsFiltersPanel.tsx"),
  "utf8",
);

assert.ok(
  filtersPanelSource.includes("data-testid=\"learning-goals-max-words-dropdown\""),
  "LearningGoalsFiltersPanel must include max words dropdown selector",
);

assert.ok(
  filtersPanelSource.includes("data-testid=\"learning-goals-complete-sentence-dropdown\""),
  "LearningGoalsFiltersPanel must include complete sentence dropdown selector",
);

assert.ok(
  filtersPanelSource.includes("data-testid=\"learning-goals-add-language-dropdown\""),
  "LearningGoalsFiltersPanel must include language adder dropdown list",
);

assert.ok(
  filtersPanelSource.includes("learning-goals-lang-max-words-dropdown-"),
  "LearningGoalsFiltersPanel must include per-language max words dropdown",
);

assert.ok(
  filtersPanelSource.includes("learning-goals-lang-complete-dropdown-"),
  "LearningGoalsFiltersPanel must include per-language complete sentence dropdown",
);

assert.ok(
  filtersPanelSource.includes("learning-goals-lang-reset-"),
  "LearningGoalsFiltersPanel must include reset button for per-language criteria",
);

console.log("✅ PASS: LearningGoalsFiltersPanel.tsx provides dropdown lists and language criteria selectors.");

// --- Test 3: newSubtitlesParser.ts simpleAlign Respects Word Filter ---
console.log("\nTest 3: Auditing simpleAlign in newSubtitlesParser.ts...");
const parserSource = fs.readFileSync(
  path.resolve(rootDir, "src/utils/newSubtitlesParser.ts"),
  "utf8",
);

assert.ok(
  parserSource.includes("hasWordFilter"),
  "newSubtitlesParser.ts must check hasWordFilter before raw cue fallback",
);

// Functional test: verify that sentences with more than X words in default language are filtered
const sampleTracks = {
  en: {
    events: [
      { tStartMs: 0, dDurationMs: 2000, segs: [{ utf8: "Short sentence." }] }, // 2 words
      { tStartMs: 2000, dDurationMs: 4000, segs: [{ utf8: "This is a very long sentence with many words exceeding the limit." }] }, // 12 words
      { tStartMs: 6000, dDurationMs: 2000, segs: [{ utf8: "Another short one." }] }, // 3 words
    ],
  },
};

const rowsLimit5 = simpleAlign(sampleTracks, "en", {
  enabled: true,
  maxWordsPerSentence: 5,
  skipIncompleteSentences: false,
  splitOnDot: true,
  splitOnQuestion: true,
  splitOnExclamation: true,
  splitOnComma: false,
  splitOnColonSemicolon: false,
  splitIntraCue: false,
  shortCompleteSentences: false,
  customDelimiters: "",
  dotAbbreviationExceptions: "",
  wrapCoupledPunctuation: true,
});

assert.strictEqual(rowsLimit5.length, 2, "Rows should filter out the 12-word sentence when maxWords is 5");
assert.ok(
  rowsLimit5.every((r) => countWords(r.texts.en || "") <= 5),
  "All remaining rows must have at most 5 words in default language",
);

console.log("✅ PASS: simpleAlign strictly respects default language word limits.");

// --- Test 4: src/routes/index.tsx passes language criteria props to SubtitlesTablePanel ---
console.log("\nTest 4: Auditing src/routes/index.tsx for SubtitlesTablePanel prop integration...");
const indexSource = fs.readFileSync(
  path.resolve(rootDir, "src/routes/index.tsx"),
  "utf8",
);

assert.ok(
  indexSource.includes("languageMaxWords={languageMaxWords}"),
  "index.tsx must pass languageMaxWords to SubtitlesTablePanel",
);

assert.ok(
  indexSource.includes("onLanguageMaxWordsChange={handleLanguageMaxWordsChange}"),
  "index.tsx must pass onLanguageMaxWordsChange to SubtitlesTablePanel",
);

console.log("✅ PASS: src/routes/index.tsx synchronizes language criteria with SubtitlesTablePanel.");

console.log("=========================================================================");
console.log("🎉 ALL TASK 388 VERIFICATION CHECKS PASSED (4/4)!");
console.log("=========================================================================");
