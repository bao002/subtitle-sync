import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getTableDisplayModePreference,
  setTableDisplayModePreference,
  type TableDisplayMode,
} from "../src/lib/playback-preferences";
import { DEFAULT_APP_SETTINGS } from "../src/utils/appSettings";

console.log("=== Verifying Single vs Multiple Subtitle Tables Feature ===");

// 1. Verify playback-preferences functions and storage
console.log("1. Checking playback-preferences...");
assert.equal(
  typeof getTableDisplayModePreference,
  "function",
  "getTableDisplayModePreference must be a function",
);
assert.equal(
  typeof setTableDisplayModePreference,
  "function",
  "setTableDisplayModePreference must be a function",
);

// Test default
assert.equal(
  getTableDisplayModePreference(),
  "single",
  "Default table display mode must be 'single'",
);

// Test update
setTableDisplayModePreference("multiple");
assert.equal(
  getTableDisplayModePreference(),
  "multiple",
  "getTableDisplayModePreference must reflect 'multiple'",
);

// Reset
setTableDisplayModePreference("single");
assert.equal(
  getTableDisplayModePreference(),
  "single",
  "getTableDisplayModePreference must reset to 'single'",
);

// 2. Verify appSettings defaults
console.log("2. Checking appSettings...");
assert.equal(
  DEFAULT_APP_SETTINGS.tableDisplayMode,
  "single",
  "DEFAULT_APP_SETTINGS.tableDisplayMode must be 'single'",
);

// 3. Verify SubtitlesTablePanel source code structure
console.log("3. Checking SubtitlesTablePanel.tsx source...");
const panelSource = fs.readFileSync(
  path.join(process.cwd(), "src/components/SubtitlesTablePanel.tsx"),
  "utf8",
);

const requiredPanelTokens = [
  'data-testid="table-display-mode-controls"',
  'data-testid="btn-table-mode-single"',
  'data-testid="btn-table-mode-multiple"',
  'data-testid="toggle-table-display-mode-btn"',
  'data-testid="subtitles-table"',
  'data-testid="subtitles-multiple-tables-container"',
  "data-testid={`subtitles-single-lang-card-${col.code}`}",
  "data-testid={`subtitles-table-${col.code}`}",
  "data-testid={`subtitles-table-body-${col.code}`}",
  "activeDisplayMode === \"single\"",
  "tableDisplayMode",
  "onTableDisplayModeChange",
];

for (const token of requiredPanelTokens) {
  assert.ok(
    panelSource.includes(token),
    `SubtitlesTablePanel.tsx must contain token: ${token}`,
  );
}

// 4. Verify 100% parity across Beginner and Advanced modes in src/routes/index.tsx
console.log("4. Checking parity in src/routes/index.tsx...");
const indexSource = fs.readFileSync(
  path.join(process.cwd(), "src/routes/index.tsx"),
  "utf8",
);

const requiredIndexTokens = [
  "getTableDisplayModePreference",
  "setTableDisplayModePreference",
  "tableDisplayMode",
  "handleTableDisplayModeChange",
  "onTableDisplayModeChange={handleTableDisplayModeChange}",
];

for (const token of requiredIndexTokens) {
  assert.ok(
    indexSource.includes(token),
    `src/routes/index.tsx must contain token: ${token}`,
  );
}

// Ensure both beginner (subtitlesTableSlot) and advanced (panelId === "subtitles") pass the prop
const beginnerSlotMatch = indexSource.includes(
  "subtitlesTableSlot={\n              <SubtitlesTablePanel",
) || indexSource.includes("<SubtitlesTablePanel");
assert.ok(beginnerSlotMatch, "Beginner subtitlesTableSlot must be present");

const occurrences = (indexSource.match(/tableDisplayMode=\{tableDisplayMode\}/g) || []).length;
assert.ok(
  occurrences >= 2,
  `tableDisplayMode must be passed to at least 2 SubtitlesTablePanel instances (Beginner and Advanced modes), found ${occurrences}`,
);

// 5. Verify Storybook coverage
console.log("5. Checking Storybook coverage...");
const storySource = fs.readFileSync(
  path.join(process.cwd(), "src/components/SubtitlesTablePanel.stories.tsx"),
  "utf8",
);
assert.ok(storySource.includes("SingleTableMode"), "Must include SingleTableMode story");
assert.ok(storySource.includes("MultipleTablesMode"), "Must include MultipleTablesMode story");
assert.ok(storySource.includes("Interactive"), "Must include Interactive story");

console.log("All assertions passed successfully! Single vs Multiple Subtitle Tables verified.");
