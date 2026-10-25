import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("====================================================");
console.log("🧪 Starting Pause Both Video and TTS-Play Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Check MainActivity.kt
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt exists");
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf-8");

assert(
  mainActivityContent.includes("fun stopNativeTTS()"),
  "MainActivity.kt defines stopNativeTTS() method",
);
assert(
  mainActivityContent.includes("textToSpeech?.stop()"),
  "MainActivity.kt stops textToSpeech on stopNativeTTS()",
);
assert(
  /fun dispatchMediaCommand\([^)]*\)\s*\{[\s\S]*?(action == "pause" || action == "stop")[\s\S]*?stopNativeTTS\(\)/.test(
    mainActivityContent,
  ),
  "MainActivity.kt dispatchMediaCommand stops native TTS when action is pause or stop",
);
assert(
  mainActivityContent.includes("if (!isBackgroundAudioEnabled)") &&
    mainActivityContent.includes("stopNativeTTS()"),
  "MainActivity.kt onPause pauses video and stops native TTS when background audio is disabled",
);

// 2. Check BackgroundAudioService.kt
const bgServicePath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/BackgroundAudioService.kt",
);
assert(fs.existsSync(bgServicePath), "BackgroundAudioService.kt exists");
const bgServiceContent = fs.readFileSync(bgServicePath, "utf-8");

assert(
  /handlePause\(\)\s*\{[\s\S]*?MainActivity\.instance\?\.stopNativeTTS\(\)[\s\S]*?MainActivity\.instance\?\.dispatchMediaCommand\("pause"/.test(
    bgServiceContent,
  ),
  "BackgroundAudioService.kt handlePause stops native TTS and dispatches pause media command",
);
assert(
  /handleStop\(\)\s*\{[\s\S]*?MainActivity\.instance\?\.stopNativeTTS\(\)[\s\S]*?MainActivity\.instance\?\.dispatchMediaCommand\("stop"/.test(
    bgServiceContent,
  ),
  "BackgroundAudioService.kt handleStop stops native TTS and dispatches stop media command",
);

// 3. Check src/routes/index.tsx
const indexPath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx exists");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert(
  indexContent.includes("pauseBothVideoAndTts"),
  "src/routes/index.tsx defines pauseBothVideoAndTts callback",
);
assert(
  /pauseBothVideoAndTts\s*=\s*useCallback\(\(\)\s*=>\s*\{[\s\S]*?player\.current\?\.pauseVideo[\s\S]*?cancelSpeech\(\)[\s\S]*?busy\.current = false[\s\S]*?setSpeakingLang\(null\)/.test(
    indexContent,
  ),
  "pauseBothVideoAndTts pauses video and cancels speech simultaneously",
);
assert(
  /handleTogglePlay\s*=\s*useCallback\(\(\)\s*=>\s*\{[\s\S]*?isSpeakingActive[\s\S]*?pauseBothVideoAndTts\(\)/.test(
    indexContent,
  ),
  "handleTogglePlay calls pauseBothVideoAndTts when video is playing or speech is active",
);
assert(
  /initBackgroundMediaManager\(\{[\s\S]*?onPause:\s*\(\)\s*=>\s*\{[\s\S]*?cancelSpeech\(\)[\s\S]*?busy\.current = false/.test(
    indexContent,
  ),
  "initBackgroundMediaManager onPause cancels speech, resets busy flag, and pauses video",
);
assert(
  /initBackgroundMediaManager\(\{[\s\S]*?onStop:\s*\(\)\s*=>\s*\{[\s\S]*?cancelSpeech\(\)[\s\S]*?busy\.current = false/.test(
    indexContent,
  ),
  "initBackgroundMediaManager onStop cancels speech, resets busy flag, and stops video",
);

// 4. Check src/components/VideoPlaybackControls.tsx
const playbackControlsPath = path.join(rootDir, "src/components/VideoPlaybackControls.tsx");
assert(fs.existsSync(playbackControlsPath), "VideoPlaybackControls.tsx exists");
const playbackControlsContent = fs.readFileSync(playbackControlsPath, "utf-8");

assert(
  playbackControlsContent.includes("isPlaying || isPausedForSpeech"),
  "VideoPlaybackControls.tsx displays pause state when isPlaying or isPausedForSpeech is active",
);

// 5. Check src/components/beginner/tabs/BeginnerPlayerTab.tsx
const beginnerPlayerPath = path.join(rootDir, "src/components/beginner/tabs/BeginnerPlayerTab.tsx");
assert(fs.existsSync(beginnerPlayerPath), "BeginnerPlayerTab.tsx exists");
const beginnerPlayerContent = fs.readFileSync(beginnerPlayerPath, "utf-8");

assert(
  beginnerPlayerContent.includes("isPlaying || Boolean(speakingLang)"),
  "BeginnerPlayerTab.tsx reflects pause state when isPlaying or speakingLang is active",
);

// 6. Check App Version synchronization across package, Android, and app config
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert(/^\d+\.\d+\.\d+$/.test(pkg.version), "package.json version must use semantic versioning");
const [major = 0, minor = 0, patch = 0] = pkg.version.split(".").map(Number);
const versionCode = major * 10000 + minor * 100 + patch;

const gradleContent = fs.readFileSync(
  path.join(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert(
  gradleContent.includes(`versionCode = ${versionCode}`),
  "build.gradle.kts versionCode matches package.json",
);
assert(
  gradleContent.includes(`versionName = "${pkg.version}"`),
  "build.gradle.kts versionName matches package.json",
);

const appConfigContent = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf-8");
assert(
  appConfigContent.includes(`APP_VERSION = "${pkg.version}"`),
  "src/config/appConfig.ts APP_VERSION matches package.json",
);

console.log("====================================================");
console.log("🎉 All Pause Both Video and TTS-Play verifications PASSED!");
console.log("====================================================");
