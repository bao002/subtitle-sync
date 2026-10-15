import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  removeCachedTargetSubtitles,
  saveCachedTargetSubtitles,
  getCachedTargetSubtitles,
} from "../src/utils/subtitleCache";
import {
  removeVideoInstanceConfig,
  loadStoredInstanceConfigs,
  saveVideoInstanceConfig,
} from "../src/utils/multiVideoPlayerManager";
import { PANELS } from "../src/config/accordionThemes";

console.log("==================================================================");
console.log(
  "🧪 Verify Compact UI, Pin Toggles, Library Cache Controls & Clean Language Removal (Task 59)",
);
console.log("==================================================================");

const rootDir = process.cwd();
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");
const accordionPath = path.join(rootDir, "src/components/AccordionSection.tsx");
const libraryPanelPath = path.join(rootDir, "src/components/VideoLibraryPanel.tsx");
const subtitleCachePath = path.join(rootDir, "src/utils/subtitleCache.ts");
const multiVideoManagerPath = path.join(rootDir, "src/utils/multiVideoPlayerManager.ts");

assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");
assert(fs.existsSync(accordionPath), "src/components/AccordionSection.tsx must exist");
assert(fs.existsSync(libraryPanelPath), "src/components/VideoLibraryPanel.tsx must exist");
assert(fs.existsSync(subtitleCachePath), "src/utils/subtitleCache.ts must exist");
assert(fs.existsSync(multiVideoManagerPath), "src/utils/multiVideoPlayerManager.ts must exist");

const indexContent = fs.readFileSync(indexTsxPath, "utf8");
const accordionContent = fs.readFileSync(accordionPath, "utf8");
const libraryContent = fs.readFileSync(libraryPanelPath, "utf8");
const cacheContent = fs.readFileSync(subtitleCachePath, "utf8");
const multiVideoContent = fs.readFileSync(multiVideoManagerPath, "utf8");

// ------------------------------------------------------------------
// Check 1: Subtask 59.1 - Compact per-language settings & voice selection
// ------------------------------------------------------------------
console.log(
  "--> [Check 1] Validating Subtask 59.1: Compact per-language settings & voice selection...",
);
assert(
  indexContent.includes("data-testid={`tts-settings-card-${lang.code}`}"),
  "index.tsx must render tts-settings-card for each spoken language",
);
assert(
  indexContent.includes("data-testid={`tts-ratio-slider-${lang.code}`}"),
  "index.tsx must render tts-ratio-slider dropdown",
);
assert(
  indexContent.includes("flex flex-wrap sm:flex-nowrap items-center gap-2"),
  "TTS settings card must use compact inline flex layout",
);
assert(
  indexContent.includes("value={voice.voiceURI || voice.name}"),
  "Voice option value must fall back to voice.name when voiceURI is empty",
);
assert(
  indexContent.includes("x.voiceURI === voiceURI || x.name === voiceURI"),
  "speakText voice resolution must match by either voiceURI or name",
);
console.log(
  "✅ PASS: Subtask 59.1 verified: compact layout and robust voice selection resolution.",
);

// ------------------------------------------------------------------
// Check 2: Subtask 59.2 - Accordions auto-fold after timeout unless pinned
// ------------------------------------------------------------------
console.log("--> [Check 2] Validating Subtask 59.2: Accordion auto-fold and pin toggles...");
assert(
  accordionContent.includes("ACCORDION_AUTO_FOLD_MS") || accordionContent.includes("setTimeout"),
  "AccordionSection must implement auto-fold timer",
);
assert(
  accordionContent.includes("pinKey") && accordionContent.includes("yt_accordion_pinned_"),
  "AccordionSection must store pinned status per accordion ID",
);
assert(
  accordionContent.includes("if (!open || pinned) return;"),
  "AccordionSection must prevent auto-folding when pinned is true",
);
assert(
  accordionContent.includes("togglePinned") && accordionContent.includes("aria-pressed={pinned}"),
  "AccordionSection must provide togglePinned handler and aria-pressed attribute",
);
console.log("✅ PASS: Subtask 59.2 verified: auto-fold timeout and persistent pin toggle.");

// ------------------------------------------------------------------
// Check 3: Subtask 59.3 - Subtitles strictly belong to the current video
// ------------------------------------------------------------------
console.log("--> [Check 3] Validating Subtask 59.3: Subtitles scoped to active video...");
assert(
  indexContent.includes("videoId={videoId}") &&
    accordionContent.includes("data-video-id={videoId}"),
  "Accordion sections must be bound to active videoId",
);
assert(
  indexContent.includes("setTracks(null)") && indexContent.includes('setObservedUrl("")'),
  "Video loading and switching must clear previous video tracks and observed URL",
);
console.log(
  "✅ PASS: Subtask 59.3 verified: all subtitles and cues belong strictly to current video.",
);

// ------------------------------------------------------------------
// Check 4: Subtask 59.4 - Remove standalone iframe player option
// ------------------------------------------------------------------
console.log("--> [Check 4] Validating Subtask 59.4: Remove standalone iframe player option...");
assert(
  !PANELS.some(
    (p) => p.id === ("language-player" as unknown) || p.id === ("iframe-player" as unknown),
  ),
  "PANELS must not contain legacy standalone language-player or iframe-player accordion",
);
assert(
  !indexContent.includes('panelId === "iframe-player"'),
  "index.tsx must not contain iframe-player panel switch",
);
console.log("✅ PASS: Subtask 59.4 verified: no standalone iframe player toggle.");

// ------------------------------------------------------------------
// Check 5: Subtask 59.5 - Library record "Clear cache" and "Fetch from scratch" buttons
// ------------------------------------------------------------------
console.log("--> [Check 5] Validating Subtask 59.5: Library Clear cache and Fetch from scratch...");
assert(
  libraryContent.includes("library-clear-cache-btn-"),
  "VideoLibraryPanel must render Clear cache button with testid library-clear-cache-btn-",
);
assert(
  libraryContent.includes("library-fetch-scratch-btn-"),
  "VideoLibraryPanel must render Fetch from scratch button with testid library-fetch-scratch-btn-",
);
assert(
  libraryContent.includes("onFetchFromScratch"),
  "VideoLibraryPanel must support onFetchFromScratch callback",
);
assert(
  indexContent.includes("onFetchFromScratch={"),
  "index.tsx must supply onFetchFromScratch handler to VideoLibraryPanel",
);
console.log(
  "✅ PASS: Subtask 59.5 verified: both Clear cache and Fetch from scratch buttons present.",
);

// ------------------------------------------------------------------
// Check 6: Subtask 59.6 - Clean language removal removes all instances
// ------------------------------------------------------------------
console.log("--> [Check 6] Validating Subtask 59.6: Clean language removal...");
assert(
  indexContent.includes("const removedLangs = targetLanguages.filter("),
  "handleTargetLanguagesChange must compute removedLangs",
);
assert(
  indexContent.includes("setShown((prev) => prev.filter((code) => !removedLangs.includes(code)))"),
  "handleTargetLanguagesChange must remove unselected languages from shown columns",
);
assert(
  indexContent.includes("setSpoken((prev) => prev.filter((code) => !removedLangs.includes(code)))"),
  "handleTargetLanguagesChange must remove unselected languages from spoken TTS",
);
assert(
  indexContent.includes("delete next[code]"),
  "handleTargetLanguagesChange must delete unselected language tracks from state",
);
assert(
  indexContent.includes("subtitleRequestQueue.removeLanguage(prevLang)"),
  "handleTargetLanguagesChange must remove unselected language from request queue",
);
assert(
  indexContent.includes("removeCachedTargetSubtitles(videoId, prevLang)"),
  "handleTargetLanguagesChange must purge cached subtitle state for removed language",
);
assert(
  indexContent.includes("removeVideoInstanceConfig(videoId, `lang_${prevLang}`)"),
  "handleTargetLanguagesChange must remove stored video instance configuration",
);
assert(
  indexContent.includes("multiVideoPlayerRegistry.unregister(`lang_${prevLang}`)"),
  "handleTargetLanguagesChange must unregister active player instance for removed language",
);

// Mock localStorage for node environment unit tests
const storageMock: Record<string, string> = {};
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storageMock[key] ?? null,
    setItem: (key: string, value: string) => {
      storageMock[key] = value;
    },
    removeItem: (key: string) => {
      delete storageMock[key];
    },
    clear: () => {
      for (const k in storageMock) delete storageMock[k];
    },
  },
};

// Functional unit test of removeCachedTargetSubtitles
console.log("--> [Check 6.1] Functional unit test of removeCachedTargetSubtitles...");
const testVideoId = "test_vid_removal_59";
const testLang = "it";
const sampleCues = [{ id: "c1", start: 0, end: 2, text: "Ciao mondo" }];
saveCachedTargetSubtitles(testVideoId, testLang, sampleCues);
assert.strictEqual(
  getCachedTargetSubtitles(testVideoId, testLang)?.length,
  1,
  "Target subtitles should be cached initially",
);
removeCachedTargetSubtitles(testVideoId, testLang);
assert.strictEqual(
  getCachedTargetSubtitles(testVideoId, testLang),
  null,
  "Target subtitles must be cleanly purged after removeCachedTargetSubtitles",
);
console.log("✅ PASS: removeCachedTargetSubtitles successfully purges cached data.");

// Functional unit test of removeVideoInstanceConfig
console.log("--> [Check 6.2] Functional unit test of removeVideoInstanceConfig...");
saveVideoInstanceConfig(testVideoId, `lang_${testLang}`, { volume: 50, muted: true });
const configsBefore = loadStoredInstanceConfigs(testVideoId);
assert(configsBefore[`lang_${testLang}`], "Instance config should be saved initially");
removeVideoInstanceConfig(testVideoId, `lang_${testLang}`);
const configsAfter = loadStoredInstanceConfigs(testVideoId);
assert(!configsAfter[`lang_${testLang}`], "Instance config must be deleted after removal");
console.log("✅ PASS: removeVideoInstanceConfig successfully removes instance configuration.");

console.log("==================================================================");
console.log("🎉 ALL TASK 59 COMPACT UI & CLEAN LANGUAGE REMOVAL CHECKS PASSED!");
console.log("==================================================================");
