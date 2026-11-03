import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  splitCuesIntoSentences,
  simpleAlign,
  DEFAULT_SIMPLE_PARSER_CONFIG,
  SimpleParserConfig,
} from "../src/utils/newSubtitlesParser";

console.log("=========================================================================");
console.log("🧪 Verifying Row Criteria in Subtitles Table View & Stage 3 Languages Hide (Task 296)");
console.log("=========================================================================");

const root = process.cwd();

// --------------------------------------------------------------------------
// [Test 1] Verify Stage 3 Hides Language Settings in src/routes/index.tsx
// --------------------------------------------------------------------------
console.log("--> [Test 1] Verifying Stage 3 hides language settings in index.tsx...");

const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

// Stage 3 filtering check
assert.ok(
  indexTsx.includes("if (currentAccordionStage === 3)"),
  "Must have Stage 3 filtering condition in index.tsx",
);

// Ensure Stage 3 returns only player and subtitles, excluding languages
const stage3Start = indexTsx.indexOf("if (currentAccordionStage === 3)");
assert.ok(stage3Start !== -1, "Stage 3 block must exist in index.tsx");
const stage3Block = indexTsx.slice(stage3Start, stage3Start + 500);
assert.ok(
  !stage3Block.includes('panelId === "languages"'),
  "Stage 3 must NOT include panelId === 'languages' (language settings hidden on stage 3)",
);
assert.ok(
  stage3Block.includes('panelId === "player" || panelId === "subtitles"'),
  "Stage 3 must return panelId === 'player' || panelId === 'subtitles'",
);

console.log("✅ PASS: Stage 3 hides language settings (configured in Stage 2) and presents player + subtitles table.");

// --------------------------------------------------------------------------
// [Test 2] Verify Row Criteria in src/components/SubtitlesTablePanel.tsx
// --------------------------------------------------------------------------
console.log("--> [Test 2] Verifying Row Criteria in SubtitlesTablePanel.tsx...");

const subtitlesTableTsx = fs.readFileSync(
  path.join(root, "src/components/SubtitlesTablePanel.tsx"),
  "utf8",
);

assert.ok(
  subtitlesTableTsx.includes('import { LearningGoalsFiltersPanel } from "@/components/shared/LearningGoalsFiltersPanel"'),
  "SubtitlesTablePanel must import LearningGoalsFiltersPanel",
);
assert.ok(
  subtitlesTableTsx.includes('id="subtitles-table-row-criteria-container"'),
  "Must contain subtitles-table-row-criteria-container id",
);
assert.ok(
  subtitlesTableTsx.includes('data-testid="subtitles-table-row-criteria-container"'),
  "Must contain subtitles-table-row-criteria-container testid",
);
assert.ok(
  subtitlesTableTsx.includes('data-testid="toggle-row-criteria-visibility-btn"'),
  "Must provide collapse/expand toggle button for row criteria",
);
assert.ok(
  subtitlesTableTsx.includes("<LearningGoalsFiltersPanel"),
  "SubtitlesTablePanel must render LearningGoalsFiltersPanel",
);
assert.ok(
  subtitlesTableTsx.includes("activeParserConfig.maxWordsPerSentence"),
  "Must bind maxWords to activeParserConfig.maxWordsPerSentence",
);
assert.ok(
  subtitlesTableTsx.includes("activeParserConfig.skipIncompleteSentences"),
  "Must bind skipIncompleteSentences to activeParserConfig.skipIncompleteSentences",
);
assert.ok(
  subtitlesTableTsx.includes("handleParserConfigChange"),
  "Must call handleParserConfigChange on filter changes",
);

console.log("✅ PASS: SubtitlesTablePanel correctly renders Row Criteria directly above the table with dynamic binding.");

// --------------------------------------------------------------------------
// [Test 3] Verify Stage 2 Row Criteria Notice & Link to Table in index.tsx
// --------------------------------------------------------------------------
console.log("--> [Test 3] Verifying Stage 2 references Subtitles Table view...");

assert.ok(
  indexTsx.includes('id="stage-2-learning-filters-container"'),
  "Stage 2 must retain stage-2-learning-filters-container container",
);
assert.ok(
  indexTsx.includes("Row Criteria: Subtitle Row Filters"),
  "Stage 2 must explain that Row Criteria is dynamic in the Subtitles Table view",
);
assert.ok(
  indexTsx.includes("Open Subtitles Table"),
  "Stage 2 must offer a direct button to Open Subtitles Table (Stage 3)",
);

console.log("✅ PASS: Stage 2 gracefully informs users that Row Criteria is active and dynamic in the Subtitles Table.");

// --------------------------------------------------------------------------
// [Test 4] Verify Dynamic Subtitle Filtering when Parser Config Changes
// --------------------------------------------------------------------------
console.log("--> [Test 4] Testing dynamic table row update behavior on parser config changes...");

const mockCues = [
  { start: 0, end: 1500, text: "Short sentence one." },
  { start: 1500, end: 3500, text: "This second sentence has many more words than the limit allows." },
  { start: 3500, end: 5000, text: "Incomplete phrase without punctuation mark" },
  { start: 5000, end: 6500, text: "Short sentence three." },
];

// Initial config: unlimited/default
const configA: SimpleParserConfig = {
  ...DEFAULT_SIMPLE_PARSER_CONFIG,
  maxWordsPerSentence: 50,
  skipIncompleteSentences: false,
};
const rowsA = splitCuesIntoSentences(mockCues, configA);
assert.strictEqual(rowsA.length, 4, "Config A keeps all 4 cues");

// Updated config: max 5 words
const configB: SimpleParserConfig = {
  ...configA,
  maxWordsPerSentence: 5,
};
const rowsB = splitCuesIntoSentences(mockCues, configB);
assert.strictEqual(rowsB.length, 3, "Config B filters out row with > 5 words");
assert.ok(!rowsB.some((r) => r.text.includes("many more words")), "Long row excluded");

// Updated config: complete sentences only
const configC: SimpleParserConfig = {
  ...configB,
  skipIncompleteSentences: true,
};
const rowsC = splitCuesIntoSentences(mockCues, configC);
assert.strictEqual(rowsC.length, 2, "Config C additionally filters out incomplete sentence");
assert.ok(rowsC.every((r) => /[.?!,]$/.test(r.text.trim())), "All kept rows end with punctuation");

console.log("✅ PASS: Dynamic row criteria filtering verified across config transitions.");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED! Task 296 fully verified.");
console.log("=========================================================================");
