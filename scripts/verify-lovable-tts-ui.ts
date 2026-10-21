import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  LOVABLE_TTS_BASE_URL,
  LOVABLE_TTS_ENDPOINT,
  LOVABLE_TTS_OPENAPI_URL,
  LOVABLE_TTS_PROVIDERS,
  LOVABLE_VOICES,
  OPENROUTER_VOICES,
} from "../src/lib/alternative-tts";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("=========================================================================");
console.log("🧪 Verifying Lovable Speak API (OpenAPI 3.1.0) UI Parity & Verification");
console.log("=========================================================================");

const rootDir = process.cwd();

// Section 1: API Constants & OpenAPI 3.1.0 Endpoint
console.log("\n🌐 Section 1: OpenAPI 3.1.0 Constants & Endpoints");
assert.equal(LOVABLE_TTS_BASE_URL, "https://tts2.lovable.app");
assert.equal(LOVABLE_TTS_ENDPOINT, "https://tts2.lovable.app/api/public/tts");
assert.equal(
  LOVABLE_TTS_OPENAPI_URL,
  "https://tts2.lovable.app/api/public/openapi.json",
  "Must point directly to the requested OpenAPI 3.1.0 specification",
);
assert.deepEqual(Array.from(LOVABLE_TTS_PROVIDERS), ["google", "lovable", "openrouter"]);
assert.ok(LOVABLE_VOICES.length > 0, "Must provide Lovable voices catalog");
assert.ok(OPENROUTER_VOICES.length > 0, "Must provide OpenRouter voices catalog");
console.log("✅ PASS: OpenAPI 3.1.0 endpoints and voice catalogs verified.");

// Section 2: Advanced Mode UI Controls in src/routes/index.tsx
console.log("\n🚀 Section 2: Advanced Mode UI Controls in src/routes/index.tsx");
const indexPath = path.join(rootDir, "src/routes/index.tsx");
assert.ok(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf-8");

const advancedTestIds = [
  'data-testid="alternative-tts-settings-card"',
  'data-testid="alternative-tts-toggle"',
  'data-testid="alternative-tts-mode-fallback"',
  'data-testid="alternative-tts-mode-always"',
  'data-testid="alternative-tts-engine-select"',
  'data-testid="lovable-tts-openapi-link"',
  'data-testid="lovable-tts-provider-select"',
  'data-testid="lovable-tts-voice-select"',
  'data-testid="test-alternative-tts-btn"',
];

for (const testId of advancedTestIds) {
  assert.ok(
    indexContent.includes(testId),
    `Advanced mode (src/routes/index.tsx) must contain ${testId}`,
  );
  console.log(`✅ PASS: Advanced mode includes ${testId}`);
}

assert.ok(
  indexContent.includes("https://tts2.lovable.app/api/public/tts") ||
    indexContent.includes("LOVABLE_TTS_OPENAPI_URL"),
  "Advanced mode must display Lovable endpoint or reference its OpenAPI specification",
);

// Section 3: Beginner Mode UI Controls in BeginnerPreferencesTab.tsx
console.log("\n🐣 Section 3: Beginner Mode UI Controls in BeginnerPreferencesTab.tsx");
const beginnerTabPath = path.join(
  rootDir,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
assert.ok(fs.existsSync(beginnerTabPath), "BeginnerPreferencesTab.tsx must exist");
const beginnerContent = fs.readFileSync(beginnerTabPath, "utf-8");

const beginnerTestIds = [
  'data-testid="beginner-alternative-tts-card"',
  'data-testid="beginner-alternative-tts-toggle"',
  'data-testid="beginner-alternative-tts-mode-fallback"',
  'data-testid="beginner-alternative-tts-mode-always"',
  'data-testid="beginner-alternative-tts-engine-select"',
  'data-testid="beginner-lovable-tts-openapi-link"',
  'data-testid="beginner-lovable-tts-provider-select"',
  'data-testid="beginner-lovable-tts-voice-select"',
  'data-testid="btn-test-alternative-tts"',
];

for (const testId of beginnerTestIds) {
  assert.ok(
    beginnerContent.includes(testId),
    `Beginner mode (BeginnerPreferencesTab.tsx) must contain ${testId}`,
  );
  console.log(`✅ PASS: Beginner mode includes ${testId}`);
}

// Section 4: Version Parity Verification (Version 1.0.68)
console.log("\n📦 Section 4: Version 1.0.68 Parity Verification Across Manifests");
const pkgPath = path.join(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
assert.equal(pkg.version, "1.0.68", "package.json must be 1.0.68");
assert.equal(APP_VERSION, "1.0.68", "appConfig.ts APP_VERSION must be 1.0.68");
assert.equal(CURRENT_APK_VERSION, "v1.0.68", "apkUpdater.ts CURRENT_APK_VERSION must be v1.0.68");

const gradlePath = path.join(rootDir, "android-shell/app/build.gradle.kts");
const gradleContent = fs.readFileSync(gradlePath, "utf-8");
assert.ok(
  gradleContent.includes('versionName = "1.0.68"'),
  "build.gradle.kts must have versionName 1.0.68",
);
assert.ok(
  gradleContent.includes("versionCode = 10068"),
  "build.gradle.kts must have versionCode 10068",
);

const settingsPath = path.join(rootDir, "src/utils/appSettings.ts");
const settingsContent = fs.readFileSync(settingsPath, "utf-8");
assert.ok(
  settingsContent.includes('version: "1.0.68"'),
  "appSettings.ts must have snapshot version 1.0.68",
);

console.log("✅ PASS: All 5 manifests and configs synchronized at version 1.0.68.");

console.log("\n=========================================================================");
console.log("🎉 ALL LOVABLE SPEAK API UI PARITY & VERIFICATION TESTS PASSED 100%!");
console.log("=========================================================================");
