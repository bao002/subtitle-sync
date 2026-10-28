import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Task 270: Special Characters Removal under Settings");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

// Section 1: Verify presence under Settings accordion (panelId === "playback")
console.log("\n⚙️ Section 1: Embedded inside Settings (Playback) Accordion");
assert(
  indexContent.includes('data-testid="settings-chars-removal-container"'),
  "Settings accordion must contain settings-chars-removal-container",
);

const playbackIdx = indexContent.indexOf('panelId === "playback"');
const charsRemovalInSettings = indexContent.indexOf(
  'data-testid="settings-chars-removal-container"',
);
const libraryIdx = indexContent.indexOf('panelId === "library"');

assert(playbackIdx !== -1, "playback accordion must exist");
assert(charsRemovalInSettings !== -1, "settings-chars-removal-container must exist");
assert(
  charsRemovalInSettings > playbackIdx && charsRemovalInSettings < libraryIdx,
  "Special characters removal must be situated within the Settings (playback) panel before library",
);
console.log("✅ PASS: Special Characters Removal is rendered directly under Settings");

// Section 2: Pipeline execution order verification
console.log("\n⛓️ Section 2: Pipeline Execution Order");
const parserIdx = indexContent.indexOf('panelId === "parser"');
assert(
  charsRemovalInSettings < parserIdx,
  "Chars Removal under Settings must still precede Parser in the DOM and pipeline order",
);
console.log("✅ PASS: Chars Removal precedes Parser, maintaining Stage 3 -> Stage 4 pipeline integrity");

console.log("\n=========================================================================");
console.log("🎉 ALL TASK 270 CHECKS PASSED 100%!");
console.log("=========================================================================");
