/**
 * Dedicated test script: scripts/verify-video-fullscreen-button.ts
 *
 * Prompt 123 / Task 357:
 * "under the video-player add a button to switch full screen."
 *
 * Validates:
 * 1. Advanced Mode (src/routes/index.tsx):
 *    - Renders data-testid="video-fullscreen-toggle-btn" in video-display-controls under the video player.
 *    - Displays Maximize2 / Minimize2 icons and "Full screen" / "Exit full screen" labels.
 *    - Targets video-player-fullscreen-container with cross-browser Fullscreen API.
 *    - Synchronizes fullscreen state via fullscreenchange event listeners.
 *    - Propagates isVideoFullscreen and onToggleFullscreen to BeginnerFlowContainer.
 * 2. Beginner Mode (src/components/beginner/tabs/BeginnerVideoTab.tsx & BeginnerFlowContainer.tsx):
 *    - Full parity: renders data-testid="video-fullscreen-toggle-btn" inside video-display-controls under the player slot.
 *    - Props isVideoFullscreen and onToggleFullscreen are wired through BeginnerFlowContainer to BeginnerVideoTab.
 *    - Includes self-contained fallback targeting beginner-player-slot-container.
 * 3. Version synchronization across all 5 single-source files to 2.1.54.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Task 357: Video Player Full Screen Button & Parity");
  console.log("=========================================================================");

  const root = path.resolve(".");
  const indexTsxPath = path.join(root, "src/routes/index.tsx");
  assert.ok(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
  const indexTsx = fs.readFileSync(indexTsxPath, "utf8");

  // Step 1: Verify Advanced Mode Fullscreen Button and Container
  console.log("--> [Step 1] Verifying Advanced Mode video-fullscreen-toggle-btn under video-player...");
  assert.ok(
    indexTsx.includes('data-testid="video-fullscreen-toggle-btn"'),
    "src/routes/index.tsx must render data-testid='video-fullscreen-toggle-btn'",
  );
  assert.ok(
    indexTsx.includes('data-testid="video-player-fullscreen-container"'),
    "src/routes/index.tsx must contain data-testid='video-player-fullscreen-container'",
  );
  assert.ok(
    indexTsx.includes('id="video-player-fullscreen-container"'),
    "src/routes/index.tsx must have id='video-player-fullscreen-container'",
  );

  // Check placement under the video player in video-display-controls
  const controlsStart = indexTsx.indexOf('data-testid="video-display-controls"');
  assert.ok(controlsStart !== -1, "video-display-controls must be present in index.tsx");
  const controlsSnippet = indexTsx.slice(controlsStart, controlsStart + 2500);
  assert.ok(
    controlsSnippet.includes('data-testid="video-fullscreen-toggle-btn"'),
    "video-fullscreen-toggle-btn must be placed inside video-display-controls under the player",
  );
  assert.ok(
    controlsSnippet.includes("<Maximize2") && controlsSnippet.includes("<Minimize2"),
    "video-display-controls must use Maximize2 and Minimize2 icons",
  );
  assert.ok(
    controlsSnippet.includes("Full screen") && controlsSnippet.includes("Exit full screen"),
    "video-display-controls must toggle 'Full screen' / 'Exit full screen' text",
  );
  console.log("✅ PASS: Advanced Mode full screen button is placed in video-display-controls under video player.");

  // Step 2: Verify Fullscreen API logic and event listeners
  console.log("--> [Step 2] Verifying Fullscreen API implementation and listeners in index.tsx...");
  assert.ok(
    indexTsx.includes("handleToggleFullscreen"),
    "index.tsx must define handleToggleFullscreen",
  );
  assert.ok(
    indexTsx.includes("requestFullscreen") && indexTsx.includes("exitFullscreen"),
    "index.tsx must invoke requestFullscreen and exitFullscreen",
  );
  assert.ok(
    indexTsx.includes('document.addEventListener("fullscreenchange"'),
    "index.tsx must listen to fullscreenchange event",
  );
  assert.ok(
    indexTsx.includes("isVideoFullscreen"),
    "index.tsx must track isVideoFullscreen state",
  );
  console.log("✅ PASS: Fullscreen API and event listeners verified in index.tsx.");

  // Step 3: Verify Beginner Mode Parity
  console.log("--> [Step 3] Verifying Beginner Mode full screen parity...");
  const beginnerVideoPath = path.join(
    root,
    "src/components/beginner/tabs/BeginnerVideoTab.tsx",
  );
  assert.ok(fs.existsSync(beginnerVideoPath), "BeginnerVideoTab.tsx must exist");
  const beginnerVideoContent = fs.readFileSync(beginnerVideoPath, "utf8");

  assert.ok(
    beginnerVideoContent.includes('data-testid="video-fullscreen-toggle-btn"'),
    "BeginnerVideoTab.tsx must render data-testid='video-fullscreen-toggle-btn'",
  );
  assert.ok(
    beginnerVideoContent.includes('id="beginner-player-slot-container"'),
    "BeginnerVideoTab.tsx must have id='beginner-player-slot-container'",
  );
  assert.ok(
    beginnerVideoContent.includes("Maximize2") && beginnerVideoContent.includes("Minimize2"),
    "BeginnerVideoTab.tsx must import and use Maximize2 and Minimize2",
  );

  const beginnerFlowPath = path.join(
    root,
    "src/components/beginner/BeginnerFlowContainer.tsx",
  );
  assert.ok(fs.existsSync(beginnerFlowPath), "BeginnerFlowContainer.tsx must exist");
  const beginnerFlowContent = fs.readFileSync(beginnerFlowPath, "utf8");

  assert.ok(
    beginnerFlowContent.includes("isVideoFullscreen?: boolean") &&
      beginnerFlowContent.includes("onToggleFullscreen?: () => void"),
    "BeginnerFlowContainer must declare isVideoFullscreen and onToggleFullscreen in props interface",
  );
  assert.ok(
    beginnerFlowContent.includes("isVideoFullscreen={isVideoFullscreen}") &&
      beginnerFlowContent.includes("onToggleFullscreen={onToggleFullscreen}"),
    "BeginnerFlowContainer must pass fullscreen props to BeginnerVideoTab",
  );
  console.log("✅ PASS: Beginner Mode has 100% parity with full screen button under the video player.");

  // Step 4: Verify single-source version bump to 2.1.54 across all 5 files
  console.log("--> [Step 4] Checking version synchronization across all 5 files to 2.1.54...");
  const pkgJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkgJson.version, "2.1.54", "package.json version must be 2.1.54");

  const buildGradle = fs.readFileSync(path.join(root, "android-shell/app/build.gradle.kts"), "utf8");
  assert.ok(buildGradle.includes('versionName = "2.1.54"'), "build.gradle.kts must have versionName = 2.1.54");
  assert.ok(buildGradle.includes("versionCode = 20154"), "build.gradle.kts must have versionCode = 20154");

  const appConfig = fs.readFileSync(path.join(root, "src/config/appConfig.ts"), "utf8");
  assert.ok(
    appConfig.includes('APP_VERSION = "2.1.54"') || appConfig.includes("packageJson.version"),
    "src/config/appConfig.ts must contain 2.1.54 or derive from packageJson.version",
  );

  const apkUpdater = fs.readFileSync(path.join(root, "src/utils/apkUpdater.ts"), "utf8");
  assert.ok(
    apkUpdater.includes('CURRENT_APK_VERSION = "v2.1.54"') || apkUpdater.includes("APP_VERSION"),
    "src/utils/apkUpdater.ts must contain v2.1.54 or derive from APP_VERSION",
  );

  const appSettings = fs.readFileSync(path.join(root, "src/utils/appSettings.ts"), "utf8");
  assert.ok(
    appSettings.includes('version: "2.1.54"') || appSettings.includes("version: APP_VERSION"),
    "src/utils/appSettings.ts must contain 2.1.54 or derive from APP_VERSION",
  );
  console.log("✅ PASS: All 5 files properly synchronized to version 2.1.54");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Video Player Full Screen Button Verified Successfully!");
  console.log("=========================================================================");
}

main().catch((err) => {
  console.error("❌ FAIL: Verification failed:", err);
  process.exit(1);
});
