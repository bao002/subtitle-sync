import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { execSync } from "node:child_process";

console.log("=========================================================================");
console.log("🧪 Verifying README CI Status Indicator & Copy-Paste AI Error Prompt Sync");
console.log("=========================================================================");

const rootDir = process.cwd();
const readmePath = path.resolve(rootDir, "README.md");
const updateReadmeScript = path.resolve(rootDir, "scripts/update-readme.mjs");

assert(fs.existsSync(readmePath), "README.md must exist");
assert(fs.existsSync(updateReadmeScript), "scripts/update-readme.mjs must exist");

const originalReadme = fs.readFileSync(readmePath, "utf-8");

try {
  // --- Test 1: Simulate Success Status Update ---
  console.log("--> [Test 1] Simulating successful CI workflow status update...");
  execSync(`node scripts/update-readme.mjs mostuf25561 subtitle-sync`, {
    env: {
      ...process.env,
      CI_STATUS: "success",
      VIDEO_SIZE_BYTES: "6724502",
    },
    encoding: "utf-8",
  });

  const successReadme = fs.readFileSync(readmePath, "utf-8");
  assert(
    successReadme.includes("<!-- CI_STATUS_INDICATOR_START -->") &&
      successReadme.includes("<!-- CI_STATUS_INDICATOR_END -->"),
    "README.md must contain CI status indicator demarcations",
  );
  assert(
    successReadme.includes("ALL VERIFIED"),
    "Success mode must display 'ALL VERIFIED' status heading",
  );
  assert(
    successReadme.includes("Android Emulator E2E Tests") &&
      successReadme.includes("android-emulator-report.html"),
    "Success mode must link to android-emulator-report.html",
  );
  assert(
    successReadme.includes("6.41 MB"),
    "Success mode must display accurate screencast video size",
  );
  console.log("✅ PASS: Success status indicator and verified links validated in README.md.");

  // --- Test 2: Simulate Failure Status & Copy-Paste AI Error Prompt ---
  console.log("--> [Test 2] Simulating CI failure status and AI error prompt generation...");
  const mockFailureMessage = "TypeError: Cannot read properties of undefined (reading 'events') at fetchSubtitles";
  execSync(`node scripts/update-readme.mjs mostuf25561 subtitle-sync`, {
    env: {
      ...process.env,
      CI_STATUS: "failure",
      FAILED_WORKFLOW: "Android Emulator E2E Tests",
      FAILED_STEP: "Run Android Emulator E2E Tests",
      ERROR_MESSAGE: mockFailureMessage,
      GITHUB_RUN_ID: "99887766",
    },
    encoding: "utf-8",
  });

  const failureReadme = fs.readFileSync(readmePath, "utf-8");
  assert(
    failureReadme.includes("Latest CI Build & Test Status: FAILED"),
    "Failure mode must display FAILED status heading",
  );
  assert(
    failureReadme.includes("Android Emulator E2E Tests"),
    "Failure mode must display failing workflow name",
  );
  assert(
    failureReadme.includes("# AI FIX PROMPT: CI Failure in Android Emulator E2E Tests"),
    "Failure mode must generate structured copy-paste AI prompt header",
  );
  assert(
    failureReadme.includes(mockFailureMessage),
    "Failure mode must embed error log snippet inside AI prompt block",
  );
  assert(
    failureReadme.includes("Instructions for AI Assistant:"),
    "Failure mode must include actionable instructions for the AI assistant",
  );
  assert(
    failureReadme.includes("https://github.com/mostuf25561/subtitle-sync/actions/runs/99887766"),
    "Failure mode must include direct link to the failing run",
  );
  console.log("✅ PASS: Failure indicator and copy-pasteable AI fix prompt validated in README.md.");

  // --- Test 3: Verify GitHub Actions Workflow Triggers ---
  console.log("--> [Test 3] Verifying .github/workflows/update-readme.yml triggers and sync step...");
  const workflowPath = path.resolve(rootDir, ".github/workflows/update-readme.yml");
  assert(fs.existsSync(workflowPath), ".github/workflows/update-readme.yml must exist");
  const workflowContent = fs.readFileSync(workflowPath, "utf-8");

  assert(workflowContent.includes("workflow_run:"), "update-readme.yml must trigger on workflow_run");
  assert(workflowContent.includes("Android Emulator E2E Tests"), "Must trigger after Android Emulator E2E Tests");
  assert(workflowContent.includes("Web E2E Tests"), "Must trigger after Web E2E Tests");
  assert(workflowContent.includes("node scripts/update-readme.mjs"), "Must execute update-readme.mjs");
  assert(workflowContent.includes("git commit -m"), "Must commit updated README back to branch");

  console.log("✅ PASS: update-readme.yml workflow triggers and automated commit step validated.");

  // --- Test 4: Verify Asset Fallbacks in Report HTML ---
  console.log("--> [Test 4] Verifying report HTML asset links and fallbacks...");
  const reportPath = path.resolve(rootDir, "public/android-emulator-report.html");
  const androidIndexPath = path.resolve(rootDir, "public/android/index.html");

  assert(fs.existsSync(reportPath), "public/android-emulator-report.html must exist");
  assert(fs.existsSync(androidIndexPath), "public/android/index.html must exist");

  const reportHtml = fs.readFileSync(reportPath, "utf-8");
  const androidHtml = fs.readFileSync(androidIndexPath, "utf-8");

  assert(
    reportHtml.includes('href="./screenshots/android-emulator-video.mp4"') &&
      reportHtml.includes('target="_blank"'),
    "Root report must have valid download link for MP4",
  );
  assert(
    androidHtml.includes('href="../screenshots/android-emulator-video.mp4"') &&
      androidHtml.includes('target="_blank"'),
    "Subfolder report must resolve to ../screenshots/android-emulator-video.mp4",
  );
  assert(
    reportHtml.includes("screencast-fallback") && reportHtml.includes("Screencast Video Lifecycle"),
    "Report must contain lifecycle explanation for video screencast",
  );

  // --- Test 5: Verify Active Broken Link Detection & Reporting ---
  console.log("--> [Test 5] Verifying active broken link detection and automatic reporting...");
  const tempReadmeWithBrokenLink = originalReadme + "\n\n[Broken Link Test](./non-existent-doc-12345.md)\n";
  fs.writeFileSync(readmePath, tempReadmeWithBrokenLink, "utf-8");

  execSync(`node scripts/update-readme.mjs mostuf25561 subtitle-sync`, {
    encoding: "utf-8",
  });

  const brokenLinkReadme = fs.readFileSync(readmePath, "utf-8");
  assert(
    brokenLinkReadme.includes("Latest CI Build & Test Status: FAILED"),
    "Broken link must trigger FAILED status in README.md",
  );
  assert(
    brokenLinkReadme.includes("Broken Links Detected:"),
    "Failure section must list broken links header",
  );
  assert(
    brokenLinkReadme.includes("non-existent-doc-12345.md"),
    "Failure section must explicitly name the missing target file",
  );
  assert(
    brokenLinkReadme.includes("# AI FIX PROMPT: CI Failure in README Link Integrity & Documentation Check"),
    "Must generate specific AI fix prompt for broken link integrity check",
  );
  console.log("✅ PASS: Active broken link detection and detailed reporting validated.");
} finally {
  // Restore README to latest synchronized state
  fs.writeFileSync(readmePath, originalReadme, "utf-8");
  execSync(`node scripts/update-readme.mjs mostuf25561 subtitle-sync`, {
    env: { ...process.env, CI_STATUS: "success" },
    encoding: "utf-8",
  });
}

console.log("=========================================================================");
console.log("🎉 ALL README CI STATUS & AI ERROR PROMPT TESTS PASSED 100%!");
console.log("=========================================================================");
