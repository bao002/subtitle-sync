/**
 * Dedicated test script: scripts/verify-hide-duplicated-header-settings-button.ts
 *
 * Validates Task 323 (Prompt 88 - Chapter 3 & Focus Mode):
 * 1. Targeted element button#header-stage4-settings-button in src/routes/index.tsx includes "hidden" class.
 * 2. Stage 4 Settings remains accessible via stage stepper navigation (stage-step-4).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Testing Hide Pointed Duplicated Settings Button (Task 323 / Prompt 88)");
console.log("=========================================================================");

const root = process.cwd();
const indexRoutePath = path.resolve(root, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");

const indexContent = fs.readFileSync(indexRoutePath, "utf-8");

// 1. Verify button#header-stage4-settings-button exists and has "hidden" class
console.log("1. Checking button#header-stage4-settings-button for hidden styling...");
assert.ok(
  indexContent.includes('id="header-stage4-settings-button"'),
  "header-stage4-settings-button ID must exist"
);
assert.ok(
  indexContent.includes('data-testid="header-stage4-settings-button"'),
  "header-stage4-settings-button testid must exist"
);

const btnIndex = indexContent.indexOf('id="header-stage4-settings-button"');
const snippet = indexContent.slice(btnIndex, btnIndex + 1000);

assert.ok(
  snippet.includes('className="hidden h-7') || snippet.includes('hidden'),
  "header-stage4-settings-button must include 'hidden' class to hide duplicated element"
);
console.log("✅ PASS: button#header-stage4-settings-button has 'hidden' class applied");

// 2. Verify Stage 4 Settings navigation is retained in the stepper
console.log("2. Checking that Stage 4 Settings remains accessible via stepper...");
assert.ok(
  indexContent.includes('data-testid="stage-step-4"'),
  "stage-step-4 must be preserved in the stages stepper"
);
console.log("✅ PASS: Stage 4 Settings remains fully accessible via stages stepper");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED: Duplicated header settings button successfully hidden!");
console.log("=========================================================================");
