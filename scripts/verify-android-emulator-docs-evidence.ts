import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("====================================================");
console.log("🧪 Running Verification: Android Emulator GitHub Actions Docs & Authenticity Evidence (Task 160)");
console.log("====================================================");

const rootDir = process.cwd();

// Test 1: Verify docs/android.md exists and documents GitHub Actions emulator runner architecture
console.log("Test 1: docs/android.md GitHub Actions emulator runner architecture...");
const androidMdPath = path.resolve(rootDir, "docs/android.md");
assert.ok(fs.existsSync(androidMdPath), "docs/android.md must exist");
const androidMd = fs.readFileSync(androidMdPath, "utf-8");

assert.ok(
  androidMd.includes("GitHub Actions Android Emulator Architecture & Runner Pipeline"),
  "docs/android.md must define GitHub Actions emulator runner pipeline",
);
assert.ok(
  androidMd.includes("macos-14") && androidMd.includes("Hypervisor.framework"),
  "docs/android.md must document macos-14 host and hardware virtualization",
);
assert.ok(
  androidMd.includes("reactivecircus/android-emulator-runner@v2"),
  "docs/android.md must document reactivecircus action",
);
assert.ok(
  androidMd.includes("api-level: 34") && androidMd.includes("arm64-v8a"),
  "docs/android.md must document API level 34 and ARM64 architecture",
);
assert.ok(
  androidMd.includes("workflow_run"),
  "docs/android.md must document workflow_run chaining from release build",
);
console.log("✅ PASS: docs/android.md comprehensively defines GitHub Actions runner architecture");

// Test 2: Verify docs/android.md documents the 5 authenticity evidence layers
console.log("Test 2: docs/android.md 5 authenticity evidence layers...");
assert.ok(
  androidMd.includes("Authenticity Evidence & Telemetry Verification in Test Report"),
  "docs/android.md must have dedicated section for authenticity evidence",
);
assert.ok(
  androidMd.includes("android-emulator-device-info.json") &&
    androidMd.includes("ro.product.model") &&
    androidMd.includes("ro.build.version.sdk"),
  "docs/android.md must document live device hardware telemetry extraction via ADB",
);
assert.ok(
  androidMd.includes("step-02-app-launch.png") &&
    androidMd.includes("step-03-action-view.png") &&
    androidMd.includes("step-04-action-send.png"),
  "docs/android.md must document multi-milestone framebuffer screencaps",
);
assert.ok(
  androidMd.includes("AUTHENTIC_CAPTIONS_EXPOSED") || androidMd.includes("CAPTION_TEXT_EXPOSED"),
  "docs/android.md must document authentic caption text exposure in logcat",
);
assert.ok(
  androidMd.includes("uiautomator dump") && androidMd.includes("This page didn't load"),
  "docs/android.md must document dual-layer error screen verification",
);
assert.ok(
  androidMd.includes("VISITOR_INFO1_LIVE") && androidMd.includes("; wv"),
  "docs/android.md must document native network interception & anti-bot cookie preservation",
);
console.log("✅ PASS: docs/android.md documents all 5 authenticity evidence layers");

// Test 3: Verify .github/workflows/emulation.yml aligns with documented architecture
console.log("Test 3: .github/workflows/emulation.yml alignment...");
const workflowPath = path.resolve(rootDir, ".github/workflows/emulation.yml");
assert.ok(fs.existsSync(workflowPath), ".github/workflows/emulation.yml must exist");
const workflow = fs.readFileSync(workflowPath, "utf-8");

assert.ok(workflow.includes("macos-14"), "emulation.yml must run on macos-14");
assert.ok(
  workflow.includes("reactivecircus/android-emulator-runner@v2"),
  "emulation.yml must use reactivecircus emulator runner action",
);
assert.ok(workflow.includes("api-level: 34"), "emulation.yml must target api-level 34");
assert.ok(workflow.includes("arch: arm64-v8a"), "emulation.yml must target arm64-v8a");
assert.ok(
  workflow.includes("android-emulator-device-info.json"),
  "emulation.yml must output android-emulator-device-info.json",
);
console.log("✅ PASS: emulation.yml aligns with documented emulator architecture");

// Test 4: Verify scripts/android-e2e-assert.sh aligns with evidence & error assertion
console.log("Test 4: scripts/android-e2e-assert.sh alignment...");
const assertScriptPath = path.resolve(rootDir, "scripts/android-e2e-assert.sh");
assert.ok(fs.existsSync(assertScriptPath), "scripts/android-e2e-assert.sh must exist");
const assertScript = fs.readFileSync(assertScriptPath, "utf-8");

assert.ok(
  assertScript.includes("uiautomator dump"),
  "android-e2e-assert.sh must execute uiautomator dump for error screen checking",
);
assert.ok(
  assertScript.includes("This page didn't load"),
  "android-e2e-assert.sh must check for 'This page didn't load' error screen",
);
assert.ok(
  assertScript.includes("action.VIEW") && assertScript.includes("action.SEND"),
  "android-e2e-assert.sh must validate ACTION_VIEW and ACTION_SEND share intents",
);
console.log("✅ PASS: android-e2e-assert.sh enforces live device assertion and error screening");

console.log("====================================================");
console.log("🎉 ALL ANDROID EMULATOR DOCS & EVIDENCE TESTS PASSED!");
console.log("====================================================");
