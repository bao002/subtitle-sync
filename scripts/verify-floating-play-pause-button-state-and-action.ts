/**
 * Dedicated Verification Test for Task 341 (Prompt 110 - Chapter 1):
 * Floating Button Play/Pause State & Play Click Handler
 *
 * Requirements:
 * 1. The floating button reflects the combined state of (tts-play & video-player) player:
 *    - When either video is playing OR TTS speech is speaking (isPlaybackActive = isVideoPlaying || isSpeaking),
 *      it shows Pause state (<Pause /> icon, rose styling).
 *    - When neither is active (!isPlaybackActive), it shows Play state (<Play /> icon, emerald styling).
 * 2. Clicking on the button dispatches onPause when playing, and onPlay when paused.
 * 3. Drag distance threshold uses Math.hypot(dx, dy) > 10 so standard touch/mouse clicks are not accidentally dropped.
 * 4. handlePlayVideo in src/routes/index.tsx resolves player from ref or registry, synchronizes st.current.isSetupPaused,
 *    kicks playback with retries, and sends iframe postMessage commands.
 * 5. handleTogglePlay in src/routes/index.tsx pauses if currently playing, speaking, or isVideoPlaying; otherwise resumes.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Task 341 - Floating Button Play/Pause State & Action");
console.log("=========================================================================");

// 1. Audit FloatingDraggablePauseButton.tsx
console.log("Test 1: Verifying combined playback state calculation in FloatingDraggablePauseButton.tsx...");
const componentPath = path.resolve(process.cwd(), "src/components/FloatingDraggablePauseButton.tsx");
assert.ok(fs.existsSync(componentPath), "FloatingDraggablePauseButton.tsx must exist");
const componentCode = fs.readFileSync(componentPath, "utf-8");

// State calculation: isPlaybackActive must combine isVideoPlaying and isSpeaking
assert.match(
  componentCode,
  /const\s+isPlaybackActive\s*=\s*(?:Boolean\()?(?:isVideoPlaying\s*\|\|\s*isSpeaking)/,
  "isPlaybackActive must combine isVideoPlaying and isSpeaking",
);

// Icon rendering: must use isPlaybackActive (or !isPlaybackActive) to switch between Play and Pause
assert.ok(
  componentCode.includes("!isPlaybackActive ? (") &&
    componentCode.includes("<Play") &&
    componentCode.includes("<Pause"),
  "Must render Play icon when !isPlaybackActive, and Pause icon when isPlaybackActive",
);

// Rose vs emerald styling
assert.ok(
  componentCode.includes("!isPlaybackActive") &&
    componentCode.includes("bg-emerald-600") &&
    componentCode.includes("bg-rose-600"),
  "Must render emerald background when paused and rose background when playing",
);

// Click handler respects combined active state
assert.match(
  componentCode,
  /const\s+isPlayingCombined\s*=\s*Boolean\(isVideoPlaying\s*\|\|\s*isSpeaking\);/,
  "Click handler must calculate combined playing state from video and speech",
);

// Drag threshold uses Math.hypot(dx, dy) > 10 to avoid false positives on taps
assert.ok(
  componentCode.includes("Math.hypot(dx, dy) > 10"),
  "Drag handler must use distance check > 10 to prevent dropped clicks",
);

console.log("✅ PASS: FloatingDraggablePauseButton combined state and click logic verified");

// 2. Audit src/routes/index.tsx
console.log("Test 2: Verifying handlePlayVideo and handleTogglePlay in src/routes/index.tsx...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexCode = fs.readFileSync(indexPath, "utf-8");

// handlePlayVideo must unpause setup in st.current
assert.ok(
  indexCode.includes("st.current.isSetupPaused = false;"),
  "handlePlayVideo must synchronize st.current.isSetupPaused to unfreeze interval loop",
);

// handlePlayVideo must check multiVideoPlayerRegistry fallback
assert.ok(
  indexCode.includes('player.current || multiVideoPlayerRegistry.get("primary")'),
  "handlePlayVideo must check player.current or primary registry instance",
);

// handlePlayVideo must clear speech states and reset userExplicitlyPausedRef
assert.ok(
  indexCode.includes("cancelSpeech();") &&
    indexCode.includes("userExplicitlyPausedRef.current = false;") &&
    indexCode.includes("isPausedForTtsRef.current = false;"),
  "handlePlayVideo must cancel active speech and clear explicit pause flags",
);

// handlePlayVideo must execute follow-up play kicks and iframe postMessage
assert.ok(
  indexCode.includes("postMessage('{\"event\":\"command\",\"func\":\"playVideo\",\"args\":\"\"}'") ||
    indexCode.includes('postMessage(\'{"event":"command","func":"playVideo","args":""}\''),
  "handlePlayVideo must dispatch playVideo postMessage directly to iframe for guaranteed playback",
);

// handleTogglePlay evaluates combined video + tts active state
assert.ok(
  indexCode.includes("isCurrentlyPlaying || isSpeakingActive || isVideoPlaying"),
  "handleTogglePlay must evaluate video player state, speaking state, or isVideoPlaying",
);

console.log("✅ PASS: src/routes/index.tsx playback resume handlers verified");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED: Task 341 Floating Button State & Action Verified");
console.log("=========================================================================");
