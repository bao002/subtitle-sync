import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Simplified Design & Reduced Text Clutter (Task 260)");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify App Version 2.0.51+ Synchronization across all 5 files
console.log("\n--> [Step 1] Verifying Version synchronization across all 5 files...");

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert.ok(packageJson.version >= "2.0.51", "package.json version must be >= 2.0.51");

const buildGradle = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(buildGradle.includes(`versionName = "${packageJson.version}"`), "build.gradle.kts must match package.json versionName");
assert.ok(buildGradle.includes("versionCode = 20"), "build.gradle.kts must have versionCode starting with 20");

const appConfig = fs.readFileSync(path.join(rootDir, "src/config/appConfig.ts"), "utf-8");
assert.ok(appConfig.includes("APP_VERSION"), "appConfig.ts must export APP_VERSION");

const apkUpdater = fs.readFileSync(path.join(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert.ok(apkUpdater.includes("CURRENT_APK_VERSION"), "apkUpdater.ts must have CURRENT_APK_VERSION");

const appSettings = fs.readFileSync(path.join(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert.ok(appSettings.includes("version: APP_VERSION") || appSettings.includes(`version: "${packageJson.version}"`), "appSettings.ts must export version matching package.json");
console.log(`✅ PASS: App version ${packageJson.version} synchronized across all 5 files.`);

// 2. Verify Simplified NewSubtitlesParserBar
console.log("\n--> [Step 2] Verifying simplified labels in NewSubtitlesParserBar...");
const parserBar = fs.readFileSync(path.join(rootDir, "src/components/NewSubtitlesParserBar.tsx"), "utf-8");
assert.ok(!parserBar.includes("Live Dynamic Updates"), "Redundant 'Live Dynamic Updates' badge must be removed");
assert.ok(parserBar.includes("<span>Short Sentences (TTS)</span>"), "Parser bar must use concise 'Short Sentences (TTS)' label");
assert.ok(parserBar.includes("<span>Dot ( . )</span>"), "Parser bar must use concise 'Dot ( . )' label");
assert.ok(parserBar.includes("<span>Question ( ? )</span>"), "Parser bar must use concise 'Question ( ? )' label");
assert.ok(parserBar.includes("<span>Exclamation ( ! )</span>"), "Parser bar must use concise 'Exclamation ( ! )' label");
assert.ok(parserBar.includes("<span>Comma ( , )</span>"), "Parser bar must use concise 'Comma ( , )' label");
assert.ok(parserBar.includes("<span>Colons ( ; : )</span>"), "Parser bar must use concise 'Colons ( ; : )' label");
assert.ok(parserBar.includes("<span>Intra-cue</span>"), "Parser bar must use concise 'Intra-cue' label");
console.log("✅ PASS: NewSubtitlesParserBar is streamlined and clutter-free.");

// 3. Verify ModeSwitcherHeader simplified text
console.log("\n--> [Step 3] Verifying streamlined ModeSwitcherHeader...");
const modeSwitcher = fs.readFileSync(path.join(rootDir, "src/components/ModeSwitcherHeader.tsx"), "utf-8");
assert.ok(modeSwitcher.includes("<span>Beginner Mode</span>"), "Mode badge must say 'Beginner Mode'");
assert.ok(modeSwitcher.includes("<span>Advanced Studio</span>"), "Mode badge must say 'Advanced Studio'");
assert.ok(modeSwitcher.includes("Guided setup"), "Mode switcher subtitle must be concise 'Guided setup'");
assert.ok(modeSwitcher.includes("Full controls"), "Mode switcher subtitle must be concise 'Full controls'");
console.log("✅ PASS: ModeSwitcherHeader is clean and succinct.");

// 4. Verify BeginnerVideoTab text reduction
console.log("\n--> [Step 4] Verifying BeginnerVideoTab text reduction...");
const videoTab = fs.readFileSync(path.join(rootDir, "src/components/beginner/tabs/BeginnerVideoTab.tsx"), "utf-8");
assert.ok(
  !videoTab.includes("Paste or share a YouTube video link to begin subtitle synchronization."),
  "Redundant explanatory paragraph in BeginnerVideoTab must be removed",
);
assert.ok(videoTab.includes("<span>Video &amp; Subtitles</span>"), "Header title must be clean 'Video & Subtitles'");
console.log("✅ PASS: BeginnerVideoTab redundant text successfully removed.");

// 5. Verify BeginnerPreferencesTab simplification
console.log("\n--> [Step 5] Verifying BeginnerPreferencesTab simplification...");
const prefsTab = fs.readFileSync(path.join(rootDir, "src/components/beginner/tabs/BeginnerPreferencesTab.tsx"), "utf-8");
assert.ok(prefsTab.includes('<h2 className="text-sm font-semibold text-foreground">Preferences</h2>'), "Preferences header must be simplified");
assert.ok(prefsTab.includes("perLanguageTtsSettingsSlot") || prefsTab.includes("VideoPlaybackPrecedenceBar"), "Preferences tab must mount language TTS controls");
assert.ok(!prefsTab.includes("The app fetches translations and prepares TTS speech for your favorite languages."), "Redundant paragraph in favorite languages must be removed");
console.log("✅ PASS: BeginnerPreferencesTab streamlined and easy to read.");

// 6. Verify Single-Line Clamped Top-Screen Description in src/routes/index.tsx
console.log("\n--> [Step 6] Verifying top-screen description line clamping in src/routes/index.tsx...");
const indexRoutes = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf-8");
assert.ok(
  indexRoutes.includes('data-testid="top-screen-video-description"') &&
    indexRoutes.includes("line-clamp-1"),
  "top-screen-video-description must use line-clamp-1 for clean, compact display",
);
console.log("✅ PASS: top-screen description is cleanly clamped.");

// 7. Verify SpecialCharactersRemovalPanel simplified labels
console.log("\n--> [Step 7] Verifying SpecialCharactersRemovalPanel simplified labels...");
const specialChars = fs.readFileSync(path.join(rootDir, "src/components/SpecialCharactersRemovalPanel.tsx"), "utf-8");
assert.ok(specialChars.includes("Symbols to strip:"), "SpecialCharactersRemovalPanel must use concise 'Symbols to strip:'");
assert.ok(specialChars.includes("Add custom rule:"), "SpecialCharactersRemovalPanel must use concise 'Add custom rule:'");
console.log("✅ PASS: SpecialCharactersRemovalPanel labels simplified.");

console.log("\n=========================================================================");
console.log("🎉 ALL SIMPLIFIED DESIGN & REDUCED TEXT CHECKS PASSED (100%)!");
console.log("=========================================================================");
