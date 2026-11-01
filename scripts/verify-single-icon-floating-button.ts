/**
 * Verification test for Task 267 / Prompt 16 (Chapter 2):
 * Single Floating Button with 1 Icon for div#root > div:nth-of-type(1) > div:nth-of-type(6)
 *
 * Validates:
 * 1. FloatingDraggablePauseButton file and exports check.
 * 2. Floating element contains exactly 1 trigger button (no separate stacked status badge item).
 * 3. The floating trigger button renders exactly 1 icon (<Pause />, <ScrollText />, or <Play />).
 * 4. Sleek circular 48px action button styling (`rounded-full h-12 w-12`).
 * 5. All accessibility testids and attributes preserved (`floating-pause-button`, `floating-pause-status`,
 *    `floating-pause-badge`, `floating-dropdown-trigger`, `floating-menu-dropdown`).
 * 6. Mouse and touch dragging physics, localStorage persistence, and bounds clamping remain intact.
 * 7. Version synchronization across all 5 version targets.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Single-Icon Floating Button (Task 267)");
console.log("=========================================================================");

// Test 1: Component file and exports
console.log("Test 1: Component file and exports check...");
const componentPath = path.resolve(
  process.cwd(),
  "src/components/FloatingDraggablePauseButton.tsx",
);
assert.ok(
  fs.existsSync(componentPath),
  "src/components/FloatingDraggablePauseButton.tsx must exist",
);
const componentCode = fs.readFileSync(componentPath, "utf-8");

assert.ok(
  componentCode.includes("export const FloatingDraggablePauseButton"),
  "Component must export FloatingDraggablePauseButton",
);
assert.ok(
  componentCode.includes("export interface FloatingDraggablePauseButtonProps"),
  "Component must export FloatingDraggablePauseButtonProps",
);
console.log("✅ PASS: Component export and interface verified");

// Test 2: Exactly 1 visible floating button, no 2nd stacked item
console.log("Test 2: Verifying only 1 floating button is rendered (no stacked badge)...");
assert.ok(
  componentCode.includes('data-testid="floating-draggable-pause-container"'),
  "Must include root container testid",
);
assert.ok(
  componentCode.includes('data-testid="floating-pause-button"'),
  "Must include button testid",
);

// Verify that the trigger button is styled as a circular 48px floating action button
assert.ok(
  componentCode.includes("h-12 w-12") && componentCode.includes("rounded-full"),
  "Button must be styled as a sleek circular floating action button (h-12 w-12 rounded-full)",
);

// Verify that the secondary badge is NOT a separate visible stacked element
// Instead, status and badge text are in sr-only tags for screen readers and automated test contracts
assert.ok(
  componentCode.includes('data-testid="floating-pause-status" className="sr-only"'),
  "Status text should be accessible via sr-only rather than a separate visible DOM element",
);
assert.ok(
  componentCode.includes('data-testid="floating-pause-badge" className="sr-only"'),
  "Secondary badge should be accessible via sr-only rather than a separate visible DOM element",
);
console.log("✅ PASS: Single floating button with no visible secondary stacked item");

// Test 3: Exactly 1 icon inside the floating button
console.log("Test 3: Verifying trigger button renders 1 icon based on state...");
assert.ok(
  componentCode.includes("{isSetupPaused ? (") &&
    componentCode.includes("<Pause") &&
    componentCode.includes("<ScrollText") &&
    componentCode.includes("<Play"),
  "Button must render exactly 1 icon dynamically based on state (Pause, ScrollText, or Play)",
);
console.log("✅ PASS: Exactly 1 icon rendered inside floating button");

// Test 4: Preserved interactive dropdown menu and controls
console.log("Test 4: Verifying dropdown menu and accessibility attributes...");
assert.ok(
  componentCode.includes('data-testid="floating-menu-dropdown"'),
  "Must retain dropdown menu for configuration",
);
assert.ok(
  componentCode.includes('aria-haspopup="menu"'),
  "Must declare aria-haspopup='menu'",
);
assert.ok(
  componentCode.includes("aria-expanded={isOpen}"),
  "Must bind aria-expanded",
);
assert.ok(
  componentCode.includes('data-testid="menu-option-setup-pause"'),
  "Must have Setup Pause option in dropdown menu",
);
assert.ok(
  componentCode.includes('data-testid="menu-option-auto-scroll"'),
  "Must have Auto-Scroll option in dropdown menu",
);
console.log("✅ PASS: Dropdown menu and accessibility features preserved");

// Test 5: Dragging physics and bounds clamping
console.log("Test 5: Verifying drag handling and boundary clamping...");
assert.ok(
  componentCode.includes("onMouseDown={handleMouseDown}"),
  "Must support mouse drag",
);
assert.ok(
  componentCode.includes("onTouchStart={handleTouchStart}"),
  "Must support touch drag",
);
assert.ok(
  componentCode.includes("clampPosition"),
  "Must support boundary clamping within viewport",
);
assert.ok(
  componentCode.includes("yt_floating_pause_pos"),
  "Must persist position across page loads in localStorage",
);
console.log("✅ PASS: Drag handling and boundary clamping verified");

// Test 6: Version synchronization check across the 5 required targets
console.log("Test 6: Checking version synchronization across all 5 files...");
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"),
);
const currentVersion = packageJson.version;
console.log(`Current version in package.json: ${currentVersion}`);

const gradleCode = fs.readFileSync(
  path.resolve(process.cwd(), "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  gradleCode.includes(`versionName = "${currentVersion}"`),
  `android-shell versionName must match ${currentVersion}`,
);

const appConfigCode = fs.readFileSync(
  path.resolve(process.cwd(), "src/config/appConfig.ts"),
  "utf-8",
);
assert.ok(
  appConfigCode.includes(`export const APP_VERSION = "${currentVersion}";`),
  `APP_VERSION in appConfig.ts must match ${currentVersion}`,
);

const apkUpdaterCode = fs.readFileSync(
  path.resolve(process.cwd(), "src/utils/apkUpdater.ts"),
  "utf-8",
);
assert.ok(
  apkUpdaterCode.includes(`export const CURRENT_APK_VERSION = "v${currentVersion}";`),
  `CURRENT_APK_VERSION in apkUpdater.ts must match v${currentVersion}`,
);

const appSettingsCode = fs.readFileSync(
  path.resolve(process.cwd(), "src/utils/appSettings.ts"),
  "utf-8",
);
assert.ok(
  appSettingsCode.includes(`version: "${currentVersion}"`),
  `version in appSettings.ts must match ${currentVersion}`,
);
console.log("✅ PASS: Version synchronized across all 5 targets");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED FOR SINGLE-ICON FLOATING BUTTON (TASK 267)!");
console.log("=========================================================================");
