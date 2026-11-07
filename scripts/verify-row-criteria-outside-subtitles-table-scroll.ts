import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  splitCuesIntoSentences,
  DEFAULT_SIMPLE_PARSER_CONFIG,
  SimpleParserConfig,
} from "../src/utils/newSubtitlesParser";

console.log("=========================================================================");
console.log("🧪 Verifying Row Criteria Element Outside Subtitles Table Scroll View (Task 332)");
console.log("=========================================================================");

const root = process.cwd();

// --------------------------------------------------------------------------
// [Test 1] Verify subtitles-table-row-criteria-container is outside subtitles-table-panel
// --------------------------------------------------------------------------
console.log("--> [Test 1] Verifying row criteria is outside subtitles-table-panel...");

const subtitlesTableTsx = fs.readFileSync(
  path.join(root, "src/components/SubtitlesTablePanel.tsx"),
  "utf8",
);

const rowCriteriaPos = subtitlesTableTsx.indexOf('id="subtitles-table-row-criteria-container"');
const tablePanelPos = subtitlesTableTsx.indexOf('id="subtitles-table-panel"');

assert.ok(rowCriteriaPos !== -1, "Must contain subtitles-table-row-criteria-container id");
assert.ok(tablePanelPos !== -1, "Must contain subtitles-table-panel id");

assert.ok(
  rowCriteriaPos < tablePanelPos,
  "Row criteria container MUST appear BEFORE subtitles-table-panel in JSX (outside the scroll container)",
);

// Verify subtitles-table-panel has scrollable overflow
const panelSlice = subtitlesTableTsx.slice(tablePanelPos, tablePanelPos + 250);
assert.ok(
  panelSlice.includes("overflow-auto"),
  "subtitles-table-panel must be scrollable with overflow-auto",
);

// Verify subtitles-table-panel does not contain row-criteria-container inside its opening tag
assert.ok(
  !panelSlice.includes("subtitles-table-row-criteria-container"),
  "subtitles-table-panel must NOT contain subtitles-table-row-criteria-container inside its tree",
);

console.log("✅ PASS: Row criteria container is positioned outside subtitles-table-panel.");

// --------------------------------------------------------------------------
// [Test 2] Verify collapse/expand toggle and filter panel binding
// --------------------------------------------------------------------------
console.log("--> [Test 2] Verifying controls and filter binding inside row criteria...");

assert.ok(
  subtitlesTableTsx.includes('data-testid="toggle-row-criteria-visibility-btn"'),
  "Must provide collapse/expand toggle button for row criteria",
);
assert.ok(
  subtitlesTableTsx.includes("<LearningGoalsFiltersPanel"),
  "SubtitlesTablePanel must render LearningGoalsFiltersPanel in row criteria",
);
assert.ok(
  subtitlesTableTsx.includes("activeParserConfig.maxWordsPerSentence"),
  "Must bind maxWords to activeParserConfig.maxWordsPerSentence",
);
assert.ok(
  subtitlesTableTsx.includes("activeParserConfig.skipIncompleteSentences"),
  "Must bind skipIncompleteSentences to activeParserConfig.skipIncompleteSentences",
);

console.log("✅ PASS: Row criteria controls and bindings are fully preserved.");

// --------------------------------------------------------------------------
// [Test 3] Verify SubtitlesTablePanel usage in Advanced and Beginner modes
// --------------------------------------------------------------------------
console.log("--> [Test 3] Verifying SubtitlesTablePanel presence in Advanced and Beginner modes...");

const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");
assert.ok(
  indexTsx.includes("<SubtitlesTablePanel"),
  "SubtitlesTablePanel must be rendered in index.tsx",
);

const beginnerVideoTabTsx = fs.readFileSync(
  path.join(root, "src/components/beginner/tabs/BeginnerVideoTab.tsx"),
  "utf8",
);
assert.ok(
  beginnerVideoTabTsx.includes("{subtitlesTableSlot}"),
  "BeginnerVideoTab must render subtitlesTableSlot",
);

console.log("✅ PASS: SubtitlesTablePanel parity preserved across Advanced and Beginner modes.");

// --------------------------------------------------------------------------
// [Test 4] Functional Sentence Splitting & Dynamic Criteria Test
// --------------------------------------------------------------------------
console.log("--> [Test 4] Verifying sentence filtering behavior under row criteria...");

const mockCues = [
  { start: 0, end: 1200, text: "Hello world." },
  { start: 1200, end: 3000, text: "This sentence contains way too many words for a compact test." },
  { start: 3000, end: 4500, text: "Trailing clause without ending punctuation" },
];

const config: SimpleParserConfig = {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  maxWordsPerSentence: 5,
  skipIncompleteSentences: true,
};

const rows = splitCuesIntoSentences(mockCues, config);
assert.strictEqual(rows.length, 1, "Only one cue matches complete punctuation and <= 5 words");
assert.strictEqual(rows[0].text, "Hello world.");

console.log("✅ PASS: Sentence splitting dynamically adapts to row criteria filter settings.");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED! Task 332 fully verified.");
console.log("=========================================================================");
