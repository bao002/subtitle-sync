import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { PANELS } from "../src/config/accordionThemes";

console.log("====================================================");
console.log("🧪 Starting Accordion VideoID Harmonization & No-Android-Fixtures Verification");
console.log("====================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);

assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");

const indexContent = fs.readFileSync(indexTsxPath, "utf8");
const activityContent = fs.readFileSync(mainActivityPath, "utf8");

// 1. Verify language video player accordion is NOT present
assert(
  !PANELS.some((p) => p.id === ("language-player" as unknown)),
  "PANELS must not contain 'language-player'",
);
assert(
  !indexContent.includes('panelId === "language-player"'),
  "index.tsx must not contain language-player accordion section",
);
console.log("✅ PASS: Language video player accordion element is completely removed");

// 2. Verify all accordion sections use the same active videoId
const accordionSectionPath = path.resolve(rootDir, "src/components/AccordionSection.tsx");
const accordionSectionContent = fs.existsSync(accordionSectionPath)
  ? fs.readFileSync(accordionSectionPath, "utf8")
  : "";

assert(
  indexContent.includes("<AccordionSection") &&
    indexContent.includes("videoId={videoId}"),
  "AccordionSection must receive videoId={videoId} in index.tsx",
);
assert(
  indexContent.includes("data-video-id={videoId}") ||
    accordionSectionContent.includes("data-video-id={videoId}"),
  "AccordionSection must set data-video-id attribute on the DOM details element",
);
console.log("✅ PASS: All accordion elements strictly bind and synchronize with active videoId");

// 3. Verify no hardcoded DEMO_VIDEO checks discriminate between videos in subtitles or columns
assert(
  !indexContent.includes("videoId !== DEMO_VIDEO && cols.length === 0"),
  "Subtitles empty-state check must not single out videoId !== DEMO_VIDEO",
);
assert(
  !indexContent.includes("if (isAndroid && videoId !== DEMO_VIDEO && (!tracks"),
  "Columns computation memo must not single out videoId !== DEMO_VIDEO",
);
console.log("✅ PASS: Subtitle rendering and column computation apply uniformly to all video IDs");

// 4. Verify fetchFavoriteLanguageSubtitles in index.tsx does NOT fall back to fixtures
assert(
  !indexContent.includes("JSON3_RAW_MAP[code]"),
  "fetchFavoriteLanguageSubtitles must not fall back to JSON3_RAW_MAP fixtures",
);
console.log("✅ PASS: Web and Android subtitle fetching does not inject fixture data for live languages");

// 5. Verify MainActivity.kt has no fake subtitle generators
assert(
  !activityContent.includes("fun generateDefaultSubtitlesJson"),
  "MainActivity.kt must not contain generateDefaultSubtitlesJson",
);
assert(
  !activityContent.includes("fun generateTranslatedFallbackJson"),
  "MainActivity.kt must not contain generateTranslatedFallbackJson",
);
console.log("✅ PASS: Synthetic fake subtitle generators are completely removed from MainActivity.kt");

// 6. Verify proactiveDetectSubtitles does not load asset fixtures
assert(
  !activityContent.includes('assets.open(path)'),
  "MainActivity.kt must not load subtitle fixtures from assets.open",
);
assert(
  !activityContent.includes('"fixtures/$videoId/en.json"'),
  "MainActivity.kt must not reference fixtures paths for proactiveDetectSubtitles",
);
console.log("✅ PASS: Android app does not load or fall back to subtitle fixtures");

// 7. Verify onNewIntent clears previous timedtext state
assert(
  activityContent.includes("lastObservedTimedTextUrl = null") &&
    activityContent.includes("lastObservedHeaders.clear()"),
  "MainActivity.kt onNewIntent must reset lastObservedTimedTextUrl and headers on new video",
);
console.log("✅ PASS: onNewIntent resets previous video timedtext URL and headers");

console.log("====================================================");
console.log("📊 ACCORDION VIDEOID & NO ANDROID FIXTURES: All assertions passed successfully!");
console.log("====================================================");
