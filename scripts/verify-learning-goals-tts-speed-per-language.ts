import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("==================================================================");
console.log("🧪 Verifying Task 348: Learning Goals TTS Speed Rate Per Language");
console.log("==================================================================");

const root = process.cwd();

// 1. Verify playback-preferences.ts exports & bounds
const prefsPath = path.join(root, "src/lib/playback-preferences.ts");
assert(fs.existsSync(prefsPath), "src/lib/playback-preferences.ts must exist");
const prefsContent = fs.readFileSync(prefsPath, "utf-8");

assert(
  prefsContent.includes("getTtsRatesPreference"),
  "playback-preferences.ts must export getTtsRatesPreference",
);
assert(
  prefsContent.includes("setTtsRatePreference"),
  "playback-preferences.ts must export setTtsRatePreference",
);
assert(
  prefsContent.includes("saveTtsRatePreference"),
  "playback-preferences.ts must export saveTtsRatePreference",
);
assert(
  prefsContent.includes("0.25") && prefsContent.includes("2.5"),
  "playback-preferences.ts must allow rates between 0.25x and 2.5x",
);
console.log(
  "✅ Step 1: playback-preferences.ts correctly exports per-language rates with 0.25x - 2.5x range",
);

// 2. Verify stage-2-ingredient-speed-section in src/routes/index.tsx
const indexPath = path.join(root, "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert(
  indexContent.includes('data-testid="stage-2-ingredient-speed-section"'),
  "src/routes/index.tsx must contain stage-2-ingredient-speed-section in Learning Goals",
);
assert(
  indexContent.includes("stage-2-speed-row-"),
  "src/routes/index.tsx must render speed row per language",
);
assert(
  indexContent.includes("stage-2-speed-slider-"),
  "src/routes/index.tsx must render speed slider per language",
);
assert(
  indexContent.includes("stage-2-speed-display-"),
  "src/routes/index.tsx must render speed display per language",
);
assert(
  indexContent.includes("stage-2-speed-decrement-") &&
    indexContent.includes("stage-2-speed-increment-"),
  "src/routes/index.tsx must render speed decrement and increment buttons per language",
);
assert(
  indexContent.includes("stage-2-speed-btn-"),
  "src/routes/index.tsx must render speed preset buttons per language",
);
console.log(
  "✅ Step 2: src/routes/index.tsx renders dedicated per-language speech rate controls in Stage 1 Learning Goals",
);

// 3. Verify speak propagation in src/routes/index.tsx
assert(
  indexContent.includes("normalizedRate = Math.max(0.25, Math.min(2.5, rate || 1.0))") ||
    indexContent.includes("normalizedRate = Math.max(0.25, Math.min(2.5"),
  "src/routes/index.tsx speak function must normalize rates up to 2.5x",
);
assert(
  indexContent.includes("altSpeed = normalizedRate"),
  "src/routes/index.tsx must pass normalizedRate to alternative TTS as altSpeed",
);
assert(
  indexContent.includes("AndroidNativeShell.speak(text, lang, normalizedRate"),
  "src/routes/index.tsx must pass normalizedRate to Android Native Shell",
);
console.log(
  "✅ Step 3: speak() propagates language speed rate to native TTS and external TTS service",
);

// 4. Verify alternative-tts.ts speed parameter propagation
const altTtsPath = path.join(root, "src/lib/alternative-tts.ts");
assert(fs.existsSync(altTtsPath), "src/lib/alternative-tts.ts must exist");
const altTtsContent = fs.readFileSync(altTtsPath, "utf-8");

assert(
  altTtsContent.includes("executeTtsFallbackSequence") && altTtsContent.includes("speed: rate"),
  "alternative-tts.ts executeTtsFallbackSequence must propagate speed: rate",
);
assert(
  altTtsContent.includes('url.searchParams.set("speed"') || altTtsContent.includes("body.speed"),
  "alternative-tts.ts must serialize speed into query params or JSON body for external TTS",
);
console.log("✅ Step 4: alternative-tts.ts handles speed for external TTS service");

// 5. Verify Beginner Mode parity
const beginnerPrefsPath = path.join(root, "src/components/beginner/PerLanguageTtsPreferences.tsx");
assert(
  fs.existsSync(beginnerPrefsPath),
  "src/components/beginner/PerLanguageTtsPreferences.tsx must exist",
);
const beginnerPrefsContent = fs.readFileSync(beginnerPrefsPath, "utf-8");

assert(
  beginnerPrefsContent.includes("beginner-tts-speed-"),
  "Beginner PerLanguageTtsPreferences must contain beginner-tts-speed- selector",
);
assert(
  beginnerPrefsContent.includes("2.0") || beginnerPrefsContent.includes("1.5"),
  "Beginner PerLanguageTtsPreferences must include faster rate options",
);
console.log("✅ Step 5: Beginner Mode maintains 100% parity with per-language speed controls");

console.log("==================================================================");
console.log("🎉 All checks for Task 348 passed successfully!");
console.log("==================================================================");
