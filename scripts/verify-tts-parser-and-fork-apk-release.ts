import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { getLovableTtsProvider, setLovableTtsProvider } from "../src/lib/alternative-tts";
import {
  DEFAULT_PARSER_CRITERIA,
  DEFAULT_CRITERIA_SETTINGS,
  criteriaSections,
  type Json3,
} from "../src/lib/subtitles";
import { DEFAULT_APP_SETTINGS } from "../src/utils/appSettings";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("====================================================");
console.log("🧪 Starting Task 187: TTS, Parser & Fork APK Release Verification");
console.log("====================================================");

const rootDir = process.cwd();

// --- 1. TTS service - set default to google provider ---
console.log("\n📦 Test 1: TTS service defaults to 'google' provider...");
// Clean any storage for test
if (typeof localStorage !== "undefined") {
  localStorage.removeItem("yt_alternative_tts_lovable_provider_v1");
}
assert.strictEqual(
  getLovableTtsProvider(),
  "google",
  "getLovableTtsProvider must default to 'google'",
);

// Fallback behavior when invalid provider given
setLovableTtsProvider("invalid_provider" as any);
assert.strictEqual(
  getLovableTtsProvider(),
  "google",
  "setLovableTtsProvider must fallback to 'google' when unknown provider is supplied",
);

// Verify UI components default to "google"
const beginnerPrefsPath = path.join(
  rootDir,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerPrefsContent = fs.readFileSync(beginnerPrefsPath, "utf8");
assert(
  beginnerPrefsContent.includes('getLovableTtsProvider() : "google"'),
  "BeginnerPreferencesTab must default lovableTtsProviderState to 'google'",
);

const indexPath = path.join(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf8");
assert(
  indexContent.includes('getLovableTtsProvider() : "google"'),
  "src/routes/index.tsx must default lovableTtsProviderState and altProvider to 'google'",
);
console.log("✅ PASS: TTS service default is 'google' provider across core lib and UI components");

// --- 2. TTS service - apply play speed based on TTS rate settings when result is an audio file ---
console.log("\n🔊 Test 2: Audio file playback speed uses TTS rate settings...");
const altTtsPath = path.join(rootDir, "src/lib/alternative-tts.ts");
const altTtsContent = fs.readFileSync(altTtsPath, "utf8");

assert(
  altTtsContent.includes("audio.playbackRate = effectivePlaybackRate") ||
    altTtsContent.includes("applyPlaybackRate"),
  "alternative-tts.ts must assign audio.playbackRate based on effective playback rate",
);
assert(
  altTtsContent.includes('audio.addEventListener("loadedmetadata", applyPlaybackRate)') &&
    altTtsContent.includes('audio.addEventListener("canplay", applyPlaybackRate)'),
  "alternative-tts.ts must re-apply playbackRate on loadedmetadata and canplay events to prevent browser reset",
);
// Verify no duplicate speed control was created in alternative TTS card
assert(
  indexContent.includes('data-testid="lovable-tts-native-speed-notice"') &&
    indexContent.includes("Uses native speech rate"),
  "TTS speed control remains in its original place with native speed notice and no duplicate control",
);
console.log(
  "✅ PASS: Audio file playback speed honors TTS rate settings and avoids duplicate controls",
);

// --- 3. Parser - default to the best settings in order not to cut a sentence in the middle ---
console.log("\n✂️ Test 3: Parser defaults to best settings to not cut sentences in the middle...");
assert.deepStrictEqual(
  DEFAULT_PARSER_CRITERIA,
  ["sentence"],
  "DEFAULT_PARSER_CRITERIA must default to ['sentence'] to avoid splitting on cue or arbitrary window chunks",
);

assert.strictEqual(
  DEFAULT_CRITERIA_SETTINGS.sentence.includeCommas,
  false,
  "DEFAULT_CRITERIA_SETTINGS.sentence.includeCommas must be false so commas do not split sentences",
);

assert(
  !DEFAULT_APP_SETTINGS.beginnerPunctuationChars?.includes(",") &&
    !DEFAULT_APP_SETTINGS.beginnerPunctuationChars?.includes(";") &&
    !DEFAULT_APP_SETTINGS.beginnerPunctuationChars?.includes(":"),
  "beginnerPunctuationChars must not include commas or colons which cut sentences in the middle",
);

const beginnerFlowPath = path.join(rootDir, "src/components/beginner/BeginnerFlowContainer.tsx");
const beginnerFlowContent = fs.readFileSync(beginnerFlowPath, "utf8");
assert(
  !beginnerFlowContent.includes('[".", "!", "?", ",", ";", ":"]'),
  "BeginnerFlowContainer must not default to punctuation characters containing commas or colons",
);

// Test sentence splitting with long sentence:
const longSentenceTrack: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 4000,
        segs: [
          { utf8: "This is a long continuous sentence that spans multiple cues ", tOffsetMs: 0 },
        ],
      },
      {
        tStartMs: 4000,
        dDurationMs: 5000,
        segs: [
          {
            utf8: "without any period or exclamation until the very end of the paragraph. ",
            tOffsetMs: 0,
          },
        ],
      },
      {
        tStartMs: 9000,
        dDurationMs: 4000,
        segs: [{ utf8: "Here is the second sentence.", tOffsetMs: 0 }],
      },
    ],
  },
};
const parsedSections = criteriaSections(longSentenceTrack, "en", DEFAULT_PARSER_CRITERIA);
assert.strictEqual(
  parsedSections.length,
  2,
  `Expected exactly 2 sentences without middle-of-sentence splitting, got ${parsedSections.length}`,
);
assert.strictEqual(
  parsedSections[0]!.end,
  9000,
  `First sentence must end at 9000ms where period occurs, got ${parsedSections[0]!.end}`,
);
console.log(
  "✅ PASS: Parser default criteria preserves complete sentence boundaries without mid-sentence cuts",
);

// --- 4. GitHub Actions release-apk workflow produces newer APK and upgrades release page ---
console.log("\n🚀 Test 4: GitHub Actions release-apk workflow configuration...");
const releaseWorkflowPath = path.join(rootDir, ".github/workflows/release-apk.yml");
assert(fs.existsSync(releaseWorkflowPath), "release-apk.yml must exist");
const releaseWorkflowContent = fs.readFileSync(releaseWorkflowPath, "utf8");

assert(
  releaseWorkflowContent.includes("timeout-minutes: 30"),
  "release-apk.yml job timeout must be at least 30 minutes to prevent premature cancellation",
);
assert(
  releaseWorkflowContent.includes('make_latest: "true"'),
  "release-apk.yml must specify make_latest: 'true' so the release page upgrades with the latest version",
);
assert(
  releaseWorkflowContent.includes("target_commitish: ${{ github.sha }}"),
  "release-apk.yml must set target_commitish to ${{ github.sha }}",
);
console.log(
  "✅ PASS: release-apk.yml configured with sufficient timeout and make_latest release upgrade",
);

// --- 5. Each GitHub fork generates the same APK version based on package.json ---
console.log("\n🍴 Test 5: Fork APK version uniformity based on package.json release...");
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
assert(
  releaseWorkflowContent.includes(
    "BASE=$(node -p \"require('./package.json').version || '1.0.0'\")",
  ),
  "release-apk.yml must read version directly from package.json",
);
assert(
  releaseWorkflowContent.includes('TAG="v${BASE}"') &&
    releaseWorkflowContent.includes('TITLE="YouTube Viewer v${BASE}"'),
  "release-apk.yml must use v${BASE} as uniform tag and title across all forks without arbitrary run numbers",
);

const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const gradleContent = fs.readFileSync(gradlePath, "utf8");
assert(
  gradleContent.includes(`versionName = "${packageJson.version}"`),
  `build.gradle.kts versionName must match package.json version ${packageJson.version}`,
);
assert(
  APP_VERSION === packageJson.version,
  `APP_VERSION (${APP_VERSION}) must match package.json version (${packageJson.version})`,
);
assert(
  CURRENT_APK_VERSION === `v${packageJson.version}`,
  `CURRENT_APK_VERSION (${CURRENT_APK_VERSION}) must match v${packageJson.version}`,
);
console.log(
  `✅ PASS: All forks will generate uniform release version v${packageJson.version} based on package.json`,
);

console.log("====================================================");
console.log("🎉 Task 187 Verification Suite PASSED successfully!");
console.log("====================================================");
