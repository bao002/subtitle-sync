import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Task 417: OpenRouter Key Settings Panel (1st Accordion)");
console.log("=========================================================================");

const root = process.cwd();
const panelPath = path.join(root, "src/components/OpenRouterSettingsPanel.tsx");
const storyPath = path.join(root, "src/components/OpenRouterSettingsPanel.stories.tsx");
const workbenchPath = path.join(root, "src/storybook/StorybookWorkbench.tsx");
const indexPath = path.join(root, "src/routes/index.tsx");
const beginnerPrefsPath = path.join(
  root,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);

assert.ok(fs.existsSync(panelPath), "OpenRouterSettingsPanel.tsx must exist");
assert.ok(fs.existsSync(storyPath), "OpenRouterSettingsPanel.stories.tsx must exist");

const panelContent = fs.readFileSync(panelPath, "utf8");
const workbenchContent = fs.readFileSync(workbenchPath, "utf8");
const indexContent = fs.readFileSync(indexPath, "utf8");
const beginnerContent = fs.readFileSync(beginnerPrefsPath, "utf8");

// 1. Panel exposes required controls & testids
for (const tid of [
  "openrouter-settings-panel",
  "openrouter-api-key-input",
  "openrouter-toggle-show-key-btn",
  "openrouter-save-key-btn",
  "openrouter-clear-key-btn",
  "openrouter-test-connection-btn",
]) {
  assert.ok(
    panelContent.includes(`data-testid="${tid}"`),
    `OpenRouterSettingsPanel must expose data-testid="${tid}"`,
  );
}
assert.ok(
  panelContent.includes("setOpenRouterApiKeySetting") &&
    panelContent.includes("getOpenRouterApiKeySetting"),
  "OpenRouterSettingsPanel must persist user key via appSettings",
);
console.log("✅ PASS: OpenRouterSettingsPanel exposes key input/save/show/clear/test controls.");

// 2. Storybook-first registration
assert.ok(
  workbenchContent.includes("<OpenRouterSettingsPanel") &&
    workbenchContent.includes('"openrouter_settings"'),
  "StorybookWorkbench must register and render OpenRouterSettingsPanel",
);
console.log("✅ PASS: OpenRouterSettingsPanel registered in StorybookWorkbench.");

// 3. Advanced Mode: 1st accordion = OpenRouter, 2nd accordion = TTS Service, 3rd = Playback
const settingsStageSlice = indexContent.slice(indexContent.indexOf('{panelId === "playback" && ('));
const advPerfIdx = settingsStageSlice.indexOf("<PerformanceModeSettingsPanel />");
const advOrIdx = settingsStageSlice.indexOf('data-testid="settings-openrouter-accordion"');
const advTtsIdx = settingsStageSlice.indexOf('data-testid="settings-tts-service-accordion"');
const advPlayIdx = settingsStageSlice.indexOf('data-testid="settings-playback-accordion"');

assert.ok(advOrIdx > advPerfIdx, "OpenRouter accordion must appear after PerformanceMode header");
assert.ok(
  advOrIdx < advTtsIdx && advTtsIdx < advPlayIdx,
  "Advanced Settings accordion order must strictly be 1st: OpenRouter -> 2nd: TTS Service -> 3rd: General Playback",
);
assert.ok(
  settingsStageSlice.slice(advOrIdx, advTtsIdx).includes("<OpenRouterSettingsPanel"),
  "Advanced settings-openrouter-accordion must render shared <OpenRouterSettingsPanel />",
);
console.log("✅ PASS: Advanced Settings mounts OpenRouter as 1st accordion before TTS Service (2nd).");

// 4. Beginner Mode: 1st accordion = OpenRouter, 2nd accordion = TTS Service
const begProfileIdx = beginnerContent.indexOf('data-testid="beginner-top-profile-container"');
const begOrIdx = beginnerContent.indexOf('data-testid="beginner-settings-openrouter-accordion"');
const begTtsIdx = beginnerContent.indexOf('data-testid="beginner-settings-tts-service-accordion"');
const begOverlayIdx = beginnerContent.indexOf('data-testid="beginner-overlay-preference"');

assert.ok(begOrIdx > begProfileIdx, "Beginner OpenRouter accordion must appear after profile bar");
assert.ok(
  begOrIdx < begTtsIdx && begTtsIdx < begOverlayIdx,
  "Beginner Preferences accordion order must strictly be 1st: OpenRouter -> 2nd: TTS Service",
);
assert.ok(
  beginnerContent.slice(begOrIdx, begTtsIdx).includes("<OpenRouterSettingsPanel"),
  "Beginner openrouter accordion must render shared <OpenRouterSettingsPanel />",
);
console.log("✅ PASS: Beginner Preferences mounts OpenRouter as 1st accordion before TTS Service (2nd).");

console.log("=========================================================================");
console.log("🎉 Task 417 OpenRouter Key 1st Accordion Verification PASSED!");
console.log("=========================================================================");
