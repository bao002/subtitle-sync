/**
 * Verification Script: AI Subtitle Punctuation Pipeline & Solely-Punctuation Workflow
 * Validates:
 * 1. Semantic version 1.0.39 synchronization across all 5 targets.
 * 2. OpenRouter punctuation style prompts ("conversational", "formal", "short_sentences").
 * 3. Quick-select free model presets (`getCuratedFreeModelPresets`).
 * 4. Multi-batch sliding-window chunking, progress tracking, and latency measurements.
 * 5. AbortSignal cancellation in `punctuateSubtitlesWithOpenRouter`.
 * 6. App settings persistence for punctuation styles.
 * 7. UI component structure and test IDs in `AiSubtitlePunctuationTab.tsx` and `src/routes/index.tsx`.
 */

import fs from "fs";
import path from "path";
import assert from "assert";
import {
  buildPunctuationPrompt,
  parsePunctuationOutput,
  punctuateSubtitlesWithOpenRouter,
  getCuratedFreeModelPresets,
  DEFAULT_OPENROUTER_MODEL,
} from "../src/utils/openRouterAiService";
import {
  getOpenRouterPunctuationStyleSetting,
  setOpenRouterPunctuationStyleSetting,
} from "../src/utils/appSettings";

const ROOT_DIR = process.cwd();

function log(msg: string) {
  console.log(`[TEST-AI-PUNCT-PIPELINE] ${msg}`);
}

async function runTests() {
  console.log("====================================================================");
  console.log("🧪 Starting AI Punctuation Pipeline & Workflow Verification (v1.0.39)");
  console.log("====================================================================");

  // --- [1] Verify Version Parity (1.0.39+ / 10039+) ---
  console.log("\n--- [1] Verifying Version Parity (1.0.39+ / 10039+) ---");
  const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf8"));
  assert(pkgJson.version >= "1.0.39", "package.json version should be 1.0.39+");

  const buildGradle = fs.readFileSync(
    path.join(ROOT_DIR, "android-shell/app/build.gradle.kts"),
    "utf8",
  );
  assert(
    buildGradle.includes(`"${pkgJson.version}"`),
    `build.gradle.kts should reference ${pkgJson.version}`,
  );
  assert(buildGradle.includes("versionCode = "), "build.gradle.kts should reference versionCode");

  const appConfig = fs.readFileSync(path.join(ROOT_DIR, "src/config/appConfig.ts"), "utf8");
  assert(
    appConfig.includes(`APP_VERSION = "${pkgJson.version}"`),
    `appConfig.ts should declare APP_VERSION ${pkgJson.version}`,
  );

  const apkUpdater = fs.readFileSync(path.join(ROOT_DIR, "src/utils/apkUpdater.ts"), "utf8");
  assert(
    apkUpdater.includes(`CURRENT_APK_VERSION = "v${pkgJson.version}"`),
    `apkUpdater.ts should declare v${pkgJson.version}`,
  );

  const appSettings = fs.readFileSync(path.join(ROOT_DIR, "src/utils/appSettings.ts"), "utf8");
  assert(
    appSettings.includes(`version: "${pkgJson.version}"`),
    `appSettings.ts snapshot should declare version ${pkgJson.version}`,
  );
  log(`✅ PASS: All 5 version targets synchronized at ${pkgJson.version}`);

  // --- [2] Verify Model Presets & Punctuation Style Prompts ---
  console.log("\n--- [2] Verifying Model Presets & Punctuation Styles ---");
  const presets = getCuratedFreeModelPresets();
  assert(
    Array.isArray(presets) && presets.length >= 4,
    "Should provide at least 4 curated free presets",
  );
  assert(
    presets.some((p) => p.id === DEFAULT_OPENROUTER_MODEL),
    "Presets must include default model router",
  );

  const sampleLines = [
    { index: 0, text: "hello world welcome to the video" },
    { index: 1, text: "today we will learn something new" },
  ];

  const promptConv = buildPunctuationPrompt(sampleLines, "conversational");
  assert(
    promptConv.includes("conversational"),
    "Conversational prompt should mention conversational style",
  );

  const promptFormal = buildPunctuationPrompt(sampleLines, "formal");
  assert(promptFormal.includes("formal"), "Formal prompt should mention formal style");

  const promptShort = buildPunctuationPrompt(sampleLines, "short_sentences");
  assert(
    promptShort.includes("short sentences"),
    "Short sentences prompt should mention short sentences",
  );
  log("✅ PASS: Punctuation style prompts and preset models verified");

  // --- [3] Verify Multi-Batch Chunking & Progress Tracking ---
  console.log("\n--- [3] Verifying Multi-Batch Chunking & Execution ---");
  const mockCues = Array.from({ length: 25 }, (_, i) => ({
    start: i * 2000,
    end: (i + 1) * 2000,
    text: `cue number ${i + 1} subtitle text without punctuation`,
  }));

  const originalFetch = global.fetch;
  const progressCalls: Array<{ percent: number; msg: string }> = [];

  try {
    global.fetch = async (url: any, init: any) => {
      const body = JSON.parse(init?.body || "{}");
      const userMsg = body.messages?.find((m: any) => m.role === "user")?.content || "";
      const lines = userMsg.split("\n").filter((l: string) => /^\d+:/.test(l));
      const punctuatedLines = lines.map((l: string) => {
        const parts = l.split(":");
        const idx = parts[0];
        const text = parts.slice(1).join(":").trim();
        return `${idx}: ${text.charAt(0).toUpperCase() + text.slice(1)}.`;
      });

      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: punctuatedLines.join("\n"),
              },
            },
          ],
        }),
      } as any;
    };

    const result = await punctuateSubtitlesWithOpenRouter({
      cues: mockCues,
      batchSize: 10, // 25 cues / 10 = 3 batches
      style: "conversational",
      onProgress: (percent, msg) => {
        progressCalls.push({ percent, msg });
      },
    });

    assert.strictEqual(result.segments.length, 25, "All 25 segments should be returned");
    assert.strictEqual(result.stats.batchesCount, 3, "Should have executed in 3 batches");
    assert(result.stats.totalLatencyMs >= 0, "Latency should be non-negative");
    assert(result.stats.punctuationMarksAdded > 0, "Punctuation marks should have been added");
    assert(progressCalls.length >= 3, "Progress callback should be invoked across batches");
    log("✅ PASS: Multi-batch chunking, progress tracking, and latency metrics verified");
  } finally {
    global.fetch = originalFetch;
  }

  // --- [4] Verify AbortSignal Cancellation ---
  console.log("\n--- [4] Verifying AbortSignal Cancellation ---");
  const controller = new AbortController();
  controller.abort();

  let abortCaught = false;
  try {
    await punctuateSubtitlesWithOpenRouter({
      cues: mockCues,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err.message.includes("cancelled")) {
      abortCaught = true;
    }
  }
  assert(abortCaught, "punctuateSubtitlesWithOpenRouter should reject when signal is aborted");
  log("✅ PASS: AbortSignal cancellation cleanly handled");

  // --- [5] Verify App Settings Persistence ---
  console.log("\n--- [5] Verifying Punctuation Style Settings Persistence ---");
  const mockStorage = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, val: string) => mockStorage.set(key, val),
      removeItem: (key: string) => mockStorage.delete(key),
    },
  };

  setOpenRouterPunctuationStyleSetting("formal");
  assert.strictEqual(
    getOpenRouterPunctuationStyleSetting(),
    "formal",
    "Should persist formal style",
  );
  setOpenRouterPunctuationStyleSetting("short_sentences");
  assert.strictEqual(
    getOpenRouterPunctuationStyleSetting(),
    "short_sentences",
    "Should persist short_sentences style",
  );
  setOpenRouterPunctuationStyleSetting("conversational");
  assert.strictEqual(
    getOpenRouterPunctuationStyleSetting(),
    "conversational",
    "Should persist conversational style",
  );
  log("✅ PASS: Punctuation style settings persistence verified");

  // --- [6] Verify UI Component Test IDs & Route Integration ---
  console.log("\n--- [6] Verifying UI Component Test IDs & Route Integration ---");
  const tabSource = fs.readFileSync(
    path.join(ROOT_DIR, "src/components/AiSubtitlePunctuationTab.tsx"),
    "utf8",
  );
  assert(
    tabSource.includes('data-testid="ai-model-presets-container"'),
    "Tab must include presets container",
  );
  assert(
    tabSource.includes('data-testid="ai-cancel-processing-btn"'),
    "Tab must include cancel processing button",
  );
  assert(tabSource.includes('data-testid="ai-stats-latency"'), "Tab must include latency display");
  assert(
    tabSource.includes('data-testid="ai-solely-punctuation-badge"'),
    "Tab must include solely punctuation badge",
  );
  assert(
    tabSource.includes('data-testid="ai-revert-criteria-btn"'),
    "Tab must include revert criteria button",
  );
  assert(
    tabSource.includes('data-testid="ai-punctuation-style-selector"'),
    "Tab must include style selector",
  );

  const indexSource = fs.readFileSync(path.join(ROOT_DIR, "src/routes/index.tsx"), "utf8");
  assert(
    indexSource.includes("isSolelyPunctuationActive="),
    "index.tsx must pass isSolelyPunctuationActive",
  );
  assert(indexSource.includes("onRevertCriteria="), "index.tsx must pass onRevertCriteria");
  log("✅ PASS: UI components and route integration verified");

  console.log("\n====================================================================");
  console.log("🎉 ALL AI PUNCTUATION PIPELINE VERIFICATIONS PASSED!");
  console.log("====================================================================");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
