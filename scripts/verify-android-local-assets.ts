import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { execFileSync } from "node:child_process";

console.log("====================================================");
console.log("🧪 Starting Android Local Assets & Offline Mandate Test");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify MainActivity.kt architecture
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const activityContent = fs.readFileSync(mainActivityPath, "utf8");

// Assert APP_URL is purged
assert(
  !activityContent.includes("APP_URL"),
  "MainActivity.kt must NOT contain any APP_URL definition or usage",
);
console.log("✅ PASS: APP_URL is completely removed from MainActivity.kt");

// Assert remote website host (github.io) is purged
assert(
  !activityContent.includes("github.io"),
  "MainActivity.kt must NOT reference remote github.io host",
);
console.log(
  "✅ PASS: Remote web-app domain (github.io) is completely removed from MainActivity.kt",
);

// Assert LOCAL_ASSET_DOMAIN is defined and used
assert(
  activityContent.includes('LOCAL_ASSET_DOMAIN = "appassets.androidplatform.net"'),
  "MainActivity.kt must define LOCAL_ASSET_DOMAIN as appassets.androidplatform.net",
);
console.log("✅ PASS: LOCAL_ASSET_DOMAIN is configured for appassets.androidplatform.net");

// Assert onCreate exclusively loads from local asset domain
assert(
  activityContent.includes('webView.loadUrl("https://$LOCAL_ASSET_DOMAIN/index.html$querySuffix")'),
  "MainActivity.kt must unconditionally load from local asset domain",
);
console.log("✅ PASS: onCreate unconditionally loads from local asset domain");

// Assert onNewIntent exclusively loads from local asset domain
assert(
  activityContent.includes(
    "Navigating to shared URL via local asset domain: https://$LOCAL_ASSET_DOMAIN/index.html$querySuffix",
  ),
  "MainActivity.kt onNewIntent must route through local asset domain",
);
console.log("✅ PASS: onNewIntent unconditionally routes through local asset domain");

// Assert shouldOverrideUrlLoading keeps only local assets and YouTube player embeds
assert(
  activityContent.includes("if (host == LOCAL_ASSET_DOMAIN)"),
  "shouldOverrideUrlLoading must preserve LOCAL_ASSET_DOMAIN",
);
console.log("✅ PASS: shouldOverrideUrlLoading preserves local assets in WebView");

// 2. Verify the Android asset synchronization script replaces stale bundles
const assetsDir = path.join(rootDir, "android-shell/app/src/main/assets");
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
assert(
  pkg.scripts["build:android-assets"]?.includes("node scripts/sync-android-assets.mjs"),
  "package.json must contain build:android-assets script",
);
const syncScriptPath = path.join(rootDir, "scripts/sync-android-assets.mjs");
assert(fs.existsSync(syncScriptPath), "Android asset synchronization script must exist");
assert(fs.existsSync(path.join(rootDir, "dist/index.html")), "Run npm run build before checking Android assets");
fs.mkdirSync(assetsDir, { recursive: true });
const staleAssetPath = path.join(assetsDir, "stale-build-marker.txt");
fs.writeFileSync(staleAssetPath, "stale");
execFileSync(process.execPath, [syncScriptPath], { cwd: rootDir, stdio: "pipe" });
assert(!fs.existsSync(staleAssetPath), "Android asset synchronization must remove stale files");
console.log("✅ PASS: Android bundle replaces stale files with the production web build");

// 3. Verify Android assets bundle all current relative references
assert(fs.existsSync(assetsDir), "android-shell assets directory must exist");
const assetsIndex = path.join(assetsDir, "index.html");
assert(fs.existsSync(assetsIndex), "assets/index.html must exist");
const bundledHtml = fs.readFileSync(assetsIndex, "utf8");
assert(
  !/(src|href)="\/(assets|src)\//.test(bundledHtml),
  "bundled index.html must not use absolute /assets or /src paths",
);
assert(bundledHtml.includes("./assets/"), "bundled index.html must reference ./assets/");
for (const ref of bundledHtml.matchAll(/"\.\/(assets\/[^"]+)"/g)) {
  assert(fs.existsSync(path.join(assetsDir, ref[1])), `referenced asset missing: ${ref[1]}`);
}
console.log("✅ PASS: Bundled index.html references existing relative ./assets/ files");

// 4. Verify build.gradle.kts integrates asset build on preBuild
const buildGradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const buildGradleContent = fs.readFileSync(buildGradlePath, "utf8");
assert(
  buildGradleContent.includes("prepareWebAssets") &&
    buildGradleContent.includes("build:android-assets") &&
    !buildGradleContent.includes("onlyIf"),
  "build.gradle.kts must refresh web assets unconditionally before assembling APK",
);
console.log("✅ PASS: build.gradle.kts always attaches current web assets to preBuild");

console.log("====================================================");
console.log("📊 ANDROID LOCAL ASSETS TEST: All tests passed!");
console.log("====================================================");
