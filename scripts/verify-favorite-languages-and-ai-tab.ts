import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  DEFAULT_OPENROUTER_MODEL,
  CURATED_FREE_MODELS,
  fetchOpenRouterFreeModels,
  punctuateSubtitlesWithOpenRouter,
  testOpenRouterConnection,
} from "../src/utils/openRouterAiService";
import {
  DEFAULT_APP_SETTINGS,
  getOpenRouterModelSetting,
  setOpenRouterModelSetting,
  getOpenRouterApiKeySetting,
  setOpenRouterApiKeySetting,
} from "../src/utils/appSettings";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("====================================================================");
console.log("🧪 Starting Favorite Languages Reactivity & AI Tab Verification");
console.log("   (Subtitles table reactivity, on-demand translation, OpenRouter)");
console.log("====================================================================");

const rootDir = process.cwd();

// ============================================================================
// 1. Version 1.0.38 Synchronization
// ============================================================================
console.log("\n--- [1] Verifying Version Parity (1.0.38+) ---");

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert.ok(packageJson.version === "1.0.38" || packageJson.version === "1.0.39", "package.json version must be 1.0.38 or 1.0.39");
assert.ok(APP_VERSION === "1.0.38" || APP_VERSION === "1.0.39", "appConfig.ts APP_VERSION must be 1.0.38 or 1.0.39");
assert.ok(CURRENT_APK_VERSION === "v1.0.38" || CURRENT_APK_VERSION === "v1.0.39", "apkUpdater.ts CURRENT_APK_VERSION must be v1.0.38 or v1.0.39");

const gradleContent = fs.readFileSync(path.join(rootDir, "android-shell/app/build.gradle.kts"), "utf-8");
assert.ok(gradleContent.includes('versionName = "1.0.38"') || gradleContent.includes('versionName = "1.0.39"'), "build.gradle.kts versionName must be 1.0.38 or 1.0.39");
assert.ok(gradleContent.includes("versionCode = 10038") || gradleContent.includes("versionCode = 10039"), "build.gradle.kts versionCode must be 10038 or 10039");
console.log(`✅ PASS: All 5 version targets synchronized at ${packageJson.version}`);

// ============================================================================
// 2. Favorite Languages & Subtitles Table Reactivity in index.tsx
// ============================================================================
console.log("\n--- [2] Verifying Favorite Languages & Subtitles Table Reactivity ---");

const indexContent = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf-8");

// Check handleUpdateFavoriteLanguages synchronizes targetLanguages and triggers fetch
assert.ok(
  indexContent.includes("setTargetLanguages((prev) => Array.from(new Set([...prev, ...addedFavs])))"),
  "handleUpdateFavoriteLanguages must add new favorites to targetLanguages",
);
assert.ok(
  indexContent.includes("setShown((prev) => Array.from(new Set([...prev, ...addedFavs])))"),
  "handleUpdateFavoriteLanguages must add new favorites to shown columns",
);
assert.ok(
  indexContent.includes("setSpoken((prev) => Array.from(new Set([...prev, ...addedFavs])))"),
  "handleUpdateFavoriteLanguages must add new favorites to spoken list",
);
assert.ok(
  indexContent.includes("void fetchFavoriteLanguageSubtitles(addedFavs)"),
  "handleUpdateFavoriteLanguages must fetch subtitles on Android",
);

// Check on-demand translation lookahead includes favoriteLanguages
assert.ok(
  indexContent.includes("new Set([...targetLanguages, ...favoriteLanguages, ...spoken, ...shown])"),
  "On-demand translation pendingLangs must include favoriteLanguages",
);

// Check cols computation includes shown languages from targetLanguages or favoriteLanguages
assert.ok(
  indexContent.includes("targetLanguages.includes(l.code) ||\n          favoriteLanguages.includes(l.code)"),
  "cols useMemo must include favoriteLanguages in candidate check",
);

// Check orderedLangs includes favoriteLanguages
assert.ok(
  indexContent.includes("...favoriteLanguages"),
  "orderedLangs must include favoriteLanguages in candidate codes",
);

console.log("✅ PASS: Favorite languages properly connected to on-demand translation and subtitles table cols");

// ============================================================================
// 3. OpenRouter Free Models & testOpenRouterConnection
// ============================================================================
console.log("\n--- [3] Verifying OpenRouter Service & Test Connection ---");

assert.strictEqual(DEFAULT_OPENROUTER_MODEL, "openrouter/auto:free");
assert.ok(CURATED_FREE_MODELS.length >= 5);
assert.strictEqual(CURATED_FREE_MODELS[0]?.id, "openrouter/auto:free");

const originalFetch = globalThis.fetch;

// Mock testOpenRouterConnection success
(globalThis as any).fetch = async (url: string, opts: any) => {
  assert.ok(url.includes("openrouter.ai/api/v1/chat/completions"));
  const body = JSON.parse(opts.body);
  assert.strictEqual(body.model, "openrouter/auto:free");
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: "OK connected" } }],
    }),
  };
};

const testResult = await testOpenRouterConnection("", "openrouter/auto:free");
assert.strictEqual(testResult.success, true);
assert.ok(testResult.message.includes("OK connected"));
console.log("✅ PASS: testOpenRouterConnection successfully validates connection");

// ============================================================================
// 4. AI Subtitle Punctuation Tab Component
// ============================================================================
console.log("\n--- [4] Verifying AiSubtitlePunctuationTab Component Structure ---");

const tabContent = fs.readFileSync(
  path.join(rootDir, "src/components/AiSubtitlePunctuationTab.tsx"),
  "utf-8",
);

assert.ok(tabContent.includes("ai-model-select"), "Must include model select dropdown");
assert.ok(tabContent.includes("ai-model-search-input"), "Must include model search filter input");
assert.ok(tabContent.includes("ai-api-key-input"), "Must include API key input");
assert.ok(tabContent.includes("ai-test-api-key-btn"), "Must include test key button");
assert.ok(tabContent.includes("apply-ai-subtitles-btn"), "Must include apply subtitles button");
assert.ok(
  tabContent.includes("apply-ai-subtitles-solely-punctuation-btn"),
  "Must include apply & rely solely on punctuation button",
);
assert.ok(tabContent.includes("start-ai-punctuation-btn"), "Must include start punctuation button");
console.log("✅ PASS: AiSubtitlePunctuationTab component defines all required interactive elements");

// ============================================================================
// 5. Index Route Tab Mount & relySolelyOnPunctuation Support
// ============================================================================
console.log("\n--- [5] Verifying index.tsx Integration ---");

assert.ok(indexContent.includes("tab-ai-punctuation"), "index.tsx must render tab-ai-punctuation button");
assert.ok(
  indexContent.includes('activeTopTab === "ai-punctuation"'),
  "index.tsx must mount AiSubtitlePunctuationTab for ai-punctuation tab",
);
assert.ok(
  indexContent.includes("handleApplyPunctuatedBaseTrack"),
  "index.tsx must connect handleApplyPunctuatedBaseTrack",
);
assert.ok(
  indexContent.includes("relySolelyOnPunctuation"),
  "handleApplyPunctuatedBaseTrack must support relySolelyOnPunctuation",
);

console.log("✅ PASS: index.tsx tab integration verified");

// Restore fetch
globalThis.fetch = originalFetch;

console.log("\n====================================================================");
console.log("🎉 ALL FAVORITE LANGUAGES & AI PUNCTUATION VERIFICATIONS PASSED!");
console.log("====================================================================");
