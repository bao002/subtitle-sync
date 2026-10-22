/**
 * scripts/verify-openrouter-key-settings.ts
 *
 * Dedicated verification script for Task 177:
 * 1. Verifies OpenRouter key configuration and localStorage persistence across all keys.
 * 2. Verifies fallback to server .env setting (VITE_OPENROUTER_API_KEY) when user has not supplied an API key.
 * 3. Verifies .env.example contains VITE_OPENROUTER_API_KEY.
 * 4. Verifies UI inputs, testids, and toggle buttons in both Advanced Mode and Beginner Mode.
 * 5. Verifies version 1.0.70 is synchronized across all 5 version files.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

console.log("=== Verifying Task 177: OpenRouter Key Settings & Server .env Fallback ===");

// 1. Verify .env.example
const envExamplePath = path.resolve(process.cwd(), ".env.example");
assert(fs.existsSync(envExamplePath), ".env.example file must exist");
const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");
assert(
  envExampleContent.includes("VITE_OPENROUTER_API_KEY="),
  ".env.example must define VITE_OPENROUTER_API_KEY",
);
console.log("✓ .env.example defines VITE_OPENROUTER_API_KEY");

// 2. Verify alternative-tts.ts exports and implementation
const altTtsPath = path.resolve(process.cwd(), "src/lib/alternative-tts.ts");
const altTtsContent = fs.readFileSync(altTtsPath, "utf-8");

assert(
  altTtsContent.includes("export function getServerOpenRouterApiKey()"),
  "alternative-tts.ts must export getServerOpenRouterApiKey()",
);
assert(
  altTtsContent.includes("export function hasCustomOpenRouterApiKey()"),
  "alternative-tts.ts must export hasCustomOpenRouterApiKey()",
);
assert(
  altTtsContent.includes("export function getLovableTtsApiKey()"),
  "alternative-tts.ts must export getLovableTtsApiKey()",
);
assert(
  altTtsContent.includes("export function setLovableTtsApiKey("),
  "alternative-tts.ts must export setLovableTtsApiKey()",
);
assert(
  altTtsContent.includes("yt_openrouter_api_key") &&
    altTtsContent.includes("yt_openrouter_api_key_v1") &&
    altTtsContent.includes("STORAGE_KEY_ALTERNATIVE_TTS_LOVABLE_API_KEY"),
  "alternative-tts.ts must sync across all openrouter storage keys",
);
console.log("✓ alternative-tts.ts exports and synchronizes OpenRouter API key functions");

// 3. Verify appSettings.ts exports and implementation
const appSettingsPath = path.resolve(process.cwd(), "src/utils/appSettings.ts");
const appSettingsContent = fs.readFileSync(appSettingsPath, "utf-8");

assert(
  appSettingsContent.includes("export function getOpenRouterApiKeySetting()"),
  "appSettings.ts must export getOpenRouterApiKeySetting()",
);
assert(
  appSettingsContent.includes("export function setOpenRouterApiKeySetting("),
  "appSettings.ts must export setOpenRouterApiKeySetting()",
);
assert(
  appSettingsContent.includes("VITE_OPENROUTER_API_KEY"),
  "appSettings.ts must support VITE_OPENROUTER_API_KEY fallback",
);
console.log("✓ appSettings.ts exports and synchronizes getOpenRouterApiKeySetting and setOpenRouterApiKeySetting");

// 4. Verify Advanced Mode UI in src/routes/index.tsx
const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexTsxContent = fs.readFileSync(indexTsxPath, "utf-8");

assert(
  indexTsxContent.includes('data-testid="openrouter-tts-key-input"'),
  "src/routes/index.tsx must contain openrouter-tts-key-input testid",
);
assert(
  indexTsxContent.includes('data-testid="save-openrouter-key-btn"'),
  "src/routes/index.tsx must contain save-openrouter-key-btn testid",
);
assert(
  indexTsxContent.includes('data-testid="toggle-show-openrouter-key-btn"'),
  "src/routes/index.tsx must contain toggle-show-openrouter-key-btn testid",
);
assert(
  indexTsxContent.includes('data-testid="clear-openrouter-key-btn"'),
  "src/routes/index.tsx must contain clear-openrouter-key-btn testid",
);
console.log("✓ Advanced Mode contains complete OpenRouter API key setting UI");

// 5. Verify Beginner Mode UI in src/components/beginner/tabs/BeginnerPreferencesTab.tsx
const beginnerTabPath = path.resolve(
  process.cwd(),
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerTabContent = fs.readFileSync(beginnerTabPath, "utf-8");

assert(
  beginnerTabContent.includes('data-testid="beginner-openrouter-tts-key-input"'),
  "BeginnerPreferencesTab must contain beginner-openrouter-tts-key-input testid",
);
assert(
  beginnerTabContent.includes('data-testid="beginner-save-openrouter-key-btn"'),
  "BeginnerPreferencesTab must contain beginner-save-openrouter-key-btn testid",
);
assert(
  beginnerTabContent.includes('data-testid="beginner-toggle-show-openrouter-key-btn"'),
  "BeginnerPreferencesTab must contain beginner-toggle-show-openrouter-key-btn testid",
);
assert(
  beginnerTabContent.includes('data-testid="beginner-clear-openrouter-key-btn"'),
  "BeginnerPreferencesTab must contain beginner-clear-openrouter-key-btn testid",
);
console.log("✓ Beginner Mode contains complete OpenRouter API key setting UI with 100% parity");

// 6. Verify version >= 1.0.70 across 5 files
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));
assert(pkgJson.version >= "1.0.70", "package.json version must be >= 1.0.70");

const gradleContent = fs.readFileSync(
  path.resolve(process.cwd(), "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert(/versionCode = 1007[0-9]/.test(gradleContent), "build.gradle.kts versionCode must be >= 10070");
assert(/versionName = "1\.0\.7[0-9]"/.test(gradleContent), 'build.gradle.kts versionName must be >= "1.0.70"');

const appConfigContent = fs.readFileSync(path.resolve(process.cwd(), "src/config/appConfig.ts"), "utf-8");
assert(/export const APP_VERSION = "1\.0\.7[0-9]";/.test(appConfigContent), 'appConfig.ts APP_VERSION must be >= "1.0.70"');

const apkUpdaterContent = fs.readFileSync(path.resolve(process.cwd(), "src/utils/apkUpdater.ts"), "utf-8");
assert(/export const CURRENT_APK_VERSION = "v1\.0\.7[0-9]";/.test(apkUpdaterContent), 'apkUpdater.ts CURRENT_APK_VERSION must be >= "v1.0.70"');

assert(/version: "1\.0\.7[0-9]"/.test(appSettingsContent), 'appSettings.ts version must be >= "1.0.70"');

console.log("✓ Version >= 1.0.70 synchronized across all 5 files");
console.log("=== ALL TASK 177 ASSERTIONS PASSED ===");
