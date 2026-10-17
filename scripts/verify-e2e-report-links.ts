import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import jsYaml from "js-yaml";

console.log("====================================================");
console.log("🧪 Starting Dedicated E2E Report Links Verification");
console.log("====================================================");

const rootDir = process.cwd();
const readmePath = path.resolve(rootDir, "README.md");
assert(fs.existsSync(readmePath), "README.md must exist in root");

const readme = fs.readFileSync(readmePath, "utf8");

// 1. Verify Android Emulator E2E Test Report Link in README.md
const emulatorReportMatch = readme.match(
  /\[([^\]]*report[^\]]*)\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/android-emulator-report\.html)\)/i,
);
assert(
  emulatorReportMatch,
  "README.md must contain report link pointing to android-emulator-report.html on GitHub Pages",
);
console.log(
  `✅ PASS: Android Emulator report link verified in basic README: ${emulatorReportMatch[2]}`,
);

// 2. Verify public report artifact exists
const reportFile = path.resolve(rootDir, "public/android-emulator-report.html");
assert(fs.existsSync(reportFile), "public/android-emulator-report.html must exist");
console.log("✅ PASS: public/android-emulator-report.html exists");

// 3. Verify workflow files exist
const webWfPath = path.resolve(rootDir, ".github/workflows/web.yml");
const emuWfPath = path.resolve(rootDir, ".github/workflows/emulation.yml");
assert(fs.existsSync(webWfPath), ".github/workflows/web.yml must exist");
assert(fs.existsSync(emuWfPath), ".github/workflows/emulation.yml must exist");
console.log("✅ PASS: CI workflows exist: web.yml and emulation.yml");

// 7. Verify workflows stage these report artifacts
const webWorkflow = fs.readFileSync(path.resolve(rootDir, ".github/workflows/web.yml"), "utf8");
assert(
  webWorkflow.includes("Stage Playwright Report for GitHub Pages") ||
    webWorkflow.includes("playwright"),
  "web.yml must stage Playwright report for publication",
);
assert(
  webWorkflow.includes("Deploy Web Test Outputs to GitHub Pages (gh-pages)") &&
    webWorkflow.includes("if: always() &&"),
  "web.yml must include if: always() on gh-pages deployment to guarantee publishing on test triage",
);

const emulationWorkflow = fs.readFileSync(
  path.resolve(rootDir, ".github/workflows/emulation.yml"),
  "utf8",
);
assert(
  emulationWorkflow.includes("android-emulator-report.html"),
  "emulation.yml must generate and stage android-emulator-report.html",
);
assert(
  emulationWorkflow.includes("Deploy Android Emulator Artifacts to GitHub Pages") &&
    emulationWorkflow.includes("if: always() &&"),
  "emulation.yml must include if: always() on gh-pages deployment to guarantee publishing on test triage",
);

const deployDemoWorkflow = fs.readFileSync(
  path.resolve(rootDir, ".github/workflows/deploy-demo.yml"),
  "utf8",
);
assert(
  deployDemoWorkflow.includes("Stage E2E Reports into Web Distribution"),
  "deploy-demo.yml must stage and preserve E2E reports into dist/",
);
assert(
  deployDemoWorkflow.includes("mochawesome.html") &&
    deployDemoWorkflow.includes("playwright") &&
    deployDemoWorkflow.includes("android-emulator-report.html"),
  "deploy-demo.yml must preserve mochawesome, playwright, and android emulator reports",
);
console.log("✅ PASS: Workflows configured to stage, preserve, and publish all linked E2E reports");

// 8. Validate YAML syntax of all relevant workflows with js-yaml
assert.doesNotThrow(() => jsYaml.load(webWorkflow), "web.yml must be valid YAML");
assert.doesNotThrow(() => jsYaml.load(emulationWorkflow), "emulation.yml must be valid YAML");
assert.doesNotThrow(() => jsYaml.load(deployDemoWorkflow), "deploy-demo.yml must be valid YAML");
console.log("✅ PASS: All deployment workflows validated with js-yaml");

console.log("====================================================");
console.log("🎉 Dedicated E2E Report Links Verification PASSED!");
console.log("====================================================");
