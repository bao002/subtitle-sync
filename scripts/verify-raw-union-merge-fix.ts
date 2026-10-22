import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

console.log("====================================================");
console.log("🧪 Starting Raw Union Merge Conflict Fix Verification");
console.log("====================================================");

const rootDir = process.cwd();

// Test 1: Ensure zero git conflict markers remain in the repository (excluding node_modules & .git)
console.log("Test 1: Scanning for any git conflict markers (<<<<<<<, =======, >>>>>>>)...");
try {
  const grepOutput = execSync(
    'grep -rn -E "^(<{7}|={7}|>{7})" --exclude-dir=node_modules --exclude-dir=.git . || true',
    { cwd: rootDir, encoding: "utf-8" }
  ).trim();

  assert.strictEqual(
    grepOutput,
    "",
    `Found lingering conflict markers in repository:\n${grepOutput}`
  );
  console.log("✅ PASS: Zero git conflict markers found in repository.");
} catch (err) {
  assert.fail(`Error during conflict marker scan: ${err}`);
}

// Test 2: Check AGENTS.md raw prompt section
console.log("Test 2: Verifying AGENTS.md last raw prompt...");
const agentsContent = fs.readFileSync(path.join(rootDir, "AGENTS.md"), "utf-8");
assert.ok(
  agentsContent.includes("## Last raw prompt"),
  "AGENTS.md must contain the ## Last raw prompt section"
);
assert.ok(
  !agentsContent.includes("======="),
  "AGENTS.md must not contain any union merge conflict markers"
);
console.log("✅ PASS: AGENTS.md is clean and records exact latest prompt.");

// Test 3: Check tracking files hygiene
console.log("Test 3: Checking task tracking files (current-sub-task.md, docs/todo.md, docs/tasks.md, docs/tokens.md)...");
const trackingFiles = [
  "current-sub-task.md",
  "docs/todo.md",
  "docs/tasks.md",
  "docs/tokens.md",
];

for (const relPath of trackingFiles) {
  const content = fs.readFileSync(path.join(rootDir, relPath), "utf-8");
  assert.ok(
    !/^(<{7}|={7}|>{7})/m.test(content),
    `${relPath} must not contain any leading union merge conflict markers`
  );
}

const doneContent = fs.readFileSync(path.join(rootDir, "docs/done.md"), "utf-8");
assert.ok(
  doneContent.includes("Task 181: Fix Git Raw Union Strategy Merge Conflicts"),
  "docs/done.md must contain completed Task 181 entry"
);
console.log("✅ PASS: All tracking files are clean and Task 181 is logged in docs/done.md.");

// Test 4: App Version Parity (>= 1.0.74) across 5 targets
console.log("Test 4: Verifying version synchronization across 5 targets...");
const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
const currentVer = pkgJson.version;
const [major, minor, patch] = currentVer.split(".").map(Number);
assert.ok(major > 1 || (major === 1 && minor > 0) || (major === 1 && minor === 0 && patch >= 74), `version must be >= 1.0.74, got ${currentVer}`);

// 2. android-shell/app/build.gradle.kts
const gradleContent = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(
  gradleContent.includes(`versionName = "${currentVer}"`),
  `build.gradle.kts must contain versionName = "${currentVer}"`
);

// 3. src/config/appConfig.ts
const appConfigContent = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(
  appConfigContent.includes(`export const APP_VERSION = "${currentVer}";`),
  `appConfig.ts must contain APP_VERSION = "${currentVer}"`
);

// 4. src/utils/apkUpdater.ts
const apkUpdaterContent = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(
  apkUpdaterContent.includes(`export const CURRENT_APK_VERSION = "v${currentVer}";`),
  `apkUpdater.ts must contain CURRENT_APK_VERSION = "v${currentVer}"`
);

// 5. src/utils/appSettings.ts
const appSettingsContent = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(
  appSettingsContent.includes(`version: "${currentVer}",`),
  `appSettings.ts must contain version: "${currentVer}"`
);
console.log(`✅ PASS: App version ${currentVer} correctly synchronized across all 5 targets.`);

// Test 5: Verify README.md release links
console.log("Test 5: Verifying README.md links...");
const readmeContent = fs.readFileSync(path.join(rootDir, "README.md"), "utf-8");
assert.ok(
  readmeContent.includes("https://github.com/mostuf25564/subtitle-sync/releases"),
  "README.md should link to releases for mostuf25564"
);
console.log("✅ PASS: README.md links verified.");

console.log("====================================================");
console.log("🎉 Raw Union Merge Conflict Fix Verification PASSED!");
console.log("====================================================");
