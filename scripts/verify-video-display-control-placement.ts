import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const route = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");
const beginnerFlow = fs.readFileSync(
  path.join(root, "src/components/beginner/BeginnerFlowContainer.tsx"),
  "utf8",
);
const beginnerVideo = fs.readFileSync(
  path.join(root, "src/components/beginner/tabs/BeginnerVideoTab.tsx"),
  "utf8",
);
const beginnerPreferences = fs.readFileSync(
  path.join(root, "src/components/beginner/tabs/BeginnerPreferencesTab.tsx"),
  "utf8",
);

assert(
  route.includes('data-testid="video-subtitles-overlay-toggle"') &&
    route.includes("onClick={handleToggleVideoSubtitles}"),
  "Advanced video view must expose an overlay toggle beside its player",
);
assert(
  beginnerFlow.includes("showVideoSubtitles={showVideoSubtitles}") &&
    beginnerFlow.includes("onToggleVideoSubtitles={onToggleVideoSubtitles}"),
  "Beginner flow must pass overlay state and its action to the video tab",
);
assert(
  beginnerVideo.includes('data-testid="video-display-controls"') &&
    beginnerVideo.includes('data-testid="video-subtitles-overlay-toggle"') &&
    beginnerVideo.includes('data-testid="subtitles-ratio-slider"'),
  "Beginner video tab must colocate overlay and subtitle sizing controls with the video",
);
assert(
  !beginnerPreferences.includes('data-testid="subtitles-ratio-slider"') &&
    !route.includes("Show spoken subtitle over video"),
  "Subtitle sizing and overlay controls must no longer live in preferences/settings",
);
assert(
  route.includes("isValidJsonSubtitleResponse(raw)") &&
    route.includes("setTracks((prev) => ({ ...prev, [defaultLang]: json }))"),
  "Moving the overlay toggle must preserve validated native caption loading",
);

console.log("PASS: subtitle size and overlay controls are colocated with video players.");
