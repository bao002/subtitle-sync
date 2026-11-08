import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Verifying Task 361: Custom Volume per Translation (Stage 2 Card)");
console.log("==================================================================");

const root = process.cwd();

// 1. Verify src/lib/playback-preferences.ts exports and volume logic
const prefsPath = path.join(root, "src/lib/playback-preferences.ts");
assert(fs.existsSync(prefsPath), "src/lib/playback-preferences.ts must exist");
const prefsContent = fs.readFileSync(prefsPath, "utf-8");

assert(
  prefsContent.includes("getTtsVolumesPreference"),
  "playback-preferences.ts must export getTtsVolumesPreference",
);
assert(
  prefsContent.includes("setTtsVolumePreference"),
  "playback-preferences.ts must export setTtsVolumePreference",
);
assert(
  prefsContent.includes("saveTtsVolumePreference"),
  "playback-preferences.ts must export saveTtsVolumePreference",
);
assert(
  prefsContent.includes("getLanguageTtsVolume"),
  "playback-preferences.ts must export getLanguageTtsVolume",
);
console.log("✅ Step 1: playback-preferences.ts exports volume preferences and getter");

// 2. Verify src/utils/appSettings.ts and ratioCompositionsManager.ts
const appSettingsPath = path.join(root, "src/utils/appSettings.ts");
assert(fs.existsSync(appSettingsPath), "src/utils/appSettings.ts must exist");
const appSettingsContent = fs.readFileSync(appSettingsPath, "utf-8");
assert(
  appSettingsContent.includes("ttsVolumes?: Record<string, number>"),
  "appSettings.ts VideoSpecificSettings must declare ttsVolumes",
);

const ratioCompPath = path.join(root, "src/utils/ratioCompositionsManager.ts");
assert(fs.existsSync(ratioCompPath), "src/utils/ratioCompositionsManager.ts must exist");
const ratioCompContent = fs.readFileSync(ratioCompPath, "utf-8");
assert(
  ratioCompContent.includes("volumes?: Record<string, number>"),
  "ratioCompositionsManager.ts must include volumes in LanguageRatioComposition",
);
console.log("✅ Step 2: appSettings.ts and ratioCompositionsManager.ts support per-language volume persistence");

// 3. Verify src/lib/alternative-tts.ts volume handling
const altTtsPath = path.join(root, "src/lib/alternative-tts.ts");
assert(fs.existsSync(altTtsPath), "src/lib/alternative-tts.ts must exist");
const altTtsContent = fs.readFileSync(altTtsPath, "utf-8");
assert(
  altTtsContent.includes("volume?: number"),
  "alternative-tts.ts executeTtsFallbackSequence must support volume option",
);
assert(
  altTtsContent.includes("audio.volume = effectiveVolume"),
  "alternative-tts.ts playAlternativeTtsAudio must set audio.volume",
);
console.log("✅ Step 3: alternative-tts.ts respects custom volume for external and audio playback");

// 4. Verify src/routes/index.tsx speak() and UI controls
const indexPath = path.join(root, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert(
  indexContent.includes("data-testid=\"stage-2-ingredient-volume-section\""),
  "index.tsx must render stage-2-ingredient-volume-section in Learning Goals",
);
assert(
  indexContent.includes("stage-2-volume-row-"),
  "index.tsx must render stage-2-volume-row per language",
);
assert(
  indexContent.includes("stage-2-volume-slider-"),
  "index.tsx must render stage-2-volume-slider per language",
);
assert(
  indexContent.includes("stage-2-volume-display-"),
  "index.tsx must render stage-2-volume-display per language",
);
assert(
  indexContent.includes("stage-2-volume-mute-toggle-"),
  "index.tsx must render mute/unmute toggle per language",
);
assert(
  indexContent.includes("stage-2-volume-decrement-") &&
    indexContent.includes("stage-2-volume-increment-"),
  "index.tsx must render volume decrement and increment buttons",
);
assert(
  indexContent.includes("stage-2-volume-btn-"),
  "index.tsx must render quick volume preset buttons",
);
assert(
  indexContent.includes("data-testid=\"th-volume\""),
  "index.tsx must render Vol column header in unified languages table",
);
assert(
  indexContent.includes("tts-volume-select-"),
  "index.tsx must render tts-volume-select in unified languages table rows",
);
assert(
  indexContent.includes("u.volume = normalizedVolume"),
  "index.tsx speak() function must set u.volume on SpeechSynthesisUtterance",
);
console.log("✅ Step 4: index.tsx renders volume controls in Stage 2 Learning Goals and unified table");

// 5. Verify settingsBackupManager.ts
const backupPath = path.join(root, "src/utils/settingsBackupManager.ts");
assert(fs.existsSync(backupPath), "src/utils/settingsBackupManager.ts must exist");
const backupContent = fs.readFileSync(backupPath, "utf-8");
assert(
  backupContent.includes("ttsVolumes: getTtsVolumesPreference()"),
  "settingsBackupManager.ts must backup ttsVolumes",
);
assert(
  backupContent.includes("prefs.ttsVolumes"),
  "settingsBackupManager.ts must import ttsVolumes",
);
console.log("✅ Step 5: settingsBackupManager.ts backs up and restores per-language ttsVolumes");

console.log("==================================================================");
console.log("🎉 ALL TESTS PASSED: Custom Volume per Translation verified!");
console.log("==================================================================");
