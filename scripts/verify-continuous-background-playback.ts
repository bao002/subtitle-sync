import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Starting Permanent Android Continuous Background Playback Verification");
console.log("==================================================================");

const rootDir = process.cwd();
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
const servicePath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/BackgroundAudioService.kt",
);
const pkgPath = path.join(rootDir, "package.json");
const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const appConfigPath = path.join(rootDir, "src/config/appConfig.ts");
const apkUpdaterPath = path.join(rootDir, "src/utils/apkUpdater.ts");
const appSettingsPath = path.join(rootDir, "src/utils/appSettings.ts");

// 1. Verify files exist
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
assert(fs.existsSync(servicePath), "BackgroundAudioService.kt must exist");
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf8");
const serviceContent = fs.readFileSync(servicePath, "utf8");

// 2. Verify BackgroundPlayableWebView implementation in MainActivity.kt
console.log("Test 1: BackgroundPlayableWebView definition and window visibility override...");
assert(
  mainActivityContent.includes(
    "open class BackgroundPlayableWebView(context: Context) : WebView(context)",
  ),
  "MainActivity.kt must define BackgroundPlayableWebView subclassing WebView",
);
assert(
  mainActivityContent.includes("override fun onWindowVisibilityChanged(visibility: Int)"),
  "BackgroundPlayableWebView must override onWindowVisibilityChanged",
);
assert(
  mainActivityContent.includes("super.onWindowVisibilityChanged(View.VISIBLE)"),
  "BackgroundPlayableWebView must permanently forward View.VISIBLE to Chromium to prevent media freezing",
);
console.log("✅ PASS: BackgroundPlayableWebView properly overrides window visibility reporting.");

// 3. Verify BackgroundPlayableWebView instantiation in MainActivity.kt
console.log("Test 2: BackgroundPlayableWebView instantiation in MainActivity...");
assert(
  mainActivityContent.includes("private lateinit var webView: BackgroundPlayableWebView"),
  "MainActivity must declare webView of type BackgroundPlayableWebView",
);
assert(
  mainActivityContent.includes("webView = BackgroundPlayableWebView(this)"),
  "MainActivity.onCreate must instantiate BackgroundPlayableWebView(this)",
);
console.log("✅ PASS: MainActivity uses BackgroundPlayableWebView.");

// 4. Verify auto-start of BackgroundAudioService in MainActivity.kt
console.log("Test 3: Auto-start of BackgroundAudioService in onCreate...");
assert(
  mainActivityContent.includes("BackgroundAudioService.startService(this)"),
  "MainActivity.onCreate must automatically initialize BackgroundAudioService",
);
console.log("✅ PASS: BackgroundAudioService auto-starts during Activity launch.");

// 5. Verify AudioManager Audio Focus in BackgroundAudioService.kt
console.log("Test 4: AudioManager Audio Focus management in BackgroundAudioService.kt...");
assert(
  serviceContent.includes("import android.media.AudioAttributes") &&
    serviceContent.includes("import android.media.AudioFocusRequest") &&
    serviceContent.includes("import android.media.AudioManager"),
  "BackgroundAudioService.kt must import AudioAttributes, AudioFocusRequest, and AudioManager",
);
assert(
  serviceContent.includes(
    "audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager",
  ),
  "BackgroundAudioService must obtain AudioManager system service",
);
assert(
  serviceContent.includes("AudioManager.AUDIOFOCUS_GAIN"),
  "BackgroundAudioService must request AUDIOFOCUS_GAIN",
);
assert(
  serviceContent.includes("AudioAttributes.USAGE_MEDIA"),
  "BackgroundAudioService must specify USAGE_MEDIA attributes",
);
assert(
  serviceContent.includes("requestAudioFocus()"),
  "BackgroundAudioService must implement requestAudioFocus()",
);
assert(
  serviceContent.includes("abandonAudioFocus()"),
  "BackgroundAudioService must implement abandonAudioFocus()",
);
console.log("✅ PASS: Audio Focus request, listener, and abandon mechanisms verified.");

// 6. Verify Audio Focus lifecycle hooks in BackgroundAudioService.kt
console.log("Test 5: Audio Focus lifecycle hooks in onCreate, handlePlay, onDestroy...");
assert(
  /override fun onCreate\(\)[\s\S]*?requestAudioFocus\(\)/.test(serviceContent),
  "onCreate must call requestAudioFocus()",
);
assert(
  /private fun handlePlay\(\)[\s\S]*?requestAudioFocus\(\)/.test(serviceContent),
  "handlePlay must call requestAudioFocus()",
);
assert(
  /override fun onDestroy\(\)[\s\S]*?abandonAudioFocus\(\)/.test(serviceContent),
  "onDestroy must call abandonAudioFocus()",
);
console.log("✅ PASS: Audio Focus hooks properly attached to service lifecycle.");

// 7. Verify version 1.0.47 / 10047 across version targets
console.log("Test 6: Version parity across version targets...");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
assert.strictEqual(pkg.version, "1.0.47", "package.json must be 1.0.47");

const gradleContent = fs.readFileSync(gradlePath, "utf8");
assert(
  gradleContent.includes("versionCode = 10047"),
  "build.gradle.kts must have versionCode 10047",
);
assert(
  gradleContent.includes('versionName = "1.0.47"'),
  "build.gradle.kts must have versionName 1.0.47",
);

const appConfigContent = fs.readFileSync(appConfigPath, "utf8");
assert(
  appConfigContent.includes('export const APP_VERSION = "1.0.47"'),
  "appConfig.ts must export APP_VERSION 1.0.47",
);

const apkUpdaterContent = fs.readFileSync(apkUpdaterPath, "utf8");
assert(
  apkUpdaterContent.includes('export const CURRENT_APK_VERSION = "v1.0.47"'),
  "apkUpdater.ts must export CURRENT_APK_VERSION v1.0.47",
);

const appSettingsContent = fs.readFileSync(appSettingsPath, "utf8");
assert(
  appSettingsContent.includes('version: "1.0.47"'),
  "appSettings.ts snapshot must have version 1.0.47",
);
console.log("✅ PASS: Version 1.0.47 and versionCode 10047 verified across all 5 targets.");

console.log("==================================================================");
console.log("🎉 ALL PERMANENT BACKGROUND PLAYBACK VERIFICATIONS PASSED (6/6)");
console.log("==================================================================");
