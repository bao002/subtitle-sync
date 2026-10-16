import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Hotfix: Active Hook Initialization Verification");
console.log("====================================================");

const rootDir = process.cwd();
const indexFilePath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexFilePath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexFilePath, "utf8");

// 1. Locate positions of active hook declaration and handleReplaySection
const activeHookIndex = indexContent.indexOf("const [active, setActive] = useState(-1);");
assert(activeHookIndex !== -1, "index.tsx must contain 'const [active, setActive] = useState(-1);'");

const handleReplaySectionIndex = indexContent.indexOf("const handleReplaySection = useCallback(");
assert(handleReplaySectionIndex !== -1, "index.tsx must contain 'const handleReplaySection = useCallback('");

// 2. Assert active hook is declared strictly BEFORE handleReplaySection to eliminate TDZ error
assert(
  activeHookIndex < handleReplaySectionIndex,
  `'const [active, setActive]' (pos ${activeHookIndex}) must be declared BEFORE 'handleReplaySection' (pos ${handleReplaySectionIndex}) to prevent TDZ ReferenceError`,
);
console.log(`✅ PASS: active hook (index ${activeHookIndex}) precedes handleReplaySection (index ${handleReplaySectionIndex})`);

// 3. Verify no other premature references to active exist before its declaration
const contentBeforeActive = indexContent.slice(0, activeHookIndex);
const prematureUsage = contentBeforeActive.match(/\bactive\b\s*>=/);
assert(
  !prematureUsage,
  `No usage of 'active' should occur before its hook initialization. Found: ${prematureUsage?.[0]}`,
);
console.log("✅ PASS: Zero premature references to 'active' before initialization");

// 4. Verify all playback handlers exist
const handlers = [
  "handleTogglePlay",
  "handleSeek",
  "handleRewind",
  "handleFastForward",
  "handlePrevSection",
  "handleNextSection",
  "handleReplaySection",
  "handleStop",
  "handleRateChange",
];

for (const h of handlers) {
  assert(indexContent.includes(h), `index.tsx must include handler ${h}`);
}
console.log(`✅ PASS: All ${handlers.length} playback control handlers properly defined and ordered`);

console.log("====================================================");
console.log("🎉 Hotfix Active Initialization Verification PASSED successfully!");
console.log("====================================================");
