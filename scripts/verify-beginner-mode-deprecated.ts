import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("--> Starting validation of Beginner Mode Deprecation (Task 320 / Prompt 85)...");

  const root = path.resolve(".");
  const indexTsx = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");
  const deprecatedMd = fs.readFileSync(path.join(root, "docs/deprecated.md"), "utf8");
  const modeSwitcherTsx = fs.readFileSync(path.join(root, "src/components/ModeSwitcherHeader.tsx"), "utf8");

  // 1. Check docs/deprecated.md contains official deprecation record for Beginner Mode
  console.log("Checking docs/deprecated.md documentation...");
  assert.ok(
    deprecatedMd.includes("## Beginner Mode (Deprecated Workflow)"),
    "docs/deprecated.md must contain ## Beginner Mode (Deprecated Workflow)",
  );
  assert.ok(
    deprecatedMd.includes("workflowMode === \"beginner\""),
    "docs/deprecated.md must mention workflowMode === 'beginner'",
  );
  assert.ok(
    deprecatedMd.includes("Unified progressive pipeline in Advanced Mode"),
    "docs/deprecated.md must explain replacement: Unified progressive pipeline in Advanced Mode",
  );
  console.log("✓ docs/deprecated.md properly records Beginner Mode deprecation");

  // 2. Check default workflow mode in src/routes/index.tsx is Advanced ("expert")
  console.log("Checking default workflowMode in src/routes/index.tsx...");
  assert.ok(
    indexTsx.includes('// Beginner mode is quarantined: default to Advanced Studio (expert)') ||
    indexTsx.includes('return "expert"'),
    "src/routes/index.tsx must default to 'expert'",
  );
  console.log("✓ src/routes/index.tsx defaults to Advanced Studio");

  // 3. Check ModeSwitcherHeader.tsx has Deprecated badge for Beginner mode button
  console.log("Checking ModeSwitcherHeader.tsx Deprecated indicator...");
  assert.ok(
    modeSwitcherTsx.includes("Deprecated"),
    "ModeSwitcherHeader.tsx must label Beginner mode with 'Deprecated'",
  );
  assert.ok(
    modeSwitcherTsx.includes('title="Beginner Mode is deprecated"'),
    "ModeSwitcherHeader.tsx must have title='Beginner Mode is deprecated'",
  );
  console.log("✓ ModeSwitcherHeader.tsx displays Deprecated label");

  // 4. Check Notice: Deprecated banner in src/routes/index.tsx when Beginner Mode is viewed
  console.log("Checking Notice: Deprecated banner in index.tsx...");
  assert.ok(
    indexTsx.includes("Notice: Deprecated"),
    "src/routes/index.tsx must render Notice: Deprecated banner for Beginner Mode",
  );
  assert.ok(
    indexTsx.includes("Beginner mode is deprecated. The primary, fully supported workflow is the unified"),
    "src/routes/index.tsx must explain deprecation in banner",
  );
  assert.ok(
    indexTsx.includes('data-testid="btn-quarantine-to-expert"'),
    "src/routes/index.tsx must provide button to navigate to Advanced Studio",
  );
  console.log("✓ Beginner mode view includes Notice: Deprecated banner with link to Advanced Studio");

  // 5. Check header-mode-toggle button reflects deprecation status
  console.log("Checking header-mode-toggle button in index.tsx...");
  assert.ok(
    indexTsx.includes("Beginner Mode (Deprecated)"),
    "header-mode-toggle must reflect Beginner Mode (Deprecated)",
  );
  console.log("✓ Header toggle button indicates Beginner Mode is deprecated");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Beginner Mode deprecation verified successfully!");
  console.log("=========================================================================");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
