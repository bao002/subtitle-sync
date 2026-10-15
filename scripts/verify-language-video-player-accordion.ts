import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { PANELS, ACCORDION_THEMES } from "../src/config/accordionThemes";

console.log("====================================================");
console.log("🧪 Starting Language Video Player Accordion Removal Verification");
console.log("====================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");

assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify accordion definition in PANELS does NOT include 'language-player'
const langPlayerPanel = PANELS.find((p) => p.id === ("language-player" as unknown));
assert(!langPlayerPanel, "PANELS must NOT include 'language-player' accordion definition");
assert(
  !(ACCORDION_THEMES as Record<string, unknown>)["language-player"],
  "ACCORDION_THEMES must NOT define theme for 'language-player'",
);
console.log("✅ PASS: 'language-player' accordion removed from PANELS and ACCORDION_THEMES");

// 2. Verify index.tsx does NOT render LanguageVideoPlayerPanel or language-player accordion section
assert(
  !indexContent.includes('panelId === "language-player"'),
  "src/routes/index.tsx must NOT contain 'panelId === \"language-player\"' check",
);
assert(
  !indexContent.includes("<LanguageVideoPlayerPanel"),
  "src/routes/index.tsx must NOT render <LanguageVideoPlayerPanel />",
);
assert(
  !indexContent.includes("import { LanguageVideoPlayerPanel }"),
  "src/routes/index.tsx must NOT import LanguageVideoPlayerPanel",
);
console.log("✅ PASS: LanguageVideoPlayerPanel is not rendered in index.tsx");

// 3. Verify the remaining expected accordion panels are intact and aligned
const expectedPanels = ["player", "playback", "parser", "languages", "subtitles", "library"];
const panelIds = PANELS.map((p) => p.id);
assert.deepStrictEqual(
  panelIds,
  expectedPanels,
  `PANELS must contain exactly [${expectedPanels.join(", ")}]`,
);
console.log(`✅ PASS: Active accordion panels match expected: [${expectedPanels.join(", ")}]`);

console.log("====================================================");
console.log("📊 LANGUAGE VIDEO PLAYER ACCORDION REMOVAL: All assertions passed successfully!");
console.log("====================================================");
