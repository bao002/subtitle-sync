import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=== Verifying Task 313: Language Speed Change No-Scroll & Video Stage Confinement ===");

const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexTsx = fs.readFileSync(indexTsxPath, "utf-8");

// 1. Verify that panelId === 'player' is strictly restricted to currentAccordionStage === 3
console.log("1. Verifying player panel restriction in panelOrder filter...");
assert.match(
  indexTsx,
  /if\s*\(\s*panelId\s*===\s*["']player["']\s*\)\s*\{\s*return\s*currentAccordionStage\s*===\s*3;\s*\}/,
  "Video player panel must be strictly restricted to Stage 3 (video stage) in panelOrder filter",
);

// Verify that it appears BEFORE showOtherSettingsAccordions
const playerCheckIdx = indexTsx.indexOf('if (panelId === "player") {');
const showOtherIdx = indexTsx.indexOf("if (showOtherSettingsAccordions) {");
assert.ok(playerCheckIdx > -1, "Player check must exist in index.tsx");
assert.ok(showOtherIdx > -1, "showOtherSettingsAccordions check must exist in index.tsx");
assert.ok(
  playerCheckIdx < showOtherIdx,
  "Player check must be placed BEFORE showOtherSettingsAccordions to prevent video stage leakage",
);

// 2. Verify that changing rate triggers recordUserInteraction
console.log("2. Verifying rate select change handlers record user interaction...");
const beginnerPrefsPath = path.resolve(
  process.cwd(),
  "src/components/beginner/PerLanguageTtsPreferences.tsx",
);
const beginnerPrefs = fs.readFileSync(beginnerPrefsPath, "utf-8");
assert.match(
  beginnerPrefs,
  /recordUserInteraction\s*\(\s*Date\.now\(\)\s*\)/,
  "Beginner per-language speed change must call recordUserInteraction(Date.now())",
);

const beginnerTabPrefsPath = path.resolve(
  process.cwd(),
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerTabPrefs = fs.readFileSync(beginnerTabPrefsPath, "utf-8");
assert.match(
  beginnerTabPrefs,
  /recordUserInteraction\s*\(\s*Date\.now\(\)\s*\)/,
  "Beginner preferences tab rate select must call recordUserInteraction(Date.now())",
);

const ttsSettingsPanelPath = path.resolve(
  process.cwd(),
  "src/components/TtsServiceSettingsPanel.tsx",
);
const ttsSettingsPanel = fs.readFileSync(ttsSettingsPanelPath, "utf-8");
assert.match(
  ttsSettingsPanel,
  /recordUserInteraction\s*\(\s*Date\.now\(\)\s*\)/,
  "TtsServiceSettingsPanel rate select must call recordUserInteraction(Date.now())",
);

// 3. Verify disableScrolling enforcement in auto-scroll effect
console.log("3. Verifying disableScrolling enforcement...");
assert.match(
  indexTsx,
  /if\s*\(\s*disableScrolling\s*\|\|\s*!autoFocus\s*\|\|\s*isSetupPaused\s*\)\s*return;/,
  "Auto-scroll effect must strictly return early when disableScrolling is true",
);

console.log("✓ All Task 313 assertions passed successfully!");
