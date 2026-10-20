import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { APP_VERSION, APP_COMMIT_ID, APP_VERSION_DESCRIPTION, ALL_RELEASES_URL } from "../src/config/appConfig";
import { CURRENT_APK_VERSION, getApkReleaseLinks } from "../src/utils/apkUpdater";

console.log("====================================================");
console.log("🧪 Running Verification: Android Build & Release Version Details Hotfix");
console.log("====================================================");

const rootDir = process.cwd();

// Test 1: Version parity across all manifests and config files
console.log("Test 1: Version parity across project manifests and configs...");
const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkg.version, "1.0.58", "package.json must be 1.0.58");
assert.strictEqual(APP_VERSION, "1.0.58", "APP_VERSION must be 1.0.58");
assert.strictEqual(CURRENT_APK_VERSION, "v1.0.58", "CURRENT_APK_VERSION must be v1.0.58");

const gradleContent = fs.readFileSync(path.resolve(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(gradleContent.includes('versionName = propVersionName ?: packageJsonVersion') || gradleContent.includes('"1.0.58"'), "build.gradle.kts must reference 1.0.58");
assert.ok(gradleContent.includes("10058"), "build.gradle.kts must reference 10058 versionCode");

const appSettingsContent = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(appSettingsContent.includes('"1.0.58"'), "appSettings.ts snapshot version must be 1.0.58");
console.log("✅ PASS: Version parity verified across all manifests (1.0.58)");

// Test 2: Android build.gradle.kts resilience & dynamic properties
console.log("Test 2: Android build.gradle.kts configuration...");
assert.ok(gradleContent.includes("prepareWebAssets"), "build.gradle.kts must define prepareWebAssets");
assert.ok(gradleContent.includes("onlyIf"), "prepareWebAssets must have onlyIf guard to avoid duplicate builds or npm failure");
assert.ok(gradleContent.includes("appVersionCode"), "build.gradle.kts must support dynamic appVersionCode property");
assert.ok(gradleContent.includes("appVersionName"), "build.gradle.kts must support dynamic appVersionName property");
console.log("✅ PASS: Android build.gradle.kts resilience and dynamic property support verified");

// Test 3: release-apk.yml version tracking and release body details
console.log("Test 3: release-apk.yml release body version details...");
const releaseWorkflow = fs.readFileSync(path.resolve(rootDir, ".github/workflows/release-apk.yml"), "utf-8");
assert.ok(releaseWorkflow.includes("-PappVersionCode=") && releaseWorkflow.includes("-PappVersionName="), "release-apk.yml must pass version properties to Gradle");
assert.ok(releaseWorkflow.includes("SHORT_SHA="), "release-apk.yml must compute SHORT_SHA");
assert.ok(releaseWorkflow.includes("COMMIT_MSG="), "release-apk.yml must compute COMMIT_MSG");
assert.ok(releaseWorkflow.includes("Version ID:"), "release-apk.yml release body must display Version ID");
assert.ok(releaseWorkflow.includes("Commit ID:"), "release-apk.yml release body must display Commit ID");
assert.ok(releaseWorkflow.includes("Version Description:"), "release-apk.yml release body must display Version Description");
console.log("✅ PASS: release-apk.yml version details telemetry verified");

// Test 4: UI Version ID, Commit ID, and Version Description in ApkReleaseModal.tsx
console.log("Test 4: ApkReleaseModal.tsx version details...");
const modalContent = fs.readFileSync(path.resolve(rootDir, "src/components/ApkReleaseModal.tsx"), "utf-8");
assert.ok(modalContent.includes('data-testid="modal-version-id"'), "ApkReleaseModal must display modal-version-id");
assert.ok(modalContent.includes('data-testid="modal-commit-id"'), "ApkReleaseModal must display modal-commit-id");
assert.ok(modalContent.includes('data-testid="modal-version-description"'), "ApkReleaseModal must display modal-version-description");
assert.ok(modalContent.includes('apk-version-id-'), "ApkReleaseModal must display version id for each repo owner");
assert.ok(modalContent.includes('apk-commit-id-'), "ApkReleaseModal must display commit id for each repo owner");
assert.ok(modalContent.includes('apk-version-desc-'), "ApkReleaseModal must display version description for each repo owner");
console.log("✅ PASS: ApkReleaseModal renders Version ID, Commit ID, and Version Description on each version");

// Test 5: UI Version ID & Commit ID in ApkReleasesFooter.tsx
console.log("Test 5: ApkReleasesFooter.tsx version details...");
const footerContent = fs.readFileSync(path.resolve(rootDir, "src/components/ApkReleasesFooter.tsx"), "utf-8");
assert.ok(footerContent.includes('data-testid="footer-version-info"'), "ApkReleasesFooter must render footer-version-info");
assert.ok(footerContent.includes("APP_COMMIT_ID"), "ApkReleasesFooter must reference APP_COMMIT_ID");
console.log("✅ PASS: ApkReleasesFooter renders Version ID and Commit ID");

// Test 6: Header badge in src/routes/index.tsx
console.log("Test 6: Header badge in src/routes/index.tsx...");
const indexContent = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf-8");
assert.ok(indexContent.includes('data-testid="header-app-version-badge"'), "Header must have header-app-version-badge");
assert.ok(indexContent.includes("APP_COMMIT_ID"), "Header must display APP_COMMIT_ID");
assert.ok(indexContent.includes("APP_VERSION_DESCRIPTION"), "Header must include APP_VERSION_DESCRIPTION");
console.log("✅ PASS: Header badge in src/routes/index.tsx displays Version ID, Commit ID, and Description");

// Test 7: apkUpdater.ts getApkReleaseLinks() includes versionId, commitId, versionDescription
console.log("Test 7: apkUpdater.ts data structures...");
const links = getApkReleaseLinks();
assert.ok(links.length >= 2, "Must return links for at least 2 repo owners");
for (const link of links) {
  assert.ok(link.versionId, `Link for ${link.owner} must have versionId`);
  assert.ok(link.commitId, `Link for ${link.owner} must have commitId`);
  assert.ok(link.versionDescription, `Link for ${link.owner} must have versionDescription`);
}
console.log("✅ PASS: apkUpdater.ts getApkReleaseLinks() populates version details on each version");

console.log("====================================================");
console.log("🎉 ALL ANDROID BUILD & RELEASE VERSION DETAILS TESTS PASSED!");
console.log("====================================================");
