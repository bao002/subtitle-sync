import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  DEFAULT_OPENROUTER_MODEL,
  CURATED_FREE_MODELS,
  fetchOpenRouterFreeModels,
  buildPunctuationPrompt,
  parsePunctuationOutput,
  punctuateSubtitlesWithOpenRouter,
} from "../src/utils/openRouterAiService";
import {
  DEFAULT_APP_SETTINGS,
  getOpenRouterModelSetting,
  setOpenRouterModelSetting,
  getOpenRouterApiKeySetting,
  setOpenRouterApiKeySetting,
  getAiPunctuateAutoApplySetting,
  setAiPunctuateAutoApplySetting,
  OPENROUTER_MODEL_STORAGE_KEY,
  OPENROUTER_API_KEY_STORAGE_KEY,
} from "../src/utils/appSettings";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("====================================================");
console.log("🧪 Starting AI Subtitle Punctuation Tab Verification");
console.log("   (OpenRouter free models & subtitle punctuation restoration)");
console.log("====================================================");

const rootDir = process.cwd();

// ============================================================================
// 1. OpenRouter Models & Free Catalog
// ============================================================================
console.log("\n--- [1] Testing OpenRouter Free Models & Defaults ---");

assert.strictEqual(
  DEFAULT_OPENROUTER_MODEL,
  "openrouter/auto:free",
  "Default OpenRouter model must be openrouter/auto:free",
);
assert.ok(
  CURATED_FREE_MODELS.length >= 5,
  "Curated free models list must have at least 5 fallback models",
);
assert.strictEqual(
  CURATED_FREE_MODELS[0]?.id,
  "openrouter/auto:free",
  "Curated free models must have auto:free at index 0",
);
assert.ok(
  CURATED_FREE_MODELS.some((m) => m.id === "openrouter/free"),
  "Curated models must include openrouter/free",
);
assert.ok(
  CURATED_FREE_MODELS.some((m) => m.id.includes("meta-llama")),
  "Curated models must include Meta Llama free model",
);
assert.ok(
  CURATED_FREE_MODELS.some((m) => m.id.includes("google")),
  "Curated models must include Google Gemma free model",
);
console.log("✅ PASS: Curated free models list and default openrouter/auto:free validated");

// Test fetchOpenRouterFreeModels dynamic response parsing & filtering
const originalFetch = globalThis.fetch;

(globalThis as any).fetch = async (url: string) => {
  assert.ok(url.includes("openrouter.ai/api/v1/models"), "Must fetch OpenRouter models endpoint");
  return {
    ok: true,
    json: async () => ({
      data: [
        { id: "paid/super-model", pricing: { prompt: "0.01", completion: "0.03" } },
        {
          id: "free/test-free-model:free",
          name: "Free Test Model",
          pricing: { prompt: "0", completion: "0" },
        },
        { id: "zero/cost-model", name: "Zero Cost Model", pricing: { prompt: 0, completion: 0 } },
      ],
    }),
  };
};

const fetchedModels = await fetchOpenRouterFreeModels("mock-key");
assert.ok(
  fetchedModels.some((m) => m.id === "openrouter/auto:free"),
  "Free models must include openrouter/auto:free",
);
assert.ok(
  fetchedModels.some((m) => m.id === "free/test-free-model:free"),
  "Free models must filter :free tags",
);
assert.ok(
  fetchedModels.some((m) => m.id === "zero/cost-model"),
  "Free models must include zero pricing models",
);
assert.ok(
  !fetchedModels.some((m) => m.id === "paid/super-model"),
  "Free models must exclude paid models",
);
console.log(
  "✅ PASS: fetchOpenRouterFreeModels correctly filters free models and retains default router",
);

globalThis.fetch = originalFetch;

// ============================================================================
// 2. Prompt Construction & Output Parser
// ============================================================================
console.log("\n--- [2] Testing Punctuation Prompt Building & Output Parsing ---");

const sampleLines = [
  { index: 0, text: "hello everyone welcome to the video" },
  { index: 1, text: "today we are learning how to speak english" },
  { index: 2, text: "are you ready let us get started" },
];

const prompt = buildPunctuationPrompt(sampleLines);
assert.ok(
  prompt.includes("0: hello everyone welcome to the video"),
  "Prompt must include indexed lines",
);
assert.ok(prompt.includes("CRITICAL RULES"), "Prompt must specify punctuation preservation rules");
console.log("✅ PASS: buildPunctuationPrompt formats input lines cleanly");

const rawAiOutput = `0: Hello everyone, welcome to the video.
1: Today, we are learning how to speak English.
2: Are you ready? Let us get started!`;

const parsedMap = parsePunctuationOutput(rawAiOutput, sampleLines.length);
assert.strictEqual(parsedMap.get(0), "Hello everyone, welcome to the video.");
assert.strictEqual(parsedMap.get(1), "Today, we are learning how to speak English.");
assert.strictEqual(parsedMap.get(2), "Are you ready? Let us get started!");
console.log("✅ PASS: parsePunctuationOutput correctly extracts punctuated lines by index");

// ============================================================================
// 3. OpenRouter Subtitle Punctuation Execution Pipeline
// ============================================================================
console.log("\n--- [3] Testing OpenRouter Subtitle Punctuation Pipeline ---");

let calledModel = "";
let calledHeaders: Record<string, string> = {};

(globalThis as any).fetch = async (url: string, opts: any) => {
  const body = JSON.parse(opts.body);
  calledModel = body.model;
  calledHeaders = opts.headers;

  return {
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: `0: Hello everyone, welcome to the video.
1: Today, we are learning how to speak English.
2: Are you ready? Let us get started!`,
          },
        },
      ],
    }),
  };
};

const inputCues = [
  { start: 0, end: 3200, text: "hello everyone welcome to the video" },
  { start: 3200, end: 6500, text: "today we are learning how to speak english" },
  { start: 6500, end: 9800, text: "are you ready let us get started" },
];

const pipelineResult = await punctuateSubtitlesWithOpenRouter({
  cues: inputCues,
  model: "openrouter/auto:free",
  apiKey: "test-openrouter-key",
});

assert.strictEqual(calledModel, "openrouter/auto:free", "Must invoke specified OpenRouter model");
assert.strictEqual(
  calledHeaders["Authorization"],
  "Bearer test-openrouter-key",
  "Must send Authorization bearer token",
);
assert.strictEqual(pipelineResult.segments.length, 3, "Must return 3 segments");
assert.strictEqual(
  pipelineResult.segments[0]?.punctuatedText,
  "Hello everyone, welcome to the video.",
);
assert.strictEqual(pipelineResult.segments[0]?.start, 0, "Must preserve segment start timing");
assert.strictEqual(pipelineResult.segments[0]?.end, 3200, "Must preserve segment end timing");
assert.ok(pipelineResult.stats.punctuationMarksAdded > 0, "Must detect added punctuation marks");
assert.ok(pipelineResult.stats.capitalizedWordsCount > 0, "Must detect capitalized words");
assert.ok(
  Array.isArray(pipelineResult.punctuatedJson3.events),
  "Must generate valid Json3 events structure",
);
assert.strictEqual(
  pipelineResult.punctuatedJson3.events?.[0]?.segs?.[0]?.utf8,
  "Hello everyone, welcome to the video.",
);

console.log(
  "✅ PASS: punctuateSubtitlesWithOpenRouter pipeline executes, parses, and produces Json3 events",
);

globalThis.fetch = originalFetch;

// ============================================================================
// 4. App Settings Persistence
// ============================================================================
console.log("\n--- [4] Testing OpenRouter App Settings Persistence ---");

assert.strictEqual(
  DEFAULT_APP_SETTINGS.openRouterModel,
  "openrouter/auto:free",
  "DEFAULT_APP_SETTINGS.openRouterModel must default to openrouter/auto:free",
);

const mockStorage = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, val: string) => mockStorage.set(key, val),
    removeItem: (key: string) => mockStorage.delete(key),
  },
};

assert.strictEqual(
  getOpenRouterModelSetting(),
  "openrouter/auto:free",
  "Default getter must return openrouter/auto:free",
);
setOpenRouterModelSetting("meta-llama/llama-3.3-70b-instruct:free");
assert.strictEqual(
  mockStorage.get(OPENROUTER_MODEL_STORAGE_KEY),
  "meta-llama/llama-3.3-70b-instruct:free",
);
assert.strictEqual(getOpenRouterModelSetting(), "meta-llama/llama-3.3-70b-instruct:free");

assert.strictEqual(getOpenRouterApiKeySetting(), "");
setOpenRouterApiKeySetting("sk-or-test-key-123");
assert.strictEqual(mockStorage.get(OPENROUTER_API_KEY_STORAGE_KEY), "sk-or-test-key-123");
assert.strictEqual(getOpenRouterApiKeySetting(), "sk-or-test-key-123");

assert.strictEqual(getAiPunctuateAutoApplySetting(), false);
setAiPunctuateAutoApplySetting(true);
assert.strictEqual(getAiPunctuateAutoApplySetting(), true);

console.log("✅ PASS: OpenRouter settings getters/setters correctly persist configurations");

// ============================================================================
// 5. Component & index.tsx Integration
// ============================================================================
console.log("\n--- [5] Verifying Component Structure & Route Integration ---");

const componentPath = path.join(rootDir, "src/components/AiSubtitlePunctuationTab.tsx");
assert.ok(fs.existsSync(componentPath), "src/components/AiSubtitlePunctuationTab.tsx must exist");
const componentContent = fs.readFileSync(componentPath, "utf-8");

assert.ok(
  componentContent.includes("ai-subtitle-punctuation-panel"),
  "Component must define panel testid",
);
assert.ok(componentContent.includes("ai-model-select"), "Component must define ai-model-select");
assert.ok(
  componentContent.includes("ai-model-search-input"),
  "Component must define ai-model-search-input",
);
assert.ok(
  componentContent.includes("ai-custom-model-input"),
  "Component must define ai-custom-model-input",
);
assert.ok(componentContent.includes("ai-api-key-input"), "Component must define ai-api-key-input");
assert.ok(
  componentContent.includes("start-ai-punctuation-btn"),
  "Component must define start-ai-punctuation-btn",
);
assert.ok(
  componentContent.includes("apply-ai-subtitles-btn"),
  "Component must define apply-ai-subtitles-btn",
);
assert.ok(
  componentContent.includes("ai-view-side-by-side-btn"),
  "Component must define ai-view-side-by-side-btn",
);
assert.ok(componentContent.includes("ai-view-diff-btn"), "Component must define ai-view-diff-btn");
assert.ok(
  componentContent.includes("ai-refresh-models-btn"),
  "Component must define ai-refresh-models-btn",
);
console.log(
  "✅ PASS: AiSubtitlePunctuationTab component adheres to full interactive specification",
);

const indexContent = fs.readFileSync(path.join(rootDir, "src/routes/index.tsx"), "utf-8");
assert.ok(
  indexContent.includes("AiSubtitlePunctuationTab"),
  "index.tsx must import AiSubtitlePunctuationTab",
);
assert.ok(
  indexContent.includes("tab-ai-punctuation"),
  "index.tsx must render tab-ai-punctuation button",
);
assert.ok(
  indexContent.includes('activeTopTab === "ai-punctuation"'),
  "index.tsx must conditionally mount AiSubtitlePunctuationTab",
);
assert.ok(
  indexContent.includes("handleApplyPunctuatedBaseTrack"),
  "index.tsx must provide handleApplyPunctuatedBaseTrack callback",
);
console.log("✅ PASS: index.tsx seamlessly mounts and connects AI Subtitle Punctuation Tab");

// ============================================================================
// 6. Version 1.0.37 Synchronization
// ============================================================================
console.log("\n--- [6] Verifying Version Parity (1.0.38+) ---");

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
assert.ok(packageJson.version >= "1.0.38", "package.json version must be 1.0.38+");
assert.strictEqual(
  APP_VERSION,
  packageJson.version,
  "appConfig.ts APP_VERSION must match package.json",
);
assert.strictEqual(
  CURRENT_APK_VERSION,
  `v${packageJson.version}`,
  "apkUpdater.ts CURRENT_APK_VERSION must match package.json",
);

const gradleContent = fs.readFileSync(
  path.join(rootDir, "android-shell/app/build.gradle.kts"),
  "utf-8",
);
assert.ok(
  gradleContent.includes(`versionName = "${packageJson.version}"`),
  "build.gradle.kts versionName must match package.json",
);
assert.ok(gradleContent.includes("versionCode = "), "build.gradle.kts versionCode must be present");
console.log(`✅ PASS: All 5 version targets synchronized at ${packageJson.version}`);

console.log("\n====================================================");
console.log("🎉 ALL AI SUBTITLE PUNCTUATION VERIFICATIONS PASSED!");
console.log("====================================================");
