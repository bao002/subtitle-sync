import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=== Verifying Task 314: Floating Pause Button Reaction & Pause Reason Notification ===");

const floatingButtonPath = path.resolve(
  process.cwd(),
  "src/components/FloatingDraggablePauseButton.tsx",
);
const floatingButtonCode = fs.readFileSync(floatingButtonPath, "utf-8");

// 1. Verify props include isVideoPlaying, isSpeaking, and pauseReason
console.log("1. Verifying FloatingDraggablePauseButton props...");
assert.match(
  floatingButtonCode,
  /isVideoPlaying\?: boolean;/,
  "FloatingDraggablePauseButtonProps must declare isVideoPlaying",
);
assert.match(
  floatingButtonCode,
  /isSpeaking\?: boolean;/,
  "FloatingDraggablePauseButtonProps must declare isSpeaking",
);
assert.match(
  floatingButtonCode,
  /pauseReason\?: string \| null;/,
  "FloatingDraggablePauseButtonProps must declare pauseReason",
);

// 2. Verify paused state computation and notification rendering
console.log("2. Verifying effective pause calculation and notification chip...");
assert.match(
  floatingButtonCode,
  /const isPlaybackActive = isVideoPlaying \|\| isSpeaking;/,
  "isPlaybackActive must consider both video playback and TTS speech",
);
assert.match(
  floatingButtonCode,
  /const isEffectivelyPaused = isSetupPaused \|\| !isPlaybackActive;/,
  "isEffectivelyPaused must reflect setup pause or stopped playback",
);
assert.match(
  floatingButtonCode,
  /data-testid=["']floating-pause-reason-chip["']/,
  "Floating pause button must render floating-pause-reason-chip when paused with reason",
);
assert.match(
  floatingButtonCode,
  /data-testid=["']floating-menu-pause-reason["']/,
  "Floating menu dropdown must display pause reason banner",
);

// 3. Verify index.tsx passes playback state and pauseReason
console.log("3. Verifying index.tsx passes properties to FloatingDraggablePauseButton...");
const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexTsx = fs.readFileSync(indexTsxPath, "utf-8");
assert.match(
  indexTsx,
  /<FloatingDraggablePauseButton[\s\S]*?isVideoPlaying=\{isVideoPlaying\}[\s\S]*?isSpeaking=\{Boolean\(speakingLang\)\}[\s\S]*?pauseReason=\{pauseReason\}/,
  "index.tsx must supply isVideoPlaying, isSpeaking, and pauseReason to FloatingDraggablePauseButton",
);

console.log("✓ All Task 314 assertions passed successfully!");
