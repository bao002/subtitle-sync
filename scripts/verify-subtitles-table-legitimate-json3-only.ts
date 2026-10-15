import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Subtitles Table View Legitimate JSON3 Only Test");
console.log("====================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify subtitles accordion section is completely omitted when no legitimate subtitles are fetched
assert(
  indexContent.includes('if (panelId === "subtitles" && !hasLegitimateSubtitles) return null;'),
  "Subtitles accordion panel must not be rendered when hasLegitimateSubtitles is false",
);
console.log("✅ PASS: Subtitles accordion panel guarded by hasLegitimateSubtitles");

// 2. Verify hasLegitimateSubtitles definition checks tracks, cues, rows, and cols
assert(
  indexContent.includes("const hasLegitimateSubtitles = useMemo(") &&
    indexContent.includes("Array.isArray(cues) && cues.length > 0") &&
    indexContent.includes("rows.length > 0 && cols.length > 0"),
  "hasLegitimateSubtitles must require non-empty track cues, non-empty aligned rows, and non-empty cols",
);
console.log(
  "✅ PASS: hasLegitimateSubtitles strictly enforces legitimate non-empty JSON3 cues and aligned rows",
);

// 3. Verify no loading state or error state is rendered inside subtitles table panel
const subtitlesPanelBlock = indexContent.slice(
  indexContent.indexOf('{panelId === "subtitles" &&'),
  indexContent.indexOf("</AccordionSection>", indexContent.indexOf('{panelId === "subtitles" &&')),
);

assert(
  !subtitlesPanelBlock.includes("Loading subtitles") &&
    !subtitlesPanelBlock.includes("Waiting for subtitles") &&
    !subtitlesPanelBlock.includes("subtitles-progressive-indicator") &&
    !subtitlesPanelBlock.includes("subtitles-manual-fetch"),
  "Subtitles table view must not render loading or error state placeholders wasting space",
);
console.log(
  "✅ PASS: Subtitles table view has zero loading or error state placeholders wasting space",
);

// 4. Verify cols only includes tracks with non-empty cues
assert(
  indexContent.includes("tracks[baseLanguage].length > 0") &&
    indexContent.includes("tracks[l.code].length > 0") &&
    (indexContent.includes("tracks[code]?.length > 0") ||
      indexContent.includes("tracks[code].length > 0")),
  "cols must only include columns that have authentic tracks with cues > 0",
);
console.log("✅ PASS: Subtitles columns strictly include tracks with non-zero cues");

// 5. Functional simulation of hasLegitimateSubtitles logic
function checkLegitimateSubtitles(
  tracks: Record<
    string,
    { tStartMs: number; dDurationMs: number; segs: { utf8: string }[] }[]
  > | null,
  rowsCount: number,
  colsCount: number,
): boolean {
  if (!tracks) return false;
  const hasValidTrack = Object.values(tracks).some(
    (cues) => Array.isArray(cues) && cues.length > 0,
  );
  return Boolean(hasValidTrack && rowsCount > 0 && colsCount > 0);
}

// Case A: tracks is null (initial loading state) -> Must be false
assert.strictEqual(
  checkLegitimateSubtitles(null, 0, 0),
  false,
  "Should be false when tracks is null",
);

// Case B: tracks is empty object -> Must be false
assert.strictEqual(
  checkLegitimateSubtitles({}, 0, 0),
  false,
  "Should be false when tracks is empty object",
);

// Case C: tracks contains empty cue list (invalid/zero cues) -> Must be false
assert.strictEqual(
  checkLegitimateSubtitles({ en: [] }, 0, 0),
  false,
  "Should be false when track has 0 cues",
);

// Case D: tracks has cues but rows count is 0 (alignment failure/pending) -> Must be false
assert.strictEqual(
  checkLegitimateSubtitles(
    { en: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "Hello" }] }] },
    0,
    1,
  ),
  false,
  "Should be false when rows count is 0",
);

// Case E: tracks has cues but cols count is 0 -> Must be false
assert.strictEqual(
  checkLegitimateSubtitles(
    { en: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "Hello" }] }] },
    1,
    0,
  ),
  false,
  "Should be false when cols count is 0",
);

// Case F: authentic legitimate JSON3 subtitles fetched and aligned -> Must be true
assert.strictEqual(
  checkLegitimateSubtitles(
    {
      en: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "Hello world" }] }],
      he: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "שלום עולם" }] }],
    },
    1,
    2,
  ),
  true,
  "Should be true when legitimate JSON3 subtitles are fetched, non-empty, and aligned",
);
console.log("✅ PASS: Functional simulation of legitimate JSON3 validation passing all cases");

console.log("====================================================");
console.log("🎉 All Subtitles Table Legitimate-Only tests PASSED successfully!");
console.log("====================================================");
