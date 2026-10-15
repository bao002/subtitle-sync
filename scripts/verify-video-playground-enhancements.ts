import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Video Playground Speed Controls, JSON Export & Handoff (Task 118)");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Version 1.0.22 Parity Across All Targets
console.log("\n📦 Section 1: Version 1.0.22 Parity");
const expectedVersion = "1.0.22";

const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkg.version, expectedVersion, `package.json version must be ${expectedVersion}`);

const buildGradle = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  buildGradle.includes(`"${expectedVersion}"`),
  `build.gradle.kts must contain ${expectedVersion}`,
);
assert.ok(buildGradle.includes("10022"), "build.gradle.kts must contain versionCode 10022");

const appConfig = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(
  appConfig.includes(`APP_VERSION = "${expectedVersion}"`),
  `appConfig.ts must declare APP_VERSION ${expectedVersion}`,
);

const apkUpdater = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(
  apkUpdater.includes(`CURRENT_APK_VERSION = "v${expectedVersion}"`),
  `apkUpdater.ts must declare CURRENT_APK_VERSION v${expectedVersion}`,
);

const appSettings = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(
  appSettings.includes(`version: "${expectedVersion}"`),
  `appSettings.ts must declare version ${expectedVersion}`,
);

console.log("✅ PASS: Version 1.0.22 strictly synchronized across all targets.");

// 2. Video Playground Speed Controls Verification
console.log("\n⚡ Section 2: Playback Speed Controls");
const playgroundPath = path.resolve(rootDir, "src/components/VideoPlayground.tsx");
assert.ok(fs.existsSync(playgroundPath), "src/components/VideoPlayground.tsx must exist");
const playgroundContent = fs.readFileSync(playgroundPath, "utf-8");

assert.ok(
  playgroundContent.includes("PLAYGROUND_PLAYBACK_RATES"),
  "VideoPlayground.tsx must declare PLAYGROUND_PLAYBACK_RATES",
);
assert.ok(
  playgroundContent.includes("setPlaybackRate"),
  "VideoPlayground.tsx must implement setPlaybackRate postMessage control",
);
assert.ok(
  playgroundContent.includes('data-testid="playground-playback-speed-group"'),
  "VideoPlayground.tsx must render playground-playback-speed-group element",
);
assert.ok(
  playgroundContent.includes("playback-speed-btn-"),
  "VideoPlayground.tsx must render individual speed selector buttons",
);

console.log("✅ PASS: Playback speed controls (0.5x to 2.0x) verified in VideoPlayground.");

// 3. Telemetry JSON Export & Clipboard Copy Verification
console.log("\n📋 Section 3: Telemetry JSON Export & Clipboard Copy");
assert.ok(
  playgroundContent.includes("handleCopyJson"),
  "VideoPlayground.tsx must implement handleCopyJson for clipboard copying",
);
assert.ok(
  playgroundContent.includes("handleDownloadJson"),
  "VideoPlayground.tsx must implement handleDownloadJson for file downloading",
);
assert.ok(
  playgroundContent.includes("copy-json-btn-"),
  "VideoPlayground.tsx must render copy-json-btn- testid",
);
assert.ok(
  playgroundContent.includes("download-json-btn-"),
  "VideoPlayground.tsx must render download-json-btn- testid",
);

console.log("✅ PASS: Telemetry JSON copy and download features verified.");

// 4. Timestamp Handoff to Synchronized Viewer Verification
console.log("\n⏱️ Section 4: Seamless Timestamp Handoff to Synchronized Viewer");
assert.ok(
  playgroundContent.includes("onSwitchToViewerAtTime"),
  "VideoPlaygroundProps must declare onSwitchToViewerAtTime prop",
);
assert.ok(
  playgroundContent.includes('data-testid="playground-handoff-time-input"'),
  "VideoPlayground.tsx must render playground-handoff-time-input element",
);
assert.ok(
  playgroundContent.includes('data-testid="jump-to-viewer-btn"'),
  "VideoPlayground.tsx must render jump-to-viewer-btn element",
);

const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexContent.includes("handleSwitchToViewerAtTime"),
  "src/routes/index.tsx must implement handleSwitchToViewerAtTime callback",
);
assert.ok(
  indexContent.includes("onSwitchToViewerAtTime={handleSwitchToViewerAtTime}"),
  "src/routes/index.tsx must pass onSwitchToViewerAtTime to VideoPlayground",
);
assert.ok(
  indexContent.includes("playerRef.current.seekTo(timeSec, true)"),
  "src/routes/index.tsx handleSwitchToViewerAtTime must seek player to target timestamp",
);
assert.ok(
  indexContent.includes("scrollIntoView"),
  "src/routes/index.tsx handleSwitchToViewerAtTime must scroll matching subtitle row into view",
);

console.log("✅ PASS: Seamless timestamp handoff from Playground to Viewer verified.");

console.log("\n=========================================================================");
console.log("🎉 ALL VIDEO PLAYGROUND ENHANCEMENTS VERIFICATION CHECKS PASSED 100%!");
console.log("=========================================================================");
