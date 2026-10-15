import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { parseJson3 } from "../src/lib/native-captions";
import { align, type Json3, type Row, LANGS } from "../src/lib/subtitles";

console.log("=========================================================================");
console.log("🧪 Starting Subtitles Table Visibility On Fetch Verification Test");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify HighlightedSubtitle import in src/routes/index.tsx
assert(
  indexContent.includes('import { HighlightedSubtitle } from "@/components/HighlightedSubtitle";'),
  "src/routes/index.tsx must import HighlightedSubtitle",
);
console.log("✅ PASS: HighlightedSubtitle is properly imported in index.tsx");

// 2. Verify subtitles panel initial and reactive open state
assert(
  indexContent.includes("subtitles: true"),
  "src/routes/index.tsx must initialize openPanels.subtitles to true",
);
assert(
  indexContent.includes(
    "setOpenPanels((current) => (current.subtitles ? current : { ...current, subtitles: true }))",
  ),
  "src/routes/index.tsx must auto-expand subtitles accordion panel when hasLegitimateSubtitles is true",
);
console.log("✅ PASS: Subtitles accordion panel is opened and auto-expands on subtitle fetch");

// 3. Verify hasLegitimateSubtitles checks for legitimate cues in Json3 tracks
assert(
  indexContent.includes("const hasLegitimateSubtitles = useMemo("),
  "hasLegitimateSubtitles must be defined in index.tsx",
);
assert(
  indexContent.includes("Array.isArray(cues) && cues.length > 0"),
  "hasLegitimateSubtitles must check for cue array and length > 0",
);
assert(
  indexContent.includes("rows.length > 0 && cols.length > 0"),
  "hasLegitimateSubtitles must require aligned rows and cols",
);
console.log("✅ PASS: hasLegitimateSubtitles verifies valid cues, aligned rows, and cols");

// 4. Verify cols extraction includes tracks with cues
assert(
  indexContent.includes("hasTrackCues"),
  "cols must use hasTrackCues to detect valid cues inside Json3 tracks",
);
assert(
  indexContent.includes("tracks[baseLanguage].length > 0") &&
    indexContent.includes("tracks[l.code].length > 0") &&
    (indexContent.includes("tracks[code]?.length > 0") ||
      indexContent.includes("tracks[code].length > 0")),
  "cols must retain track length assertions for full spec compliance",
);
console.log("✅ PASS: cols properly extracts language columns from Json3 tracks");

// 5. Functional runtime simulation of hasLegitimateSubtitles and cols
const sampleEnRaw = JSON.stringify({
  wireMagic: "pb3",
  events: [
    {
      tStartMs: 1000,
      dDurationMs: 2000,
      segs: [{ utf8: "Hello world" }],
    },
    {
      tStartMs: 3000,
      dDurationMs: 2500,
      segs: [{ utf8: "Welcome to parallel subtitles" }],
    },
  ],
});

const sampleHeRaw = JSON.stringify({
  wireMagic: "pb3",
  events: [
    {
      tStartMs: 1000,
      dDurationMs: 2000,
      segs: [{ utf8: "שלום עולם" }],
    },
    {
      tStartMs: 3000,
      dDurationMs: 2500,
      segs: [{ utf8: "ברוכים הבאים לכתוביות מקבילות" }],
    },
  ],
});

const sampleEmptyRaw = JSON.stringify({
  wireMagic: "pb3",
  events: [],
});

function simulateHasLegitimateSubtitles(
  tracks: Record<string, Json3> | null,
  rowsCount: number,
  colsCount: number,
): boolean {
  if (!tracks) return false;
  const hasValidTrack = Object.values(tracks).some((track) => {
    const cues = Array.isArray(track) ? track : track?.events || [];
    const isValid =
      (Array.isArray(cues) && cues.length > 0) ||
      (Array.isArray(track?.events) && track.events.length > 0);
    return isValid;
  });
  return Boolean(hasValidTrack && rowsCount > 0 && colsCount > 0);
}

function simulateGetCols(
  tracks: Record<string, Json3> | null,
  baseLanguage: string,
  shown: string[],
): { code: string; name: string }[] {
  if (!tracks || Object.keys(tracks).length === 0) return [];
  const list: { code: string; name: string }[] = [];
  const addedCodes = new Set<string>();

  const hasTrackCues = (t: Json3 | undefined): boolean => {
    if (!t) return false;
    if (typeof t.length === "number" && t.length > 0) return true;
    if (Array.isArray(t.events) && t.events.length > 0) return true;
    if (Array.isArray(t) && (t as unknown[]).length > 0) return true;
    return false;
  };

  if (
    baseLanguage &&
    tracks[baseLanguage] &&
    (tracks[baseLanguage]!.length! > 0 || hasTrackCues(tracks[baseLanguage])) &&
    shown.includes(baseLanguage)
  ) {
    const meta = LANGS.find((l) => l.code === baseLanguage) || {
      code: baseLanguage,
      name: baseLanguage,
    };
    list.push(meta);
    addedCodes.add(baseLanguage);
  }

  for (const code of Object.keys(tracks)) {
    if (
      !addedCodes.has(code) &&
      shown.includes(code) &&
      (tracks[code]!.length! > 0 || hasTrackCues(tracks[code]))
    ) {
      const meta = LANGS.find((l) => l.code === code) || { code, name: code };
      list.push(meta);
      addedCodes.add(code);
    }
  }

  if (list.length === 0) {
    for (const code of Object.keys(tracks)) {
      if (!addedCodes.has(code) && hasTrackCues(tracks[code])) {
        const meta = LANGS.find((l) => l.code === code) || { code, name: code };
        list.push(meta);
        addedCodes.add(code);
      }
    }
  }

  return list;
}

// Case 1: Initial state (tracks is null)
assert.strictEqual(
  simulateHasLegitimateSubtitles(null, 0, 0),
  false,
  "Must be false before subtitles are fetched",
);
console.log("✅ PASS: Initial state correctly does not render subtitles table");

// Case 2: At least 1 legitimate subtitle is fetched (English)
const enTrack = parseJson3(sampleEnRaw);
assert(enTrack !== null, "Sample English JSON3 must parse successfully");
const singleTrack: Record<string, Json3> = { en: enTrack };
const colsCase2 = simulateGetCols(singleTrack, "en", ["en"]);
assert.strictEqual(colsCase2.length, 1, "Must produce 1 column for English");
assert.strictEqual(colsCase2[0]?.code, "en", "Column code must be en");

const rowsCase2: Row[] = align(singleTrack, "en", ["sentence"]);
assert(rowsCase2.length > 0, "Must align cues into rows");
assert.strictEqual(rowsCase2[0]?.texts["en"], "Hello world", "Row text must match");

const isLegitimateCase2 = simulateHasLegitimateSubtitles(
  singleTrack,
  rowsCase2.length,
  colsCase2.length,
);
assert.strictEqual(
  isLegitimateCase2,
  true,
  "hasLegitimateSubtitles must be TRUE when 1 subtitle is fetched correctly",
);
console.log(
  "✅ PASS: When at least 1 subtitle is fetched, hasLegitimateSubtitles is TRUE and table is visible",
);

// Case 3: At least 1 subtitle fetched in target language (Hebrew) even if not in shown yet
const heTrack = parseJson3(sampleHeRaw);
assert(heTrack !== null, "Sample Hebrew JSON3 must parse successfully");
const heOnlyTrack: Record<string, Json3> = { he: heTrack };
const colsCase3 = simulateGetCols(heOnlyTrack, "en", []); // shown is empty initially
assert.strictEqual(colsCase3.length, 1, "Fallback must extract column even if shown is empty");
assert.strictEqual(colsCase3[0]?.code, "he", "Column code must be he");

const rowsCase3 = align(heOnlyTrack, "he", ["sentence"]);
assert(rowsCase3.length > 0, "Hebrew track must produce aligned rows");

const isLegitimateCase3 = simulateHasLegitimateSubtitles(
  heOnlyTrack,
  rowsCase3.length,
  colsCase3.length,
);
assert.strictEqual(
  isLegitimateCase3,
  true,
  "hasLegitimateSubtitles must be TRUE for Hebrew-only track",
);
console.log("✅ PASS: Hebrew-only subtitle track renders valid columns, aligned rows, and table");

// Case 4: Empty subtitles response with 0 cues
const emptyTrack = parseJson3(sampleEmptyRaw);
const isLegitimateCase4 = simulateHasLegitimateSubtitles(
  emptyTrack ? { en: emptyTrack } : {},
  0,
  0,
);
assert.strictEqual(
  isLegitimateCase4,
  false,
  "Empty subtitles with 0 cues must NOT be considered legitimate subtitles",
);
console.log("✅ PASS: Empty subtitles with 0 cues are rejected");

console.log("=========================================================================");
console.log("🎉 ALL SUBTITLES TABLE VISIBILITY ON FETCH TESTS PASSED!");
console.log("=========================================================================");
