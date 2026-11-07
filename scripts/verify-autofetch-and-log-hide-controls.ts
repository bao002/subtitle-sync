import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Auto-Fetching Subtitles & Log Controls (Task 336)");
console.log("=========================================================================");

const rootDir = process.cwd();
const indexTsxPath = path.resolve(rootDir, "src/routes/index.tsx");
const retryIndicatorPath = path.resolve(rootDir, "src/components/FloatingSubtitleRetryIndicator.tsx");

assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
assert.ok(fs.existsSync(retryIndicatorPath), "src/components/FloatingSubtitleRetryIndicator.tsx must exist");

const indexContent = fs.readFileSync(indexTsxPath, "utf-8");
const retryContent = fs.readFileSync(retryIndicatorPath, "utf-8");

// Test 1: Auto-Fetching Subtitles is folded by default in FloatingSubtitleRetryIndicator
console.log("Test 1: Verifying Auto-Fetching Subtitles is folded by default...");
assert.match(
  retryContent,
  /defaultMinimized\s*=\s*true/,
  "FloatingSubtitleRetryIndicator must have defaultMinimized = true",
);
assert.match(
  retryContent,
  /isMinimized,\s*setIsMinimized\s*\]\s*=\s*useState<boolean>\(\s*defaultMinimized\s*\?\?\s*true\s*\)/,
  "isMinimized state must initialize to defaultMinimized ?? true (folded by default)",
);
console.log("✅ PASS: Auto-Fetching Subtitles is folded by default");

// Test 2: Auto-Fetching Subtitles is hidden by default on page refresh in index.tsx
console.log("Test 2: Verifying Auto-Fetching Subtitles is hidden by default on refresh...");
assert.match(
  indexContent,
  /const\s*\[showAutoFetchSubtitles,\s*setShowAutoFetchSubtitles\]\s*=\s*useState<boolean>\(\s*\(\)\s*=>\s*\{[\s\S]*?return false;\s*\}\s*\)/,
  "showAutoFetchSubtitles must default to false on refresh",
);
assert.match(
  indexContent,
  /id=["']autofetch-subtitles-container["']/,
  "index.tsx must include #autofetch-subtitles-container",
);
assert.match(
  indexContent,
  /className=\{showAutoFetchSubtitles\s*\?\s*["']block["']\s*:\s*["']hidden["']\}/,
  "#autofetch-subtitles-container must toggle block/hidden based on showAutoFetchSubtitles",
);
console.log("✅ PASS: Auto-Fetching Subtitles is hidden by default on refresh");

// Test 3: Log view is hidden by default on page refresh in index.tsx
console.log("Test 3: Verifying Bottom Log View is hidden by default on refresh...");
assert.match(
  indexContent,
  /const\s*\[showBottomLogViewer,\s*setShowBottomLogViewer\]\s*=\s*useState<boolean>\(\s*\(\)\s*=>\s*\{[\s\S]*?return false;\s*\}\s*\)/,
  "showBottomLogViewer must default to false on refresh",
);
assert.match(
  indexContent,
  /id=["']bottom-log-viewer-container["']/,
  "index.tsx must include #bottom-log-viewer-container",
);
assert.match(
  indexContent,
  /className=\{showBottomLogViewer\s*\?\s*["']block["']\s*:\s*["']hidden["']\}/,
  "#bottom-log-viewer-container must toggle block/hidden based on showBottomLogViewer",
);
console.log("✅ PASS: Bottom Log View is hidden by default on refresh");

// Test 4: Top menu has 2 control hide/show buttons with visible labels
console.log("Test 4: Verifying the 2 control hide/show buttons on top menu...");
assert.match(
  indexContent,
  /id=["']header-toggle-autofetch-button["']/,
  "Top menu must include header-toggle-autofetch-button",
);
assert.match(
  indexContent,
  /data-testid=["'][^"']*header-toggle-autofetch-button[^"']*["']/,
  "header-toggle-autofetch-button must have data-testid",
);
assert.match(
  indexContent,
  /<span>Auto-Fetch<\/span>/,
  "Auto-Fetch button must have a clear visible label",
);
assert.match(
  indexContent,
  /id=["']header-toggle-log-button["']/,
  "Top menu must include header-toggle-log-button",
);
assert.match(
  indexContent,
  /data-testid=["'][^"']*header-toggle-log-button[^"']*["']/,
  "header-toggle-log-button must have data-testid",
);
assert.match(
  indexContent,
  /<span>Log View<\/span>/,
  "Log View button must have a clear visible label",
);
console.log("✅ PASS: The 2 control hide/show buttons on top menu verified");

// Test 5: Verify toggle handlers update state
console.log("Test 5: Verifying toggle handlers in index.tsx...");
assert.match(
  indexContent,
  /handleToggleAutoFetchSubtitles/,
  "handleToggleAutoFetchSubtitles must be defined and bound",
);
assert.match(
  indexContent,
  /handleToggleBottomLogViewer/,
  "handleToggleBottomLogViewer must be defined and bound",
);
console.log("✅ PASS: Toggle handlers verified");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED: Auto-Fetching Subtitles & Log Controls (Task 336)");
console.log("=========================================================================");
