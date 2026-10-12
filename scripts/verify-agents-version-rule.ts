import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("====================================================");
console.log("🧪 Starting AGENTS.md App Version Rule Verification");
console.log("====================================================");

const rootDir = process.cwd();
const agentsPath = path.join(rootDir, "AGENTS.md");
const packageJsonPath = path.join(rootDir, "package.json");
const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const apkUpdaterPath = path.join(rootDir, "src/utils/apkUpdater.ts");
const appSettingsPath = path.join(rootDir, "src/utils/appSettings.ts");

// 1. Verify AGENTS.md exists and contains the version update rule
assert(fs.existsSync(agentsPath), "AGENTS.md must exist in root");
const agentsContent = fs.readFileSync(agentsPath, "utf8");

assert(
  agentsContent.includes("the app version number must not stay 1.0 always") ||
    agentsContent.includes("the app version number stays 1.0 always - it should be updated") ||
    (agentsContent.includes("app version") && agentsContent.includes("prompt response")),
  "AGENTS.md must instruct updating the app version number for prompt response",
);
console.log("✅ PASS: AGENTS.md contains explicit instruction that app version number must not stay 1.0 always and must be updated for prompt response");

// 2. Verify package.json contains valid updated version
assert(fs.existsSync(packageJsonPath), "package.json must exist in root");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
assert(typeof packageJson.version === "string" && packageJson.version.length > 0, "package.json must contain a version field");
assert(packageJson.version !== "1.0" && packageJson.version !== "1.0.0", `package.json version must not stay 1.0, got: "${packageJson.version}"`);
console.log(`✅ PASS: package.json has updated version: "${packageJson.version}"`);

// 3. Verify android-shell build.gradle.kts has updated versionCode and versionName
assert(fs.existsSync(gradlePath), "android-shell/app/build.gradle.kts must exist");
const gradleContent = fs.readFileSync(gradlePath, "utf8");

const versionCodeMatch = gradleContent.match(/versionCode\s*=\s*(\d+)/);
assert(versionCodeMatch, "build.gradle.kts must specify versionCode");
const versionCode = parseInt(versionCodeMatch[1], 10);
assert(versionCode > 1, `build.gradle.kts versionCode must be > 1, got: ${versionCode}`);
console.log(`✅ PASS: android-shell/app/build.gradle.kts has updated versionCode: ${versionCode}`);

const versionNameMatch = gradleContent.match(/versionName\s*=\s*"([^"]+)"/);
assert(versionNameMatch, "build.gradle.kts must specify versionName");
const versionName = versionNameMatch[1];
assert(versionName !== "1.0", `build.gradle.kts versionName must not stay "1.0", got: "${versionName}"`);
console.log(`✅ PASS: android-shell/app/build.gradle.kts has updated versionName: "${versionName}"`);

// 4. Verify src/utils/apkUpdater.ts CURRENT_APK_VERSION
assert(fs.existsSync(apkUpdaterPath), "src/utils/apkUpdater.ts must exist");
const apkUpdaterContent = fs.readFileSync(apkUpdaterPath, "utf8");
assert(
  apkUpdaterContent.includes(`export const CURRENT_APK_VERSION = "v${packageJson.version}"`) ||
    CURRENT_APK_VERSION === `v${packageJson.version}`,
  `CURRENT_APK_VERSION ("${CURRENT_APK_VERSION}") must align with package.json version ("${packageJson.version}")`,
);
assert(CURRENT_APK_VERSION !== "v1.0" && CURRENT_APK_VERSION !== "v1.0.0", `CURRENT_APK_VERSION must not stay 1.0, got: "${CURRENT_APK_VERSION}"`);
console.log(`✅ PASS: src/utils/apkUpdater.ts has updated CURRENT_APK_VERSION: "${CURRENT_APK_VERSION}"`);

// 5. Verify src/utils/appSettings.ts default snapshot version
assert(fs.existsSync(appSettingsPath), "src/utils/appSettings.ts must exist");
const appSettingsContent = fs.readFileSync(appSettingsPath, "utf8");
const appSettingsVersionMatch = appSettingsContent.match(/version:\s*"([^"]+)"/);
assert(appSettingsVersionMatch, "appSettings.ts AppStateSnapshot must contain version");
const appSettingsVersion = appSettingsVersionMatch[1];
assert(appSettingsVersion !== "1.0" && appSettingsVersion !== "1.0.0", `appSettings.ts version must not stay 1.0, got: "${appSettingsVersion}"`);
console.log(`✅ PASS: src/utils/appSettings.ts has updated snapshot version: "${appSettingsVersion}"`);

// 6. Verify cross-file version synchronization
assert.strictEqual(
  packageJson.version,
  versionName,
  `package.json version (${packageJson.version}) must match Android versionName (${versionName})`,
);
assert.strictEqual(
  `v${packageJson.version}`,
  CURRENT_APK_VERSION,
  `package.json version (v${packageJson.version}) must match CURRENT_APK_VERSION (${CURRENT_APK_VERSION})`,
);
assert.strictEqual(
  packageJson.version,
  appSettingsVersion,
  `package.json version (${packageJson.version}) must match appSettings snapshot version (${appSettingsVersion})`,
);
console.log(`✅ PASS: All project version targets are synchronized at "${packageJson.version}"`);

console.log("====================================================");
console.log("🎉 AGENTS.md App Version Rule Verification PASSED successfully!");
console.log("====================================================");
