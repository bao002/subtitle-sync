/**
 * Automated Verification Script: docs/steps.md
 *
 * Verifies that:
 * 1. docs/steps.md exists strictly under docs/ and not in root.
 * 2. Covers the ordered steps by descending importance (Steps 1 to 6).
 * 3. Specifies isolated design rules (Storybook, mock fixtures, pure props).
 * 4. Specifies isolated testing rules (Vitest pure functions, synthetic clock ticks, schema contract gates).
 * 5. Explains the minimal integration layer connecting decoupled pieces.
 * 6. Validates synchronized version 2.0.78 across all 5 version targets.
 */

import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Verification failed: ${message}`);
    process.exit(1);
  }
}

console.log("🔍 Verifying docs/steps.md and isolated architecture specifications...");

const rootDir = process.cwd();
const stepsPath = path.join(rootDir, "docs", "steps.md");
const rootStepsPath = path.join(rootDir, "steps.md");

// 1. Mandatory location check
assert(fs.existsSync(stepsPath), "docs/steps.md must exist under docs/");
assert(!fs.existsSync(rootStepsPath), "steps.md must NOT exist in the repository root (strictly docs/*.md policy)");

const content = fs.readFileSync(stepsPath, "utf-8");

// 2. Ordered steps by importance check
assert(content.includes("Step 1 (Highest Importance)"), "docs/steps.md must include Step 1 (Highest Importance)");
assert(content.includes("Step 2 (High Importance)"), "docs/steps.md must include Step 2 (High Importance)");
assert(content.includes("Step 3 (High Importance)"), "docs/steps.md must include Step 3 (High Importance)");
assert(content.includes("Step 4 (Medium Importance)"), "docs/steps.md must include Step 4 (Medium Importance)");
assert(content.includes("Step 5 (Medium Importance)"), "docs/steps.md must include Step 5 (Medium Importance)");
assert(content.includes("Step 6 (Minimal Integration Layer)"), "docs/steps.md must include Step 6 (Minimal Integration Layer)");

// 3. Isolated design & testing specifications
assert(content.includes("Pure Transformation Pipeline"), "docs/steps.md must cover the pure transformation pipeline");
assert(content.includes("Multi-Language Temporal Alignment"), "docs/steps.md must cover multi-language alignment");
assert(content.includes("Headless Playback & Speech Coordination"), "docs/steps.md must cover headless playback coordination");
assert(content.includes("Schema Conformance Gate"), "docs/steps.md must cover schema conformance gate");
assert(content.includes("Storybook"), "docs/steps.md must cover Storybook for isolated UI design");
assert(content.includes("Minimal Integration Layer") || content.includes("The Glue Shell"), "docs/steps.md must cover minimal integration layer");
assert(content.includes("Summary Matrix"), "docs/steps.md must include the summary isolation/integration table");

// 4. Version consistency check across 5 files
console.log("🔍 Checking version parity (2.0.78)...");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert(packageJson.version === "2.0.78", `package.json version must be 2.0.78, found: ${packageJson.version}`);

const gradleContent = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert(gradleContent.includes('versionName = "2.0.78"'), "build.gradle.kts must have versionName = 2.0.78");
assert(gradleContent.includes("versionCode = 20078"), "build.gradle.kts must have versionCode = 20078");

const appConfigContent = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf-8");
assert(appConfigContent.includes('APP_VERSION = "2.0.78"'), "appConfig.ts must have APP_VERSION = 2.0.78");

const apkUpdaterContent = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert(apkUpdaterContent.includes('CURRENT_APK_VERSION = "v2.0.78"'), "apkUpdater.ts must have CURRENT_APK_VERSION = v2.0.78");

const appSettingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert(appSettingsContent.includes('version: "2.0.78"'), "appSettings.ts must have version: 2.0.78");

console.log("✅ All verification assertions passed successfully! docs/steps.md satisfies all architectural requirements.");
