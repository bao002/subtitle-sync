import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { formatTimecode, VideoPlaybackControls } from "../src/components/VideoPlaybackControls";

console.log("====================================================");
console.log("🧪 Starting Video Playback Controls & Video Overlay Verification");
console.log("====================================================");

// 1. Verify formatTimecode unit tests
assert.strictEqual(formatTimecode(0), "00:00", "0s must format to 00:00");
assert.strictEqual(formatTimecode(5), "00:05", "5s must format to 00:05");
assert.strictEqual(formatTimecode(65), "01:05", "65s must format to 01:05");
assert.strictEqual(formatTimecode(599), "09:59", "599s must format to 09:59");
assert.strictEqual(formatTimecode(3600), "01:00:00", "3600s must format to 01:00:00");
assert.strictEqual(formatTimecode(3665), "01:01:05", "3665s must format to 01:01:05");
assert.strictEqual(formatTimecode(-10), "00:00", "Negative time must format to 00:00");
assert.strictEqual(formatTimecode(NaN), "00:00", "NaN must format to 00:00");
console.log("✅ PASS: formatTimecode produces exact MM:SS and HH:MM:SS timestamps");

// 2. Verify VideoPlaybackControls component exists and has required testids
const rootDir = process.cwd();
const controlsFilePath = path.join(rootDir, "src/components/VideoPlaybackControls.tsx");
assert(fs.existsSync(controlsFilePath), "VideoPlaybackControls.tsx must exist");
const controlsContent = fs.readFileSync(controlsFilePath, "utf8");

const requiredTestIds = [
  "video-playback-controls",
  "player-control-play-pause",
  "player-control-rewind",
  "player-control-forward",
  "player-control-prev-section",
  "player-control-next-section",
  "player-control-replay-section",
  "player-control-stop",
  "player-control-time-display",
  "player-control-seekbar",
  "player-control-speed",
];

for (const testId of requiredTestIds) {
  assert(
    controlsContent.includes(`data-testid="${testId}"`),
    `VideoPlaybackControls must contain data-testid="${testId}"`,
  );
}
console.log(`✅ PASS: VideoPlaybackControls defines all ${requiredTestIds.length} required playback controls testids`);

// 3. Verify VideoPlaybackControls includes touch-friendly sizing and visual indicators
assert(
  controlsContent.includes("h-11") && controlsContent.includes("min-w-[90px]"),
  "Play/Pause button must have touch-friendly height and width for small screens",
);
assert(
  controlsContent.includes("player-control-section-badge") &&
    controlsContent.includes("player-control-speech-hint"),
  "VideoPlaybackControls must feature section badge and speech activity hints",
);
console.log("✅ PASS: Mobile touch target sizes and accessibility labels verified");

// 4. Verify integration in src/routes/index.tsx
const indexFilePath = path.join(rootDir, "src/routes/index.tsx");
assert(fs.existsSync(indexFilePath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexFilePath, "utf8");

// A. Check VideoPlaybackControls component is imported and rendered under the video
assert(
  indexContent.includes("import { VideoPlaybackControls } from \"@/components/VideoPlaybackControls\""),
  "index.tsx must import VideoPlaybackControls",
);
assert(
  indexContent.includes("<VideoPlaybackControls"),
  "index.tsx must render <VideoPlaybackControls under the presented video",
);

// B. Check center video overlay play/pause controls over the video
assert(
  indexContent.includes("data-testid=\"video-overlay-play-pause-btn\""),
  "index.tsx must render center play/pause button overlay over the video (video-overlay-play-pause-btn)",
);
assert(
  indexContent.includes("data-testid=\"video-overlay-play-pause-container\""),
  "index.tsx must render video overlay play/pause container (video-overlay-play-pause-container)",
);

// C. Check playback state hooks and event listeners
assert(
  indexContent.includes("const [isVideoPlaying, setIsVideoPlaying] = useState(false);"),
  "index.tsx must track isVideoPlaying in React state",
);
assert(
  indexContent.includes("onStateChange: (event: { data: number }) =>"),
  "index.tsx must register onStateChange listener on YouTube player",
);
assert(
  indexContent.includes("handleTogglePlay") &&
    indexContent.includes("handleSeek") &&
    indexContent.includes("handleRewind") &&
    indexContent.includes("handleFastForward"),
  "index.tsx must provide playback handlers: togglePlay, seek, rewind, fastForward",
);
console.log("✅ PASS: index.tsx integrates VideoPlaybackControls under video and center play/pause overlay over video");

// 5. Verify docs/files.md inventory
const filesDocPath = path.join(rootDir, "docs/files.md");
const filesDocContent = fs.readFileSync(filesDocPath, "utf8");
assert(
  filesDocContent.includes("src/components/VideoPlaybackControls.tsx"),
  "docs/files.md must list src/components/VideoPlaybackControls.tsx",
);
console.log("✅ PASS: docs/files.md documents VideoPlaybackControls.tsx");

console.log("====================================================");
console.log("🎉 Video Playback Controls & Video Overlay Verification PASSED successfully!");
console.log("====================================================");
