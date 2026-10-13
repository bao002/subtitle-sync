import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Starting Android Background Audio & MediaSession Verification");
console.log("==================================================================");

const rootDir = process.cwd();
const manifestPath = path.join(rootDir, "android-shell/app/src/main/AndroidManifest.xml");
const servicePath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/BackgroundAudioService.kt",
);
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
const typesPath = path.join(rootDir, "src/types.ts");
const preferencesPath = path.join(rootDir, "src/lib/playback-preferences.ts");
const mediaManagerPath = path.join(rootDir, "src/utils/backgroundMediaManager.ts");
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");

// 1. Verify AndroidManifest.xml
assert(fs.existsSync(manifestPath), "AndroidManifest.xml must exist");
const manifestContent = fs.readFileSync(manifestPath, "utf8");

assert(
  manifestContent.includes("android.permission.FOREGROUND_SERVICE"),
  "AndroidManifest.xml must declare FOREGROUND_SERVICE permission",
);
assert(
  manifestContent.includes("android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"),
  "AndroidManifest.xml must declare FOREGROUND_SERVICE_MEDIA_PLAYBACK permission",
);
assert(
  manifestContent.includes("android.permission.POST_NOTIFICATIONS"),
  "AndroidManifest.xml must declare POST_NOTIFICATIONS permission",
);
assert(
  manifestContent.includes("android.permission.WAKE_LOCK"),
  "AndroidManifest.xml must declare WAKE_LOCK permission",
);
assert(
  manifestContent.includes("BackgroundAudioService"),
  "AndroidManifest.xml must register BackgroundAudioService",
);
assert(
  manifestContent.includes('android:foregroundServiceType="mediaPlayback"'),
  "BackgroundAudioService in AndroidManifest.xml must specify foregroundServiceType mediaPlayback",
);
console.log("✅ PASS: AndroidManifest.xml permissions and service declaration verified");

// 2. Verify BackgroundAudioService.kt
assert(fs.existsSync(servicePath), "BackgroundAudioService.kt must exist");
const serviceContent = fs.readFileSync(servicePath, "utf8");

assert(
  serviceContent.includes("class BackgroundAudioService : Service()"),
  "BackgroundAudioService must inherit from Service",
);
assert(
  serviceContent.includes("MediaSessionCompat"),
  "BackgroundAudioService must initialize MediaSessionCompat",
);
assert(
  serviceContent.includes("NotificationCompat.MediaStyle") ||
    serviceContent.includes("MediaStyle()"),
  "BackgroundAudioService must use MediaStyle notification",
);
assert(
  serviceContent.includes("ACTION_PLAY") &&
    serviceContent.includes("ACTION_PAUSE") &&
    serviceContent.includes("ACTION_NEXT") &&
    serviceContent.includes("ACTION_PREV") &&
    serviceContent.includes("ACTION_STOP"),
  "BackgroundAudioService must support transport control actions (PLAY, PAUSE, NEXT, PREV, STOP)",
);
assert(
  serviceContent.includes("dispatchMediaCommand"),
  "BackgroundAudioService must dispatch transport commands to MainActivity",
);
assert(
  serviceContent.includes("PowerManager.PARTIAL_WAKE_LOCK"),
  "BackgroundAudioService must acquire PARTIAL_WAKE_LOCK to prevent background CPU sleep",
);
console.log("✅ PASS: BackgroundAudioService.kt implementation verified");

// 3. Verify MainActivity.kt
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const activityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  activityContent.includes("fun dispatchMediaCommand(action: String"),
  "MainActivity.kt must implement dispatchMediaCommand",
);
assert(
  activityContent.includes("window.onNativeMediaCommand"),
  "MainActivity.kt must evaluate javascript on window.onNativeMediaCommand",
);
assert(
  activityContent.includes("fun setBackgroundAudioEnabled(enabled: Boolean): Boolean"),
  "MainActivity.kt bridge must declare setBackgroundAudioEnabled",
);
assert(
  activityContent.includes("fun updateMediaMetadata"),
  "MainActivity.kt bridge must declare updateMediaMetadata",
);
console.log("✅ PASS: MainActivity.kt bridge methods and command dispatcher verified");

// 4. Verify src/types.ts
assert(fs.existsSync(typesPath), "src/types.ts must exist");
const typesContent = fs.readFileSync(typesPath, "utf8");

assert(
  typesContent.includes("setBackgroundAudioEnabled?: (enabled: boolean) => boolean"),
  "src/types.ts must declare setBackgroundAudioEnabled on AndroidNativeShell",
);
assert(
  typesContent.includes("updateMediaMetadata?:"),
  "src/types.ts must declare updateMediaMetadata on AndroidNativeShell",
);
assert(
  typesContent.includes("onNativeMediaCommand?: (action: string, data?: number) => void"),
  "src/types.ts must declare onNativeMediaCommand on Window",
);
console.log("✅ PASS: src/types.ts bridge signatures verified");

// 5. Verify src/lib/playback-preferences.ts
assert(fs.existsSync(preferencesPath), "src/lib/playback-preferences.ts must exist");
const preferencesContent = fs.readFileSync(preferencesPath, "utf8");

assert(
  preferencesContent.includes("getBackgroundAudioEnabled") &&
    preferencesContent.includes("setBackgroundAudioEnabled"),
  "src/lib/playback-preferences.ts must export getBackgroundAudioEnabled and setBackgroundAudioEnabled",
);
console.log("✅ PASS: src/lib/playback-preferences.ts preference getters/setters verified");

// 6. Verify src/utils/backgroundMediaManager.ts
assert(fs.existsSync(mediaManagerPath), "src/utils/backgroundMediaManager.ts must exist");
const mediaManagerContent = fs.readFileSync(mediaManagerPath, "utf8");

assert(
  mediaManagerContent.includes("initBackgroundMediaManager") &&
    mediaManagerContent.includes("syncMediaMetadata") &&
    mediaManagerContent.includes("setNativeBackgroundAudio"),
  "src/utils/backgroundMediaManager.ts must export lifecycle coordination functions",
);
assert(
  mediaManagerContent.includes("window.onNativeMediaCommand ="),
  "src/utils/backgroundMediaManager.ts must bind window.onNativeMediaCommand",
);
assert(
  mediaManagerContent.includes("navigator.mediaSession"),
  "src/utils/backgroundMediaManager.ts must support Web MediaSession API fallback",
);
console.log("✅ PASS: src/utils/backgroundMediaManager.ts media manager verified");

// 7. Verify src/routes/index.tsx
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

assert(
  indexContent.includes("initBackgroundMediaManager") &&
    indexContent.includes("syncMediaMetadata") &&
    indexContent.includes("setNativeBackgroundAudio"),
  "src/routes/index.tsx must import backgroundMediaManager utilities",
);
assert(
  indexContent.includes("backgroundAudioEnabled") &&
    indexContent.includes("handleToggleBackgroundAudio"),
  "src/routes/index.tsx must manage backgroundAudioEnabled state",
);
assert(
  indexContent.includes("syncMediaMetadata({"),
  "src/routes/index.tsx must sync media metadata during playback loop",
);
assert(
  indexContent.includes("id=\"background-audio-toggle\"") ||
    indexContent.includes("data-testid=\"background-audio-toggle\""),
  "src/routes/index.tsx must render background-audio-toggle in Playback settings",
);
console.log("✅ PASS: src/routes/index.tsx integration and UI controls verified");

console.log("==================================================================");
console.log("🎉 ALL ANDROID BACKGROUND AUDIO VERIFICATIONS PASSED (7/7)");
console.log("==================================================================");
