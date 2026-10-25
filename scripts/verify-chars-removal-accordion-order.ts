import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Chars Removal Accordion Parity & Ordering Before Parser");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Beginner Mode: Chars Removal accordion before the shared table parser
console.log("\n🐣 Section 1: Beginner Mode Ordering in the daily video flow");
const beginnerAccordionPath = path.resolve(
  rootDir,
  "src/components/beginner/BeginnerCharsRemovalAccordion.tsx",
);
const beginnerVideoPath = path.resolve(
  rootDir,
  "src/components/beginner/tabs/BeginnerVideoTab.tsx",
);
assert(fs.existsSync(beginnerAccordionPath), "BeginnerCharsRemovalAccordion.tsx must exist");
const beginnerAccordion = fs.readFileSync(beginnerAccordionPath, "utf-8");
const beginnerVideo = fs.readFileSync(beginnerVideoPath, "utf-8");
const beginnerCharsIndex = beginnerVideo.indexOf("{charsRemovalSlot}");
const beginnerTableIndex = beginnerVideo.indexOf("{subtitlesTableSlot}");

assert(
  beginnerAccordion.includes('data-testid="beginner-chars-removal-accordion"'),
  "Beginner mode must render a dedicated Chars Removal accordion",
);
assert(
  beginnerCharsIndex !== -1 && beginnerCharsIndex < beginnerTableIndex,
  "In Beginner mode, Chars Removal must appear before the table and its parser controls",
);
console.log("✅ PASS: In Beginner Mode, Chars Removal is rendered before the table parser.");

// 2. Accordion Themes Configuration: charsRemoval in PANELS and ACCORDION_THEMES
console.log("\n🎨 Section 2: Accordion Themes Configuration");
const themesPath = path.resolve(rootDir, "src/config/accordionThemes.ts");
assert(fs.existsSync(themesPath), "accordionThemes.ts must exist");
const themesContent = fs.readFileSync(themesPath, "utf-8");

assert(themesContent.includes('"charsRemoval"'), "PanelId must include 'charsRemoval'");
assert(
  themesContent.includes('id: "charsRemoval", title: "Special characters removal"'),
  "PANELS must define 'charsRemoval' with title 'Special characters removal'",
);

const panelsCharsIndex = themesContent.indexOf('id: "charsRemoval"');
const panelsParserIndex = themesContent.indexOf('id: "parser"');
assert(
  panelsCharsIndex !== -1 && panelsParserIndex !== -1,
  "Both charsRemoval and parser must exist in PANELS",
);
assert(
  panelsCharsIndex < panelsParserIndex,
  "In PANELS array, 'charsRemoval' must appear BEFORE 'parser'",
);

assert(
  themesContent.includes("charsRemoval: {"),
  "ACCORDION_THEMES must define a theme for charsRemoval",
);
console.log("✅ PASS: accordionThemes.ts defines charsRemoval before parser.");

// 3. Advanced Mode: SpecialCharactersRemovalPanel in src/routes/index.tsx
console.log("\n🚀 Section 3: Advanced Mode SpecialCharactersRemovalPanel in index.tsx");
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert(
  indexContent.includes("import { SpecialCharactersRemovalPanel }"),
  "index.tsx must import SpecialCharactersRemovalPanel",
);
assert(
  indexContent.includes("charsRemoval: false"),
  "index.tsx openPanels must include charsRemoval",
);
assert(
  indexContent.includes('panelId === "charsRemoval"'),
  "index.tsx must handle panelId === 'charsRemoval' in accordion loop",
);
assert(
  indexContent.includes("<SpecialCharactersRemovalPanel"),
  "index.tsx must render <SpecialCharactersRemovalPanel /> in accordion loop",
);

const indexCharsPanel = indexContent.indexOf('panelId === "charsRemoval"');
const indexParserPanel = indexContent.indexOf('panelId === "parser"');
assert(
  indexCharsPanel !== -1 && indexParserPanel !== -1,
  "Both charsRemoval and parser panel renders must exist in index.tsx",
);
assert(
  indexCharsPanel < indexParserPanel,
  `In Advanced Mode accordion loop, charsRemoval (index ${indexCharsPanel}) must appear BEFORE parser (index ${indexParserPanel})`,
);
console.log("✅ PASS: SpecialCharactersRemovalPanel is mounted before Parser in Advanced Mode.");

// 4. SpecialCharactersRemovalPanel Component Integrity
console.log("\n📦 Section 4: SpecialCharactersRemovalPanel Component Integrity");
const panelCompPath = path.resolve(rootDir, "src/components/SpecialCharactersRemovalPanel.tsx");
assert(fs.existsSync(panelCompPath), "SpecialCharactersRemovalPanel.tsx must exist");
const panelCompContent = fs.readFileSync(panelCompPath, "utf-8");

assert(
  panelCompContent.includes('data-testid="special-characters-removal-panel"'),
  "SpecialCharactersRemovalPanel must render testid 'special-characters-removal-panel'",
);
assert(
  panelCompContent.includes('data-testid="advanced-toggle-strip-brackets"'),
  "SpecialCharactersRemovalPanel must render testid 'advanced-toggle-strip-brackets'",
);
assert(
  panelCompContent.includes('data-testid="advanced-remove-chars-chips"'),
  "SpecialCharactersRemovalPanel must render testid 'advanced-remove-chars-chips'",
);
assert(
  panelCompContent.includes('data-testid="advanced-btn-add-char-rule"'),
  "SpecialCharactersRemovalPanel must render testid 'advanced-btn-add-char-rule'",
);
assert(
  panelCompContent.includes('data-testid="advanced-chars-removal-preview"'),
  "SpecialCharactersRemovalPanel must render testid 'advanced-chars-removal-preview'",
);
assert(
  panelCompContent.includes("sampleCues.slice(0, 3)") &&
    panelCompContent.includes("Load subtitles to see the sanitization preview.") &&
    !panelCompContent.includes("fallbackSamples"),
  "Sanitization previews must use authentic loaded cues and never fall back to hardcoded subtitle text",
);
console.log("✅ PASS: SpecialCharactersRemovalPanel exports all required interactive elements.");

// 5. Settings Persistence Integrity
console.log("\n⚙️ Section 5: Settings Persistence Integrity");
const settingsPath = path.resolve(rootDir, "src/utils/appSettings.ts");
assert(fs.existsSync(settingsPath), "appSettings.ts must exist");
const settingsContent = fs.readFileSync(settingsPath, "utf-8");

assert(
  settingsContent.includes("getStripSpeakerBracketsSetting"),
  "appSettings.ts must export getStripSpeakerBracketsSetting",
);
assert(
  settingsContent.includes("setStripSpeakerBracketsSetting"),
  "appSettings.ts must export setStripSpeakerBracketsSetting",
);
assert(
  settingsContent.includes("getRemoveCharsSetting"),
  "appSettings.ts must export getRemoveCharsSetting",
);
assert(
  settingsContent.includes("setRemoveCharsSetting"),
  "appSettings.ts must export setRemoveCharsSetting",
);
console.log("✅ PASS: appSettings.ts provides persistent settings for special characters removal.");

console.log("=========================================================================");
console.log("🎉 ALL CHARS REMOVAL PARITY & ORDERING CHECKS PASSED 100%!");
console.log("=========================================================================");
