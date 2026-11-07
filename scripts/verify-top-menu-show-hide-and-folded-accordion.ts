import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Top Menu Show/Hide Buttons & Folded Accordion Default (Task 335)");
console.log("=========================================================================");

const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf-8");

// Test 1: Accordion elements are folded by default
console.log("Test 1: Verifying accordion elements are folded by default in openPanels...");
assert.match(
  indexContent,
  /languages:\s*false,/,
  "openPanels.languages must default to false (folded by default)",
);
assert.match(
  indexContent,
  /subtitles:\s*false,/,
  "openPanels.subtitles must default to false (folded by default)",
);
assert.match(
  indexContent,
  /fetchedSubtitles:\s*false,/,
  "openPanels.fetchedSubtitles must default to false",
);
assert.match(
  indexContent,
  /player:\s*false,/,
  "openPanels.player must default to false",
);
console.log("✅ PASS: Accordion elements are folded by default");

// Test 2: Top Menu Show/Hide Buttons exist
console.log("Test 2: Verifying top menu show/hide buttons in header...");
assert.match(
  indexContent,
  /id=["']header-toggle-accordion-button["']/,
  "Top menu must include header-toggle-accordion-button",
);
assert.match(
  indexContent,
  /data-testid=["']header-toggle-accordion-button["']/,
  "header-toggle-accordion-button must have matching data-testid",
);
assert.match(
  indexContent,
  /id=["']header-toggle-log-button["']/,
  "Top menu must include header-toggle-log-button",
);
assert.match(
  indexContent,
  /data-testid=["']header-toggle-log-button["']/,
  "header-toggle-log-button must have matching data-testid",
);
console.log("✅ PASS: Top menu show/hide buttons exist in header");

// Test 3: Log viewer visibility container
console.log("Test 3: Verifying bottom log viewer show/hide container wrapper...");
assert.match(
  indexContent,
  /id=["']bottom-log-viewer-container["']/,
  "BottomLogViewer must be wrapped in #bottom-log-viewer-container",
);
assert.match(
  indexContent,
  /className=\{showBottomLogViewer\s*\?\s*["']block["']\s*:\s*["']hidden["']\}/,
  "bottom-log-viewer-container must toggle between block and hidden based on showBottomLogViewer state",
);
console.log("✅ PASS: Bottom log viewer show/hide container wrapper verified");

// Test 4: Accordion toggle handler toggles active stage accordion
console.log("Test 4: Verifying handleToggleActiveAccordion handler...");
assert.match(
  indexContent,
  /const\s+handleToggleActiveAccordion\s*=/,
  "handleToggleActiveAccordion callback must be defined",
);
assert.match(
  indexContent,
  /const\s+isCurrentAccordionOpen\s*=/,
  "isCurrentAccordionOpen must determine whether the active stage accordion is open or folded",
);
console.log("✅ PASS: Accordion toggle handler verified");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED: Top Menu Show/Hide Buttons & Folded Accordion Default (Task 335)");
console.log("=========================================================================");
