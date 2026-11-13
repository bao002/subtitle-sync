import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Same Components Policy (Beginner & Advanced Mode — Only Order Differs)");
console.log("=========================================================================");

const root = process.cwd();
const read = (relPath: string) => fs.readFileSync(path.join(root, relPath), "utf8");

const agentsMd = read("AGENTS.md");
const indexTsx = read("src/routes/index.tsx");
const beginnerFlow = read("src/components/beginner/BeginnerFlowContainer.tsx");
const beginnerPrefs = read("src/components/beginner/tabs/BeginnerPreferencesTab.tsx");
const beginnerVideo = read("src/components/beginner/tabs/BeginnerVideoTab.tsx");
const beginnerTabNav = read("src/components/beginner/BeginnerTabNav.tsx");
const subtitlesTable = read("src/components/SubtitlesTablePanel.tsx");

// 1. Constitutional rule in AGENTS.md
assert.ok(
  agentsMd.includes("Same Components Policy (Only Order Differs)"),
  "AGENTS.md must formalize 'Same Components Policy (Only Order Differs)'",
);
assert.ok(
  agentsMd.includes("differ strictly in layout/sequence order"),
  "AGENTS.md must specify that Beginner and Advanced modes differ strictly in layout/sequence order",
);
console.log("✅ PASS: AGENTS.md defines the Same Components Policy (Only Order Differs).");

// 2. Every required shared component block must be wired in BOTH modes
const beginnerCombined = `${beginnerFlow}\n${beginnerPrefs}\n${beginnerVideo}`;
const beginnerCallMatch = indexTsx.match(/<BeginnerFlowContainer[\s\S]*?\/>\s*<\/div>\s*\) : \(/);
assert.ok(beginnerCallMatch, "index.tsx must mount <BeginnerFlowContainer /> for Beginner mode");
const beginnerSlotSection = beginnerCallMatch[0];
const advancedSection = indexTsx.slice(indexTsx.indexOf(beginnerCallMatch[0]) + beginnerCallMatch[0].length);

const SHARED_COMPONENTS = [
  "SpecialCharactersRemovalPanel",
  "SubtitlesTablePanel",
  "NewSubtitlesParserBar",
  "GlobalFavoriteLanguagesPanel",
  "LearningGoalsFiltersPanel",
  "PerformanceModeSettingsPanel",
  "LanguageBoxesSelector",
  "VideoPlaybackControls",
  "SwitchableDefaultSubtitlesBar",
  "LanguageRatioCompositionSelector",
  "TtsFallbackOrderSwitch",
  "CriticalCaptionsAlert",
  "AlternativeVideoPlayerView",
  "WordBalloonLearningView",
  "VideoLibraryPanel",
  "WebDemoUrlsInput",
] as const;

for (const componentName of SHARED_COMPONENTS) {
  const inAdvanced =
    advancedSection.includes(`<${componentName}`) ||
    (componentName === "NewSubtitlesParserBar" && subtitlesTable.includes(`<${componentName}`)) ||
    (componentName === "SpecialCharactersRemovalPanel" &&
      indexTsx.includes("const specialCharactersRemovalPanel =") &&
      advancedSection.includes("{specialCharactersRemovalPanel}"));

  const inBeginner =
    beginnerCombined.includes(`<${componentName}`) ||
    beginnerSlotSection.includes(`<${componentName}`) ||
    (componentName === "NewSubtitlesParserBar" && subtitlesTable.includes(`<${componentName}`)) ||
    (componentName === "SpecialCharactersRemovalPanel" &&
      beginnerSlotSection.includes("{specialCharactersRemovalPanel}"));

  assert.ok(inAdvanced, `Advanced Mode must render shared component <${componentName}>`);
  assert.ok(inBeginner, `Beginner Mode must render shared component <${componentName}>`);
}
console.log(`✅ PASS: All ${SHARED_COMPONENTS.length} shared component blocks are active in BOTH modes.`);

// 3. Only sequence/presentation order differs (Beginner tabs vs Advanced stages/accordions)
assert.ok(
  beginnerTabNav.includes('id: "preferences"') && beginnerTabNav.includes('id: "video"'),
  "Beginner mode presents shared components via 2-step tab flow (preferences -> video)",
);
assert.ok(
  indexTsx.includes("currentAccordionStage") && indexTsx.includes("PANELS"),
  "Advanced mode presents shared components via stage/accordion ordering",
);

// 4. Shared state ownership stays above mode conditional in index.tsx
assert.ok(
  indexTsx.includes("const [tracks, setTracks]") &&
    indexTsx.includes("const setBaseLanguage = useCallback") &&
    indexTsx.includes("const [favoriteLanguages, setFavoriteLanguagesState]"),
  "Shared playback, tracks, and language state must live above mode switch in index.tsx",
);
console.log("✅ PASS: Mode transition preserves shared state and differs only in presentation sequence.");
console.log("=========================================================================");
console.log("🎉 Same Components Policy Parity Verification PASSED!");
console.log("=========================================================================");
