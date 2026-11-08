import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log("🔍 Verifying Alternative Video Player View Implementation (Prompt 120 / Task 355)...");

const rootDir = process.cwd();

// 1. Verify AlternativeVideoPlayerView component exists
const componentPath = path.join(rootDir, "src/components/AlternativeVideoPlayerView.tsx");
assert(fs.existsSync(componentPath), "AlternativeVideoPlayerView.tsx must exist");
const componentContent = fs.readFileSync(componentPath, "utf-8");

assert(
  componentContent.includes("export const AlternativeVideoPlayerView"),
  "AlternativeVideoPlayerView component must be exported",
);
assert(
  componentContent.includes("data-testid=\"alternative-video-player-view\""),
  "AlternativeVideoPlayerView must render container with data-testid='alternative-video-player-view'",
);
assert(
  componentContent.includes("data-testid=\"alternative-view-base-words\""),
  "AlternativeVideoPlayerView must render base language words with data-testid='alternative-view-base-words'",
);
assert(
  componentContent.includes("data-testid=\"alternative-view-translation-words\""),
  "AlternativeVideoPlayerView must render target TTS translation words with data-testid='alternative-view-translation-words'",
);
assert(
  componentContent.includes("data-testid=\"alternative-sentence-progress-bar\""),
  "AlternativeVideoPlayerView must render sentence progress bar with data-testid='alternative-sentence-progress-bar'",
);
assert(
  componentContent.includes("switch-to-standard-video-btn"),
  "AlternativeVideoPlayerView must render switch-to-standard-video-btn to toggle back to standard video player",
);
assert(
  componentContent.includes("active-base-word") || componentContent.includes("activeBaseWordIndex"),
  "AlternativeVideoPlayerView must calculate and highlight active part word during playback",
);
assert(
  componentContent.includes("tts-spoken-word-highlight"),
  "AlternativeVideoPlayerView must highlight active spoken word during TTS speech synthesis",
);
console.log("✅ AlternativeVideoPlayerView component contract verified.");

// 2. Verify Storybook story exists
const storyPath = path.join(rootDir, "src/components/AlternativeVideoPlayerView.stories.tsx");
assert(fs.existsSync(storyPath), "AlternativeVideoPlayerView.stories.tsx must exist");
const storyContent = fs.readFileSync(storyPath, "utf-8");
assert(
  storyContent.includes("title: \"Components/AlternativeVideoPlayerView\""),
  "Storybook story must declare title Components/AlternativeVideoPlayerView",
);
assert(
  storyContent.includes("VideoPlayingState"),
  "Storybook story must include VideoPlayingState story",
);
assert(
  storyContent.includes("TtsSpeakingState"),
  "Storybook story must include TtsSpeakingState story",
);
console.log("✅ AlternativeVideoPlayerView Storybook story verified.");

// 3. Verify StorybookWorkbench registration
const workbenchPath = path.join(rootDir, "src/storybook/StorybookWorkbench.tsx");
assert(fs.existsSync(workbenchPath), "StorybookWorkbench.tsx must exist");
const workbenchContent = fs.readFileSync(workbenchPath, "utf-8");
assert(
  workbenchContent.includes("AlternativeVideoPlayerView"),
  "StorybookWorkbench must import AlternativeVideoPlayerView",
);
assert(
  workbenchContent.includes("alternative_player_view"),
  "StorybookWorkbench must register alternative_player_view in component catalog",
);
console.log("✅ StorybookWorkbench registration verified.");

// 4. Verify BeginnerVideoTab props and toggle button
const beginnerVideoTabPath = path.join(rootDir, "src/components/beginner/tabs/BeginnerVideoTab.tsx");
const beginnerVideoTabContent = fs.readFileSync(beginnerVideoTabPath, "utf-8");
assert(
  beginnerVideoTabContent.includes("useAlternativePlayerView"),
  "BeginnerVideoTab must accept useAlternativePlayerView prop",
);
assert(
  beginnerVideoTabContent.includes("onToggleAlternativePlayerView"),
  "BeginnerVideoTab must accept onToggleAlternativePlayerView prop",
);
assert(
  beginnerVideoTabContent.includes("toggle-alternative-player-view-btn"),
  "BeginnerVideoTab must render toggle-alternative-player-view-btn in video-display-controls",
);
console.log("✅ BeginnerVideoTab props and toggle button verified.");

// 5. Verify BeginnerFlowContainer props and passthrough
const beginnerFlowPath = path.join(rootDir, "src/components/beginner/BeginnerFlowContainer.tsx");
const beginnerFlowContent = fs.readFileSync(beginnerFlowPath, "utf-8");
assert(
  beginnerFlowContent.includes("useAlternativePlayerView"),
  "BeginnerFlowContainer must support useAlternativePlayerView",
);
assert(
  beginnerFlowContent.includes("onToggleAlternativePlayerView"),
  "BeginnerFlowContainer must support onToggleAlternativePlayerView",
);
console.log("✅ BeginnerFlowContainer passthrough verified.");

// 6. Verify index.tsx integration for both Beginner and Advanced modes
const indexRoutePath = path.join(rootDir, "src/routes/index.tsx");
const indexRouteContent = fs.readFileSync(indexRoutePath, "utf-8");
assert(
  indexRouteContent.includes("AlternativeVideoPlayerView"),
  "src/routes/index.tsx must import AlternativeVideoPlayerView",
);
assert(
  indexRouteContent.includes("useAlternativePlayerView"),
  "src/routes/index.tsx must manage useAlternativePlayerView state",
);
assert(
  indexRouteContent.includes("handleToggleAlternativePlayerView"),
  "src/routes/index.tsx must define handleToggleAlternativePlayerView",
);
assert(
  indexRouteContent.includes("currentAlternativeSentence"),
  "src/routes/index.tsx must compute currentAlternativeSentence",
);
assert(
  indexRouteContent.includes("currentAlternativeTranslation"),
  "src/routes/index.tsx must compute currentAlternativeTranslation to current TTS-play language",
);
assert(
  indexRouteContent.includes("handleSpeakTextFromAlternativeView"),
  "src/routes/index.tsx must define handleSpeakTextFromAlternativeView",
);
// Parity check: both Beginner and Advanced mode must render AlternativeVideoPlayerView
const matches = indexRouteContent.match(/<AlternativeVideoPlayerView/g);
assert(
  matches !== null && matches.length >= 2,
  "AlternativeVideoPlayerView must be integrated in both Beginner and Advanced modes (at least 2 instances)",
);
console.log("✅ Full parity and integration across Beginner & Advanced modes verified.");

// 7. Verify version synchronization
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert(packageJson.version >= "2.1.52", `package.json version must be >= 2.1.52, got ${packageJson.version}`);

const buildGradle = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert(buildGradle.includes(`versionName = "${packageJson.version}"`), "build.gradle.kts must match package.json version");

const appConfig = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf-8");
assert(
  appConfig.includes("APP_VERSION = packageJson.version") || appConfig.includes("packageJson"),
  "src/config/appConfig.ts must derive version from package.json",
);

console.log("🎉 All Alternative Video Player View checks passed successfully! (Task 355 / Prompt 120)");
