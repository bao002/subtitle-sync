import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import jsYaml from "js-yaml";

console.log("====================================================");
console.log("🧪 Starting Emulation GitHub Pages Publication Test");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify .github/workflows/emulation.yml exists and contains required steps
const workflowPath = path.join(rootDir, ".github/workflows/emulation.yml");
assert(fs.existsSync(workflowPath), "emulation.yml must exist");
const workflowContent = fs.readFileSync(workflowPath, "utf8");
const emulatorStep = workflowContent
  .split("      - name: Run E2E Test on Android Emulator (Option C)")[1]
  ?.split("      - name: Upload Android Emulator Artifacts")[0];
const emulatorStepTimeoutSeconds = Number(
  emulatorStep?.match(/timeout-minutes:\s*(\d+)/)?.[1] ?? 0,
);
const emulatorBootTimeoutSeconds = Number(
  emulatorStep?.match(/emulator-boot-timeout:\s*(\d+)/)?.[1] ?? Infinity,
);
assert(
  emulatorStepTimeoutSeconds * 60 > emulatorBootTimeoutSeconds,
  "Android emulator step timeout must exceed its configured boot timeout",
);
console.log("✅ PASS: emulator step timeout exceeds AVD boot timeout");
assert(emulatorStep?.includes("id: android_e2e"), "Android emulator step must expose its outcome");
const resultSummaryStep = workflowContent
  .split("      - name: Publish Android E2E Result to Job Summary")[1]
  ?.split("      - name: Upload Android Emulator Artifacts")[0];
assert(
  resultSummaryStep?.includes("if: always()"),
  "Android E2E result summary must run after failures",
);
assert(
  resultSummaryStep?.includes("steps.android_e2e.outcome") &&
    resultSummaryStep.includes("GITHUB_STEP_SUMMARY"),
  "Android E2E result summary must publish the emulator step outcome to the job summary",
);
console.log("✅ PASS: emulator test result is published to the GitHub Actions job summary");
assert(
  emulatorStep?.includes("adb shell pm clear com.ytviewer.app"),
  "Android E2E must start with clean app preferences",
);
assert(
  emulatorStep?.includes("bash scripts/android-e2e-assert.sh"),
  "Android emulator workflow must run the real subtitle-fetch assertion",
);
const androidAssertion = fs.readFileSync(
  path.join(rootDir, "scripts/android-e2e-assert.sh"),
  "utf8",
);
for (const language of ["default", "he", "it"]) {
  assert(
    androidAssertion.includes(
      `SUBTITLE_FETCH kind=${language === "default" ? "default" : "translated"}${language === "default" ? "" : ` lang=${language}`}`,
    ),
    `Android E2E assertion must require real ${language} subtitle response telemetry`,
  );
}
assert(
  androidAssertion.includes("DEFAULT_LINE < HEBREW_LINE && HEBREW_LINE < ITALIAN_LINE"),
  "Android E2E assertion must prove favorite tracks arrive after the default track",
);
console.log(
  "✅ PASS: Android emulator test requires real ordered default and favorite subtitle responses",
);

// Assert permissions
assert(
  workflowContent.includes("contents: write"),
  "emulation.yml must have contents: write permission",
);
assert(workflowContent.includes("pages: write"), "emulation.yml must have pages: write permission");
console.log("✅ PASS: emulation.yml has required contents: write and pages: write permissions");

// Assert staging step
assert(
  workflowContent.includes("Stage Android Emulator Artifacts for GitHub Pages"),
  "emulation.yml must contain staging step for GitHub Pages",
);
assert(
  workflowContent.includes("gh-pages-staging/screenshots"),
  "emulation.yml must stage artifacts to gh-pages-staging/screenshots",
);
assert(
  workflowContent.includes("android-emulator-screenshot.png"),
  "emulation.yml staging must handle android-emulator-screenshot.png",
);
console.log(
  "✅ PASS: emulation.yml stages emulator screenshot and logcat into gh-pages-staging/screenshots",
);

// Assert deployment step
assert(
  workflowContent.includes("Deploy Android Emulator Artifacts to GitHub Pages (gh-pages branch)"),
  "emulation.yml must contain deployment step to gh-pages",
);
assert(
  workflowContent.includes("if: always() &&"),
  "emulation.yml deployment step must include if: always() to guarantee report publishing on triage/failure",
);
assert(
  workflowContent.includes("peaceiris/actions-gh-pages@v4"),
  "emulation.yml deployment step must use peaceiris/actions-gh-pages@v4",
);
assert(
  workflowContent.includes("publish_branch: gh-pages"),
  "emulation.yml deployment must target gh-pages branch",
);
assert(
  workflowContent.includes("keep_files: true"),
  "emulation.yml deployment must specify keep_files: true to preserve web app files",
);
assert(
  workflowContent.includes("publish_dir: ./gh-pages-staging"),
  "emulation.yml deployment must deploy from ./gh-pages-staging",
);
console.log("✅ PASS: emulation.yml configures gh-pages deployment with keep_files: true");

// Assert YAML validity via js-yaml
let parsedWorkflow: unknown;
assert.doesNotThrow(() => {
  parsedWorkflow = jsYaml.load(workflowContent);
}, "emulation.yml must be valid YAML parseable by js-yaml");
assert(
  parsedWorkflow && typeof parsedWorkflow === "object",
  "emulation.yml must parse to an object",
);
console.log("✅ PASS: emulation.yml syntax is 100% valid YAML verified by js-yaml");

// 2. Verify .gitignore ignores ephemeral emulator artifacts
const gitignorePath = path.join(rootDir, ".gitignore");
assert(fs.existsSync(gitignorePath), ".gitignore must exist");
const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");

assert(gitignoreContent.includes("gh-pages-staging/"), ".gitignore must ignore gh-pages-staging/");
assert(
  gitignoreContent.includes("android-emulator-screenshot.png"),
  ".gitignore must ignore android-emulator-screenshot.png",
);
assert(
  gitignoreContent.includes("android-emulator-logcat.txt"),
  ".gitignore must ignore android-emulator-logcat.txt",
);
assert(gitignoreContent.includes("screenshots/"), ".gitignore must ignore screenshots/");
console.log("✅ PASS: .gitignore ignores emulator screenshots and staging directory");

// 3. Verify README references direct emulator screenshot URL
const readmePath = path.join(rootDir, "README.md");
assert(fs.existsSync(readmePath), "README.md must exist");
const readmeContent = fs.readFileSync(readmePath, "utf8");
assert(
  readmeContent.includes("screenshots/android-emulator-screenshot.png"),
  "README.md must document the direct screenshot URL under screenshots/",
);
console.log("✅ PASS: README.md documents direct link to Android Emulator Screenshot");

console.log("====================================================");
console.log("📊 EMULATION GH-PAGES TEST: All tests passed!");
console.log("====================================================");
