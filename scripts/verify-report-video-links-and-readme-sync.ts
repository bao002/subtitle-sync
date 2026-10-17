import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { execSync } from "node:child_process";

console.log("=========================================================================");
console.log("🧪 Verifying Dedicated Report Video Links & README Sync Flow");
console.log("=========================================================================");

const rootDir = process.cwd();
const reportHtmlPath = path.resolve(rootDir, "public/android-emulator-report.html");
const androidIndexPath = path.resolve(rootDir, "public/android/index.html");
const updateReadmeScript = path.resolve(rootDir, "scripts/update-readme.mjs");
const readmePath = path.resolve(rootDir, "README.md");
const updateReadmeWorkflowPath = path.resolve(rootDir, ".github/workflows/update-readme.yml");
const integrityWorkflowPath = path.resolve(rootDir, ".github/workflows/integrity.yml");

const reportVideoFlowWorkflowPath = path.resolve(
  rootDir,
  ".github/workflows/report-video-flow.yml",
);

// 1. Assert required files exist
assert(fs.existsSync(reportHtmlPath), "public/android-emulator-report.html must exist");
assert(fs.existsSync(androidIndexPath), "public/android/index.html must exist");
assert(fs.existsSync(updateReadmeScript), "scripts/update-readme.mjs must exist");
assert(fs.existsSync(readmePath), "README.md must exist");
assert(fs.existsSync(updateReadmeWorkflowPath), ".github/workflows/update-readme.yml must exist");
assert(fs.existsSync(integrityWorkflowPath), ".github/workflows/integrity.yml must exist");
assert(
  fs.existsSync(reportVideoFlowWorkflowPath),
  ".github/workflows/report-video-flow.yml must exist",
);
console.log("✅ PASS: All required report HTML, script, and workflow files exist.");

// 1b. Verify report-video-flow.yml workflow configuration & README badge
const reportVideoWorkflowContent = fs.readFileSync(reportVideoFlowWorkflowPath, "utf-8");
assert(
  reportVideoWorkflowContent.includes("name: Android Emulator Screencast & Report Video Flow"),
  "report-video-flow.yml must have name 'Android Emulator Screencast & Report Video Flow'",
);
assert(
  reportVideoWorkflowContent.includes("node scripts/update-readme.mjs"),
  "report-video-flow.yml must execute update-readme.mjs",
);
assert(
  reportVideoWorkflowContent.includes("CHECK_REMOTE_VIDEO"),
  "report-video-flow.yml must pass CHECK_REMOTE_VIDEO",
);
assert(
  reportVideoWorkflowContent.includes("workflow_dispatch:"),
  "report-video-flow.yml must support manual dispatch",
);
assert(
  reportVideoWorkflowContent.includes("actions: write"),
  "report-video-flow.yml must have actions: write permission",
);
assert(
  reportVideoWorkflowContent.includes("gh workflow run emulation.yml"),
  "report-video-flow.yml must include step to auto-trigger emulation.yml upon 404 video detection",
);

const deployDemoWorkflowContent = fs.readFileSync(
  path.resolve(rootDir, ".github/workflows/deploy-demo.yml"),
  "utf-8",
);
assert(
  deployDemoWorkflowContent.includes("android-emulator-artifacts"),
  "deploy-demo.yml must retrieve android-emulator-artifacts if missing from dist/screenshots",
);

const readmeCurrentContent = fs.readFileSync(readmePath, "utf-8");
assert(
  readmeCurrentContent.includes("android-emulator-report.html"),
  "README.md must link to android-emulator-report.html",
);
console.log(
  "✅ PASS: Dedicated report-video-flow.yml workflow, auto-trigger, and deploy-demo recovery properly configured.",
);

// 2. Validate client-side error handling & multi-path resilience in report HTMLs
const reportHtml = fs.readFileSync(reportHtmlPath, "utf-8");
const androidHtml = fs.readFileSync(androidIndexPath, "utf-8");

for (const [name, content] of [
  ["android-emulator-report.html", reportHtml],
  ["android/index.html", androidHtml],
]) {
  assert(
    content.includes('id="screencast-video-player"'),
    `${name} must include id="screencast-video-player"`,
  );
  assert(
    content.includes('id="video-broken-banner"'),
    `${name} must include #video-broken-banner element`,
  );
  assert(
    content.includes("screencast-alert-error"),
    `${name} must define .screencast-alert-error styling`,
  );
  assert(content.includes("markVideoBroken"), `${name} must include markVideoBroken JS handler`);
  assert(content.includes("#readme"), `${name} must link to README.md for AI fix prompt`);
  console.log(`✅ PASS: ${name} contains video error banner, listener, and README fix link.`);
}

assert(
  reportHtml.includes('href="./screenshots/android-emulator-video.mp4"'),
  "Root report must have valid ./screenshots/ download button",
);
assert(
  androidHtml.includes('href="../screenshots/android-emulator-video.mp4"'),
  "Subfolder report must have valid ../screenshots/ download button",
);
console.log("✅ PASS: Download button paths properly configured for root and subfolder reports.");

// 3. Verify workflow files contain dedicated report video link verification steps
const updateWorkflowContent = fs.readFileSync(updateReadmeWorkflowPath, "utf-8");
assert(
  updateWorkflowContent.includes("test:report-video-links"),
  "update-readme.yml must include test:report-video-links step",
);
assert(
  updateWorkflowContent.includes("CHECK_REMOTE_VIDEO"),
  "update-readme.yml must pass CHECK_REMOTE_VIDEO env var",
);

const integrityWorkflowContent = fs.readFileSync(integrityWorkflowPath, "utf-8");
assert(
  integrityWorkflowContent.includes("test:report-video-links"),
  "integrity.yml must include test:report-video-links step",
);
console.log(
  "✅ PASS: Workflows update-readme.yml and integrity.yml enforce report video validation.",
);

// 4. Test broken video detection and automatic README error reporting
const originalReadme = fs.readFileSync(readmePath, "utf-8");

try {
  console.log("--> Testing broken report video detection via update-readme.mjs...");
  execSync(`node scripts/update-readme.mjs mostuf25561 subtitle-sync`, {
    env: {
      ...process.env,
      REPORT_VIDEO_BROKEN: "true",
      CHECK_REMOTE_VIDEO: "false",
    },
    encoding: "utf-8",
  });

  const failureReadme = fs.readFileSync(readmePath, "utf-8");
  assert(
    failureReadme.includes("## 🚨 Latest CI Build & Test Status: FAILED"),
    "Broken video link must set CI status heading to FAILED in README.md",
  );
  assert(
    failureReadme.includes("Android Emulator Screencast & Report Video Flow"),
    "README must identify failing workflow as 'Android Emulator Screencast & Report Video Flow'",
  );
  assert(
    failureReadme.includes("android-emulator-video.mp4 returned HTTP 404"),
    "README must state that android-emulator-video.mp4 returned HTTP 404",
  );
  assert(
    failureReadme.includes(
      "# AI FIX PROMPT: CI Failure in Android Emulator Screencast & Report Video Flow",
    ),
    "README must generate structured AI Fix Prompt for broken report video link",
  );
  assert(
    failureReadme.includes(
      "https://mostuf25561.github.io/subtitle-sync/android-emulator-report.html",
    ),
    "README must reference the report URL with the broken video",
  );
  assert(
    failureReadme.includes("android-emulator-video.mp4") || failureReadme.includes("HTTP 404"),
    "README must note broken screencast video",
  );
  console.log("✅ PASS: Broken report video link correctly detected and published to README.md.");

  // 5. Test verified state recovery when video is available
  console.log("--> Testing verified state recovery when video size is acknowledged...");
  execSync(`node scripts/update-readme.mjs mostuf25561 subtitle-sync`, {
    env: {
      ...process.env,
      CI_STATUS: "success",
      VIDEO_SIZE_BYTES: "6724502",
      CHECK_REMOTE_VIDEO: "false",
    },
    encoding: "utf-8",
  });

  const restoredReadme = fs.readFileSync(readmePath, "utf-8");
  assert(
    restoredReadme.includes("## 🚦 Latest CI Build & Test Status: ALL VERIFIED"),
    "When video is verified, README.md status must return to ALL VERIFIED",
  );
  assert(
    restoredReadme.includes("6.41 MB"),
    "When video is verified, README.md must display verified file size",
  );
  console.log(
    "✅ PASS: Verified recovery restores ALL VERIFIED status and file size in README.md.",
  );
} finally {
  // Restore README to original state
  fs.writeFileSync(readmePath, originalReadme, "utf-8");
}

console.log("=========================================================================");
console.log("🎉 ALL DEDICATED REPORT VIDEO LINKS & README SYNC TESTS PASSED 100%!");
console.log("=========================================================================");
