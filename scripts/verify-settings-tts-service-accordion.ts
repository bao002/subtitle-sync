import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Task 416: TTS Service Moved Upper to Its Own Accordion (Slot 2)");
console.log("=========================================================================");

const root = process.cwd();
const indexPath = path.join(root, "src/routes/index.tsx");
const beginnerPrefsPath = path.join(
  root,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);

const indexContent = fs.readFileSync(indexPath, "utf8");
const beginnerContent = fs.readFileSync(beginnerPrefsPath, "utf8");

// 1. Advanced Mode: dedicated settings-tts-service-accordion exists and is upper than settings-playback-accordion
const settingsStageStartIdx = indexContent.indexOf('{panelId === "playback" && (');
assert.ok(settingsStageStartIdx !== -1, 'panelId === "playback" section must exist');
const settingsStageSlice = indexContent.slice(settingsStageStartIdx);

const perfIdx = settingsStageSlice.indexOf("<PerformanceModeSettingsPanel />");
const ttsAccordionIdx = settingsStageSlice.indexOf('data-testid="settings-tts-service-accordion"');
const playbackAccordionIdx = settingsStageSlice.indexOf('data-testid="settings-playback-accordion"');

assert.ok(perfIdx !== -1, "PerformanceModeSettingsPanel must exist in Settings");
assert.ok(ttsAccordionIdx !== -1, "settings-tts-service-accordion must exist in Advanced Settings");
assert.ok(playbackAccordionIdx !== -1, "settings-playback-accordion must exist in Advanced Settings");
assert.ok(
  ttsAccordionIdx > perfIdx && ttsAccordionIdx < playbackAccordionIdx,
  "settings-tts-service-accordion must appear upper in Settings before settings-playback-accordion",
);

// Extract settings-playback-accordion body to verify alternative-tts-settings-card is NOT inside it
const playbackAccordionCloseIdx = settingsStageSlice.indexOf(
  'data-testid="settings-chars-removal-accordion"',
);
assert.ok(playbackAccordionCloseIdx !== -1, "settings-chars-removal-accordion must follow playback");
const playbackAccordionBody = settingsStageSlice.slice(
  playbackAccordionIdx,
  playbackAccordionCloseIdx,
);
assert.ok(
  !playbackAccordionBody.includes('data-testid="alternative-tts-settings-card"'),
  "alternative-tts-settings-card must be moved OUT of settings-playback-accordion",
);

const ttsAccordionBody = settingsStageSlice.slice(ttsAccordionIdx, playbackAccordionIdx);
assert.ok(
  ttsAccordionBody.includes('data-testid="alternative-tts-settings-card"') &&
    ttsAccordionBody.includes("<TtsServiceSettingsPanel"),
  "settings-tts-service-accordion must contain alternative-tts-settings-card and TtsServiceSettingsPanel",
);
console.log("✅ PASS: Advanced Settings renders TTS Service upper in its own dedicated accordion.");

// 2. Beginner Mode: dedicated beginner-settings-tts-service-accordion exists and is upper than General cards
const beginnerTopProfileIdx = beginnerContent.indexOf('data-testid="beginner-top-profile-container"');
const beginnerTtsAccIdx = beginnerContent.indexOf('data-testid="beginner-settings-tts-service-accordion"');
const beginnerOverlayIdx = beginnerContent.indexOf('data-testid="beginner-overlay-preference"');
const beginnerPerfIdx = beginnerContent.indexOf("<PerformanceModeSettingsPanel />");

assert.ok(beginnerTopProfileIdx !== -1, "beginner-top-profile-container must exist");
assert.ok(
  beginnerTtsAccIdx !== -1,
  "beginner-settings-tts-service-accordion must exist in BeginnerPreferencesTab",
);
assert.ok(beginnerOverlayIdx !== -1, "beginner-overlay-preference must exist");
assert.ok(
  beginnerTtsAccIdx > beginnerTopProfileIdx &&
    beginnerTtsAccIdx < beginnerOverlayIdx &&
    beginnerTtsAccIdx < beginnerPerfIdx,
  "beginner-settings-tts-service-accordion must appear upper in Beginner Preferences",
);

const beginnerTtsMatches = beginnerContent.match(/data-testid="beginner-alternative-tts-card"/g);
assert.strictEqual(
  beginnerTtsMatches?.length,
  1,
  "beginner-alternative-tts-card must appear exactly once inside beginner-settings-tts-service-accordion",
);
console.log("✅ PASS: Beginner Preferences renders TTS Service upper in its own dedicated accordion.");

console.log("=========================================================================");
console.log("🎉 Task 416 TTS Service Dedicated Upper Accordion Verification PASSED!");
console.log("=========================================================================");
