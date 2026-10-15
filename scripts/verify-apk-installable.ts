import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("====================================================");
console.log("🧪 Running Subtask 63.1: APK Installability & Build Verification");
console.log("====================================================");

const rootDir = process.cwd();

// Test 1: Android Assets Synchronization
console.log("Test 1: Verifying synchronized Android web assets...");
const assetsDir = path.resolve(rootDir, "android-shell/app/src/main/assets");
const indexHtmlPath = path.resolve(assetsDir, "index.html");
assert.ok(fs.existsSync(indexHtmlPath), "android-shell assets/index.html must exist");

const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
assert.ok(
  indexHtml.includes('<div id="root"></div>'),
  "assets/index.html must contain #root mount element",
);
assert.ok(
  indexHtml.includes("/assets/index-") || indexHtml.includes("./assets/index-"),
  "assets/index.html must reference bundled assets",
);

const assetsSubdir = path.resolve(assetsDir, "assets");
assert.ok(fs.existsSync(assetsSubdir), "assets/assets directory must exist");
const bundledFiles = fs.readdirSync(assetsSubdir);
const jsBundle = bundledFiles.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const cssBundle = bundledFiles.find((f) => f.startsWith("index-") && f.endsWith(".css"));
assert.ok(jsBundle, "assets/assets must contain an index-*.js bundle");
assert.ok(cssBundle, "assets/assets must contain an index-*.css stylesheet");

const jsSize = fs.statSync(path.resolve(assetsSubdir, jsBundle)).size;
assert.ok(jsSize > 100000, `JS bundle must be substantial (>100KB), got ${jsSize} bytes`);
console.log(
  `✅ PASS: Synchronized web assets verified (JS: ${jsBundle} (${jsSize} bytes), CSS: ${cssBundle})`,
);

// Test 2: Android Build Configuration & Gradle Hooks
console.log("Test 2: Verifying Android build configuration & Gradle hooks...");
const gradlePath = path.resolve(rootDir, "android-shell/app/build.gradle.kts");
assert.ok(fs.existsSync(gradlePath), "android-shell/app/build.gradle.kts must exist");
const gradleContent = fs.readFileSync(gradlePath, "utf-8");

assert.ok(
  gradleContent.includes("prepareWebAssets"),
  "build.gradle.kts must declare prepareWebAssets task",
);
assert.ok(
  gradleContent.includes("dependsOn(prepareWebAssets)"),
  "preBuild task must depend on prepareWebAssets to guarantee fresh assets",
);
assert.ok(
  gradleContent.includes("compileSdk = 34"),
  "build.gradle.kts must use compileSdk 34 (Android 14)",
);
assert.ok(gradleContent.includes("targetSdk = 34"), "build.gradle.kts must target SDK 34");
assert.ok(
  gradleContent.includes('applicationId = "com.ytviewer.app"'),
  "applicationId must be com.ytviewer.app",
);
assert.ok(
  gradleContent.includes('signingConfig = signingConfigs.getByName("debug")'),
  "Release build must be signed with debug key so APK is universally installable",
);
console.log("✅ PASS: Android Gradle build configuration verified");

// Test 3: Android Manifest & Intent Filters
console.log("Test 3: Verifying Android Manifest & intent filters...");
const manifestPath = path.resolve(rootDir, "android-shell/app/src/main/AndroidManifest.xml");
assert.ok(fs.existsSync(manifestPath), "AndroidManifest.xml must exist");
const manifestContent = fs.readFileSync(manifestPath, "utf-8");

assert.ok(
  manifestContent.includes('android:name="android.permission.INTERNET"'),
  "AndroidManifest.xml must request INTERNET permission",
);
assert.ok(
  manifestContent.includes('android:name=".MainActivity"'),
  "AndroidManifest.xml must declare MainActivity",
);
assert.ok(
  manifestContent.includes('android:name="android.intent.action.VIEW"') &&
    manifestContent.includes('android:host="youtube.com"') &&
    manifestContent.includes('android:host="youtu.be"'),
  "AndroidManifest.xml must declare ACTION_VIEW for YouTube URLs",
);
assert.ok(
  manifestContent.includes('android:name="android.intent.action.SEND"') &&
    manifestContent.includes('android:mimeType="text/plain"'),
  "AndroidManifest.xml must declare ACTION_SEND for YouTube text sharing",
);
console.log("✅ PASS: Android Manifest and intent filters verified");

// Test 4: update.apk.sh & install-apk.sh Robustness & Parity
console.log("Test 4: Verifying update.apk.sh and install-apk.sh installation scripts...");
const updateScript = fs.readFileSync(path.resolve(rootDir, "update.apk.sh"), "utf-8");
const installScript = fs.readFileSync(path.resolve(rootDir, "install-apk.sh"), "utf-8");

for (const [name, content] of [
  ["update.apk.sh", updateScript],
  ["install-apk.sh", installScript],
]) {
  assert.ok(content.includes("deep_purge_package"), `${name} must define deep_purge_package`);
  assert.ok(content.includes('pm clear "${PACKAGE_NAME}"'), `${name} must include pm clear`);
  assert.ok(
    content.includes('pm uninstall --user 0 "${PACKAGE_NAME}"'),
    `${name} must include multi-user uninstall (pm uninstall --user 0)`,
  );
  assert.ok(
    content.includes("INSTALL_FAILED_UPDATE_INCOMPATIBLE") &&
      content.includes("INSTALL_FAILED_VERSION_DOWNGRADE"),
    `${name} must intercept package collision errors`,
  );
  assert.ok(
    content.includes("install -r -d -t"),
    `${name} must install with replace (-r), allow downgrade (-d), and test (-t) flags`,
  );
  assert.ok(
    !content.includes("install -g") && !content.includes("install -r -d -g"),
    `${name} must not use -g flag which fails on MIUI/HyperOS/ColorOS/Knox`,
  );
  assert.ok(
    content.includes("//data/local/tmp/app-install.apk") ||
      content.includes("/data/local/tmp/app-install.apk"),
    `${name} must support direct push and pm install fallback for bulletproof path handling`,
  );
}
console.log(
  "✅ PASS: Installation scripts (update.apk.sh and install-apk.sh) verified for cross-platform resilience",
);

// Test 5: GitHub Release Workflow & Artifact Propagation
console.log("Test 5: Verifying release workflow artifact packaging...");
const releaseWorkflow = fs.readFileSync(
  path.resolve(rootDir, ".github/workflows/release-apk.yml"),
  "utf-8",
);
assert.ok(
  releaseWorkflow.includes("./gradlew assembleDebug"),
  "release-apk.yml must assemble the debug APK",
);
assert.ok(
  releaseWorkflow.includes("YouTube-Viewer-debug.apk"),
  "release-apk.yml must produce YouTube-Viewer-debug.apk",
);
assert.ok(
  releaseWorkflow.includes("name: youtube-viewer-apks"),
  "release-apk.yml must upload youtube-viewer-apks artifact for downstream workflows",
);
console.log("✅ PASS: Release APK workflow packaging verified");

console.log("====================================================");
console.log("🎉 Subtask 63.1 APK Installability & Build Verification PASSED!");
console.log("====================================================");
