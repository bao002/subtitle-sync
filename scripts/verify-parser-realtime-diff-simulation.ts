import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeParserDiff, type ParserDiffResult } from "../src/utils/parserDiffHelper";
import { align, DEFAULT_CRITERIA_SETTINGS, DEFAULT_PARSER_CRITERIA, type Json3 } from "../src/lib/subtitles";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("=== Verifying Parser Real-time Diff Simulation with Auto-Scroll to Differences Only ===");

// 1. Verify existence of ParserRealtimeSimulation component
const simulationComponentPath = path.join(rootDir, "src/components/ParserRealtimeSimulation.tsx");
assert(fs.existsSync(simulationComponentPath), "ParserRealtimeSimulation.tsx must exist");
const simulationSource = fs.readFileSync(simulationComponentPath, "utf-8");

// 2. Verify required attributes and elements in ParserRealtimeSimulation.tsx
assert(
  simulationSource.includes('data-testid="parser-realtime-simulation"'),
  "ParserRealtimeSimulation must include parser-realtime-simulation testid",
);
assert(
  simulationSource.includes('data-testid="auto-scroll-diff-toggle"'),
  "ParserRealtimeSimulation must include auto-scroll-diff-toggle checkbox",
);
assert(
  simulationSource.includes('data-testid="prev-diff-btn"'),
  "ParserRealtimeSimulation must include prev-diff-btn button",
);
assert(
  simulationSource.includes('data-testid="next-diff-btn"'),
  "ParserRealtimeSimulation must include next-diff-btn button",
);
assert(
  simulationSource.includes('data-testid="diff-sections-only"'),
  "ParserRealtimeSimulation must include diff-sections-only container",
);
assert(
  simulationSource.includes('data-testid={`diff-section-${idx}`}'),
  "ParserRealtimeSimulation must render each differing section with diff-section-${idx}",
);
assert(
  simulationSource.includes("scrollIntoView"),
  "ParserRealtimeSimulation must use scrollIntoView for smooth auto-scroll to diff appearance",
);
assert(
  simulationSource.includes("activeDiffIndex"),
  "ParserRealtimeSimulation must track activeDiffIndex for cycling through differences",
);
console.log("✓ ParserRealtimeSimulation component structure verified with auto-scroll and diff filtering.");

// 3. Verify wire-up in src/routes/index.tsx
const indexPath = path.join(rootDir, "src/routes/index.tsx");
const indexSource = fs.readFileSync(indexPath, "utf-8");

assert(
  indexSource.includes('import { ParserRealtimeSimulation } from "@/components/ParserRealtimeSimulation"'),
  "src/routes/index.tsx must import ParserRealtimeSimulation",
);
assert(
  indexSource.includes("realtimeParserDiff = useMemo"),
  "src/routes/index.tsx must compute realtimeParserDiff in useMemo",
);
assert(
  indexSource.includes("<ParserRealtimeSimulation"),
  "src/routes/index.tsx must render <ParserRealtimeSimulation",
);
assert(
  indexSource.includes('export { ParserRealtimeSimulation } from "@/components/ParserRealtimeSimulation"'),
  "src/routes/index.tsx must export ParserRealtimeSimulation",
);
console.log("✓ src/routes/index.tsx wiring verified with realtimeParserDiff and ParserRealtimeSimulation.");

// 4. Test dynamic simulation computation when parser option changes
const sampleTracks: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [{ utf8: "Hello world! This is a test sentence. " }],
      },
      {
        tStartMs: 4200,
        dDurationMs: 6000,
        segs: [{ utf8: "Here is Dr. Smith who has a 2.5 second pause. And another sentence! " }],
      },
    ],
  },
};

// Baseline: only punct
const baselineRows = align(sampleTracks, "en", ["punct"], DEFAULT_CRITERIA_SETTINGS);

// Simulated change: add pause criteria
const withPauseRows = align(sampleTracks, "en", ["punct", "pause"], {
  ...DEFAULT_CRITERIA_SETTINGS,
  pause: { minPauseMs: 1500 },
});

const diffResult: ParserDiffResult = computeParserDiff(baselineRows, withPauseRows, "en");

assert(typeof diffResult.hasChanges === "boolean", "diffResult hasChanges must be boolean");
assert(typeof diffResult.totalChanges === "number", "diffResult totalChanges must be number");
assert(Array.isArray(diffResult.changedRecords), "diffResult changedRecords must be an array");

// When only differing sections are shown, unchanged rows are excluded
diffResult.changedRecords.forEach((change, idx) => {
  assert(change.beforeRecords.length > 0 || change.afterRecords.length > 0, `Diff #${idx} must have records`);
  assert(change.timeRange.formatted, `Diff #${idx} must have a formatted time range`);
  assert(change.changeType, `Diff #${idx} must define a changeType`);
});
console.log(`✓ Real-time parser simulation diff verified: ${diffResult.totalChanges} difference(s) detected.`);

// 5. Test empty diff scenario (identical configuration)
const identicalDiff = computeParserDiff(baselineRows, baselineRows, "en");
assert.strictEqual(identicalDiff.hasChanges, false, "Identical configuration must produce no changes");
assert.strictEqual(identicalDiff.totalChanges, 0, "Identical configuration must have totalChanges = 0");
assert.strictEqual(identicalDiff.changedRecords.length, 0, "Identical configuration must have 0 changed records");
console.log("✓ Identical configuration correctly yields 0 changed sections.");

console.log("=== All Parser Real-time Diff Simulation Verifications Passed Successfully! ===");
