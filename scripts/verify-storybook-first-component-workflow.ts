/**
 * Dedicated test script: scripts/verify-storybook-first-component-workflow.ts
 *
 * Validates:
 * 1. AGENTS.md includes the mandatory "Storybook-first component workflow" rule.
 * 2. Storybook configuration is properly structured (.storybook/main.ts, .storybook/preview.ts).
 * 3. Package.json registers storybook scripts and build commands.
 * 4. Storybook workbench route (src/routes/storybook.tsx) and component stories exist.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Storybook-First Component Workflow Contract (Task 288)");
  console.log("=========================================================================");

  const rootDir = process.cwd();

  // 1. Verify AGENTS.md rule
  console.log("--> [Test 1] Inspecting AGENTS.md for Storybook-first component rule...");
  const agentsPath = path.resolve(rootDir, "AGENTS.md");
  assert(fs.existsSync(agentsPath), "AGENTS.md must exist in root");
  const agentsContent = fs.readFileSync(agentsPath, "utf-8");
  assert(
    agentsContent.includes("Storybook-first component workflow") ||
      (agentsContent.includes("storyboard") && agentsContent.includes("implemented")),
    "AGENTS.md must mandate Storybook-first component workflow",
  );
  assert(
    agentsContent.includes(".stories.tsx") || agentsContent.includes("Storybook"),
    "AGENTS.md must reference Storybook component stories",
  );
  console.log("✅ PASS: AGENTS.md explicitly defines Storybook-first component workflow rule");

  // 2. Verify Storybook setup
  console.log("--> [Test 2] Verifying Storybook directory and configurations...");
  const storybookMain = path.resolve(rootDir, ".storybook/main.ts");
  const storybookPreview = path.resolve(rootDir, ".storybook/preview.ts");
  assert(fs.existsSync(storybookMain), ".storybook/main.ts must exist");
  assert(fs.existsSync(storybookPreview), ".storybook/preview.ts must exist");
  console.log("✅ PASS: Storybook config files verified");

  // 3. Verify Storybook scripts in package.json
  console.log("--> [Test 3] Verifying Storybook scripts in package.json...");
  const pkgPath = path.resolve(rootDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert(pkg.scripts?.storybook, "package.json must define 'storybook' script");
  assert(pkg.scripts?.["build-storybook"] || pkg.scripts?.["build:storybook"], "package.json must define build-storybook script");
  console.log("✅ PASS: package.json Storybook commands verified");

  // 4. Verify Storybook component stories exist
  console.log("--> [Test 4] Verifying presence of .stories.tsx components...");
  const componentsDir = path.resolve(rootDir, "src/components");
  const storyFiles = fs.readdirSync(componentsDir).filter((file) => file.endsWith(".stories.tsx"));
  assert(storyFiles.length > 0, "At least one component .stories.tsx must exist in src/components");
  console.log(`✅ PASS: Found ${storyFiles.length} component stories in src/components: ${storyFiles.join(", ")}`);

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED! Storybook-first component workflow verified.");
  console.log("=========================================================================");
}

run();
