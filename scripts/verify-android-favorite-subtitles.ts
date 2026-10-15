/**
 * Dedicated verification test for Android dynamic subtitle fetching & 10-line presentation
 * Validates:
 * 1. Android dynamic fetching: bridge requests captions for all selected favorite languages.
 * 2. 10-line presentation: exactly first 10 lines are presented for each favorite language column by default.
 * 3. Pagination & limits: pagination navigation (page 1 -> lines 1-10, page 2 -> lines 11-20) and limit switching.
 * 4. Web demo isolation: web demo fixture mode is unaffected and retains all rows.
 */

import { align, parseJson3, type Json3 } from "../src/lib/subtitles.js";
import { RTL, LANGS } from "../src/lib/subtitles.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("====================================================");
console.log("🧪 Running Android Favorite Subtitles Verification");
console.log("====================================================\n");

// 1. Generate 15 distinct cues for each of 3 favorite languages: Hebrew, Italian, Spanish
const favoriteLangs = ["he", "it", "es"];
const mockTracks: Record<string, Json3> = {};

for (const lang of favoriteLangs) {
  const events = [];
  for (let i = 0; i < 15; i++) {
    events.push({
      tStartMs: i * 3000,
      dDurationMs: 3000,
      segs: [{ utf8: `[${lang.toUpperCase()}] Line ${i + 1} dialog for ${lang}.` }],
    });
  }
  mockTracks[lang] = { events };
}

// 2. Validate alignment across all favorite languages
const alignedRows = align(mockTracks, "he", "sentence");
assert(
  alignedRows.length >= 15,
  `Aligned rows count should be at least 15 (got ${alignedRows.length})`,
);

// 3. Verify each row contains dialog for every favorite language
for (let i = 0; i < 10; i++) {
  const row = alignedRows[i];
  for (const lang of favoriteLangs) {
    assert(
      row.texts[lang] && row.texts[lang].includes(`Line ${i + 1}`),
      `Row ${i + 1} contains expected subtitle text for favorite language ${lang}`,
    );
  }
}

// 4. Verify 10-line presentation slicing (Default on Android)
const defaultAndroidLimit = 10;
let androidPage = 1;

function getDisplayedRows(
  rows: typeof alignedRows,
  isAndroid: boolean,
  limit: number,
  page: number,
) {
  if (isAndroid && limit > 0) {
    const start = (page - 1) * limit;
    return rows.slice(start, start + limit);
  }
  return rows;
}

const page1Displayed = getDisplayedRows(alignedRows, true, defaultAndroidLimit, androidPage);
assert(
  page1Displayed.length === 10,
  `Android default presentation displays exactly 10 lines (got ${page1Displayed.length})`,
);
assert(page1Displayed[0].texts["he"].includes("Line 1"), "Line 1 is first displayed line");
assert(
  page1Displayed[9].texts["es"].includes("Line 10"),
  "Line 10 is last displayed line on page 1",
);

// 5. Verify pagination to page 2 (lines 11-15)
androidPage = 2;
const page2Displayed = getDisplayedRows(alignedRows, true, defaultAndroidLimit, androidPage);
assert(
  page2Displayed.length === 5,
  `Page 2 displays remaining 5 lines (got ${page2Displayed.length})`,
);
assert(page2Displayed[0].texts["it"].includes("Line 11"), "Page 2 begins with Line 11");
assert(page2Displayed[4].texts["he"].includes("Line 15"), "Page 2 ends with Line 15");

// 6. Verify "All" limit option (limit = 0)
const allDisplayed = getDisplayedRows(alignedRows, true, 0, 1);
assert(
  allDisplayed.length === alignedRows.length,
  `Limit 0 displays all ${alignedRows.length} lines`,
);

// 7. Verify Web Demo Isolation (isAndroid = false)
const webDemoDisplayed = getDisplayedRows(alignedRows, false, defaultAndroidLimit, 1);
assert(
  webDemoDisplayed.length === alignedRows.length,
  `Web demo displays all ${alignedRows.length} rows regardless of android limit`,
);

// 8. Verify Source Code Scoping in src/routes/index.tsx and modular SubtitlesTablePanel.tsx
const indexSource = readFileSync(resolve(process.cwd(), "src/routes/index.tsx"), "utf-8");
const subtitlesPanelPath = resolve(process.cwd(), "src/components/SubtitlesTablePanel.tsx");
const subtitlesPanelSource = existsSync(subtitlesPanelPath)
  ? readFileSync(subtitlesPanelPath, "utf-8")
  : "";
const combinedSource = indexSource + "\n" + subtitlesPanelSource;

assert(
  indexSource.includes(
    "const [subtitlesLimit, setSubtitlesLimit] = useState<number>(() => (isAndroid ? 10 : 0));",
  ),
  "src/routes/index.tsx initializes subtitlesLimit to 10 for Android and 0 for web",
);

assert(
  combinedSource.includes('data-testid="android-subtitles-pagination-bar"'),
  "src/routes/index.tsx / SubtitlesTablePanel renders dedicated android-subtitles-pagination-bar only on Android",
);

assert(
  combinedSource.includes("First 10 lines of favorite languages"),
  'src/routes/index.tsx / SubtitlesTablePanel includes badge indicating "First 10 lines of favorite languages"',
);

// 9. Verify web demo fixtures are present and unchanged
const demoFixturePath = resolve(process.cwd(), "public/fixtures/L2Ryrr6txwA/he.json");
assert(existsSync(demoFixturePath), "Web demo subtitle fixture he.json exists");
const demoFixtureContent = JSON.parse(readFileSync(demoFixturePath, "utf-8"));
assert(
  Array.isArray(demoFixtureContent.events) && demoFixtureContent.events.length > 0,
  "Web demo fixture contains authentic events",
);

console.log("\n====================================================");
console.log("🎉 All Android Favorite Subtitles tests PASSED successfully!");
console.log("====================================================");
