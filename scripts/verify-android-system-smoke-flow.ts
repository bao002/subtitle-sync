import fs from "fs";
import path from "path";

console.log("=========================================================================");
console.log("🧪 Verifying Android System Smoke & Screencast GitHub Actions Flow");
console.log("=========================================================================");

let failureCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failureCount++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

const rootDir = process.cwd();

// 1. Verify existence of .github/workflows/android-system-smoke.yml
const smokeWorkflowPath = path.resolve(rootDir, ".github/workflows/android-system-smoke.yml");
assert(fs.existsSync(smokeWorkflowPath), ".github/workflows/android-system-smoke.yml must exist");

const smokeContent = fs.existsSync(smokeWorkflowPath)
  ? fs.readFileSync(smokeWorkflowPath, "utf-8")
  : "";

// 2. Verify runner, emulator, and pure OS configuration
assert(
  smokeContent.includes("runs-on: macos-14"),
  "android-system-smoke.yml must use macos-14 runner",
);
assert(
  smokeContent.includes("reactivecircus/android-emulator-runner@v2"),
  "android-system-smoke.yml must use reactivecircus/android-emulator-runner@v2",
);
assert(
  smokeContent.includes("api-level: 34"),
  "android-system-smoke.yml must target api-level: 34",
);
assert(
  smokeContent.includes("target: google_apis"),
  "android-system-smoke.yml must target google_apis",
);
assert(
  smokeContent.includes("arch: arm64-v8a"),
  "android-system-smoke.yml must use arch: arm64-v8a",
);

// 3. Verify no app compilation or execution in system smoke flow
assert(
  !smokeContent.includes("assembleDebug"),
  "android-system-smoke.yml must NOT compile the app (pure system smoke)",
);
assert(
  !smokeContent.includes("com.ytviewer.app"),
  "android-system-smoke.yml must NOT install or launch repo application package",
);

// 4. Verify screencast and screenshot generation
assert(
  smokeContent.includes("adb shell screenrecord") &&
    smokeContent.includes("pkill -2 -f screenrecord"),
  "android-system-smoke.yml must record screencast and finalize gracefully with SIGINT",
);
assert(
  smokeContent.includes("android-system-home.png") &&
    smokeContent.includes("android-system-settings.png"),
  "android-system-smoke.yml must capture Home and Settings screenshots",
);
assert(
  smokeContent.includes("android-system-screencast.mp4"),
  "android-system-smoke.yml must produce android-system-screencast.mp4",
);
assert(
  smokeContent.includes("name: android-system-artifacts"),
  "android-system-smoke.yml must upload android-system-artifacts",
);

// 5. Zero cron job policy
assert(
  !smokeContent.includes("schedule:") && !smokeContent.includes("cron:"),
  "android-system-smoke.yml must NOT contain cron or schedule trigger",
);

// 6. Verify emulation.yml flow_mode input
const emulationPath = path.resolve(rootDir, ".github/workflows/emulation.yml");
assert(fs.existsSync(emulationPath), "emulation.yml must exist");
const emulationContent = fs.readFileSync(emulationPath, "utf-8");
assert(
  emulationContent.includes("flow_mode:") && emulationContent.includes("system-smoke"),
  "emulation.yml must support workflow_dispatch flow_mode with system-smoke option",
);

// 7. Verify documentation references
const e2eGuidePath = path.resolve(
  rootDir,
  "docs/e2e_testing_including_android_codespace_docker_and_github_pages.md",
);
const e2eGuideContent = fs.readFileSync(e2eGuidePath, "utf-8");
assert(
  e2eGuideContent.includes("android-system-smoke.yml"),
  "docs/e2e_testing_including_android_codespace_docker_and_github_pages.md must document android-system-smoke.yml",
);

const androidMdPath = path.resolve(rootDir, "docs/android.md");
const androidMdContent = fs.readFileSync(androidMdPath, "utf-8");
assert(
  androidMdContent.includes("android-system-smoke.yml"),
  "docs/android.md must document android-system-smoke.yml",
);

// 8. Verify docs/files.md registration
const filesMdPath = path.resolve(rootDir, "docs/files.md");
const filesMdContent = fs.readFileSync(filesMdPath, "utf-8");
assert(
  filesMdContent.includes(".github/workflows/android-system-smoke.yml"),
  "docs/files.md must catalog .github/workflows/android-system-smoke.yml",
);
assert(
  filesMdContent.includes("scripts/verify-android-system-smoke-flow.ts"),
  "docs/files.md must catalog scripts/verify-android-system-smoke-flow.ts",
);

// 9. Verify package.json script registration
const packageJsonPath = path.resolve(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
assert(
  Boolean(packageJson.scripts && packageJson.scripts["test:android-system-smoke-flow"]),
  "package.json must contain script 'test:android-system-smoke-flow'",
);

console.log("=========================================================================");
if (failureCount === 0) {
  console.log("🎉 ALL ANDROID SYSTEM SMOKE FLOW VERIFICATIONS PASSED!");
  process.exit(0);
} else {
  console.error(`❌ ${failureCount} VERIFICATION(S) FAILED.`);
  process.exit(1);
}
