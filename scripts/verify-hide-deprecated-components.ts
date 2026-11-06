/**
 * Dedicated test script: scripts/verify-hide-deprecated-components.ts
 *
 * Validates Task 322 (Prompt 88 - Chapter 2):
 * 1. Deprecated beginner mode switcher button (btn-mode-beginner) has class "hidden" in ModeSwitcherHeader.tsx.
 * 2. Deprecated header-mode-toggle button has class "hidden" in src/routes/index.tsx.
 * 3. Deprecated beginner flow container has class "hidden" in src/routes/index.tsx.
 * 4. Application defaults to Advanced Studio ("expert").
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Testing Hide Deprecated Components (Task 322 / Prompt 88)");
console.log("=========================================================================");

const root = process.cwd();
const modeSwitcherPath = path.resolve(root, "src/components/ModeSwitcherHeader.tsx");
const indexRoutePath = path.resolve(root, "src/routes/index.tsx");

assert.ok(fs.existsSync(modeSwitcherPath), "ModeSwitcherHeader.tsx must exist");
assert.ok(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");

const modeSwitcherContent = fs.readFileSync(modeSwitcherPath, "utf-8");
const indexRouteContent = fs.readFileSync(indexRoutePath, "utf-8");

// 1. Verify btn-mode-beginner has "hidden" in className
console.log("1. Checking ModeSwitcherHeader.tsx for hidden deprecated button...");
assert.ok(
  modeSwitcherContent.includes('data-testid="btn-mode-beginner"'),
  "btn-mode-beginner must be present"
);
const btnIndex = modeSwitcherContent.indexOf('data-testid="btn-mode-beginner"');
const beginnerBtnSnippet = modeSwitcherContent.slice(Math.max(0, btnIndex - 300), btnIndex + 100);
assert.ok(
  beginnerBtnSnippet.includes("hidden"),
  "btn-mode-beginner must include 'hidden' class to hide deprecated component"
);
console.log("✅ PASS: ModeSwitcherHeader.tsx hides deprecated beginner button with 'hidden' class");

// 2. Verify header-mode-toggle in src/routes/index.tsx has "hidden" in className
console.log("2. Checking header-mode-toggle in src/routes/index.tsx...");
assert.ok(
  indexRouteContent.includes('data-testid="header-mode-toggle"'),
  "header-mode-toggle must be present"
);
const headerToggleIndex = indexRouteContent.indexOf('data-testid="header-mode-toggle"');
const headerToggleSnippet = indexRouteContent.slice(
  Math.max(0, headerToggleIndex - 400),
  headerToggleIndex + 50
);
assert.ok(
  headerToggleSnippet.includes("hidden"),
  "header-mode-toggle must include 'hidden' class to hide deprecated component"
);
console.log("✅ PASS: header-mode-toggle hides deprecated mode toggle with 'hidden' class");

// 3. Verify beginner container has "hidden" in className
console.log("3. Checking deprecated beginner flow container...");
assert.ok(
  indexRouteContent.includes('data-testid="deprecated-beginner-container"'),
  "deprecated-beginner-container must be present"
);
assert.ok(
  indexRouteContent.includes('className="hidden space-y-4" data-testid="deprecated-beginner-container"'),
  "deprecated-beginner-container must have 'hidden' class"
);
console.log("✅ PASS: Deprecated beginner container is hidden with 'hidden' class");

// 4. Verify default mode is expert
console.log("4. Verifying default workflowMode remains expert...");
assert.ok(
  indexRouteContent.includes('return "expert"'),
  "Workflow mode must default to expert"
);
console.log("✅ PASS: Application defaults to Advanced Studio ('expert')");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED: Deprecated components successfully hidden!");
console.log("=========================================================================");
