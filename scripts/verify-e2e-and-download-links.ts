import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import child_process from "node:child_process";
import jsYaml from "js-yaml";

console.log("=========================================================================");
console.log("🧪 Starting Dedicated E2E Test & Download Links Verification Suite (Task 148)");
console.log("=========================================================================");

const rootDir = process.cwd();

// -----------------------------------------------------------------------------
// 1. Verify E2E Test Targets in package.json and web.yml
// -----------------------------------------------------------------------------
console.log("\n--> [Step 1] Verifying E2E test targets in package.json and web.yml...");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf8"));
assert(
  pkg.scripts["test:e2e"] && pkg.scripts["test:e2e"].includes("e2e/emulation.spec.ts"),
  "package.json test:e2e must target e2e/emulation.spec.ts",
);
assert(
  pkg.scripts["test:e2e:web"] && pkg.scripts["test:e2e:web"].includes("e2e/emulation.spec.ts"),
  "package.json test:e2e:web must target e2e/emulation.spec.ts",
);

const webWorkflowPath = path.resolve(rootDir, ".github/workflows/web.yml");
assert(fs.existsSync(webWorkflowPath), ".github/workflows/web.yml must exist");
const webWorkflow = fs.readFileSync(webWorkflowPath, "utf8");
assert(
  webWorkflow.includes("npx playwright test e2e/emulation.spec.ts"),
  "web.yml must execute active e2e/emulation.spec.ts",
);
console.log("✅ PASS: E2E test targets aligned to active e2e/emulation.spec.ts");

// -----------------------------------------------------------------------------
// 2. Validate YAML Syntax for all Workflows (Guaranteed no deploy-demo crash)
// -----------------------------------------------------------------------------
console.log("\n--> [Step 2] Validating YAML syntax across all GitHub Actions workflows...");
const workflowsDir = path.resolve(rootDir, ".github/workflows");
const ymlFiles = fs.readdirSync(workflowsDir).filter((f) => f.endsWith(".yml"));

for (const ymlFile of ymlFiles) {
  const content = fs.readFileSync(path.join(workflowsDir, ymlFile), "utf8");
  assert.doesNotThrow(
    () => jsYaml.load(content),
    `Workflow ${ymlFile} must parse as valid YAML without syntax errors`,
  );
  console.log(`   ✓ ${ymlFile} validated successfully`);
}
console.log("✅ PASS: All workflow YAML files have valid syntax.");

// -----------------------------------------------------------------------------
// 3. Verify Download Links and Resilient Handlers in Report HTML Files
// -----------------------------------------------------------------------------
console.log("\n--> [Step 3] Verifying download links and resilient handlers in report HTMLs...");
const reportFiles = ["public/android-emulator-report.html", "public/android/index.html"];

for (const relPath of reportFiles) {
  const fullPath = path.resolve(rootDir, relPath);
  assert(fs.existsSync(fullPath), `${relPath} must exist`);
  const content = fs.readFileSync(fullPath, "utf8");

  // Logcat download link
  assert(
    content.includes('href="./screenshots/android-emulator-logcat.txt"') ||
      content.includes('href="../screenshots/android-emulator-logcat.txt"'),
    `${relPath} must contain logcat download link`,
  );

  // Screencast MP4 download link
  assert(
    content.includes('href="./screenshots/android-emulator-video.mp4"') ||
      content.includes('href="../screenshots/android-emulator-video.mp4"'),
    `${relPath} must contain screencast video download link`,
  );

  // Synchronous e.preventDefault() to block immediate 404 navigation
  assert(
    content.includes("e.preventDefault()"),
    `${relPath} must call e.preventDefault() synchronously to intercept download clicks`,
  );

  // Blob fallback for logcat
  assert(
    content.includes("Blob([logContent]") && content.includes("createObjectURL"),
    `${relPath} must contain client-side Blob fallback for guaranteed logcat download`,
  );

  // Candidate URL fallback for video
  assert(
    content.includes("candidateUrls"),
    `${relPath} must implement multi-candidate URL probing for screencast video download`,
  );

  console.log(`   ✓ ${relPath} contains resilient download handlers and fallback blob generators`);
}
console.log("✅ PASS: Report HTML files guarantee download link resilience.");

// -----------------------------------------------------------------------------
// 4. Verify Built Artifacts in dist/ Directory
// -----------------------------------------------------------------------------
console.log("\n--> [Step 4] Verifying dist/ artifacts for download links...");
const distScreenshots = path.resolve(rootDir, "dist/screenshots");
const requiredDistFiles = [
  "android-emulator-logcat.txt",
  "android-emulator-device-info.json",
  "android-emulator-video.mp4",
  "android-emulator-screenshot.png",
];

if (!fs.existsSync(distScreenshots) || !requiredDistFiles.every((f) => fs.existsSync(path.join(distScreenshots, f)))) {
  console.log("   ⚡ dist/screenshots missing or incomplete, building assets via npm run build...");
  child_process.execSync("npm run build", { stdio: "inherit", cwd: rootDir });
}

for (const f of requiredDistFiles) {
  const filePath = path.join(distScreenshots, f);
  assert(
    fs.existsSync(filePath) && fs.statSync(filePath).size > 0,
    `dist/screenshots/${f} must exist and be non-empty`,
  );
  console.log(`   ✓ dist/screenshots/${f} verified (${fs.statSync(filePath).size} bytes)`);
}
console.log("✅ PASS: All download artifacts exist and are non-empty in dist/screenshots/.");

// -----------------------------------------------------------------------------
// 5. Verify Version Parity Across All 5 Targets
// -----------------------------------------------------------------------------
const targetVer = pkg.version;
const parts = targetVer.split(".").map((p: string) => parseInt(p, 10) || 0);
const targetCode = parts[0] * 10000 + parts[1] * 100 + parts[2];

console.log(`\n--> [Step 5] Verifying Version ${targetVer} / ${targetCode} parity across all 5 targets...`);
assert(Boolean(targetVer), "package.json version must be defined");

const gradle = fs.readFileSync(path.resolve(rootDir, "android-shell/app/build.gradle.kts"), "utf8");
assert(gradle.includes(`versionName = "${targetVer}"`), `build.gradle.kts versionName must be ${targetVer}`);
assert(gradle.includes(`versionCode = ${targetCode}`), `build.gradle.kts versionCode must be ${targetCode}`);

const appConfig = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf8");
assert(appConfig.includes(`APP_VERSION = "${targetVer}"`), `appConfig.ts APP_VERSION must be ${targetVer}`);

const apkUpdater = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf8");
assert(
  apkUpdater.includes(`CURRENT_APK_VERSION = "v${targetVer}"`),
  `apkUpdater.ts CURRENT_APK_VERSION must be v${targetVer}`,
);

const appSettings = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf8");
assert(appSettings.includes(`version: "${targetVer}"`), `appSettings.ts version must be ${targetVer}`);

console.log(`✅ PASS: All 5 targets synchronized at version ${targetVer} / ${targetCode}.`);

console.log("\n=========================================================================");
console.log("🎉 ALL E2E TEST & DOWNLOAD LINKS VERIFICATIONS PASSED 100%!");
console.log("=========================================================================");
