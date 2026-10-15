import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Android E2E Specification & Workflow Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify docs/android.md existence and no root duplicate
console.log("1. Verifying docs/android.md existence and no duplicate in root...");
const androidMdPath = path.join(rootDir, "android.md");
const docsAndroidMdPath = path.join(rootDir, "docs/android.md");
assert(
  !fs.existsSync(androidMdPath),
  "android.md must not exist in root directory (canonical is docs/android.md)",
);
assert(fs.existsSync(docsAndroidMdPath), "docs/android.md must exist in docs directory");

const androidMdContent = fs.readFileSync(docsAndroidMdPath, "utf8");

// 2. Verify comprehensive contents in android.md
console.log("2. Verifying android.md contents...");
assert(
  androidMdContent.includes("Parity Mandate") &&
    androidMdContent.includes("No Synthetic Fixtures") &&
    androidMdContent.includes("Subtitles are discovered dynamically"),
  "android.md must specify parity and elimination of synthetic fixtures",
);
assert(
  androidMdContent.includes("screenrecord") &&
    androidMdContent.includes("SIGINT") &&
    androidMdContent.includes("pkill -2") &&
    androidMdContent.includes("moov"),
  "android.md must explain screencast video capture and clean container finalization",
);
assert(
  androidMdContent.includes("GitHub Pages") &&
    androidMdContent.includes("device-telemetry-card") &&
    androidMdContent.includes("step-grid") &&
    androidMdContent.includes("video controls autoplay"),
  "android.md must detail the GitHub Pages report structure and embedded video presentation",
);
assert(
  androidMdContent.includes("This page didn't load") && androidMdContent.includes("APP_BOOT_ERROR"),
  "android.md must detail strict failure detection on error screens",
);
assert(
  androidMdContent.includes("Never Commit Video") && androidMdContent.includes("gh-pages"),
  "android.md must enforce clean repository hygiene forbidding videos on main branch",
);
console.log("✅ PASS: android.md comprehensively documents Android E2E architecture");

// 3. Verify AGENTS.md mandates Android E2E validation & screencast
console.log("3. Verifying AGENTS.md mandates Android E2E workflow...");
const agentsPath = path.join(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsPath), "AGENTS.md must exist");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

assert(
  agentsContent.includes("Android app E2E validation, screencast video & GitHub Pages reporting"),
  "AGENTS.md must feature dedicated section on Android E2E validation and screencast reporting",
);
assert(
  agentsContent.includes("screenrecord") && agentsContent.includes("pkill -2"),
  "AGENTS.md must detail the screencast video recording protocol",
);
assert(
  agentsContent.includes("android.md"),
  "AGENTS.md must reference android.md for complete operational details",
);
console.log("✅ PASS: AGENTS.md codifies Android E2E validation and screencast protocol");

// 4. Verify scripts/run-android-e2e.sh starts screenrecord before app launch
console.log("4. Verifying scripts/run-android-e2e.sh implementation...");
const runScriptPath = path.join(rootDir, "scripts/run-android-e2e.sh");
assert(fs.existsSync(runScriptPath), "scripts/run-android-e2e.sh must exist");
const runScriptContent = fs.readFileSync(runScriptPath, "utf8");

const screenrecordIndex = runScriptContent.indexOf("screenrecord --time-limit");
const amStartIndex = runScriptContent.indexOf("am start -n");
assert(
  screenrecordIndex !== -1 && amStartIndex !== -1,
  "run-android-e2e.sh must execute both screenrecord and am start",
);
assert(
  screenrecordIndex < amStartIndex,
  "screenrecord must be initiated before am start to record entire app lifecycle",
);
assert(
  runScriptContent.includes("pkill -2") || runScriptContent.includes("kill -2"),
  "run-android-e2e.sh must cleanly stop screenrecord with SIGINT",
);
assert(
  runScriptContent.includes("This page didn't load"),
  "run-android-e2e.sh must assert against error screen during launch",
);
console.log("✅ PASS: run-android-e2e.sh correctly stages recording and asserts app health");

// 5. Verify public/android-emulator-report.html renders video player & fallback listeners
console.log("5. Verifying public/android-emulator-report.html video presentation...");
const reportPath = path.join(rootDir, "public/android-emulator-report.html");
assert(fs.existsSync(reportPath), "public/android-emulator-report.html must exist");
const reportContent = fs.readFileSync(reportPath, "utf8");

assert(
  reportContent.includes("<video") &&
    reportContent.includes("android-emulator-video.mp4") &&
    reportContent.includes("screencast-fallback") &&
    reportContent.includes("device-telemetry-card"),
  "public/android-emulator-report.html must feature video player, fallback handler, and telemetry card",
);
console.log("✅ PASS: public/android-emulator-report.html has complete presentation structure");

// 6. Verify video availability lifecycle documentation
console.log("6. Verifying video availability lifecycle documentation...");
assert(
  androidMdContent.includes("Video Availability Timeline and Lifecycle") &&
    androidMdContent.includes("Why the video is not in git") &&
    androidMdContent.includes("When the video is generated"),
  "android.md must document video availability timeline and lifecycle",
);
console.log("✅ PASS: Video availability lifecycle comprehensively documented");

console.log("====================================================");
console.log("🎉 All Android E2E Specification Tests PASSED Successfully!");
console.log("====================================================");
