import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_FREE_MODELS_FIND_URL,
  fetchOpenRouterFreeModels,
  parseOpenRouterFreeModelsPayload,
  resetOpenRouterModelsCache,
} from "../src/utils/openRouterAiService";
import { getOpenRouterModelSetting } from "../src/utils/appSettings";

console.log("=========================================================================");
console.log("🧪 Verifying Task 418: OpenRouter Free Models Fetch, Default & Dropdown");
console.log("=========================================================================");

// 1. Validate exact OpenRouter frontend free-models endpoint & default model constant
assert.strictEqual(
  OPENROUTER_FREE_MODELS_FIND_URL,
  "https://openrouter.ai/api/frontend/v1/models/find?active=true&fmt=cards&max_price=0",
  "Must use exact OpenRouter frontend free models find URL",
);
assert.strictEqual(
  DEFAULT_OPENROUTER_MODEL,
  "openrouter/auto:free",
  "Default OpenRouter model must strictly be openrouter/auto:free",
);
assert.strictEqual(
  getOpenRouterModelSetting(),
  "openrouter/auto:free",
  "Default model getter must return openrouter/auto:free",
);
console.log("✅ PASS: Exact free-models URL and openrouter/auto:free default verified.");

// 2. Validate frontend cards schema parsing (`data.models`, `has_text_output`, `endpoint.model_variant_slug`)
const parsedCards = parseOpenRouterFreeModelsPayload({
  data: {
    models: [
      {
        slug: "recraft/recraft-v4.1-flash-v2",
        name: "Recraft Image Only",
        has_text_output: false,
        output_modalities: ["image"],
        endpoint: {
          model_variant_slug: "recraft/recraft-v4.1-flash-v2:free",
          is_free: true,
          pricing: { prompt: "0", completion: "0" },
        },
      },
      {
        slug: "inclusionai/ling-3.2-flash",
        name: "inclusionAI: Ling 3.2 Flash (free)",
        has_text_output: true,
        output_modalities: ["text"],
        context_length: 131072,
        endpoint: {
          model_variant_slug: "inclusionai/ling-3.2-flash:free",
          is_free: true,
          pricing: { prompt: "0", completion: "0" },
        },
      },
      {
        slug: "openrouter/auto",
        name: "OpenRouter Auto (Free)",
        has_text_output: true,
        endpoint: {
          model_variant_slug: "openrouter/auto:free",
          is_free: true,
          pricing: { prompt: "0", completion: "0" },
        },
      },
    ],
  },
});

assert.strictEqual(
  parsedCards[0]?.id,
  "openrouter/auto:free",
  "Parsed free models list must always pin openrouter/auto:free first",
);
assert.ok(
  parsedCards.some((m) => m.id === "inclusionai/ling-3.2-flash:free"),
  "Frontend card model must use endpoint.model_variant_slug",
);
assert.ok(
  !parsedCards.some((m) => m.id.includes("recraft")),
  "Non-text-output image models (has_text_output: false) must be filtered out",
);
console.log("✅ PASS: Frontend cards schema parsing & text-output filtering verified.");

// 3. Validate fetchOpenRouterFreeModels calls frontend/v1/models/find with Authorization Bearer <key>
const originalFetch = globalThis.fetch;
let capturedUrl = "";
let capturedAuthHeader = "";

resetOpenRouterModelsCache();
(globalThis as unknown as { fetch: typeof fetch }).fetch = (async (
  url: RequestInfo | URL,
  init?: RequestInit,
) => {
  capturedUrl = String(url);
  const hdrs = (init?.headers || {}) as Record<string, string>;
  capturedAuthHeader = hdrs["Authorization"] || hdrs["authorization"] || "";
  return {
    ok: true,
    json: async () => ({
      data: {
        models: [
          {
            slug: "qwen/qwen3-free-card",
            name: "Qwen 3 Free Card",
            has_text_output: true,
            endpoint: {
              model_variant_slug: "qwen/qwen3-free-card:free",
              is_free: true,
              pricing: { prompt: "0", completion: "0" },
            },
          },
        ],
      },
    }),
  } as Response;
}) as typeof fetch;

const liveMockModels = await fetchOpenRouterFreeModels("sk-or-v1-test-user-key-418");
globalThis.fetch = originalFetch;
resetOpenRouterModelsCache();

assert.strictEqual(
  capturedUrl,
  "https://openrouter.ai/api/frontend/v1/models/find?active=true&fmt=cards&max_price=0",
  "fetchOpenRouterFreeModels must call frontend/v1/models/find endpoint",
);
assert.strictEqual(
  capturedAuthHeader,
  "Bearer sk-or-v1-test-user-key-418",
  "fetchOpenRouterFreeModels must forward user OpenRouter API key as Bearer token",
);
assert.strictEqual(liveMockModels[0]?.id, "openrouter/auto:free");
assert.ok(liveMockModels.some((m) => m.id === "qwen/qwen3-free-card:free"));
console.log("✅ PASS: OpenRouter API key Bearer auth + dynamic fetch verified.");

// 4. Verify OpenRouterSettingsPanel renders dropdown and triggers fetch on component init
const root = process.cwd();
const panelPath = path.join(root, "src/components/OpenRouterSettingsPanel.tsx");
const panelContent = fs.readFileSync(panelPath, "utf8");

for (const tid of [
  "openrouter-free-models-section",
  "openrouter-free-models-dropdown",
  "openrouter-refresh-models-btn",
  "openrouter-models-count-badge",
]) {
  assert.ok(
    panelContent.includes(`data-testid="${tid}"`),
    `OpenRouterSettingsPanel must expose data-testid="${tid}"`,
  );
}
assert.ok(
  panelContent.includes("useEffect") && panelContent.includes("loadFreeModels(savedEffectiveKey"),
  "OpenRouterSettingsPanel must fetch free models automatically on component init",
);
assert.ok(
  panelContent.includes("setOpenRouterModelSetting") &&
    panelContent.includes("DEFAULT_OPENROUTER_MODEL"),
  "OpenRouterSettingsPanel must persist model selection and default to openrouter/auto:free",
);
console.log("✅ PASS: OpenRouterSettingsPanel init auto-fetch & dropdown wiring verified.");

console.log("=========================================================================");
console.log("🎉 Task 418 OpenRouter Free Models Dropdown Verification PASSED!");
console.log("=========================================================================");
