import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("--> Starting validation of Test Coverage Generation & GitHub Pages Report Integration...");

const rootDir = process.cwd();

// 1. Verify coverage script exists and run output generation
const coverageScriptPath = path.join(rootDir, "scripts/generate-test-coverage.ts");
assert(fs.existsSync(coverageScriptPath), "scripts/generate-test-coverage.ts must exist");
console.log("Checking coverage generation outputs...");

const jsonSummaryPath = path.join(rootDir, "public/coverage/coverage-summary.json");
const htmlReportPath = path.join(rootDir, "public/coverage/index.html");

assert(fs.existsSync(jsonSummaryPath), "public/coverage/coverage-summary.json must exist");
assert(fs.existsSync(htmlReportPath), "public/coverage/index.html must exist");

const summaryData = JSON.parse(fs.readFileSync(jsonSummaryPath, "utf8"));
assert(summaryData.totalSuites > 50, `totalSuites must be > 50, got ${summaryData.totalSuites}`);
assert(summaryData.totalAssertions > 100, `totalAssertions must be > 100, got ${summaryData.totalAssertions}`);
assert(summaryData.statementCoveragePct >= 90, `statementCoveragePct must be >= 90%, got ${summaryData.statementCoveragePct}`);
assert(summaryData.branchCoveragePct >= 85, `branchCoveragePct must be >= 85%, got ${summaryData.branchCoveragePct}`);
assert(summaryData.functionCoveragePct >= 90, `functionCoveragePct must be >= 90%, got ${summaryData.functionCoveragePct}`);
assert(summaryData.lineCoveragePct >= 90, `lineCoveragePct must be >= 90%, got ${summaryData.lineCoveragePct}`);

// Check all 7 pipeline stages are marked true
const stages = summaryData.stageCoverage;
assert(stages.stage1, "Stage 1 (Acquisition & Interception) must be covered");
assert(stages.stage2, "Stage 2 (Validation & Schema Conformance) must be covered");
assert(stages.stage3, "Stage 3 (Special Characters Removal) must be covered");
assert(stages.stage4, "Stage 4 (Parser & Sentence Splitting) must be covered");
assert(stages.stage5, "Stage 5 (Translation & Multi-Language) must be covered");
assert(stages.stage6, "Stage 6 (Multi-Language Alignment Grid) must be covered");
assert(stages.stage7, "Stage 7 (Audio Playback & TTS Synthesis) must be covered");
console.log("✓ All 7 application pipeline stages confirmed 100% covered in coverage-summary.json");

// 2. Verify standalone coverage dashboard HTML
console.log("Checking standalone coverage HTML dashboard (public/coverage/index.html)...");
const coverageHtml = fs.readFileSync(htmlReportPath, "utf8");
assert(coverageHtml.includes("Test Coverage & Quality Assurance Report"), "Must contain page title");
assert(coverageHtml.includes("Overall Coverage Metrics"), "Must contain metrics section");
assert(coverageHtml.includes("Application Pipeline Stages Coverage"), "Must contain pipeline stages section");
assert(coverageHtml.includes('id="suites-table"'), "Must contain suites table");
assert(coverageHtml.includes("../android-emulator-report.html"), "Must contain link back to report");
console.log("✓ Standalone coverage dashboard verified");

// 3. Verify public/android-emulator-report.html integration
console.log("Checking public/android-emulator-report.html integration...");
const androidReportPath = path.join(rootDir, "public/android-emulator-report.html");
assert(fs.existsSync(androidReportPath), "public/android-emulator-report.html must exist");
const androidReportHtml = fs.readFileSync(androidReportPath, "utf8");

assert(androidReportHtml.includes('id="test-coverage-section"'), "Must contain id=test-coverage-section");
assert(androidReportHtml.includes("Product 4: Test Coverage & Verification Matrix"), "Must contain Product 4 heading");
assert(androidReportHtml.includes("100% Passing"), "Must contain 100% Passing badge");
assert(androidReportHtml.includes("Statements"), "Must contain Statements KPI");
assert(androidReportHtml.includes("Branches"), "Must contain Branches KPI");
assert(androidReportHtml.includes("Functions"), "Must contain Functions KPI");
assert(androidReportHtml.includes("Lines"), "Must contain Lines KPI");
assert(androidReportHtml.includes("Pipeline Stages Full Coverage"), "Must contain Pipeline Stages Full Coverage heading");
assert(androidReportHtml.includes("./coverage/index.html"), "Must link to ./coverage/index.html");
console.log("✓ public/android-emulator-report.html contains full Test Coverage card and links");

// 4. Verify public/android/index.html parity
console.log("Checking public/android/index.html parity...");
const androidIndexHtmlPath = path.join(rootDir, "public/android/index.html");
assert(fs.existsSync(androidIndexHtmlPath), "public/android/index.html must exist");
const androidIndexHtml = fs.readFileSync(androidIndexHtmlPath, "utf8");
assert(androidIndexHtml.includes('id="test-coverage-section"'), "public/android/index.html must contain test-coverage-section");
assert(androidIndexHtml.includes("Product 4: Test Coverage & Verification Matrix"), "public/android/index.html must contain Product 4 heading");
console.log("✓ public/android/index.html parity confirmed");

// 5. Verify package.json scripts
console.log("Checking package.json coverage scripts...");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
assert(pkg.scripts["test:coverage"], "package.json must contain test:coverage script");
assert(pkg.scripts["coverage"], "package.json must contain coverage script");
assert(pkg.scripts["test:test-coverage-report"], "package.json must contain test:test-coverage-report script");
console.log("✓ package.json scripts verified");

// 6. Verify version 2.0.62 across all 5 files
console.log("Verifying version 2.0.62 synchronization across all 5 files...");
assert.strictEqual(pkg.version, "2.0.62", `package.json version should be 2.0.62, got ${pkg.version}`);

const buildGradle = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf8");
assert(buildGradle.includes('versionCode = 20062'), "build.gradle.kts must have versionCode = 20062");
assert(buildGradle.includes('versionName = "2.0.62"'), "build.gradle.kts must have versionName = 2.0.62");

const appConfig = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf8");
assert(appConfig.includes('export const APP_VERSION = "2.0.62";'), "appConfig.ts must export APP_VERSION = 2.0.62");

const apkUpdater = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf8");
assert(apkUpdater.includes('export const CURRENT_APK_VERSION = "v2.0.62";'), "apkUpdater.ts must export CURRENT_APK_VERSION = v2.0.62");

const appSettings = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf8");
assert(appSettings.includes('version: "2.0.62",'), "appSettings.ts must have version: 2.0.62");
console.log("✓ All 5 files properly synchronized to version 2.0.62");

console.log("All Test Coverage & GitHub Pages Report Integration verifications passed successfully!");
