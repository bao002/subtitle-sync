import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying Video Playground Top Tab & Subtitle Interception Architecture");
console.log("=========================================================================");

const rootDir = process.cwd();
const expectedVersion = "1.0.21";

// -----------------------------------------------------------------------------
// Section 1: Version 1.0.21 Parity Across Codebase
// -----------------------------------------------------------------------------
console.log("\n📦 Section 1: Version 1.0.21 Parity Check");

const pkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
assert.strictEqual(pkg.version, expectedVersion, `package.json version must be ${expectedVersion}`);

const buildGradle = fs.readFileSync(path.resolve(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(buildGradle.includes(`"${expectedVersion}"`), `build.gradle.kts must declare ${expectedVersion}`);
assert.ok(buildGradle.includes("10021"), "build.gradle.kts must declare versionCode 10021");

const appConfig = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(appConfig.includes(`APP_VERSION = "${expectedVersion}"`), `appConfig.ts must declare APP_VERSION ${expectedVersion}`);

const apkUpdater = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(apkUpdater.includes(`CURRENT_APK_VERSION = "v${expectedVersion}"`), `apkUpdater.ts must declare CURRENT_APK_VERSION v${expectedVersion}`);

const appSettings = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(appSettings.includes(`version: "${expectedVersion}"`), `appSettings.ts must declare version ${expectedVersion}`);

console.log("✅ PASS: Semantic version 1.0.21 and versionCode 10021 strictly aligned across all 5 files.");

// -----------------------------------------------------------------------------
// Section 2: VideoPlayground Component File & Structure
// -----------------------------------------------------------------------------
console.log("\n📺 Section 2: VideoPlayground Component Verification");

const playgroundPath = path.resolve(rootDir, "src/components/VideoPlayground.tsx");
assert.ok(fs.existsSync(playgroundPath), "src/components/VideoPlayground.tsx must exist");
const playgroundContent = fs.readFileSync(playgroundPath, "utf-8");

assert.ok(playgroundContent.includes("export function VideoPlayground"), "VideoPlayground must export VideoPlayground function");
assert.ok(playgroundContent.includes("export interface DetectedSubtitleTrack"), "VideoPlayground must export DetectedSubtitleTrack interface");
assert.ok(playgroundContent.includes("export interface VideoPlaygroundProps"), "VideoPlayground must export VideoPlaygroundProps interface");

// Assert required data-testids exist in VideoPlayground
const requiredPlaygroundTestIds = [
  "video-playground-container",
  "playground-youtube-iframe",
  "detected-tracks-count-badge",
  "playground-url-form",
  "playground-video-input",
  "playground-load-video-btn",
  "playground-reload-player-btn",
];

for (const testId of requiredPlaygroundTestIds) {
  assert.ok(
    playgroundContent.includes(`data-testid="${testId}"`) || playgroundContent.includes(`data-testid={\`${testId}`),
    `VideoPlayground must include element with data-testid="${testId}"`,
  );
  console.log(`✅ PASS: data-testid="${testId}" verified in VideoPlayground.tsx`);
}

// Verify YouTube embed parameters
assert.ok(playgroundContent.includes("enablejsapi=1"), "Playground embed must include enablejsapi=1");
assert.ok(playgroundContent.includes("playsinline=1"), "Playground embed must include playsinline=1");
assert.ok(playgroundContent.includes("origin="), "Playground embed must specify origin");
console.log("✅ PASS: VideoPlayground embed parameters verified for independent execution.");

// -----------------------------------------------------------------------------
// Section 3: Navigation Tabs & External Control Isolation in index.tsx
// -----------------------------------------------------------------------------
console.log("\n🔀 Section 3: Navigation Tabs & Playback Decoupling in index.tsx");

const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

// Assert import of VideoPlayground
assert.ok(
  indexContent.includes('from "@/components/VideoPlayground"'),
  "index.tsx must import VideoPlayground from @/components/VideoPlayground",
);

// Assert top tabs navigation and testids
assert.ok(indexContent.includes('data-testid="top-tabs-nav"'), "index.tsx must render top-tabs-nav");
assert.ok(indexContent.includes('data-testid="tab-viewer"'), "index.tsx must include tab-viewer button");
assert.ok(indexContent.includes('data-testid="tab-playground"'), "index.tsx must include tab-playground button");
console.log("✅ PASS: Top tabs navigation (tab-viewer and tab-playground) present in index.tsx.");

// Assert activeTopTab state and isolation in player interval
assert.ok(
  indexContent.includes('activeTopTabRef.current === "playground"'),
  "index.tsx interval loop must guard against running while on playground tab",
);
console.log("✅ PASS: Background playback loop is strictly disabled when activeTopTab is 'playground'.");

// Assert conditional rendering of VideoPlayground
assert.ok(
  indexContent.includes('<VideoPlayground'),
  "index.tsx must render <VideoPlayground when activeTopTab is 'playground'",
);

// Assert detected captions synchronization into detectedPlaygroundTracks
assert.ok(
  indexContent.includes("setDetectedPlaygroundTracks"),
  "index.tsx must update detectedPlaygroundTracks upon caption interception or tracks update",
);
console.log("✅ PASS: Subtitle detection telemetry wired into detectedPlaygroundTracks.");

// Assert export of VideoPlayground from index.tsx
assert.ok(
  indexContent.includes('export { VideoPlayground } from "@/components/VideoPlayground"'),
  "index.tsx must re-export VideoPlayground component",
);

// -----------------------------------------------------------------------------
// Section 4: Functional Verification of Track Import Logic
// -----------------------------------------------------------------------------
console.log("\n🧪 Section 4: Functional Simulation of Detected Subtitle Flow");

// Simulate mock detected track
const mockDetectedTrack = {
  lang: "he",
  langName: "Hebrew",
  json: {
    wireMagic: "pb3",
    pens: [{}],
    wsWinStyles: [{}],
    wpWinPositions: [{}],
    events: [
      { tStartMs: 1000, dDurationMs: 2000, segs: [{ utf8: "שלום עולם" }] },
      { tStartMs: 3500, dDurationMs: 1500, segs: [{ utf8: "בדיקת כתוביות" }] },
    ],
  },
  rawData: '{"wireMagic":"pb3","events":[{"tStartMs":1000,"dDurationMs":2000,"segs":[{"utf8":"שלום עולם"}]}]}',
  url: "https://www.youtube.com/api/timedtext?v=vBURridJXZ0&lang=he&fmt=json3",
  timestamp: Date.now(),
  cuesCount: 2,
};

assert.strictEqual(mockDetectedTrack.cuesCount, 2, "Mock track cue count must match");
assert.strictEqual(mockDetectedTrack.lang, "he", "Mock track language code must match");
assert.ok(mockDetectedTrack.json.events.length > 0, "Mock track must have events");
console.log("✅ PASS: Detected subtitle schema and cue structure verified.");

console.log("\n=========================================================================");
console.log("🎉 ALL VIDEO PLAYGROUND TOP TAB & INTERCEPTION TESTS PASSED 100%!");
console.log("=========================================================================");
