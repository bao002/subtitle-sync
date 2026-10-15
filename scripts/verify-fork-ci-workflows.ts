import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import jsYaml from "js-yaml";

console.log("====================================================");
console.log("🧪 Starting Fork CI Workflows & Staging Test (Subtask 47.2)");
console.log("====================================================");

const rootDir = process.cwd();
const workflowsDir = path.resolve(rootDir, ".github", "workflows");

// 1. Verify web.yml triggers and resilient deployment
const webPath = path.join(workflowsDir, "web.yml");
assert(fs.existsSync(webPath), "web.yml must exist");
const webYaml = fs.readFileSync(webPath, "utf8");
const parsedWeb = jsYaml.load(webYaml) as any;
assert(parsedWeb.on.push, "web.yml must include push trigger for forked repositories");
assert(
  parsedWeb.on.push.branches.includes("main") && parsedWeb.on.push.branches.includes("master"),
  "web.yml must trigger on push to main and master",
);
assert(
  webYaml.includes("Deploy Web Test Outputs to GitHub Pages (gh-pages)"),
  "web.yml must contain Deploy Web Test Outputs to GitHub Pages step",
);
assert(
  webYaml.includes("if: always() &&"),
  "web.yml deployment step must use if: always() to publish reports unconditionally",
);
console.log("✅ PASS: web.yml configured with push trigger and resilient report deployment");

// 2. Verify emulation.yml triggers and resilient deployment
const emulationPath = path.join(workflowsDir, "emulation.yml");
assert(fs.existsSync(emulationPath), "emulation.yml must exist");
const emulationYaml = fs.readFileSync(emulationPath, "utf8");
const parsedEmulation = jsYaml.load(emulationYaml) as any;
assert(parsedEmulation.on.push, "emulation.yml must include push trigger for forked repositories");
assert(
  parsedEmulation.on.push.branches.includes("main") &&
    parsedEmulation.on.push.branches.includes("master"),
  "emulation.yml must trigger on push to main and master",
);
assert(
  emulationYaml.includes("Deploy Android Emulator Artifacts to GitHub Pages"),
  "emulation.yml must contain Deploy Android Emulator Artifacts step",
);
assert(
  emulationYaml.includes("if: always() &&"),
  "emulation.yml deployment step must use if: always() to publish reports unconditionally",
);
console.log("✅ PASS: emulation.yml configured with push trigger and resilient report deployment");

// 3. Verify deploy-demo.yml stages and preserves all reports
const deployDemoPath = path.join(workflowsDir, "deploy-demo.yml");
assert(fs.existsSync(deployDemoPath), "deploy-demo.yml must exist");
const deployDemoYaml = fs.readFileSync(deployDemoPath, "utf8");
const parsedDeployDemo = jsYaml.load(deployDemoYaml) as any;
assert.doesNotThrow(() => parsedDeployDemo, "deploy-demo.yml must be valid YAML");
assert(
  deployDemoYaml.includes("Stage E2E Reports into Web Distribution"),
  "deploy-demo.yml must stage and preserve E2E reports into dist/",
);
assert(
  deployDemoYaml.includes("mochawesome.html") &&
    deployDemoYaml.includes("playwright") &&
    deployDemoYaml.includes("android-emulator-report.html"),
  "deploy-demo.yml must preserve mochawesome, playwright, and android emulator reports",
);
console.log("✅ PASS: deploy-demo.yml preserves all E2E reports across deployments");

console.log("====================================================");
console.log("🎉 Fork CI Workflows & Staging Test PASSED!");
console.log("====================================================");
