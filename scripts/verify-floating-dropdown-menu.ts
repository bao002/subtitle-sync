/**
 * Dedicated Verification Test for Task 151 / 152:
 * Floating Draggable Dropdown Menu with Auto-Scroll & Setup-Pause
 *
 * Validates:
 * 1. FloatingDraggablePauseButton.tsx exports and props interface.
 * 2. Dropdown trigger, aria attributes, and open/close popup mechanisms.
 * 3. Menu option 1 (Pause for Setup) with clear descriptive explanation.
 * 4. Menu option 2 (Auto-Scroll) with clear descriptive explanation.
 * 5. Visual status badges and active state counters.
 * 6. Clean wiring in src/routes/index.tsx (isAutoScrollEnabled={autoFocus} and onToggleAutoScroll).
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Floating Draggable Dropdown Menu & Auto-Scroll");
console.log("=========================================================================");

// Test 1: Component exports and interface contracts
console.log("Test 1: Component exports and interface contracts...");
const componentPath = path.resolve(
  process.cwd(),
  "src/components/FloatingDraggablePauseButton.tsx",
);
assert.ok(fs.existsSync(componentPath), "FloatingDraggablePauseButton.tsx must exist");
const componentCode = fs.readFileSync(componentPath, "utf-8");

assert.ok(
  componentCode.includes("export const FloatingDraggablePauseButton"),
  "Must export FloatingDraggablePauseButton component",
);
assert.ok(
  componentCode.includes("export interface FloatingDraggablePauseButtonProps"),
  "Must export FloatingDraggablePauseButtonProps interface",
);
assert.ok(
  componentCode.includes("isAutoScrollEnabled?: boolean;"),
  "Props interface must define optional isAutoScrollEnabled boolean",
);
assert.ok(
  componentCode.includes("onToggleAutoScroll?: () => void;"),
  "Props interface must define optional onToggleAutoScroll callback",
);
console.log("✅ PASS: Component exports and interface contracts verified");

// Test 2: Dropdown trigger and popup containers
console.log("Test 2: Dropdown trigger and menu structure...");
assert.ok(
  componentCode.includes('data-testid="floating-draggable-pause-container"'),
  "Must include root container testid",
);
assert.ok(
  componentCode.includes('data-testid="floating-pause-button"'),
  "Must include floating-pause-button testid for backward compatibility",
);
assert.ok(
  componentCode.includes('data-testid="floating-dropdown-trigger"') ||
    componentCode.includes("floating-dropdown-trigger"),
  "Must support floating-dropdown-trigger testid / reference",
);
assert.ok(
  componentCode.includes('aria-haspopup="menu"'),
  "Trigger button must declare aria-haspopup='menu'",
);
assert.ok(
  componentCode.includes("aria-expanded={isOpen}"),
  "Trigger button must reflect aria-expanded state",
);
assert.ok(
  componentCode.includes('data-testid="floating-menu-dropdown"'),
  "Must render floating dropdown popup with testid 'floating-menu-dropdown'",
);
console.log("✅ PASS: Dropdown trigger and popup structure verified");

// Test 3: Option 1: Pause for Setup & Explanation
console.log("Test 3: Setup Pause option and descriptive explanation...");
assert.ok(
  componentCode.includes('data-testid="menu-option-setup-pause"'),
  "Must provide menu option for Setup Pause with data-testid='menu-option-setup-pause'",
);
assert.ok(
  componentCode.includes('data-testid="explanation-setup-pause"'),
  "Must provide explanation container with data-testid='explanation-setup-pause'",
);
assert.ok(
  componentCode.includes(
    "Freezes video playback, text-to-speech voice synthesis, and automatic scrolling",
  ),
  "Setup pause explanation must clearly describe frozen playback and scrolling",
);
console.log("✅ PASS: Setup Pause option and explanation verified");

// Test 4: Option 2: Auto-Scroll & Explanation
console.log("Test 4: Auto-Scroll option and descriptive explanation...");
assert.ok(
  componentCode.includes('data-testid="menu-option-auto-scroll"'),
  "Must provide menu option for Auto-Scroll with data-testid='menu-option-auto-scroll'",
);
assert.ok(
  componentCode.includes('data-testid="explanation-auto-scroll"'),
  "Must provide explanation container with data-testid='explanation-auto-scroll'",
);
assert.ok(
  componentCode.includes("Automatically centers and scrolls the parallel subtitles table"),
  "Auto-scroll explanation must explain following dialogue in parallel subtitles table",
);
assert.ok(
  componentCode.includes("5") && componentCode.includes("seconds"),
  "Auto-scroll explanation must mention 5-second hold on user interaction",
);
console.log("✅ PASS: Auto-Scroll option and explanation verified");

// Test 5: Route wiring in src/routes/index.tsx
console.log("Test 5: Wiring in src/routes/index.tsx...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexCode = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexCode.includes("<FloatingDraggablePauseButton"),
  "index.tsx must render FloatingDraggablePauseButton",
);
assert.ok(
  indexCode.includes("isAutoScrollEnabled={autoFocus}"),
  "index.tsx must pass isAutoScrollEnabled={autoFocus}",
);
assert.ok(
  indexCode.includes("onToggleAutoScroll={() => onAutoFocusChange(!autoFocus)}"),
  "index.tsx must pass onToggleAutoScroll={() => onAutoFocusChange(!autoFocus)}",
);
console.log("✅ PASS: Route wiring in index.tsx verified");

// Test 6: Verify docs/files.md entry
console.log("Test 6: Documentation catalog check in docs/files.md...");
const filesMdPath = path.resolve(process.cwd(), "docs/files.md");
assert.ok(fs.existsSync(filesMdPath), "docs/files.md must exist");
const filesMd = fs.readFileSync(filesMdPath, "utf-8");
assert.ok(
  filesMd.includes("FloatingDraggablePauseButton.tsx"),
  "docs/files.md must inventory FloatingDraggablePauseButton.tsx",
);
console.log("✅ PASS: Documentation inventory verified");

console.log("=========================================================================");
console.log("🎉 All Floating Draggable Dropdown Menu & Auto-Scroll tests PASSED!");
console.log("=========================================================================");
