import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying No Cron README Updates & Status Badge Issue Indication");
console.log("=========================================================================");

const rootDir = process.cwd();
const workflowsDir = path.resolve(rootDir, ".github/workflows");
const readmePath = path.resolve(rootDir, "README.md");

// 1. Verify Version 1.0.21 Parity Across Files
console.log("\n📦 Section 1: Version 1.0.21 Parity");
const expectedVersion = "1.0.21";

const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkg.version, expectedVersion, `package.json version must be ${expectedVersion}`);

const buildGradle = fs.readFileSync(path.resolve(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(buildGradle.includes(`"${expectedVersion}"`), `build.gradle.kts must contain ${expectedVersion}`);
assert.ok(buildGradle.includes("10021"), "build.gradle.kts must contain versionCode 10021");

const appConfig = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(appConfig.includes(`APP_VERSION = "${expectedVersion}"`), `appConfig.ts must declare APP_VERSION ${expectedVersion}`);

const apkUpdater = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(apkUpdater.includes(`CURRENT_APK_VERSION = "v${expectedVersion}"`), `apkUpdater.ts must declare CURRENT_APK_VERSION v${expectedVersion}`);

const appSettings = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(appSettings.includes(`version: "${expectedVersion}"`), `appSettings.ts must declare version ${expectedVersion}`);

console.log("✅ PASS: Version 1.0.20 strictly aligned across all target files.");

// 2. Verify No Workflow Runs Cron Jobs that Commit to README.md
console.log("\n🚫 Section 2: Prohibit Cron Jobs from Modifying or Committing README.md");

const workflowFiles = fs.readdirSync(workflowsDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
assert.ok(workflowFiles.length > 0, "Workflow directory must contain workflow files");

for (const wfFile of workflowFiles) {
  const content = fs.readFileSync(path.resolve(workflowsDir, wfFile), "utf-8");
  const hasSchedule = /^\s*schedule\s*:/m.test(content);
  const commitsToReadme = content.includes("git commit") && content.includes("README.md");

  if (hasSchedule) {
    assert.ok(
      !commitsToReadme,
      `Workflow ${wfFile} has a schedule trigger AND commits to README.md! This causes git merge conflicts. Cron jobs must not modify README.md.`,
    );
  }
}
console.log("✅ PASS: Zero scheduled/cron workflows commit to README.md across repository.");

// 3. Specifically verify report-video-flow.yml does NOT contain schedule trigger
console.log("\n🛡️ Section 3: Verify report-video-flow.yml Trigger & Conflict-Free Architecture");
const reportVideoWf = fs.readFileSync(path.resolve(workflowsDir, "report-video-flow.yml"), "utf-8");
assert.ok(
  !/^\s*schedule\s*:/m.test(reportVideoWf),
  "report-video-flow.yml must NOT contain a schedule/cron trigger",
);
assert.ok(
  !reportVideoWf.includes("git push origin"),
  "report-video-flow.yml must NOT git push updates to README.md",
);
assert.ok(
  reportVideoWf.includes("git checkout -- README.md"),
  "report-video-flow.yml must restore clean README.md state after check",
);
assert.ok(
  reportVideoWf.includes("exit 1"),
  "report-video-flow.yml must exit with code 1 upon failure so the status badge reflects the failing issue",
);
console.log("✅ PASS: report-video-flow.yml correctly relies on workflow badge and rejects cron commits.");

// 4. Verify README.md Prominently Features the Status Badge
console.log("\n🏷️ Section 4: Verify README.md Workflow Status Badges");
const readmeContent = fs.readFileSync(readmePath, "utf-8");

assert.ok(
  readmeContent.includes("report-video-flow.yml/badge.svg"),
  "README.md must prominently feature the Report Video Flow status badge",
);

assert.ok(
  readmeContent.includes("actions/workflows/report-video-flow.yml"),
  "README.md badge must link directly to the report-video-flow.yml workflow run history",
);

// Verify all badges in README.md map to valid workflow files
const badgeRegex = /actions\/workflows\/([a-zA-Z0-9_\-.]+\.yml)/g;
let match;
let count = 0;
while ((match = badgeRegex.exec(readmeContent)) !== null) {
  const file = match[1];
  const targetPath = path.resolve(workflowsDir, file);
  assert.ok(fs.existsSync(targetPath), `Badge target workflow file must exist: ${file}`);
  count++;
}
assert.ok(count >= 5, `Expected at least 5 workflow badges in README.md, found ${count}`);
console.log(`✅ PASS: All ${count} workflow status badges verified in README.md.`);

console.log("\n=========================================================================");
console.log("🎉 ALL NO-CRON README UPDATE & STATUS BADGE CHECKS PASSED 100%!");
console.log("=========================================================================");
