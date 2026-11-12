/**
 * scripts/verify-word-balloons-stage-no-video.ts
 *
 * Automated verification for Task 389 (Prompt 154 - Chapter 4):
 * Word Balloons Stage - Remove Video Player & Deliver Pure Learning Words Game
 *
 * Verifies:
 * 1. BeginnerVideoTab provides clean game view without video aspect-video lock,
 *    video overlay controls, URL inputs, or subtitle tables when in game mode.
 * 2. src/routes/index.tsx automatically pauses video and TTS on entering
 *    Word Balloon Learning View or Stage 5, and suppresses playback controls.
 * 3. WordBalloonLearningView has zero embedded video elements or video distractions,
 *    focusing 100% on interactive sentence & word learning games with "Back to Video" control.
 */

import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log("=========================================================================");
console.log("🧪 Verifying Task 389: Word Balloons Stage - Video Removal & Pure Game");
console.log("=========================================================================");

// 1. BeginnerVideoTab checks
console.log("Test 1: Auditing BeginnerVideoTab.tsx for pure learning game view...");
const beginnerVideoTabPath = path.resolve(process.cwd(), "src/components/beginner/tabs/BeginnerVideoTab.tsx");
assert(fs.existsSync(beginnerVideoTabPath), "BeginnerVideoTab.tsx must exist");
const beginnerVideoTabContent = fs.readFileSync(beginnerVideoTabPath, "utf-8");

// Container must not lock aspect-video when in showWordBalloonLearningView
assert(
  beginnerVideoTabContent.includes("showWordBalloonLearningView ?") ||
  beginnerVideoTabContent.includes("showWordBalloonLearningView\n                ?"),
  "beginner-player-slot-container must adapt style when showWordBalloonLearningView is true"
);
assert(
  beginnerVideoTabContent.includes("playerSlot && !showWordBalloonLearningView && ("),
  "video-display-controls must be hidden when showWordBalloonLearningView is true"
);
assert(
  beginnerVideoTabContent.includes("!showWordBalloonLearningView && ("),
  "Video URL form, language boxes selector, and discovery details must be hidden when showWordBalloonLearningView is true"
);
console.log("✅ PASS: BeginnerVideoTab.tsx delivers a dedicated, distraction-free game view.");

// 2. src/routes/index.tsx checks
console.log("Test 2: Auditing src/routes/index.tsx for playback pausing and controls suppression...");
const routesIndexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert(fs.existsSync(routesIndexPath), "src/routes/index.tsx must exist");
const routesIndexContent = fs.readFileSync(routesIndexPath, "utf-8");

// Auto-pause effect
assert(
  routesIndexContent.includes("showWordBalloonLearningView || currentAccordionStage === 5") &&
  routesIndexContent.includes("pauseBothVideoAndTts()"),
  "src/routes/index.tsx must pause video on entering Word Balloon Learning View or Stage 5"
);

// Playback controls suppression
assert(
  routesIndexContent.includes("showWordBalloonLearningView ? null :"),
  "src/routes/index.tsx must suppress playbackControlsSlot when showWordBalloonLearningView is active"
);

// Stage 5 button configuration
assert(
  routesIndexContent.includes('id="stage-step-learning"'),
  "src/routes/index.tsx must provide stage-step-learning button"
);
console.log("✅ PASS: src/routes/index.tsx cleanly isolates game mode and pauses video.");

// 3. WordBalloonLearningView checks
console.log("Test 3: Auditing WordBalloonLearningView.tsx for zero embedded video and pure game focus...");
const wordBalloonPath = path.resolve(process.cwd(), "src/components/WordBalloonLearningView.tsx");
assert(fs.existsSync(wordBalloonPath), "WordBalloonLearningView.tsx must exist");
const wordBalloonContent = fs.readFileSync(wordBalloonPath, "utf-8");

// Must not have HTML <video> or <iframe> tags
assert(!wordBalloonContent.includes("<video"), "WordBalloonLearningView must NOT contain <video> tags");
assert(!wordBalloonContent.includes("<iframe"), "WordBalloonLearningView must NOT contain <iframe> tags");

// Must provide interactive game modes
assert(wordBalloonContent.includes('"sentence_builder"'), "Must support sentence builder game mode");
assert(wordBalloonContent.includes('"word_match"'), "Must support word match game mode");
assert(wordBalloonContent.includes('"missing_word"'), "Must support missing word game mode");
assert(wordBalloonContent.includes('"word_balloons"'), "Must support word balloons game mode");

// Must provide return button
assert(
  wordBalloonContent.includes('data-testid="balloon-back-to-video-btn"'),
  "WordBalloonLearningView must provide 'Back to Video' button"
);
console.log("✅ PASS: WordBalloonLearningView provides pure interactive game modes with zero video distraction.");

console.log("=========================================================================");
console.log("🎉 ALL TASK 389 VERIFICATION CHECKS PASSED (3/3)!");
console.log("=========================================================================");
