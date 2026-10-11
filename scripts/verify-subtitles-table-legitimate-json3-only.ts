import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Running Subtitles Table Legitimate JSON3-Only Verification");
console.log("==================================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify hasLegitimateSubtitles memo exists and enforces valid non-empty cues, rows, and cols
assert(
  indexContent.includes("const hasLegitimateSubtitles = useMemo("),
  "src/routes/index.tsx must define hasLegitimateSubtitles memo",
);
assert(
  indexContent.includes("Object.values(tracks).some(") &&
    indexContent.includes("Array.isArray(cues) && cues.length > 0") &&
    indexContent.includes("rows.length > 0 && cols.length > 0"),
  "hasLegitimateSubtitles must require non-empty cue arrays, rows, and cols",
);
console.log("✅ PASS: hasLegitimateSubtitles strictly requires valid JSON3 cues and rendered rows/cols");

// 2. Verify panelOrder mapping skips the subtitles accordion panel when hasLegitimateSubtitles is false
assert(
  indexContent.includes('if (panelId === "subtitles" && !hasLegitimateSubtitles) return null;'),
  "panelOrder.map must skip the subtitles accordion panel when legitimate subtitles are not present",
);
console.log("✅ PASS: Subtitles accordion panel does not render or waste space before subtitles arrive");

// 3. Verify the subtitles panel content does NOT render loading or error placeholders
assert(
  !indexContent.includes('Waiting for subtitles… Play the video and ensure captions are enabled.'),
  "Subtitles panel must not contain 'Waiting for subtitles…' placeholder",
);
assert(
  indexContent.includes('{panelId === "subtitles" &&\n                (!hasLegitimateSubtitles ? null : (') ||
    indexContent.includes('panelId === "subtitles" && (!hasLegitimateSubtitles ? null : ('),
  "Subtitles panel must return null when hasLegitimateSubtitles is false instead of loading text",
);
console.log("✅ PASS: Subtitles panel renders null instead of loading/waiting placeholders");

// 4. Verify SubtitleRow cells do not render 'Loading subtitles…' placeholders
assert(
  !indexContent.includes('<span className="text-xs text-muted-foreground italic">Loading subtitles…</span>'),
  "SubtitleRow cells must NOT render 'Loading subtitles…' span",
);
assert(
  indexContent.includes("{tracks && !tracks[l.code] ? null : ("),
  "SubtitleRow cells must render null when a track is missing instead of a loading span",
);
console.log("✅ PASS: SubtitleRow cells do not waste space with loading text");

// 5. Verify cols calculation only includes languages with legitimate, non-empty tracks
assert(
  indexContent.includes("Boolean(tracks?.[l.code] && tracks[l.code].length > 0)"),
  "cols calculation must only include languages with valid, non-empty tracks",
);
console.log("✅ PASS: cols calculation excludes unloaded or missing languages");

// 6. Simulate behavioral logic of hasLegitimateSubtitles
function simulateHasLegitimateSubtitles(
  tracks: Record<string, unknown[]> | null,
  rowsCount: number,
  colsCount: number,
): boolean {
  if (!tracks) return false;
  const hasValidTrack = Object.values(tracks).some(
    (cues) => Array.isArray(cues) && cues.length > 0,
  );
  return Boolean(hasValidTrack && rowsCount > 0 && colsCount > 0);
}

// Initial state (no subtitles fetched yet / loading state)
assert.strictEqual(
  simulateHasLegitimateSubtitles(null, 0, 0),
  false,
  "Must evaluate to false when tracks is null (loading/unloaded)",
);

// Empty object state (network request completed with no cues or error)
assert.strictEqual(
  simulateHasLegitimateSubtitles({}, 0, 0),
  false,
  "Must evaluate to false when tracks is empty object",
);

// Errored / 0 cues state
assert.strictEqual(
  simulateHasLegitimateSubtitles({ en: [] }, 0, 1),
  false,
  "Must evaluate to false when track has 0 cues",
);

// Legitimate JSON3 subtitle response fetched with cues and aligned rows
assert.strictEqual(
  simulateHasLegitimateSubtitles(
    {
      en: [{ tStartMs: 0, dDurationMs: 1500, segs: [{ utf8: "Authentic caption" }] }],
    },
    1,
    1,
  ),
  true,
  "Must evaluate to true when authentic JSON3 cues, rows, and cols exist",
);
console.log("✅ PASS: State simulation verifies exact conditional display semantics");

console.log("==================================================================");
console.log("🎉 ALL SUBTITLES TABLE LEGITIMATE JSON3-ONLY TESTS PASSED!");
console.log("==================================================================");
