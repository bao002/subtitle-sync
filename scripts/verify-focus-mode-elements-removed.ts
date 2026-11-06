import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("--> Starting validation of Focus Mode Element Removal (Task 319 / Prompt 84)...");

  const root = path.resolve(".");
  const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");

  // 1. Selector 1: Custom ratio number input in stage-2-language-ratios-container should be removed
  console.log("Checking Selector 1: Custom ratio input removed...");
  assert.ok(
    !indexTsx.includes('data-testid={`stage-2-ratio-input-${langCode}`}'),
    "Custom ratio input (stage-2-ratio-input-${langCode}) must be removed from stage-2-language-ratios-container",
  );
  assert.ok(
    !indexTsx.includes('className="w-12 h-6 text-xs text-center rounded border border-input bg-background font-mono"'),
    "Input element markup must be removed",
  );
  console.log("✓ Selector 1 verified: custom ratio input removed");

  // 2. Selector 2: stage-2-learning-filters-container should be removed
  console.log("Checking Selector 2: stage-2-learning-filters-container removed...");
  assert.ok(
    !indexTsx.includes('id="stage-2-learning-filters-container"'),
    "stage-2-learning-filters-container id must be removed",
  );
  assert.ok(
    !indexTsx.includes('data-testid="stage-2-learning-filters-container"'),
    "stage-2-learning-filters-container testid must be removed",
  );
  console.log("✓ Selector 2 verified: stage-2-learning-filters-container removed");

  // 3. Selector 3: Stage 2 action bar in stage-2-learning-goals-card should be removed
  console.log("Checking Selector 3: Stage 2 action bar in stage-2-learning-goals-card removed...");
  assert.ok(
    !indexTsx.includes('id="stage-2-next-button"'),
    "stage-2-next-button must be removed from stage-2-learning-goals-card",
  );
  assert.ok(
    !indexTsx.includes('id="stage-2-back-button"'),
    "stage-2-back-button must be removed from stage-2-learning-goals-card",
  );
  assert.ok(
    !indexTsx.includes('id="stage-to-stage-0-btn"'),
    "stage-to-stage-0-btn must be removed from stage-2-learning-goals-card",
  );
  console.log("✓ Selector 3 verified: Stage 2 action bar removed");

  // 4. Selector 4: toggle-stage4-settings-btn in accordion-stages-stepper should be removed
  console.log("Checking Selector 4: toggle-stage4-settings-btn removed...");
  assert.ok(
    !indexTsx.includes('id="toggle-stage4-settings-btn"'),
    "toggle-stage4-settings-btn id must be removed from stepper",
  );
  assert.ok(
    !indexTsx.includes('data-testid="toggle-stage4-settings-btn"'),
    "toggle-stage4-settings-btn testid must be removed from stepper",
  );
  // Ensure stage-step-4 remains available in the stepper
  assert.ok(
    indexTsx.includes('id="stage-step-4"'),
    "stage-step-4 button in stepper remains available for navigating to Stage 4 Settings",
  );
  console.log("✓ Selector 4 verified: toggle-stage4-settings-btn removed");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Focus mode element removal verified successfully!");
  console.log("=========================================================================");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
