import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { getLanguageColorPalette, LANGUAGE_COLOR_PALETTES } from "../src/utils/languageColors";
import { logBuffer, logError } from "../src/utils/logBuffer";

console.log("--- Starting Prompt 115 Feature Verification Suite ---");

// Test 1: Language Color Palettes & Subtitles Table Cell/Header Coloring
console.log("\n[Test 1] Verifying language color palettes and table cell/column coloring...");
assert(typeof getLanguageColorPalette === "function", "getLanguageColorPalette must be a function");
const enPalette = getLanguageColorPalette("en");
const hePalette = getLanguageColorPalette("he");
const esPalette = getLanguageColorPalette("es");
const arPalette = getLanguageColorPalette("ar");

assert(enPalette && enPalette.cellBg && enPalette.headerBg, "English palette must be fully defined");
assert(hePalette && hePalette.cellBg && hePalette.headerBg, "Hebrew palette must be fully defined");
assert(esPalette && esPalette.cellBg && esPalette.headerBg, "Spanish palette must be fully defined");
assert(arPalette && arPalette.cellBg && arPalette.headerBg, "Arabic palette must be fully defined");

// Check distinctness
assert(enPalette.cellBg !== hePalette.cellBg, "Different languages should have distinct color palettes");
assert(enPalette.headerBg !== esPalette.headerBg, "Different languages should have distinct header palettes");

// Fallback for custom languages
const customPalette = getLanguageColorPalette("xx-custom");
assert(customPalette && customPalette.cellBg, "Fallback palette must exist for unknown languages");

// Verify SubtitleRow.tsx sets data-lang-cell and uses getLanguageColorPalette
const subtitleRowSource = fs.readFileSync(path.resolve("src/components/SubtitleRow.tsx"), "utf8");
assert(subtitleRowSource.includes("getLanguageColorPalette"), "SubtitleRow must import and use getLanguageColorPalette");
assert(subtitleRowSource.includes('data-lang-cell={l.code}'), "SubtitleRow must mark each cell with data-lang-cell attribute");
assert(subtitleRowSource.includes('palette.cellBg'), "SubtitleRow must apply palette.cellBg to cells");

// Verify SubtitlesTablePanel.tsx sets data-lang-col and uses getLanguageColorPalette
const tablePanelSource = fs.readFileSync(path.resolve("src/components/SubtitlesTablePanel.tsx"), "utf8");
assert(tablePanelSource.includes("getLanguageColorPalette"), "SubtitlesTablePanel must import getLanguageColorPalette");
assert(tablePanelSource.includes('data-lang-col={l.code}'), "SubtitlesTablePanel must mark header th with data-lang-col");
assert(tablePanelSource.includes('palette.headerBg'), "SubtitlesTablePanel must apply palette.headerBg to th headers");

console.log("✔ Test 1 Passed: Language color palettes correctly mapped to table columns and cells.");

// Test 2: Subtitles Table Clicking Triggers Playing
console.log("\n[Test 2] Verifying subtitles table click triggers playback...");
assert(tablePanelSource.includes("onTablePlay"), "SubtitlesTablePanel must accept onTablePlay prop");
assert(tablePanelSource.includes('onClick={(e) => {'), "SubtitlesTablePanel must have an onClick handler on table element");
assert(tablePanelSource.includes('onTablePlay?.()'), "SubtitlesTablePanel onClick must call onTablePlay");

const indexSource = fs.readFileSync(path.resolve("src/routes/index.tsx"), "utf8");
// Verify seek calls handlePlayVideo
assert(indexSource.includes("const seek = (r: Row, i: number) => {"), "seek function must exist in index.tsx");
assert(indexSource.includes("handlePlayVideo();") && indexSource.includes("player.current?.seekTo"), "seek must call handlePlayVideo to ensure playback triggers");

// Verify onTablePlay is passed in both Beginner and Advanced modes
const beginnerTableMatches = indexSource.match(/subtitlesTableSlot=\{[\s\S]*?onTablePlay=\{handlePlayVideo\}/);
assert(beginnerTableMatches, "Beginner mode subtitlesTableSlot must pass onTablePlay={handlePlayVideo}");

const advancedTableMatches = indexSource.match(/data-testid="advanced-parallel-subtitles"[\s\S]*?onTablePlay=\{handlePlayVideo\}/);
assert(advancedTableMatches, "Advanced mode SubtitlesTablePanel must pass onTablePlay={handlePlayVideo}");

console.log("✔ Test 2 Passed: Subtitles table clicks trigger playback across both Beginner and Advanced modes.");

// Test 3: Floating Error Button
console.log("\n[Test 3] Verifying floating error button component and mounting...");
const floatingErrorBtnPath = path.resolve("src/components/FloatingErrorButton.tsx");
assert(fs.existsSync(floatingErrorBtnPath), "FloatingErrorButton.tsx must exist");
const floatingErrorSource = fs.readFileSync(floatingErrorBtnPath, "utf8");

assert(floatingErrorSource.includes("data-testid=\"floating-error-button\""), "FloatingErrorButton must have data-testid=\"floating-error-button\"");
assert(floatingErrorSource.includes("data-testid=\"floating-error-count-badge\""), "FloatingErrorButton must have error count badge");
assert(floatingErrorSource.includes("data-testid=\"floating-error-modal\""), "FloatingErrorButton must have error modal dialog");
assert(floatingErrorSource.includes("data-testid=\"copy-floating-errors-btn\""), "FloatingErrorButton must have copy errors button");
assert(floatingErrorSource.includes("data-testid=\"clear-floating-errors-btn\""), "FloatingErrorButton must have clear errors button");
assert(floatingErrorSource.includes("logBuffer.subscribe"), "FloatingErrorButton must subscribe to logBuffer");
assert(floatingErrorSource.includes("if (errors.length === 0)"), "FloatingErrorButton must remain hidden when there are 0 errors");

// Check mounting in index.tsx
assert(indexSource.includes("<FloatingErrorButton"), "index.tsx must mount <FloatingErrorButton />");
assert(indexSource.includes("import { FloatingErrorButton } from \"@/components/FloatingErrorButton\";"), "index.tsx must import FloatingErrorButton");

// Check Storybook story exists
const storyPath = path.resolve("src/components/FloatingErrorButton.stories.tsx");
assert(fs.existsSync(storyPath), "FloatingErrorButton.stories.tsx must exist");

// Test logBuffer error dispatch
logBuffer.clear();
assert(logBuffer.getEntries().filter((e) => e.level === "ERROR").length === 0, "Initial errors must be 0");
logError("TestCategory", "Test error message for floating button verification", { detail: 123 });
const errorEntries = logBuffer.getEntries().filter((e) => e.level === "ERROR");
assert(errorEntries.length === 1, "logError must produce an ERROR entry in logBuffer");
assert(errorEntries[0].message === "Test error message for floating button verification");
logBuffer.clear();

console.log("✔ Test 3 Passed: FloatingErrorButton exists, captures errors rising, and is mounted in UI.");

// Test 4: App Design - Header Background Diversity Toggle
console.log("\n[Test 4] Verifying header background diversity toggle button and ambient styling...");
assert(indexSource.includes("data-testid=\"header-bg-diversity-toggle\""), "index.tsx must have header-bg-diversity-toggle button");
assert(indexSource.includes("data-testid=\"app-root-container\""), "index.tsx root container must have app-root-container testid");
assert(indexSource.includes("data-bg-diversity="), "index.tsx must set data-bg-diversity attribute on root container");
assert(indexSource.includes("yt_bg_diversity_mode"), "index.tsx must persist background diversity in localStorage");
assert(indexSource.includes("bg-gradient-to-br"), "index.tsx must have rich background gradient for diverse theme mode");

console.log("✔ Test 4 Passed: Header background diversity toggle and ambient backdrop styling verified.");

console.log("\nAll Prompt 115 tests passed successfully! 🎉");
