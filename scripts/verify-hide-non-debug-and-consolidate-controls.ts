import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=== Verifying Task 316: Hide Non-Debug Elements When Debug Off & Consolidate Controls ===");

// 1. Verify index.tsx consolidates duplicate controls
const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexTsx = fs.readFileSync(indexTsxPath, "utf-8");

console.log("1. Verifying consolidated auto-scroll control in Stage 4 settings...");
// Only auto-scroll-toggle should be a visible row; disable-scrolling-toggle and disable-autofocus-toggle should be hidden compatibility inputs
assert.match(
  indexTsx,
  /id=["']auto-scroll-toggle["']/,
  "Authoritative auto-scroll-toggle must exist in Stage 4 settings",
);
assert.match(
  indexTsx,
  /<input[\s\S]*?id=["']disable-scrolling-toggle["'][\s\S]*?className=["']hidden["']/,
  "disable-scrolling-toggle must be marked hidden in Stage 4 settings to avoid duplicate UI rows",
);
assert.match(
  indexTsx,
  /<input[\s\S]*?id=["']disable-autofocus-toggle["'][\s\S]*?className=["']hidden["']/,
  "disable-autofocus-toggle must be marked hidden in Stage 4 settings to avoid duplicate UI rows",
);

// 2. Verify non-debug elements are hidden when debug is off
console.log("2. Verifying debug-only views and buttons are guarded by debugMode...");
// Toolbar buttons Network and Actions are guarded by isDeveloperMode && debugMode
assert.match(
  indexTsx,
  /isDeveloperMode\s*&&\s*debugMode\s*&&\s*!isAndroid\s*&&\s*\([\s\S]*?id=["']open-network-inspector-button["']/,
  "Network inspector button in toolbar must only render when debugMode is true",
);
assert.match(
  indexTsx,
  /isDeveloperMode\s*&&\s*debugMode\s*&&\s*\([\s\S]*?data-testid=["']open-state-machine-action-logs-button["']/,
  "Action logs button in toolbar must only render when debugMode is true",
);
// Inspectors are guarded by debugMode
assert.match(
  indexTsx,
  /isDeveloperMode\s*&&\s*debugMode\s*&&\s*\([\s\S]*?<NetworkRequestsInspector/,
  "NetworkRequestsInspector must only render when debugMode is true",
);
assert.match(
  indexTsx,
  /isDeveloperMode\s*&&\s*debugMode\s*&&\s*\([\s\S]*?<StateMachineActionLogsInspector/,
  "StateMachineActionLogsInspector must only render when debugMode is true",
);

// 3. Verify FloatingSubtitleRetryIndicator experimental debug panel is guarded by isDebug
const retryIndicatorPath = path.resolve(
  process.cwd(),
  "src/components/FloatingSubtitleRetryIndicator.tsx",
);
const retryIndicatorCode = fs.readFileSync(retryIndicatorPath, "utf-8");
assert.match(
  retryIndicatorCode,
  /\{isDebug\s*&&\s*\([\s\S]*?data-testid=["']auto-fetch-debug-panel["']/,
  "FloatingSubtitleRetryIndicator auto-fetch-debug-panel must only render when isDebug is true",
);

console.log("✓ All Task 316 assertions passed successfully!");
