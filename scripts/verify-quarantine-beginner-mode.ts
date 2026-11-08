import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAppSettings } from "../src/utils/appSettings";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("====================================================");
console.log("🧪 Starting Quarantine Beginner Mode Verification Suite");
console.log("====================================================");

// 1. Verify quarentined/beginner directory and quarantined files
const quarentinedDir = path.resolve(__dirname, "../quarentined/beginner");
assert.ok(fs.existsSync(quarentinedDir), "quarentined/beginner directory must exist");

const expectedQuarantinedFiles = [
  "BeginnerFlowContainer.tsx",
  "BeginnerTabNav.tsx",
  "BeginnerCharsRemovalAccordion.tsx",
  "BeginnerTtsServiceControl.tsx",
  "PerLanguageTtsPreferences.tsx",
  "tabs/BeginnerVideoTab.tsx",
  "tabs/BeginnerPreferencesTab.tsx",
  "tabs/BeginnerParsingTab.tsx",
  "tabs/BeginnerPlayerTab.tsx",
];

for (const relFile of expectedQuarantinedFiles) {
  const fullPath = path.join(quarentinedDir, relFile);
  assert.ok(fs.existsSync(fullPath), `Quarantined file must exist: ${relFile}`);
}

const quarantinedDocs = path.resolve(__dirname, "../quarentined/docs/beginner-mode-tab-flow.md");
assert.ok(fs.existsSync(quarantinedDocs), "quarentined/docs/beginner-mode-tab-flow.md must exist");
console.log("✅ Step 1 PASS: Quarantined beginner directory and files verified.");

// 2. Verify default settings in appSettings.ts
const defaultSettings = loadAppSettings();
assert.strictEqual(
  defaultSettings.workflowMode,
  "expert",
  "Default application workflow mode must be 'expert' (Advanced Studio)",
);

const appSettingsCode = fs.readFileSync(path.resolve(__dirname, "../src/utils/appSettings.ts"), "utf-8");
assert.ok(
  appSettingsCode.includes('workflowMode: "expert"'),
  "appSettings.ts must define default workflowMode as 'expert'",
);
console.log("✅ Step 2 PASS: appSettings.ts default workflowMode is 'expert'.");

// 3. Verify src/routes/index.tsx defaults to expert and has quarantine notice
const indexTsx = fs.readFileSync(path.resolve(__dirname, "../src/routes/index.tsx"), "utf-8");
assert.ok(
  indexTsx.includes('// Beginner mode is quarantined: default to Advanced Studio (expert)'),
  "routes/index.tsx must contain beginner quarantine default comment",
);
assert.ok(
  indexTsx.includes('data-testid="beginner-mode-quarantined-banner"'),
  "routes/index.tsx must contain beginner-mode-quarantined-banner",
);
assert.ok(
  indexTsx.includes('data-testid="btn-quarantine-to-expert"'),
  "routes/index.tsx must provide button to switch back to Advanced Studio from quarantined view",
);
console.log("✅ Step 3 PASS: routes/index.tsx quarantine defaults and banner verified.");

// 4. Verify ModeSwitcherHeader indicates Beginner Mode is quarantined
const modeSwitcherCode = fs.readFileSync(path.resolve(__dirname, "../src/components/ModeSwitcherHeader.tsx"), "utf-8");
assert.ok(
  modeSwitcherCode.includes("Quarantined") || modeSwitcherCode.includes("Deprecated"),
  "ModeSwitcherHeader must visually badge Beginner Mode as Quarantined or Deprecated",
);
console.log("✅ Step 4 PASS: ModeSwitcherHeader contains Quarantined indicator.");

console.log("====================================================");
console.log("🎉 All Quarantine Beginner Mode Tests PASSED Successfully!");
console.log("====================================================");
