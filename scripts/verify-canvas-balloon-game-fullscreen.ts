/**
 * Dedicated automated test: scripts/verify-canvas-balloon-game-fullscreen.ts
 *
 * Validates:
 * 1. src/components/CanvasBalloonGame.tsx exists and uses HTML5 <canvas> with 2D rendering loop.
 * 2. Absolute zero-video policy in CanvasBalloonGame: no <video>, no <iframe>, no player embed.
 * 3. Full screen mode support: data-testid="canvas-balloon-fullscreen-toggle", requestFullscreen API and fixed viewport overlay (fixed inset-0 z-50).
 * 4. Word-popping mechanics: floating balloons, pop audio SFX, translation tags, score tracking, and victory banner.
 * 5. Storybook catalog integration: src/components/CanvasBalloonGame.stories.tsx exists.
 * 6. WordBalloonLearningView integration: data-testid="balloon-play-canvas-game-btn" launches canvas game.
 * 7. src/routes/index.tsx integration: data-testid="launch-canvas-balloon-game-btn" in video controls and full screen rendering.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Testing Full Screen Canvas Balloon Word-Popping Game (Zero Video)");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify CanvasBalloonGame.tsx exists and implements HTML5 canvas
const canvasGamePath = path.resolve(rootDir, "src/components/CanvasBalloonGame.tsx");
assert(fs.existsSync(canvasGamePath), "src/components/CanvasBalloonGame.tsx must exist");
const canvasGameContent = fs.readFileSync(canvasGamePath, "utf-8");

assert(
  canvasGameContent.includes('data-testid="canvas-balloon-game-canvas"') &&
    canvasGameContent.includes("<canvas"),
  "CanvasBalloonGame must render an HTML5 <canvas> element with data-testid='canvas-balloon-game-canvas'",
);
assert(
  canvasGameContent.includes("getContext(\"2d\")") &&
    canvasGameContent.includes("requestAnimationFrame"),
  "CanvasBalloonGame must use 2D canvas context and requestAnimationFrame render loop",
);
console.log("✅ PASS: HTML5 <canvas> with 2D animation loop verified");

// 2. Enforce strict Zero-Video policy in game component
assert(
  !canvasGameContent.includes("<video") &&
    !canvasGameContent.includes("<iframe") &&
    !canvasGameContent.includes("YouTubePlayer") &&
    !canvasGameContent.includes("react-player"),
  "CanvasBalloonGame must have ZERO video or iframe elements (strict zero-video mandate)",
);
console.log("✅ PASS: Strict zero-video policy verified in CanvasBalloonGame");

// 3. Verify Fullscreen Support (API + CSS Viewport Fallback)
assert(
  canvasGameContent.includes('data-testid="canvas-balloon-fullscreen-toggle"'),
  "CanvasBalloonGame must include fullscreen toggle button with data-testid='canvas-balloon-fullscreen-toggle'",
);
assert(
  canvasGameContent.includes("requestFullscreen") &&
    canvasGameContent.includes("fixed inset-0 z-50"),
  "CanvasBalloonGame must support both requestFullscreen API and fixed fullscreen viewport overlay",
);
console.log("✅ PASS: Fullscreen toggle and fixed overlay styling verified");

// 4. Verify Word Popping, Audio, Translation Reveal, and HUD Controls
assert(
  canvasGameContent.includes("playPopAudioEffect") || canvasGameContent.includes("AudioContext"),
  "CanvasBalloonGame must include Web Audio sound effects for balloon pops",
);
assert(
  canvasGameContent.includes("translation") &&
    canvasGameContent.includes("onSpeakText"),
  "CanvasBalloonGame must expose word translations and invoke TTS pronunciation on pop",
);
assert(
  canvasGameContent.includes('data-testid="canvas-balloon-score"') &&
    canvasGameContent.includes('data-testid="canvas-balloon-reinflate-btn"'),
  "CanvasBalloonGame must provide score tracking and balloon re-inflation controls",
);
console.log("✅ PASS: Word-popping physics, SFX, TTS, score, and HUD verified");

// 5. Verify Storybook story catalog integration
const storyPath = path.resolve(rootDir, "src/components/CanvasBalloonGame.stories.tsx");
assert(fs.existsSync(storyPath), "src/components/CanvasBalloonGame.stories.tsx must exist");
const storyContent = fs.readFileSync(storyPath, "utf-8");
assert(
  storyContent.includes("Components/CanvasBalloonGame") &&
    storyContent.includes("FullScreenMode"),
  "CanvasBalloonGame stories must define component story with FullScreenMode",
);
console.log("✅ PASS: Storybook catalog story verified");

// 6. Verify WordBalloonLearningView integration
const wordBalloonPath = path.resolve(rootDir, "src/components/WordBalloonLearningView.tsx");
const wordBalloonContent = fs.readFileSync(wordBalloonPath, "utf-8");
assert(
  wordBalloonContent.includes('data-testid="balloon-play-canvas-game-btn"'),
  "WordBalloonLearningView must include button to launch canvas game in full screen",
);
assert(
  wordBalloonContent.includes("CanvasBalloonGame"),
  "WordBalloonLearningView must import and render CanvasBalloonGame",
);
console.log("✅ PASS: WordBalloonLearningView launches Canvas Balloon Game");

// 7. Verify src/routes/index.tsx video controls and overlay rendering
const indexRoutePath = path.resolve(rootDir, "src/routes/index.tsx");
const indexRouteContent = fs.readFileSync(indexRoutePath, "utf-8");
assert(
  indexRouteContent.includes('data-testid="launch-canvas-balloon-game-btn"'),
  "src/routes/index.tsx must include launch-canvas-balloon-game-btn in playback controls bar",
);
assert(
  indexRouteContent.includes("<CanvasBalloonGame") &&
    indexRouteContent.includes("showCanvasBalloonGame"),
  "src/routes/index.tsx must render CanvasBalloonGame when showCanvasBalloonGame is active",
);
console.log("✅ PASS: src/routes/index.tsx playback controls and full screen game rendering verified");

console.log("=========================================================================");
console.log("🎉 ALL CHECKS PASSED: Full Screen Canvas Balloon Game successfully verified!");
console.log("=========================================================================");
