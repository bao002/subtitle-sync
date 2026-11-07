/**
 * Dedicated verification script: Remove Redundant Accordion Button (Task 338)
 * Verifies that:
 * 1. button#header-toggle-accordion-button has been removed from the header menu.
 * 2. Exactly the 2 required show/hide buttons exist on the header menu:
 *    - header-toggle-autofetch-button (Auto-Fetching Subtitles widget toggle)
 *    - header-toggle-log-button (Bottom activity & state log viewer toggle)
 * 3. Default state of stage accordions remains folded by default.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Running Verification: Remove Redundant Accordion Header Button (Task 338)");
console.log("=========================================================================");

const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf-8");

// Test 1: Redundant accordion button is removed
console.log("Test 1: Verifying button#header-toggle-accordion-button is removed...");
assert.ok(
  !indexContent.includes('id="header-toggle-accordion-button"'),
  "button#header-toggle-accordion-button must be completely removed from header",
);
assert.ok(
  !indexContent.includes('data-testid="header-toggle-accordion-button"'),
  "header-toggle-accordion-button data-testid must be completely removed",
);
console.log("✅ PASS: Redundant accordion toggle button is removed");

// Test 2: Exactly 2 control toggle buttons exist in the header
console.log("Test 2: Verifying exactly 2 header control buttons exist (Auto-Fetch and Log View)...");
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
console.log("✅ PASS: Exactly the 2 header control buttons verified");

// Test 3: Accordion panels remain folded by default
console.log("Test 3: Verifying accordion panels remain folded by default...");
assert.match(
  indexContent,
  /languages:\s*false,/,
  "openPanels.languages must default to false",
);
assert.match(
  indexContent,
  /subtitles:\s*false,/,
  "openPanels.subtitles must default to false",
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
console.log("✅ PASS: Accordion panels remain folded by default");

console.log("=========================================================================");
console.log("🎉 ALL TESTS PASSED: Remove Redundant Accordion Header Button (Task 338)");
console.log("=========================================================================");
