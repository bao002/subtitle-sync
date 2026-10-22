import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";
import { APP_VERSION } from "../src/config/appConfig";

console.log("==================================================================");
console.log("🧪 Starting Task 186: Mode Switcher Hidden Style Verification");
console.log("==================================================================");

const rootDir = process.cwd();
const modeSwitcherPath = path.join(rootDir, "src/components/ModeSwitcherHeader.tsx");
const indexPath = path.join(rootDir, "src/routes/index.tsx");
const packageJsonPath = path.join(rootDir, "package.json");
const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const appSettingsPath = path.join(rootDir, "src/utils/appSettings.ts");

// 1. Verify ModeSwitcherHeader has 'hidden' class to satisfy Focus Mode user request
console.log("Test 1: Verifying ModeSwitcherHeader element has 'hidden' class...");
assert.ok(fs.existsSync(modeSwitcherPath), "ModeSwitcherHeader.tsx must exist");
const modeSwitcherContent = fs.readFileSync(modeSwitcherPath, "utf-8");

assert.ok(
  modeSwitcherContent.includes('id="mode-switcher-header"'),
  "ModeSwitcherHeader must have id='mode-switcher-header'",
);
assert.ok(
  modeSwitcherContent.includes("hidden"),
  "ModeSwitcherHeader root element must include 'hidden' class to hide redundant banner",
);
console.log("✅ PASS: ModeSwitcherHeader applies 'hidden' styling to #mode-switcher-header.");

// 2. Verify semantic theme tokens and test IDs are preserved
console.log("Test 2: Verifying semantic theme tokens and test IDs in ModeSwitcherHeader...");
assert.ok(modeSwitcherContent.includes("bg-card/90"), "Must preserve bg-card/90 theme token");
assert.ok(modeSwitcherContent.includes("border-border"), "Must preserve border-border theme token");
assert.ok(modeSwitcherContent.includes("text-foreground"), "Must preserve text-foreground theme token");
assert.ok(
  modeSwitcherContent.includes('data-testid="mode-switcher-header"'),
  "Must preserve data-testid='mode-switcher-header'",
);
assert.ok(
  modeSwitcherContent.includes('data-testid="btn-mode-beginner"'),
  "Must preserve data-testid='btn-mode-beginner'",
);
assert.ok(
  modeSwitcherContent.includes('data-testid="btn-mode-expert"'),
  "Must preserve data-testid='btn-mode-expert'",
);
console.log("✅ PASS: Semantic tokens and required testids are preserved.");

// 3. Verify index.tsx includes header-mode-toggle button referenced by user
console.log("Test 3: Verifying existing mode switch button in header...");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");
assert.ok(
  indexContent.includes('data-testid="header-mode-toggle"'),
  "src/routes/index.tsx must contain data-testid='header-mode-toggle'",
);
console.log("✅ PASS: index.tsx contains active header-mode-toggle button.");

// 4. Verify version 1.0.100 parity across all 5 targets
console.log("Test 4: Verifying version 1.0.100 synchronization...");
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
assert.equal(pkg.version, "1.0.100", "package.json version must be 1.0.100");
assert.equal(APP_VERSION, "1.0.100", "appConfig.ts APP_VERSION must be 1.0.100");
assert.equal(CURRENT_APK_VERSION, "v1.0.100", "apkUpdater.ts CURRENT_APK_VERSION must be v1.0.100");

const gradleContent = fs.readFileSync(gradlePath, "utf-8");
assert.ok(gradleContent.includes('versionName = "1.0.100"'), "build.gradle.kts must have versionName 1.0.100");
assert.ok(gradleContent.includes("versionCode = 10100"), "build.gradle.kts must have versionCode 10100");

const appSettingsContent = fs.readFileSync(appSettingsPath, "utf-8");
assert.ok(appSettingsContent.includes('version: "1.0.100"'), "appSettings.ts must have version 1.0.100");
console.log("✅ PASS: All 5 version targets synchronized at 1.0.100.");

console.log("==================================================================");
console.log("🎉 Task 186: Mode Switcher Hidden Style Verification PASSED 100%!");
console.log("==================================================================");
