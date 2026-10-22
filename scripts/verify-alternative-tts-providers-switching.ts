import fs from "fs";
import path from "path";
import assert from "assert";
import {
  getLovableTtsProvider,
  setLovableTtsProvider,
  LOVABLE_VOICES,
  OPENROUTER_VOICES,
} from "../src/lib/alternative-tts";

const rootDir = process.cwd();

console.log("=== Verifying Task 180: Switchable Alternative TTS Providers & Voice Catalogs ===");

// 1. Verify provider persistence and helper functions
console.log("\n📦 Test 1: Provider storage functions & valid switching...");
assert.equal(typeof getLovableTtsProvider, "function", "getLovableTtsProvider must be exported");
assert.equal(typeof setLovableTtsProvider, "function", "setLovableTtsProvider must be exported");

setLovableTtsProvider("google");
assert.equal(getLovableTtsProvider(), "google", "Should switch and persist provider 'google'");

setLovableTtsProvider("openrouter");
assert.equal(getLovableTtsProvider(), "openrouter", "Should switch and persist provider 'openrouter'");

setLovableTtsProvider("lovable");
assert.equal(getLovableTtsProvider(), "lovable", "Should switch and persist provider 'lovable'");
console.log("✓ Provider switching and persistence verified across lovable, google, and openrouter");

// 2. Verify Advanced Mode UI (src/routes/index.tsx)
console.log("\n🚀 Test 2: Advanced Mode Provider & Voice Selectors...");
const indexPath = path.resolve(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert(
  indexContent.includes('data-testid="lovable-tts-provider-select"'),
  "Advanced mode must include lovable-tts-provider-select",
);
assert(
  !indexContent.includes('data-testid="lovable-tts-provider-select"\n                                        value="lovable"\n                                        disabled') &&
    !indexContent.includes('data-testid="lovable-tts-provider-select"\n                                        value={lovableTtsProviderState}\n                                        disabled'),
  "lovable-tts-provider-select must NOT be disabled",
);
assert(
  indexContent.includes('<option value="lovable">lovable</option>') &&
    indexContent.includes('<option value="google">google</option>') &&
    indexContent.includes('<option value="openrouter">openrouter</option>'),
  "Advanced mode provider select must offer lovable, google, and openrouter options",
);
assert(
  indexContent.includes('data-testid="lovable-tts-voice-select"'),
  "Advanced mode must include lovable-tts-voice-select",
);
assert(
  indexContent.includes("OPENROUTER_VOICES.map"),
  "Advanced mode must support OpenRouter voice options",
);
assert(
  indexContent.includes("LOVABLE_VOICES.map"),
  "Advanced mode must support Lovable voice options",
);
console.log("✓ Advanced Mode includes enabled provider selector and dynamic voice catalogs");

// 3. Verify Beginner Mode UI (BeginnerPreferencesTab.tsx)
console.log("\n🐣 Test 3: Beginner Mode Provider & Voice Selectors Parity...");
const beginnerPath = path.resolve(
  rootDir,
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerContent = fs.readFileSync(beginnerPath, "utf-8");

assert(
  beginnerContent.includes('data-testid="beginner-lovable-tts-provider-select"'),
  "Beginner mode must include beginner-lovable-tts-provider-select",
);
assert(
  !beginnerContent.includes('data-testid="beginner-lovable-tts-provider-select"\n                    value="lovable"\n                    disabled') &&
    !beginnerContent.includes('data-testid="beginner-lovable-tts-provider-select"\n                    value={lovableTtsProviderState}\n                    disabled'),
  "beginner-lovable-tts-provider-select must NOT be disabled",
);
assert(
  beginnerContent.includes('<option value="lovable">lovable</option>') &&
    beginnerContent.includes('<option value="google">google</option>') &&
    beginnerContent.includes('<option value="openrouter">openrouter</option>'),
  "Beginner mode provider select must offer lovable, google, and openrouter options",
);
assert(
  beginnerContent.includes('data-testid="beginner-lovable-tts-voice-select"'),
  "Beginner mode must include beginner-lovable-tts-voice-select",
);
assert(
  beginnerContent.includes("OPENROUTER_VOICES.map"),
  "Beginner mode must support OpenRouter voice options",
);
assert(
  beginnerContent.includes("LOVABLE_VOICES.map"),
  "Beginner mode must support Lovable voice options",
);
console.log("✓ Beginner Mode includes enabled provider selector with 100% parity");

// 4. Verify Active Provider Passed in Synthesis and Playback Calls
console.log("\n🔊 Test 4: Active provider wiring in speech calls...");
assert(
  indexContent.includes("provider: altProvider"),
  "speak() in index.tsx must pass active provider",
);
assert(
  indexContent.includes("provider: lovableTtsProviderState"),
  "Test button in index.tsx must pass active provider",
);
assert(
  beginnerContent.includes("provider: lovableTtsProviderState"),
  "Test button in BeginnerPreferencesTab must pass active provider",
);
console.log("✓ Active provider wired into all synthesis and playback calls");

// 5. Verify Version >= 1.0.73 synchronized across all 5 files
console.log("\n📦 Test 5: Version Synchronization across all 5 Targets...");
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));
const currentVer = pkgJson.version;
const [major, minor, patch] = currentVer.split(".").map(Number);
assert(major > 1 || (major === 1 && minor > 0) || (major === 1 && minor === 0 && patch >= 73), `package.json version must be >= 1.0.73, got ${currentVer}`);

const gradleContent = fs.readFileSync(
  path.resolve(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert(gradleContent.includes(`versionName = "${currentVer}"`), `build.gradle.kts versionName must be "${currentVer}"`);

const appConfigContent = fs.readFileSync(path.resolve(rootDir, "src/config/appConfig.ts"), "utf-8");
assert(
  appConfigContent.includes(`export const APP_VERSION = "${currentVer}";`),
  `appConfig.ts APP_VERSION must be "${currentVer}"`,
);

const apkUpdaterContent = fs.readFileSync(path.resolve(rootDir, "src/utils/apkUpdater.ts"), "utf-8");
assert(
  apkUpdaterContent.includes(`export const CURRENT_APK_VERSION = "v${currentVer}";`),
  `apkUpdater.ts CURRENT_APK_VERSION must be "v${currentVer}"`,
);

const appSettingsContent = fs.readFileSync(path.resolve(rootDir, "src/utils/appSettings.ts"), "utf-8");
assert(appSettingsContent.includes(`version: "${currentVer}"`), `appSettings.ts version must be "${currentVer}"`);

console.log(`✓ Version ${currentVer} synchronized across all 5 files`);
console.log("=== ALL TASK 180 ASSERTIONS PASSED ===");
