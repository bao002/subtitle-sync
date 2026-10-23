import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Task 189: Beginner Mode vs Advanced Mode Video Functionality");
console.log("=========================================================================");

const rootDir = process.cwd();

// Test 1: BeginnerFlowContainer Video Accordion & ForceMount
console.log("--> [Test 1] Verifying BeginnerFlowContainer video player mount lifecycle...");
const flowContainerPath = path.join(rootDir, "src/components/beginner/BeginnerFlowContainer.tsx");
assert.ok(fs.existsSync(flowContainerPath), "BeginnerFlowContainer.tsx must exist");
const flowCode = fs.readFileSync(flowContainerPath, "utf-8");

assert.ok(
  flowCode.includes("forceMount={true}"),
  "BeginnerFlowContainer must set forceMount={true} on AccordionContent so playerSlot mounts in DOM",
);
assert.ok(
  flowCode.includes("const [accordionValue, setAccordionValue] = useState<string>(\"\");"),
  "BeginnerFlowContainer must maintain controlled accordionValue state",
);
assert.ok(
  flowCode.includes("if (isPlaying)") && flowCode.includes('setAccordionValue("video-player")'),
  "BeginnerFlowContainer must auto-expand accordion when video playback starts (isPlaying)",
);
assert.ok(
  flowCode.includes("handleSubmitUrl") && flowCode.includes('setAccordionValue("video-player")'),
  "BeginnerFlowContainer must expand accordion upon video submission via handleSubmitUrl",
);
assert.ok(
  flowCode.includes('defaultValue=""') && flowCode.includes("collapsible"),
  "Accordion must preserve collapsible and defaultValue=\"\" folded baseline for compatibility",
);
console.log("✅ PASS: BeginnerFlowContainer video accordion properly forceMounts and auto-expands.");

// Test 2: Index route player ref callback & dynamic initialization
console.log("--> [Test 2] Verifying src/routes/index.tsx player container mount & lifecycle...");
const indexPath = path.join(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexCode = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexCode.includes("const [playerContainerNode, setPlayerContainerNode] = useState<HTMLDivElement | null>(null);"),
  "index.tsx must track playerContainerNode state for reactive DOM mount detection",
);
assert.ok(
  indexCode.includes("const handlePlayerRef = useCallback((el: HTMLDivElement | null) => {"),
  "index.tsx must define handlePlayerRef callback",
);
assert.ok(
  indexCode.includes("<div ref={handlePlayerRef} className=\"h-full w-full\" />"),
  "index.tsx must connect handlePlayerRef to player container slots in Beginner and Advanced modes",
);
assert.ok(
  indexCode.includes("[videoId, isAndroid, workflowMode, playerContainerNode]"),
  "Player useEffect dependency array must include playerContainerNode",
);
assert.ok(
  indexCode.includes("if (!player.current && playerEl.current && window.YT?.Player)"),
  "Player polling interval must dynamically initialize player when DOM host and API become ready",
);
assert.ok(
  indexCode.includes("player.current.loadVideoById(newId)") || indexCode.includes("player.current?.loadVideoById"),
  "handleSelectLibraryVideo must re-cue/play video if same videoId is selected or submitted",
);
console.log("✅ PASS: Index route player container lifecycle and re-init verified.");

// Test 3: Proper Terminology: "Beginner Mode" vs "Advanced Mode" / "Advanced Studio"
console.log("--> [Test 3] Verifying proper terminology across UI...");
const switcherPath = path.join(rootDir, "src/components/ModeSwitcherHeader.tsx");
assert.ok(fs.existsSync(switcherPath), "ModeSwitcherHeader.tsx must exist");
const switcherCode = fs.readFileSync(switcherPath, "utf-8");

assert.ok(
  switcherCode.includes("Beginner Mode (Guided Tabs)"),
  "ModeSwitcherHeader must display 'Beginner Mode (Guided Tabs)'",
);
assert.ok(
  switcherCode.includes("Advanced Studio (Full Controls)"),
  "ModeSwitcherHeader must display 'Advanced Studio (Full Controls)'",
);

// Scan for incorrect "advance mode" (without 'd')
const forbiddenTermRegex = /\badvance mode\b/i;
assert.ok(
  !forbiddenTermRegex.test(flowCode),
  "BeginnerFlowContainer must not contain 'advance mode'",
);
assert.ok(
  !forbiddenTermRegex.test(indexCode),
  "index.tsx must not contain 'advance mode'",
);
assert.ok(
  !forbiddenTermRegex.test(switcherCode),
  "ModeSwitcherHeader.tsx must not contain 'advance mode'",
);
console.log("✅ PASS: Proper terminology ('Beginner Mode' vs 'Advanced Mode') verified.");

// Test 4: Version 1.0.103 Parity across all 5 codebase targets
console.log("--> [Test 4] Verifying version 1.0.103 parity across all 5 targets...");
const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert.equal(pkgJson.version, "1.0.103", "package.json version must be 1.0.103");

const gradleCode = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(gradleCode.includes('versionCode = 10103'), "build.gradle.kts versionCode must be 10103");
assert.ok(gradleCode.includes('versionName = "1.0.103"'), "build.gradle.kts versionName must be 1.0.103");

const apkUpdaterCode = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(apkUpdaterCode.includes('CURRENT_APK_VERSION = "v1.0.103"'), "apkUpdater.ts must be v1.0.103");

const appSettingsCode = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(appSettingsCode.includes('version: "1.0.103"'), "appSettings.ts snapshot version must be 1.0.103");

const appConfigCode = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(appConfigCode.includes('APP_VERSION = "1.0.103"'), "appConfig.ts APP_VERSION must be 1.0.103");
console.log("✅ PASS: Version 1.0.103 synchronized across all 5 targets.");

console.log("=========================================================================");
console.log("🎉 ALL TASK 189 VERIFICATION CHECKS PASSED (100%)!");
console.log("=========================================================================");
