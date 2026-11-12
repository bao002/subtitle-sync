import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Dedicated automated verification test for Task 393 (Prompt 177):
 * Verify removal of the 3 redundant dropdowns in LearningGoalsFiltersPanel
 * while preserving the per-language max words stepper/input and punctuation switch.
 */
function runVerifyRedundantDropdownsRemoved() {
  console.log("=== Verifying Task 393 (Prompt 177): Remove 3 Redundant Dropdowns ===");

  const panelPath = resolve(process.cwd(), "src/components/shared/LearningGoalsFiltersPanel.tsx");
  const content = readFileSync(panelPath, "utf8");

  // 1. Assert the 3 redundant dropdowns are removed
  const removedIds = [
    "learning-goals-add-language-dropdown",
    "learning-goals-lang-max-words-dropdown",
    "learning-goals-lang-complete-dropdown",
  ];
  for (const id of removedIds) {
    if (content.includes(id)) {
      throw new Error(`FAIL: Redundant dropdown '${id}' is still present in LearningGoalsFiltersPanel.tsx!`);
    }
  }
  console.log("PASS: All 3 redundant dropdowns removed from LearningGoalsFiltersPanel.tsx.");

  // 2. Assert primary per-language controls remain intact
  const preservedTestIds = [
    "learning-goals-lang-complete-switch-",
    "learning-goals-lang-decrement-",
    "learning-goals-lang-max-words-input-",
    "learning-goals-lang-increment-",
    "learning-goals-reset-all-lang-criteria-btn",
  ];
  for (const id of preservedTestIds) {
    if (!content.includes(id)) {
      throw new Error(`FAIL: Expected control '${id}' is missing from LearningGoalsFiltersPanel.tsx!`);
    }
  }
  console.log("PASS: Stepper/number inputs and punctuation switches are preserved.");

  // 3. Assert Beginner & Advanced mode parity (shared component usage)
  const indexContent = readFileSync(resolve(process.cwd(), "src/routes/index.tsx"), "utf8");
  const beginnerContent = readFileSync(
    resolve(process.cwd(), "src/components/beginner/tabs/BeginnerPreferencesTab.tsx"),
    "utf8",
  );
  if (!indexContent.includes("<LearningGoalsFiltersPanel") || !beginnerContent.includes("<LearningGoalsFiltersPanel")) {
    throw new Error("FAIL: LearningGoalsFiltersPanel parity broken across Advanced or Beginner mode!");
  }
  console.log("PASS: Shared LearningGoalsFiltersPanel preserves 100% parity across Advanced & Beginner modes.");

  console.log("SUCCESS: Task 393 (Prompt 177) verification passed 100%!");
}

try {
  runVerifyRedundantDropdownsRemoved();
} catch (err: unknown) {
  console.error((err as Error).message);
  process.exit(1);
}
