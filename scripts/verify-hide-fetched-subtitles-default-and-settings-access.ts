/**
 * Dedicated test script: scripts/verify-hide-fetched-subtitles-default-and-settings-access.ts
 *
 * Validates Task 324 (Prompt 89):
 * 1. "Fetched Subtitles" stage is hidden by default:
 *    - currentAccordionStage defaults to 1 (Learning Goals) instead of 0.
 *    - openPanels defaults fetchedSubtitles to false, languages to true.
 *    - stage-step-0 button has 'hidden' class by default in accordion-stages-stepper.
 * 2. Fetched Subtitles info is accessible on Settings stage (Stage 4):
 *    - settings-fetched-subtitles-accordion is rendered within Stage 4 (playback panel).
 *    - FetchedSubtitlesStagePanel is embedded inside settings-fetched-subtitles-container.
 *    - settings-open-stage-0-btn allows direct navigation to stage 0 view.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Testing Hide Fetched Subtitles Default & Access on Settings Stage (Prompt 89)");
console.log("=========================================================================");

const root = process.cwd();
const indexRoutePath = path.resolve(root, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// 1. Verify currentAccordionStage defaults to 1
console.log("1. Verifying currentAccordionStage default value...");
const stageDefMatch = indexContent.match(
  /const\s*\[currentAccordionStage,\s*setCurrentAccordionStage\]\s*=\s*useState<[^>]+>\(\(\)\s*=>\s*\{([\s\S]*?)\n\s*\}\);/
);
assert.ok(stageDefMatch, "currentAccordionStage state definition must exist");
const stageDefBody = stageDefMatch[1];
assert.ok(
  stageDefBody.includes("return 1;"),
  "currentAccordionStage must return 1 by default (hiding stage 0 by default)"
);
console.log("✅ PASS: currentAccordionStage defaults to Stage 1 (Learning Goals)");

// 2. Verify openPanels defaults
console.log("2. Verifying openPanels initial state...");
const openPanelsMatch = indexContent.match(
  /const\s*\[openPanels,\s*setOpenPanels\]\s*=\s*useState<Record<PanelId,\s*boolean>>\(\{([\s\S]*?)\}\);/
);
assert.ok(openPanelsMatch, "openPanels state definition must exist");
const openPanelsBody = openPanelsMatch[1];
assert.ok(
  openPanelsBody.includes("fetchedSubtitles: false"),
  "openPanels.fetchedSubtitles must default to false"
);
assert.ok(
  openPanelsBody.includes("languages: true"),
  "openPanels.languages must default to true"
);
console.log("✅ PASS: openPanels defaults fetchedSubtitles to false and languages to true");

// 3. Verify stage-step-0 button is hidden when not on stage 0
console.log("3. Verifying stage-step-0 button in stepper...");
assert.ok(
  indexContent.includes('id="stage-step-0"'),
  "stage-step-0 must exist in index.tsx"
);
assert.ok(
  indexContent.includes('currentAccordionStage === 0 ? "flex" : "hidden"'),
  "stage-step-0 must be hidden when currentAccordionStage is not 0"
);
console.log("✅ PASS: stage-step-0 is hidden by default from stages stepper");

// 4. Verify Settings stage access to Fetched Subtitles info
console.log("4. Verifying Fetched Subtitles info accessible in Stage 4 Settings...");
assert.ok(
  indexContent.includes('data-testid="settings-fetched-subtitles-accordion"'),
  "Settings stage must include settings-fetched-subtitles-accordion"
);
assert.ok(
  indexContent.includes('data-testid="settings-fetched-subtitles-container"'),
  "Settings stage must include settings-fetched-subtitles-container"
);
assert.ok(
  indexContent.includes('data-testid="settings-open-stage-0-btn"'),
  "Settings stage must provide settings-open-stage-0-btn to open stage view"
);

// Verify FetchedSubtitlesStagePanel is mounted inside the settings sub-accordion
const settingsSubAccordionIndex = indexContent.indexOf(
  'data-testid="settings-fetched-subtitles-accordion"'
);
const afterSettingsAccordion = indexContent.slice(
  settingsSubAccordionIndex,
  settingsSubAccordionIndex + 5000
);
assert.ok(
  afterSettingsAccordion.includes("<FetchedSubtitlesStagePanel"),
  "FetchedSubtitlesStagePanel must be embedded inside settings-fetched-subtitles-accordion"
);
console.log("✅ PASS: Fetched Subtitles info & controls are fully accessible on Settings stage");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED: Fetched Subtitles hidden by default and accessible in Settings!");
console.log("=========================================================================");
