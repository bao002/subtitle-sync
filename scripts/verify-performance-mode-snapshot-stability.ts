import assert from "node:assert";
import {
  getPerformanceMode,
  setPerformanceMode,
  getElementOverrides,
  setElementOverrides,
  isElementEnabled,
  setElementEnabled,
  disableAllNonObligatoryElements,
  enableAllNonObligatoryElements,
  resetPerformanceModeToDefault,
  NON_OBLIGATORY_ELEMENTS,
} from "../src/utils/performanceModeManager";

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Performance Mode Snapshot Stability & Caching");
  console.log("=========================================================================");

  // Reset to default
  resetPerformanceModeToDefault();

  // 1. Verify getElementOverrides() referential identity
  console.log("Check 1: Verifying getElementOverrides() referential stability...");
  const o1 = getElementOverrides();
  const o2 = getElementOverrides();
  assert.strictEqual(
    o1,
    o2,
    "getElementOverrides() must return the EXACT SAME object reference when state has not changed (Object.is === true)",
  );
  console.log("✓ Check 1 passed: getElementOverrides() is referentially stable.");

  // 2. Verify getPerformanceMode() default is "fast"
  console.log("Check 2: Verifying default mode...");
  assert.strictEqual(getPerformanceMode(), "fast");
  console.log("✓ Check 2 passed: Default mode is 'fast'.");

  // 3. Verify all non-obligatory elements are disabled by default in fast mode
  console.log("Check 3: Verifying elements disabled in fast mode...");
  for (const el of NON_OBLIGATORY_ELEMENTS) {
    assert.strictEqual(
      isElementEnabled(el.id),
      false,
      `Element ${el.id} should be disabled by default in fast mode`,
    );
  }
  console.log("✓ Check 3 passed: All non-obligatory elements disabled in fast mode.");

  // 4. Verify Enable All updates state and preserves reference stability afterward
  console.log("Check 4: Verifying enableAllNonObligatoryElements()...");
  enableAllNonObligatoryElements();
  assert.strictEqual(getPerformanceMode(), "slow");
  const oSlow1 = getElementOverrides();
  const oSlow2 = getElementOverrides();
  assert.strictEqual(oSlow1, oSlow2, "Overrides must be referentially stable after enableAll");
  for (const el of NON_OBLIGATORY_ELEMENTS) {
    assert.strictEqual(isElementEnabled(el.id), true, `Element ${el.id} should be enabled`);
  }
  console.log("✓ Check 4 passed: Enable all works with referential stability.");

  // 5. Verify Disable All updates state and preserves reference stability afterward
  console.log("Check 5: Verifying disableAllNonObligatoryElements()...");
  disableAllNonObligatoryElements();
  assert.strictEqual(getPerformanceMode(), "fast");
  const oFast1 = getElementOverrides();
  const oFast2 = getElementOverrides();
  assert.strictEqual(oFast1, oFast2, "Overrides must be referentially stable after disableAll");
  for (const el of NON_OBLIGATORY_ELEMENTS) {
    assert.strictEqual(isElementEnabled(el.id), false, `Element ${el.id} should be disabled`);
  }
  console.log("✓ Check 5 passed: Disable all works with referential stability.");

  // 6. Reset to clean defaults
  resetPerformanceModeToDefault();
  assert.strictEqual(getPerformanceMode(), "fast");
  console.log("✓ Check 6 passed: Reset to default succeeds.");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: useSyncExternalStore getSnapshot caching verified!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
