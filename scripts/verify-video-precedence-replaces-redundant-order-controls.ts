import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("VERIFY: Video Playback Precedence Bar Replaces Redundant Order Controls");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexTsxPath = path.resolve(rootDir, "src/routes/index.tsx");
const beginnerPrefsPath = path.resolve(
  rootDir,
  "src/components/beginner/PerLanguageTtsPreferences.tsx",
);

assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
assert(fs.existsSync(beginnerPrefsPath), "PerLanguageTtsPreferences.tsx must exist");

const indexContent = fs.readFileSync(indexTsxPath, "utf-8");
const beginnerContent = fs.readFileSync(beginnerPrefsPath, "utf-8");

// Test 1: Verify removal from Advanced Mode (src/routes/index.tsx)
console.log("\n[Test 1] Verifying removal of redundant order controls in Advanced Mode...");

// 1.1 In unified-languages-table: No "TTS Order" column header
assert(
  !indexContent.includes(">TTS Order<") && !indexContent.includes(">TTS Order</th>"),
  "unified-languages-table header must not contain 'TTS Order'",
);

// 1.2 In unified-languages-table rows: No LanguageTtsOrderSelect
assert(
  !indexContent.includes("<LanguageTtsOrderSelect"),
  "unified-languages-table rows must not render <LanguageTtsOrderSelect>",
);

// 1.3 In unified-languages-table: VideoPlaybackPrecedenceBar must use colSpan={9}
assert(
  indexContent.includes("colSpan={9}"),
  "VideoPlaybackPrecedenceBar in table must use colSpan={9} matching 9-column schema",
);
assert(
  !indexContent.includes("<VideoPlaybackPrecedenceBar\n                                                   asTableRow\n                                                   colSpan={10}") &&
    !indexContent.includes("colSpan={10}"),
  "No VideoPlaybackPrecedenceBar should use outdated colSpan={10}",
);

// 1.4 Redundant controls absent from Learning Goals, no redundant section-order-select
assert(
  !indexContent.includes('data-testid="section-order-select"'),
  "index.tsx must not render redundant section-order-select dropdown",
);

console.log("✅ PASS: Advanced Mode verified clean of redundant order controls with colSpan={9}.");

// Test 2: Verify removal from Beginner Mode (PerLanguageTtsPreferences.tsx)
console.log("\n[Test 2] Verifying removal of redundant order controls in Beginner Mode...");

// 2.1 No LanguageTtsOrderSelect in language cards
assert(
  !beginnerContent.includes("<LanguageTtsOrderSelect"),
  "Beginner cards must not render <LanguageTtsOrderSelect>",
);

// 2.2 Redundant section-order-select is absent
assert(
  !beginnerContent.includes('data-testid="beginner-section-order-select"'),
  "Beginner mode must not render redundant beginner-section-order-select dropdown",
);

// 2.3 VideoPlaybackPrecedenceBar is present and active
assert(
  beginnerContent.includes("<VideoPlaybackPrecedenceBar"),
  "Beginner mode must render VideoPlaybackPrecedenceBar",
);

console.log("✅ PASS: Beginner Mode verified with full functional parity.");

// Test 3: Verify single precedence authority
console.log("\n[Test 3] Verifying VideoPlaybackPrecedenceBar acts as single precedence authority...");
assert(
  indexContent.includes("VideoPlaybackPrecedenceBar"),
  "index.tsx must contain VideoPlaybackPrecedenceBar",
);
assert(
  indexContent.includes("handleSetVideoBarPosition"),
  "index.tsx must wire handleSetVideoBarPosition to update precedence",
);

console.log("✅ PASS: VideoPlaybackPrecedenceBar acts as single precedence authority.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Redundant controls cleanly replaced by precedence bar!");
console.log("=========================================================================");
