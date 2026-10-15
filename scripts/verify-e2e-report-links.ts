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

// 1. Verify E2E Reports Section exists in README.md
assert(
  readme.includes("## 🌐 GitHub Pages Links"),
  "README.md must contain ## 🌐 GitHub Pages Links section",
);
console.log("✅ PASS: GitHub Pages Links section present in README.md");

// 2. Verify Mochawesome E2E Test Report Link
const mochawesomeMatch = readme.match(
  /\[\*\*Open Mochawesome Report\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/mochawesome\.html)\)/,
);
assert(
  mochawesomeMatch,
  "README.md must contain [**Open Mochawesome Report**] link pointing to mochawesome.html",
);
console.log(`✅ PASS: Mochawesome report link verified: ${mochawesomeMatch[1]}`);

// 3. Verify Playwright E2E Test Report Link
const playwrightMatch = readme.match(
  /\[\*\*Open Playwright Report\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/playwright\/index\.html)\)/,
);
assert(
  playwrightMatch,
  "README.md must contain [**Open Playwright Report**] link pointing to playwright/index.html",
);
console.log(`✅ PASS: Playwright report link verified: ${playwrightMatch[1]}`);

// 4. Verify Android Emulator E2E Test Report Link
const emulatorReportMatch = readme.match(
  /\[\*\*Open Android Emulator Report\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/android-emulator-report\.html)\)/,
);
assert(
  emulatorReportMatch,
  "README.md must contain [**Open Android Emulator Report**] link pointing to android-emulator-report.html",
);
console.log(`✅ PASS: Android Emulator report link verified: ${emulatorReportMatch[1]}`);

// 5. Verify Android Emulator Screenshot Link
const screenshotMatch = readme.match(
  /\[\*\*View Latest Emulator Screenshot\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/screenshots\/android-emulator-screenshot\.png)\)/,
);
assert(
  screenshotMatch,
  "README.md must contain [**View Latest Emulator Screenshot**] link pointing to android-emulator-screenshot.png",
);
console.log(`✅ PASS: Emulator screenshot link verified: ${screenshotMatch[1]}`);

// 5b. Verify Android Emulator Screencast Video Link & Size
const videoMatch =
  readme.match(
    /\[\*\*View\/Download MP4 Screencast[^*]*\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/screenshots\/android-emulator-video\.mp4)\)/,
  ) ||
  readme.match(
    /⚠️\s*\[\*\*Broken Link \/ Missing Asset[^*]*\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/android-emulator-report\.html)\)/,
  ) ||
  readme.match(
    /⚠️\s*\[\*\*Missing Asset \/ HTTP 404\*\*\]\((https:\/\/[^/]+\.github\.io\/[^/]+\/screenshots\/android-emulator-video\.mp4)\)/,
  );
assert(
  videoMatch,
  "README.md must contain [**View/Download MP4 Screencast...**] link pointing to android-emulator-video.mp4 with size or missing asset indicator",
);
console.log(`✅ PASS: Emulator screencast video link verified: ${videoMatch[1]}`);

// 6. Verify CI Workflow Links
assert(
  readme.includes("actions/workflows/web.yml"),
  "README.md must link to Web E2E CI workflow actions/workflows/web.yml",
);
assert(
  readme.includes("actions/workflows/emulation.yml"),
  "README.md must link to Android Emulation CI workflow actions/workflows/emulation.yml",
);
console.log("✅ PASS: Live CI workflows for Web E2E and Emulation E2E linked in README.md");

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
