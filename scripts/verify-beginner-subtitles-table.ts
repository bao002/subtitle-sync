import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=== Verifying Task 143: Beginner Mode Video & Subtitles Table ===");

const root = process.cwd();

// 1. Check version 1.0.46 across all targets
const targets = [
  { file: "package.json", regex: /"version":\s*"1\.0\.46"/ },
  { file: "android-shell/app/build.gradle.kts", regex: /1\.0\.46/ },
  { file: "src/config/appConfig.ts", regex: /APP_VERSION\s*=\s*"1\.0\.46"/ },
  { file: "src/utils/apkUpdater.ts", regex: /CURRENT_APK_VERSION\s*=\s*"v1\.0\.46"/ },
  { file: "src/utils/appSettings.ts", regex: /version:\s*"1\.0\.46"/ },
];

for (const target of targets) {
  const filePath = path.join(root, target.file);
  assert(fs.existsSync(filePath), `Target file does not exist: ${target.file}`);
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    target.regex.test(content),
    `Version 1.0.46 not found in ${target.file} matching ${target.regex}`,
  );
  console.log(`[PASS] Version verified in ${target.file}`);
}

// 2. Verify BeginnerFlowContainer structure
const beginnerFlowPath = path.join(root, "src/components/beginner/BeginnerFlowContainer.tsx");
assert(fs.existsSync(beginnerFlowPath), "BeginnerFlowContainer.tsx must exist");
const beginnerFlowContent = fs.readFileSync(beginnerFlowPath, "utf-8");

assert(
  beginnerFlowContent.includes("subtitlesTableSlot"),
  "BeginnerFlowContainer must support subtitlesTableSlot prop",
);
assert(
  beginnerFlowContent.includes("data-testid=\"beginner-player-slot-container\""),
  "BeginnerFlowContainer must render persistent beginner-player-slot-container",
);
console.log("[PASS] BeginnerFlowContainer persistent player & subtitles slot verified");

// 3. Verify BeginnerVideoTab structure
const videoTabPath = path.join(root, "src/components/beginner/tabs/BeginnerVideoTab.tsx");
assert(fs.existsSync(videoTabPath), "BeginnerVideoTab.tsx must exist");
const videoTabContent = fs.readFileSync(videoTabPath, "utf-8");

assert(
  videoTabContent.includes("subtitlesTableSlot"),
  "BeginnerVideoTab must accept subtitlesTableSlot",
);
assert(
  videoTabContent.includes("Synchronized Subtitles Table"),
  "BeginnerVideoTab must render Synchronized Subtitles Table header/slot",
);
console.log("[PASS] BeginnerVideoTab subtitles table rendering verified");

// 4. Verify BeginnerPlayerTab structure
const playerTabPath = path.join(root, "src/components/beginner/tabs/BeginnerPlayerTab.tsx");
assert(fs.existsSync(playerTabPath), "BeginnerPlayerTab.tsx must exist");
const playerTabContent = fs.readFileSync(playerTabPath, "utf-8");

assert(
  playerTabContent.includes("subtitlesTableSlot"),
  "BeginnerPlayerTab must accept subtitlesTableSlot",
);
console.log("[PASS] BeginnerPlayerTab subtitles table slot verified");

// 5. Verify src/routes/index.tsx provides SubtitlesTablePanel and VideoPlaybackControls to BeginnerFlowContainer
const indexPath = path.join(root, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert(
  indexContent.includes("<BeginnerFlowContainer"),
  "index.tsx must render BeginnerFlowContainer",
);
assert(
  indexContent.includes("subtitlesTableSlot={"),
  "index.tsx must supply subtitlesTableSlot to BeginnerFlowContainer",
);
assert(
  indexContent.includes("<SubtitlesTablePanel"),
  "index.tsx must instantiate SubtitlesTablePanel in beginner mode",
);
assert(
  indexContent.includes("playbackControlsSlot={"),
  "index.tsx must supply playbackControlsSlot to BeginnerFlowContainer",
);
console.log("[PASS] src/routes/index.tsx beginner mode integration verified");

console.log("\n=== ALL Task 143 CHECKS PASSED SUCCESSFULLY ===");
