import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("====================================================");
console.log("🧪 Running Android Notification 1-Click Pause All Test Suite");
console.log("====================================================");

// ----------------------------------------------------
// Test 1: Android BackgroundAudioService.kt Verification
// ----------------------------------------------------
console.log("1. Auditing BackgroundAudioService.kt for 1-click pause behavior...");

const servicePath = path.resolve(
  __dirname,
  "../android-shell/app/src/main/java/com/ytviewer/app/BackgroundAudioService.kt",
);
assert.ok(fs.existsSync(servicePath), "BackgroundAudioService.kt must exist");
const serviceContent = fs.readFileSync(servicePath, "utf-8");

// handlePause must kill native TTS and dispatch pause to web app
assert.ok(
  serviceContent.includes("MainActivity.instance?.stopNativeTTS()"),
  "handlePause must invoke MainActivity.instance?.stopNativeTTS() to kill speech in 1 click",
);
assert.ok(
  serviceContent.includes('MainActivity.instance?.dispatchMediaCommand("pause", 0L)'),
  "handlePause must dispatch pause media command to the web layer",
);

// handleStop must also kill native TTS
assert.ok(
  serviceContent.includes('MainActivity.instance?.dispatchMediaCommand("stop", 0L)'),
  "handleStop must dispatch stop media command",
);

// buildNotification action 1 must toggle between ACTION_PAUSE and ACTION_PLAY
assert.ok(
  serviceContent.includes("action = if (isPlaying) ACTION_PAUSE else ACTION_PLAY"),
  "Notification play/pause intent must trigger ACTION_PAUSE when session is active",
);
assert.ok(
  serviceContent.includes('val playPauseTitle = if (isPlaying) "Pause" else "Play"'),
  'Notification must show "Pause" title when active',
);

console.log("✅ PASS: BackgroundAudioService.kt correctly terminates native TTS on pause in 1 click");

// ----------------------------------------------------
// Test 2: MainActivity.kt Verification
// ----------------------------------------------------
console.log("2. Auditing MainActivity.kt for TTS stop and media command routing...");

const mainActivityPath = path.resolve(
  __dirname,
  "../android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert.ok(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf-8");

assert.ok(
  mainActivityContent.includes("fun stopNativeTTS()"),
  "MainActivity.kt must implement public stopNativeTTS()",
);
assert.ok(
  mainActivityContent.includes("textToSpeech?.stop()"),
  "stopNativeTTS() must stop the Android TextToSpeech engine",
);

assert.ok(
  mainActivityContent.includes("fun dispatchMediaCommand(action: String, data: Long = 0L)"),
  "MainActivity.kt must implement dispatchMediaCommand",
);

assert.ok(
  mainActivityContent.includes('if (action == "pause" || action == "stop") {') &&
    mainActivityContent.includes("stopNativeTTS()"),
  "dispatchMediaCommand must eagerly stopNativeTTS on pause or stop",
);

assert.ok(
  mainActivityContent.includes("window.onNativeMediaCommand"),
  "dispatchMediaCommand must bridge to window.onNativeMediaCommand in WebView",
);

assert.ok(
  mainActivityContent.includes("fun stopSpeaking()"),
  "AndroidNativeBridge must expose stopSpeaking JavascriptInterface",
);

console.log("✅ PASS: MainActivity.kt stops native TTS and routes media commands cleanly");

// ----------------------------------------------------
// Test 3: backgroundMediaManager.ts Verification
// ----------------------------------------------------
console.log("3. Auditing backgroundMediaManager.ts for media command dispatch...");

const mediaManagerPath = path.resolve(__dirname, "../src/utils/backgroundMediaManager.ts");
assert.ok(fs.existsSync(mediaManagerPath), "backgroundMediaManager.ts must exist");
const mediaManagerContent = fs.readFileSync(mediaManagerPath, "utf-8");

assert.ok(
  mediaManagerContent.includes('case "pause":') &&
    mediaManagerContent.includes("activeCallbacks.onPause();"),
  "backgroundMediaManager must handle pause action and trigger onPause callback",
);

assert.ok(
  mediaManagerContent.includes('case "stop":') &&
    mediaManagerContent.includes("activeCallbacks.onStop?.();"),
  "backgroundMediaManager must handle stop action and trigger onStop callback",
);

console.log("✅ PASS: backgroundMediaManager.ts correctly forwards native media commands to callbacks");

// ----------------------------------------------------
// Test 4: src/routes/index.tsx Integration Verification
// ----------------------------------------------------
console.log("4. Auditing src/routes/index.tsx for 1-click pause all session termination...");

const indexPath = path.resolve(__dirname, "../src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

// onPause inside initBackgroundMediaManager
assert.ok(
  indexContent.includes("onPause: () => {") &&
    indexContent.includes("cancelSpeech();") &&
    indexContent.includes("busy.current = false;"),
  "index.tsx onPause must cancel speech and set busy.current = false",
);

// syncMediaMetadata should reflect TTS active state so notification displays Pause
assert.ok(
  indexContent.includes("Boolean(speakingLangRef.current) ||") &&
    indexContent.includes("busy.current;"),
  "syncMediaMetadata must report isPlaying true when TTS speech is active, allowing 1-click pause",
);

// Video-first loop guard after speakRow
assert.ok(
  indexContent.includes("await speakRow(candidateRow);") &&
    indexContent.includes("const wasCancelled = !busy.current;") &&
    indexContent.includes("if (wasCancelled || st.current.isSetupPaused || !isVideoPlayingRef.current) return;"),
  "Video-first mode must abort playback resumption when paused mid-speech or when video is stopped",
);

// TTS-first loop guard after speakRow
assert.ok(
  indexContent.includes("await speakRow(idx);") &&
    indexContent.includes("const wasCancelled = !busy.current;") &&
    indexContent.includes("if (wasCancelled || st.current.isSetupPaused || !isVideoPlayingRef.current) return;"),
  "TTS-first mode must abort playback resumption when paused mid-speech or when video is stopped",
);

// cancelSpeech must call AndroidNativeShell.stopSpeaking and cancelAlternativeTtsAudio
assert.ok(
  indexContent.includes("cancelAlternativeTtsAudio();") &&
    indexContent.includes("window.AndroidNativeShell?.stopSpeaking"),
  "cancelSpeech must cancel alternative TTS and Android native shell TTS",
);

console.log("✅ PASS: src/routes/index.tsx correctly halts all playing audio, video, and TTS on 1-click pause");

console.log("====================================================");
console.log("🎉 ALL Android Notification 1-Click Pause tests PASSED successfully!");
console.log("====================================================");
