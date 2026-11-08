import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Task 360 - Subtitles Table Running Index Column");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: SubtitlesTablePanel table header verification
console.log("Test 1: Verifying SubtitlesTablePanel table header # running index...");
const panelSource = fs.readFileSync(path.join(rootDir, "src/components/SubtitlesTablePanel.tsx"), "utf8");

assert.ok(
  panelSource.includes('data-testid="table-header-index"'),
  "SubtitlesTablePanel must have table-header-index test id",
);

// Verify the index header is before the time header
const indexHeaderPos = panelSource.indexOf('data-testid="table-header-index"');
const timeHeaderPos = panelSource.indexOf('data-testid="table-header-time"');
assert.ok(
  indexHeaderPos !== -1 && timeHeaderPos !== -1 && indexHeaderPos < timeHeaderPos,
  "table-header-index must appear strictly BEFORE table-header-time in thead",
);

// Verify sticky left alignment when columns are frozen
assert.ok(
  panelSource.includes('shouldFreezeColumns ? "sticky left-0'),
  "table-header-index must freeze at sticky left-0",
);
assert.ok(
  panelSource.includes('shouldFreezeColumns ? "sticky left-14'),
  "table-header-time must freeze at sticky left-14",
);

// Verify empty notice colSpan accounts for the new column
assert.ok(
  panelSource.includes("colSpan={Math.max(1, cols.length + 2)}"),
  "SubtitlesTablePanel empty notice colSpan must be cols.length + 2",
);
console.log("✅ PASS: SubtitlesTablePanel header structure verified");

// Test 2: SubtitleRow cell verification
console.log("Test 2: Verifying SubtitleRow # running index cell...");
const rowSource = fs.readFileSync(path.join(rootDir, "src/components/SubtitleRow.tsx"), "utf8");

assert.ok(
  rowSource.includes('data-testid="cue-row-index"'),
  "SubtitleRow must have cue-row-index test id",
);

const indexCellPos = rowSource.indexOf('data-testid="cue-row-index"');
const timeCellPos = rowSource.indexOf('data-testid="cue-row-timestamp"');
assert.ok(
  indexCellPos !== -1 && timeCellPos !== -1 && indexCellPos < timeCellPos,
  "cue-row-index cell must appear strictly BEFORE cue-row-timestamp in tbody row",
);

// Verify 1-based index calculation
assert.ok(
  rowSource.includes("{actualIndex + 1}"),
  "SubtitleRow must render {actualIndex + 1} as the 1-based running index",
);

// Verify sticky left alignment on row cells
assert.ok(
  rowSource.includes('sticky left-0 z-10') && rowSource.includes('data-testid="cue-row-index"'),
  "cue-row-index cell must freeze at sticky left-0",
);
assert.ok(
  rowSource.includes('sticky left-14 z-10') && rowSource.includes('data-testid="cue-row-timestamp"'),
  "cue-row-timestamp cell must freeze at sticky left-14",
);
console.log("✅ PASS: SubtitleRow cell structure verified");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED: Subtitles Table Running Index Column Verified");
console.log("=========================================================================");
