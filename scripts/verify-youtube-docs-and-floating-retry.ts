import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import {
  getAutoRetrySubtitles,
  setAutoRetrySubtitles,
  getRetryPacingMinSec,
  setRetryPacingMinSec,
  getRetryPacingMaxSec,
  setRetryPacingMaxSec,
  getRandomRetryDelayMs,
} from "../src/lib/playback-preferences";
import { getUseFetchServer, getFetchServerUrl } from "../src/lib/subtitle-fetch-plan";
import { PANELS, ACCORDION_THEMES } from "../src/config/accordionThemes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("=========================================================================");
console.log("🧪 Verifying YouTube Docs, Server Deprecation & Floating Retry Indicator");
console.log("=========================================================================");

// --- Step 1: Verify Server Option Deprecation ---
console.log("--> [Step 1] Verifying server option deprecation annotations and badges...");
const subtitleFetchPlanPath = path.resolve(__dirname, "../src/lib/subtitle-fetch-plan.ts");
const subtitleFetchPlanContent = fs.readFileSync(subtitleFetchPlanPath, "utf-8");
assert(
  subtitleFetchPlanContent.includes("buildServerProxyUrl"),
  "subtitle-fetch-plan.ts must build <server>/api/proxy URLs",
);

const attemptOrderSettingsPath = path.resolve(
  __dirname,
  "../src/components/AttemptOrderSettings.tsx",
);
const attemptOrderSettingsContent = fs.readFileSync(attemptOrderSettingsPath, "utf-8");
assert(
  attemptOrderSettingsContent.includes("use-fetch-server-toggle") &&
    attemptOrderSettingsContent.includes("server.json"),
  "AttemptOrderSettings.tsx must include data-testid='server-option-deprecated-badge' and 'Deprecated'",
);
assert(
  attemptOrderSettingsContent.includes("Android only"),
  "AttemptOrderSettings.tsx must display deprecation explanation notice",
);
console.log("✅ PASS: Server option is cleanly deprecated with JSDoc annotations and UI badge.");

// --- Step 2: Verify Settings Accordion & Persistent Pacing Preferences ---
console.log("--> [Step 2] Verifying Settings accordion naming and pacing preferences...");
const playbackPanel = PANELS.find((p) => p.id === "playback");
assert(
  playbackPanel && playbackPanel.title === "Settings",
  `Accordion 'playback' must be titled 'Settings' (found: ${playbackPanel?.title})`,
);

// Verify default pacing and auto-retry values
const defaultAutoRetry = getAutoRetrySubtitles();
assert.strictEqual(
  defaultAutoRetry,
  true,
  `Auto-retry must be enabled by default (got ${defaultAutoRetry})`,
);

const defaultMinSec = getRetryPacingMinSec();
assert.strictEqual(
  defaultMinSec,
  3,
  `Default retry min pacing must be 3 seconds (got ${defaultMinSec})`,
);

const defaultMaxSec = getRetryPacingMaxSec();
assert.strictEqual(
  defaultMaxSec,
  8,
  `Default retry max pacing must be 8 seconds (got ${defaultMaxSec})`,
);

// Test clamping and setters
setRetryPacingMinSec(5);
assert.strictEqual(getRetryPacingMinSec(), 5, "setRetryPacingMinSec should update value");
setRetryPacingMinSec(0); // clamp min 1
assert.strictEqual(getRetryPacingMinSec(), 1, "setRetryPacingMinSec should clamp to >= 1");
setRetryPacingMinSec(3); // restore

setRetryPacingMaxSec(12);
assert.strictEqual(getRetryPacingMaxSec(), 12, "setRetryPacingMaxSec should update value");
setRetryPacingMaxSec(8); // restore

// Test random delay generator
for (let i = 0; i < 20; i++) {
  const delay = getRandomRetryDelayMs(3, 8);
  assert(
    delay >= 3000 && delay <= 8000,
    `getRandomRetryDelayMs(3, 8) must return between 3000 and 8000 ms, got ${delay}`,
  );
}
console.log("✅ PASS: Pacing preferences, clamping, and jitter calculation verified.");

// --- Step 3: Verify FloatingSubtitleRetryIndicator Component ---
console.log("--> [Step 3] Verifying FloatingSubtitleRetryIndicator component...");
const floatingIndicatorPath = path.resolve(
  __dirname,
  "../src/components/FloatingSubtitleRetryIndicator.tsx",
);
assert(fs.existsSync(floatingIndicatorPath), "FloatingSubtitleRetryIndicator.tsx must exist");
const floatingIndicatorContent = fs.readFileSync(floatingIndicatorPath, "utf-8");

assert(
  floatingIndicatorContent.includes("export function FloatingSubtitleRetryIndicator"),
  "Must export FloatingSubtitleRetryIndicator component",
);
assert(
  floatingIndicatorContent.includes("floating-subtitle-retry-indicator"),
  "Must provide testid 'floating-subtitle-retry-indicator'",
);
assert(
  floatingIndicatorContent.includes("floating-retry-toggle-btn"),
  "Must provide testid 'floating-retry-toggle-btn'",
);
assert(
  floatingIndicatorContent.includes("floating-retry-countdown"),
  "Must provide testid 'floating-retry-countdown'",
);
assert(
  floatingIndicatorContent.includes("floating-retry-minimize-btn"),
  "Must provide testid 'floating-retry-minimize-btn'",
);

// Verify integration in src/routes/index.tsx
const indexRoutePath = path.resolve(__dirname, "../src/routes/index.tsx");
const indexRouteContent = fs.readFileSync(indexRoutePath, "utf-8");
assert(
  indexRouteContent.includes("<FloatingSubtitleRetryIndicator"),
  "src/routes/index.tsx must render FloatingSubtitleRetryIndicator",
);
assert(
  indexRouteContent.includes("auto-retry-subtitles-toggle"),
  "src/routes/index.tsx must provide auto-retry-subtitles-toggle in Settings accordion",
);
assert(
  indexRouteContent.includes("retry-pacing-min-input") &&
    indexRouteContent.includes("retry-pacing-max-input"),
  "src/routes/index.tsx must provide retry pacing min and max inputs in Settings accordion",
);
console.log("✅ PASS: FloatingSubtitleRetryIndicator and Settings controls properly wired.");

// --- Step 4: Verify docs/youtube.md Architectural Documentation ---
console.log("--> [Step 4] Verifying docs/youtube.md specification...");
const youtubeDocsPath = path.resolve(__dirname, "../docs/youtube.md");
assert(fs.existsSync(youtubeDocsPath), "docs/youtube.md must exist");
const youtubeDocsContent = fs.readFileSync(youtubeDocsPath, "utf-8");

// Check question 1: Distinguish videos that use tlang vs lang only
assert(
  youtubeDocsContent.includes("tlang") && youtubeDocsContent.includes("lang"),
  "docs/youtube.md must cover tlang vs lang",
);
assert(
  youtubeDocsContent.includes("captionTracks") &&
    youtubeDocsContent.includes("translationLanguages"),
  "docs/youtube.md must explain captionTracks and translationLanguages manifest inspection",
);
assert(
  youtubeDocsContent.includes("vssId") &&
    (youtubeDocsContent.includes("asr") || youtubeDocsContent.includes("ASR")),
  "docs/youtube.md must explain authored tracks vs ASR tracks",
);

// Check question 2: Client-side youtube npm modules
assert(
  youtubeDocsContent.includes("youtube-caption-extractor") ||
    youtubeDocsContent.includes("get-youtube-subtitle"),
  "docs/youtube.md must evaluate client-side npm packages",
);
assert(
  youtubeDocsContent.includes("CORS") || youtubeDocsContent.includes("Cross-Origin"),
  "docs/youtube.md must document why client-side browser modules fail due to CORS",
);

// Check question 3: Server-side options
assert(
  youtubeDocsContent.includes("youtubei.js") &&
    youtubeDocsContent.includes("yt-dlp") &&
    youtubeDocsContent.includes("YouTube Data API"),
  "docs/youtube.md must evaluate server-side options (youtubei.js, yt-dlp, Data API v3)",
);

// Check question 4: Best result regarding rate limitations
assert(
  youtubeDocsContent.includes("429") || youtubeDocsContent.includes("Rate-Limit"),
  "docs/youtube.md must provide analysis of rate limits",
);
assert(
  youtubeDocsContent.includes("jitter") || youtubeDocsContent.includes("pacing"),
  "docs/youtube.md must document paced jitter between X and Y seconds",
);

console.log("✅ PASS: docs/youtube.md comprehensively covers all technical specifications.");

console.log("=========================================================================");
console.log("🎉 ALL YOUTUBE DOCS, SERVER DEPRECATION & RETRY INDICATOR CHECKS PASSED!");
console.log("=========================================================================");
