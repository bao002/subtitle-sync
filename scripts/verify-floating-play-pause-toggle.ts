/**
 * Verification test for Task 334 / Prompt 102:
 * Floating Play/Pause Button State & Click Behavior
 *
 * Requirements:
 * 1. If the video is not playing - show a play button (<Play /> icon, emerald styling)
 * 2. Else (if the video is playing) - show a pause button (<Pause /> icon, rose styling)
 * 3. Clicking on play should always trigger play (calls onPlay / handlePlayVideo)
 * 4. Clicking on pause should always trigger pause (calls onPause / handlePauseVideo)
 * 5. Full integration in src/routes/index.tsx with handlePlayVideo, handlePauseVideo, and handleTogglePlay
 * 6. Backward compatibility with existing floating button test suites
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Floating Play/Pause Button State & Click Behavior (Task 334)");
console.log("=========================================================================");

// Test 1: FloatingDraggablePauseButton.tsx props and exports
console.log("Test 1: Verifying FloatingDraggablePauseButton props and interface...");
const componentPath = path.resolve(
  process.cwd(),
  "src/components/FloatingDraggablePauseButton.tsx",
);
assert.ok(fs.existsSync(componentPath), "FloatingDraggablePauseButton.tsx must exist");
const componentCode = fs.readFileSync(componentPath, "utf-8");

assert.ok(
  componentCode.includes("export const FloatingDraggablePauseButton"),
  "Must export FloatingDraggablePauseButton",
);
assert.ok(
  componentCode.includes("export interface FloatingDraggablePauseButtonProps"),
  "Must export FloatingDraggablePauseButtonProps",
);
assert.ok(
  componentCode.includes("onTogglePlay?: () => void;"),
  "Props interface must declare onTogglePlay",
);
assert.ok(
  componentCode.includes("onPlay?: () => void;"),
  "Props interface must declare onPlay",
);
assert.ok(
  componentCode.includes("onPause?: () => void;"),
  "Props interface must declare onPause",
);
console.log("✅ PASS: Component props and exports verified");

// Test 2: If video is not playing -> show play button, else -> show pause button
console.log("Test 2: Verifying conditional icon rendering based on isVideoPlaying...");
assert.ok(
  componentCode.includes("!isVideoPlaying ? (") &&
    componentCode.includes("<Play") &&
    componentCode.includes("<Pause"),
  "Must render Play icon when video is not playing, and Pause icon when playing",
);

// Verify styling distinction: emerald/play vs rose/pause
assert.ok(
  componentCode.includes("!isVideoPlaying") &&
    componentCode.includes("bg-emerald-600") &&
    componentCode.includes("bg-rose-600"),
  "Must style as emerald play button when not playing, and rose pause button when playing",
);
console.log("✅ PASS: Play when not playing, Pause when playing icon logic verified");

// Test 3: Clicking on play triggers play, clicking on pause triggers pause
console.log("Test 3: Verifying click action dispatch logic...");
assert.ok(
  componentCode.includes("if (isVideoPlaying)") &&
    componentCode.includes("if (onPause)") &&
    componentCode.includes("onPause()") &&
    componentCode.includes("if (onPlay)") &&
    componentCode.includes("onPlay()"),
  "Click handler must invoke onPause when isVideoPlaying is true, and onPlay when false",
);
console.log("✅ PASS: Click action dispatch logic verified");

// Test 4: Route integration in src/routes/index.tsx
console.log("Test 4: Verifying route integration in src/routes/index.tsx...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexCode = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexCode.includes("const handlePlayVideo = useCallback("),
  "index.tsx must define handlePlayVideo callback",
);
assert.ok(
  indexCode.includes("const handlePauseVideo = useCallback("),
  "index.tsx must define handlePauseVideo callback",
);
assert.ok(
  indexCode.includes("onTogglePlay={handleTogglePlay}") &&
    indexCode.includes("onPlay={handlePlayVideo}") &&
    indexCode.includes("onPause={handlePauseVideo}"),
  "FloatingDraggablePauseButton must receive onTogglePlay, onPlay, and onPause callbacks",
);
console.log("✅ PASS: Route integration in index.tsx verified");

// Test 5: Verify all accessibility attributes and testids
console.log("Test 5: Verifying accessibility testids and attributes...");
const requiredTestIds = [
  'data-testid="floating-draggable-pause-container"',
  'data-testid="floating-pause-button"',
  'data-testid="floating-pause-status"',
  'data-testid="floating-pause-badge"',
  'data-testid="floating-dropdown-trigger"',
  'data-testid="floating-menu-dropdown"',
  'data-testid="menu-option-setup-pause"',
  'data-testid="menu-option-auto-scroll"',
  'data-testid="floating-menu-toggle-btn"',
];
for (const testId of requiredTestIds) {
  assert.ok(componentCode.includes(testId), `Component must include ${testId}`);
}
assert.ok(
  componentCode.includes("aria-pressed={isSetupPaused}"),
  "Component must maintain aria-pressed={isSetupPaused}",
);
console.log("✅ PASS: Accessibility attributes and testids verified");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED: Floating Play/Pause Button State & Click Behavior (Task 334)");
console.log("=========================================================================");
