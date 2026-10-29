import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

console.log("=== Verifying Video Pause Diagnostics and Explanations ===");

const rootDir = process.cwd();
const routesIndexPath = path.join(rootDir, "src/routes/index.tsx");
const controlsPath = path.join(rootDir, "src/components/VideoPlaybackControls.tsx");
const docPath = path.join(rootDir, "docs/video-pause-reasons.md");

// 1. Verify docs/video-pause-reasons.md exists and covers key pause causes
assert.ok(fs.existsSync(docPath), "docs/video-pause-reasons.md must exist");
const docContent = fs.readFileSync(docPath, "utf-8");
assert.ok(
  docContent.includes("Speech Synchronization") || docContent.includes("pauseMode"),
  "Docs must describe Speech Synchronization pause",
);
assert.ok(
  docContent.includes("TTS") || docContent.includes("speech synthesis"),
  "Docs must explain speech synthesis delay as a cause of video pause",
);
assert.ok(
  docContent.includes("End of Subtitle Track") || docContent.includes("end of subtitle"),
  "Docs must describe pause at end of subtitle track",
);
assert.ok(
  docContent.includes("video-pause-reason-banner"),
  "Docs must document the on-screen video-pause-reason-banner element",
);
console.log("✔ Documentation in docs/video-pause-reasons.md verified");

// 2. Verify VideoPlaybackControls supports pauseReason
assert.ok(fs.existsSync(controlsPath), "VideoPlaybackControls.tsx must exist");
const controlsContent = fs.readFileSync(controlsPath, "utf-8");
assert.ok(
  controlsContent.includes("pauseReason?: string | null"),
  "VideoPlaybackControlsProps must declare pauseReason prop",
);
assert.ok(
  controlsContent.includes('data-testid="player-control-pause-reason"'),
  "VideoPlaybackControls must render player-control-pause-reason element",
);
console.log("✔ VideoPlaybackControls pauseReason interface and badge verified");

// 3. Verify src/routes/index.tsx tracks and presents pauseReason
assert.ok(fs.existsSync(routesIndexPath), "src/routes/index.tsx must exist");
const routesContent = fs.readFileSync(routesIndexPath, "utf-8");

assert.ok(
  routesContent.includes("const [pauseReason, setPauseReason] = useState<string | null>(null);"),
  "src/routes/index.tsx must declare pauseReason state",
);

assert.ok(
  routesContent.includes('setPauseReason("Paused by user")'),
  "src/routes/index.tsx must set pauseReason when paused by user",
);

assert.ok(
  routesContent.includes('setPauseReason("Paused for setup")'),
  "src/routes/index.tsx must set pauseReason when paused for setup",
);

assert.ok(
  routesContent.includes("Waiting for speech synthesis") ||
    routesContent.includes("speaking translation"),
  "src/routes/index.tsx must set pauseReason for speech synthesis delays",
);

assert.ok(
  routesContent.includes('data-testid="video-pause-reason-banner"'),
  "src/routes/index.tsx must render on-screen video-pause-reason-banner",
);

assert.ok(
  routesContent.includes("pauseReason={pauseReason}"),
  "src/routes/index.tsx must pass pauseReason to VideoPlaybackControls",
);

console.log("✔ src/routes/index.tsx pauseReason tracking and banner presentation verified");
console.log("🎉 All Video Pause Diagnostics tests passed successfully!");
