/**
 * Verification test for Subtask 48.1: Robust APK Installation & Version Code Handling in Update Script.
 * Validates:
 * 1. update.apk.sh includes deep_purge_package and collision detection (INSTALL_FAILED_UPDATE_INCOMPATIBLE,
 *    INSTALL_FAILED_VERSION_DOWNGRADE, INSTALL_FAILED_CONFLICTING_PROVIDER, etc.) with automatic re-installation.
 * 2. install-apk.sh includes matching deep purge and collision resilience.
 * 3. package.json defines standard "version" property.
 * 4. release-apk.yml propagates appVersionCode and appVersionName into Gradle assembleDebug.
 * 5. README.md links directly to the all releases page (https://github.com/mostuf2556/subtitle-sync/releases).
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("====================================================");
console.log("🧪 Running Subtask 48.1: APK Installation Robustness Verification");
console.log("====================================================");

// Test 1: update.apk.sh collision handling and deep purge verification
console.log("Test 1: update.apk.sh collision handling & deep purge...");
const updateScriptPath = path.resolve(process.cwd(), "update.apk.sh");
assert.ok(fs.existsSync(updateScriptPath), "update.apk.sh must exist");
const updateScriptContent = fs.readFileSync(updateScriptPath, "utf-8");

assert.ok(
  updateScriptContent.includes("deep_purge_package"),
  "update.apk.sh must define deep_purge_package",
);
assert.ok(
  updateScriptContent.includes('pm clear "${PACKAGE_NAME}"'),
  "deep_purge_package must execute pm clear",
);
assert.ok(
  updateScriptContent.includes('pm uninstall --user 0 "${PACKAGE_NAME}"'),
  "deep_purge_package must execute pm uninstall --user 0",
);
assert.ok(
  updateScriptContent.includes("INSTALL_FAILED_UPDATE_INCOMPATIBLE") &&
    updateScriptContent.includes("INSTALL_FAILED_VERSION_DOWNGRADE") &&
    updateScriptContent.includes("INSTALL_FAILED_CONFLICTING_PROVIDER"),
  "update.apk.sh must detect package collision error signatures",
);
assert.ok(
  updateScriptContent.includes("has_collision_error"),
  "update.apk.sh must implement has_collision_error check",
);
console.log("✅ PASS: update.apk.sh deep purge and collision resilience verified");

// Test 2: install-apk.sh parity check
console.log("Test 2: install-apk.sh parity check...");
const installScriptPath = path.resolve(process.cwd(), "install-apk.sh");
assert.ok(fs.existsSync(installScriptPath), "install-apk.sh must exist");
const installScriptContent = fs.readFileSync(installScriptPath, "utf-8");

assert.ok(
  installScriptContent.includes("deep_purge_package"),
  "install-apk.sh must define deep_purge_package",
);
assert.ok(
  installScriptContent.includes('pm clear "${PACKAGE_NAME}"'),
  "install-apk.sh must execute pm clear",
);
assert.ok(
  installScriptContent.includes('pm uninstall --user 0 "${PACKAGE_NAME}"'),
  "install-apk.sh must execute pm uninstall --user 0",
);
assert.ok(
  installScriptContent.includes("INSTALL_FAILED_UPDATE_INCOMPATIBLE") &&
    installScriptContent.includes("INSTALL_FAILED_VERSION_DOWNGRADE") &&
    installScriptContent.includes("INSTALL_FAILED_CONFLICTING_PROVIDER"),
  "install-apk.sh must detect package collision error signatures",
);
console.log("✅ PASS: install-apk.sh parity verified");

// Test 3: package.json version field
console.log("Test 3: package.json standard version field...");
const pkgJsonPath = path.resolve(process.cwd(), "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
assert.ok(pkg.version, "package.json must contain a standard 'version' field");
assert.match(
  pkg.version,
  /^\d+\.\d+\.\d+/,
  "package.json version must be semantic versioning (x.y.z)",
);
console.log(`✅ PASS: package.json has valid version: "${pkg.version}"`);

// Test 4: release-apk.yml version propagation
console.log("Test 4: release-apk.yml version code and name propagation...");
const workflowPath = path.resolve(process.cwd(), ".github/workflows/release-apk.yml");
const workflowContent = fs.readFileSync(workflowPath, "utf-8");

assert.ok(
  workflowContent.includes("BASE=$(node -p \"require('./package.json').version || '1.0.0'\")"),
  "release-apk.yml must read version from package.json",
);
assert.ok(
  workflowContent.includes("-PappVersionCode=") && workflowContent.includes("-PappVersionName="),
  "release-apk.yml must pass -PappVersionCode and -PappVersionName to Gradle",
);
console.log("✅ PASS: release-apk.yml propagates appVersionCode and appVersionName");

// Test 5: README.md releases link
console.log("Test 5: README.md APK section links to all releases page...");
const readmePath = path.resolve(process.cwd(), "README.md");
const readmeContent = fs.readFileSync(readmePath, "utf-8");

assert.ok(
  readmeContent.includes("https://github.com/mostuf2556/subtitle-sync/releases") ||
    /https:\/\/github\.com\/[a-zA-Z0-9_\-.]+\/(subtitle-sync|Youtubenet6)\/releases/.test(
      readmeContent,
    ),
  "README.md APK section must link to all releases page",
);
console.log("✅ PASS: README.md includes direct link to all releases page");

console.log("====================================================");
console.log("🎉 Subtask 48.1 APK Installation Robustness tests PASSED!");
console.log("====================================================");
