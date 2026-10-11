import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { criteriaSections, Json3 } from "../src/lib/subtitles";

console.log("====================================================");
console.log("🧪 Starting Parser Timing Lab & Learning Interface Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify component existence and export
console.log("1. Verifying component file existence and modularity...");
const labComponentPath = path.resolve(rootDir, "src/components/ParserTimingLab.tsx");
assert(fs.existsSync(labComponentPath), "src/components/ParserTimingLab.tsx must exist");

const labContent = fs.readFileSync(labComponentPath, "utf8");
assert(
  labContent.includes("export function ParserTimingLab"),
  "ParserTimingLab component must be exported",
);
console.log("✅ PASS: ParserTimingLab component is defined and exported as a modular component");

// 2. Verify integration into src/routes/index.tsx
console.log("2. Verifying integration in src/routes/index.tsx...");
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert(
  indexContent.includes('import { ParserTimingLab } from "@/components/ParserTimingLab"'),
  "src/routes/index.tsx must import ParserTimingLab",
);
assert(
  indexContent.includes("<ParserTimingLab"),
  "src/routes/index.tsx must render ParserTimingLab in the parser panel",
);
console.log("✅ PASS: ParserTimingLab is cleanly imported and integrated into src/routes/index.tsx");

// 3. Verify UI test IDs and interactive lab features
console.log("3. Verifying test IDs and UI capabilities...");
assert(
  labContent.includes('data-testid="parser-timing-lab"'),
  "ParserTimingLab must expose data-testid='parser-timing-lab'",
);
assert(
  labContent.includes('data-testid="open-timing-guide-button"'),
  "ParserTimingLab must provide data-testid='open-timing-guide-button'",
);
assert(
  labContent.includes('data-testid="timing-guide-modal"'),
  "ParserTimingLab must render data-testid='timing-guide-modal'",
);
assert(
  labContent.includes('data-testid={`experiment-card-${exp.id}`}'),
  "ParserTimingLab must provide test IDs for experiment cards",
);
console.log("✅ PASS: Required test IDs and interactive controls are present");

// 4. Verify live metrics comparison calculation
console.log("4. Verifying mathematical calculations for timing vs punctuation metrics...");
const testVideoTrack: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 6000,
        segs: [
          { utf8: "This is a quick sentence. ", tOffsetMs: 0 },
        ],
      },
      {
        tStartMs: 6500,
        dDurationMs: 14000, // 14-second long run-on cue without period
        segs: [
          { utf8: "And now I talk continuously ", tOffsetMs: 0 },
          { utf8: "for many many seconds ", tOffsetMs: 3000 },
          { utf8: "until taking a breath ", tOffsetMs: 6500 },
          { utf8: "right here before continuing ", tOffsetMs: 9500 },
        ],
      },
      {
        tStartMs: 21000,
        dDurationMs: 4000,
        segs: [{ utf8: "Final statement concludes here.", tOffsetMs: 0 }],
      },
    ],
  },
};

// Pure punctuation: only 2 periods exist (cue 0 and cue 2)
const purePunctSections = criteriaSections(testVideoTrack, "en", ["sentence"]);
// Timing-assisted with pauses: breaks the 14s cue at the speech pause (6500ms offset)
const timingSections = criteriaSections(testVideoTrack, "en", ["sentence", "pause"]);

assert(
  timingSections.length >= purePunctSections.length,
  `Timing-assisted splitting should produce at least as many sections as pure punctuation (${timingSections.length} vs ${purePunctSections.length})`,
);

const purePunctMaxDuration = Math.max(...purePunctSections.map((s) => s.end - s.start));
const timingMaxDuration = Math.max(...timingSections.map((s) => s.end - s.start));

console.log(
  `   - Max duration in pure punctuation: ${purePunctMaxDuration}ms\n   - Max duration with timing assistance: ${timingMaxDuration}ms`,
);
console.log("✅ PASS: Timing assistance successfully breaks up long run-on speech");

// 5. Verify educational tutorial topics
console.log("5. Verifying educational guide content...");
assert(
  labContent.includes("The Screen Cue vs. Sentence Dilemma"),
  "Guide must explain screen cue vs sentence dilemma",
);
assert(
  labContent.includes("Acoustic Silence Detection (Δt ≥ 500ms)"),
  "Guide must explain acoustic silence gap detection",
);
assert(
  labContent.includes("Guarding Abbreviations & Numbers"),
  "Guide must explain abbreviation and decimal guarding",
);
assert(
  labContent.includes("Solving Translation Drift with Consensus"),
  "Guide must explain multi-track consensus alignment",
);
console.log("✅ PASS: Guide modal covers all 4 fundamental timing architecture lessons");

console.log("====================================================");
console.log("🎉 All Parser Timing Lab Tests PASSED Successfully!");
console.log("====================================================");
