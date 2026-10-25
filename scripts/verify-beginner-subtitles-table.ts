import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=== Verifying Task 143: Beginner Mode Video & Subtitles Table ===");

const root = process.cwd();

// 1. Check the current app version across all targets
const appVersion = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8")).version;
const escapedVersion = appVersion.replaceAll(".", "\\.");
const targets = [
  { file: "package.json", regex: new RegExp(`"version":\\s*"${escapedVersion}"`) },
  { file: "android-shell/app/build.gradle.kts", regex: new RegExp(escapedVersion) },
  {
    file: "src/config/appConfig.ts",
    regex: new RegExp(`APP_VERSION\\s*=\\s*"${escapedVersion}"`),
  },
  {
    file: "src/utils/apkUpdater.ts",
    regex: new RegExp(`CURRENT_APK_VERSION\\s*=\\s*"v${escapedVersion}"`),
  },
  {
    file: "src/utils/appSettings.ts",
    regex: new RegExp(`version:\\s*"${escapedVersion}"`),
  },
];

for (const target of targets) {
  const filePath = path.join(root, target.file);
  assert(fs.existsSync(filePath), `Target file does not exist: ${target.file}`);
  const content = fs.readFileSync(filePath, "utf-8");
  assert(
    target.regex.test(content),
    `Version ${appVersion} not found in ${target.file} matching ${target.regex}`,
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
  beginnerFlowContent.includes("playerSlot") && beginnerFlowContent.includes("subtitlesTableSlot"),
  "BeginnerFlowContainer must pass the persistent player and subtitle slots to the daily view",
);
console.log("[PASS] BeginnerFlowContainer player & subtitles slots verified");

// 3. Verify BeginnerVideoTab structure
const videoTabPath = path.join(root, "src/components/beginner/tabs/BeginnerVideoTab.tsx");
assert(fs.existsSync(videoTabPath), "BeginnerVideoTab.tsx must exist");
const videoTabContent = fs.readFileSync(videoTabPath, "utf-8");

assert(
  videoTabContent.includes("subtitlesTableSlot"),
  "BeginnerVideoTab must accept subtitlesTableSlot",
);
assert(
  videoTabContent.includes("Parallel subtitles") &&
    videoTabContent.includes("beginner-player-slot-container"),
  "BeginnerVideoTab must render the parallel table and player within the daily view",
);
console.log("[PASS] BeginnerVideoTab subtitles table rendering verified");

// 4. Verify src/routes/index.tsx provides table and player controls to BeginnerFlowContainer
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
assert(
  indexContent.includes("charsRemovalSlot={"),
  "index.tsx must supply the Stage 3 sanitization accordion to BeginnerFlowContainer",
);
console.log("[PASS] src/routes/index.tsx beginner mode integration verified");

console.log("\n=== ALL Task 143 CHECKS PASSED SUCCESSFULLY ===");
