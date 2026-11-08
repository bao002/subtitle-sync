import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { formatPlaytimeSeconds } from "../src/components/FloatingDraggablePauseButton.js";

console.log("=========================================================================");
console.log("🧪 Running Verification: Task 345 - Floating Play Button Playtime Tooltip");
console.log("=========================================================================");

// Test 1: formatPlaytimeSeconds utility tests
console.log("Test 1: Verifying formatPlaytimeSeconds formatting...");
assert.equal(formatPlaytimeSeconds(0), "0:00", "0 seconds should format to 0:00");
assert.equal(formatPlaytimeSeconds(45), "0:45", "45 seconds should format to 0:45");
assert.equal(formatPlaytimeSeconds(65), "1:05", "65 seconds should format to 1:05");
assert.equal(formatPlaytimeSeconds(3605), "1:00:05", "3605 seconds should format to 1:00:05");
assert.equal(formatPlaytimeSeconds(3665), "1:01:05", "3665 seconds should format to 1:01:05");
assert.equal(formatPlaytimeSeconds(-5), "0:00", "Negative seconds should fallback to 0:00");
assert.equal(formatPlaytimeSeconds(NaN), "0:00", "NaN should fallback to 0:00");
console.log("✅ PASS: formatPlaytimeSeconds formats values accurately");

// Test 2: Verify FloatingDraggablePauseButton code structure
console.log("Test 2: Verifying FloatingDraggablePauseButton.tsx implementation...");
const btnPath = path.resolve(process.cwd(), "src/components/FloatingDraggablePauseButton.tsx");
const btnCode = fs.readFileSync(btnPath, "utf-8");

assert.ok(btnCode.includes("currentTimeSec?: number"), "FloatingDraggablePauseButtonProps must declare currentTimeSec");
assert.ok(btnCode.includes("durationSec?: number"), "FloatingDraggablePauseButtonProps must declare durationSec");
assert.ok(btnCode.includes("isHovered"), "Must declare isHovered state for desktop hover");
assert.ok(btnCode.includes("showPlaytimeMobile"), "Must declare showPlaytimeMobile state for mobile interaction");
assert.ok(btnCode.includes("data-testid=\"floating-playtime-tooltip\""), "Must render floating-playtime-tooltip element");
assert.ok(btnCode.includes("onMouseEnter"), "Container must handle onMouseEnter");
assert.ok(btnCode.includes("onMouseLeave"), "Container must handle onMouseLeave");
assert.ok(btnCode.includes("longPressTimerRef"), "Must handle mobile long press or tap for mobile equivalent tooltip");
console.log("✅ PASS: FloatingDraggablePauseButton has hover, mobile touch, and playtime tooltip");

// Test 3: Verify src/routes/index.tsx passes playback times
console.log("Test 3: Verifying FloatingDraggablePauseButton wiring in src/routes/index.tsx...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexCode = fs.readFileSync(indexPath, "utf-8");

assert.ok(indexCode.includes("<FloatingDraggablePauseButton"), "src/routes/index.tsx must render FloatingDraggablePauseButton");
assert.ok(indexCode.includes("currentTimeSec={playbackCurrentTime}"), "Must pass currentTimeSec={playbackCurrentTime}");
assert.ok(indexCode.includes("durationSec={playbackDuration}"), "Must pass durationSec={playbackDuration}");
console.log("✅ PASS: index.tsx passes currentTimeSec and durationSec to floating button");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED: Task 345 Floating Play Button Playtime Tooltip Verified");
console.log("=========================================================================");
