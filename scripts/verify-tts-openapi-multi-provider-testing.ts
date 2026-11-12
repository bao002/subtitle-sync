/**
 * Verification Test: OpenAPI Multi-Provider Testing, Playback & Custom Auto Provider Selection
 *
 * Requirements (Task 381):
 * 1. Test All Providers: testAllOpenApiProviders() synthesizes audio across OpenAPI providers
 *    and returns structured test results with latency, audioUrl, and status.
 * 2. Playback: Provider audio clips can be directly tested and played without error.
 * 3. Custom Auto Selection: getCustomAutoProviders() and setCustomAutoProviders() allow
 *    users to select which providers to include when calling /api/public/auto (or fallback pool)
 *    and persist preferences cleanly.
 * 4. TtsServiceSettingsPanel includes the test button, results cards, and auto provider selector.
 */

import {
  SELECTABLE_AUTO_PROVIDERS,
  DEFAULT_CUSTOM_AUTO_PROVIDERS,
  getCustomAutoProviders,
  setCustomAutoProviders,
  testAllOpenApiProviders,
  buildLovableTtsRequestBody,
  type LovableTtsProvider,
  type ProviderTestResult,
} from "../src/lib/alternative-tts";

function assert(condition: unknown, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTest() {
  console.log("=== Running OpenAPI Multi-Provider Testing & Selection Verification ===");

  // 1. Verify selectable auto providers constants
  assert(Array.isArray(SELECTABLE_AUTO_PROVIDERS), "SELECTABLE_AUTO_PROVIDERS must be an array");
  assert(SELECTABLE_AUTO_PROVIDERS.includes("google"), "Must include google");
  assert(SELECTABLE_AUTO_PROVIDERS.includes("lovable"), "Must include lovable");
  assert(SELECTABLE_AUTO_PROVIDERS.includes("gemini"), "Must include gemini");
  assert(SELECTABLE_AUTO_PROVIDERS.includes("openrouter"), "Must include openrouter");
  console.log("✔ SELECTABLE_AUTO_PROVIDERS verified:", SELECTABLE_AUTO_PROVIDERS);

  // 2. Verify getCustomAutoProviders and setCustomAutoProviders
  const initial = getCustomAutoProviders();
  assert(Array.isArray(initial) && initial.length > 0, "Default custom auto providers must be non-empty");
  console.log("✔ Initial auto providers:", initial);

  const customSet: LovableTtsProvider[] = ["google", "gemini"];
  setCustomAutoProviders(customSet);
  const updated = getCustomAutoProviders();
  assert(updated.length === 2, "Updated custom auto providers count must match 2");
  assert(updated.includes("google") && updated.includes("gemini"), "Updated providers match set values");
  console.log("✔ Custom auto provider persistence verified:", updated);

  // Restore defaults
  setCustomAutoProviders(DEFAULT_CUSTOM_AUTO_PROVIDERS);
  assert(getCustomAutoProviders().length === DEFAULT_CUSTOM_AUTO_PROVIDERS.length, "Restored defaults");

  // 3. Verify buildLovableTtsRequestBody injects custom providers into options when provider is auto
  const autoBody = buildLovableTtsRequestBody("Test text", "en", { provider: "auto" });
  assert(autoBody.provider === "auto", "Provider is auto");
  assert(autoBody.options && typeof autoBody.options === "object", "Body options must be defined for auto");
  assert(
    Array.isArray((autoBody.options as any).providers),
    "autoBody.options.providers must be array of custom auto providers",
  );
  console.log("✔ Auto provider options injection verified:", (autoBody.options as any).providers);

  // 4. Verify testAllOpenApiProviders functionality with mock fetch
  const originalFetch = globalThis.fetch;
  const testedProviders: string[] = [];

  (globalThis as any).fetch = async (url: string | URL, init?: RequestInit) => {
    const urlStr = String(url);
    if (urlStr.includes("tts")) {
      let bodyObj: any = {};
      if (init?.body && typeof init.body === "string") {
        try {
          bodyObj = JSON.parse(init.body);
        } catch {
          // ignore
        }
      }
      const provider = bodyObj.provider || "google";
      testedProviders.push(provider);
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          mime: "audio/mpeg",
          audio: "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA",
        }),
        text: async () => JSON.stringify({ ok: true }),
      };
    }
    return originalFetch(url, init);
  };

  try {
    const progressUpdates: number[] = [];
    const testResults = await testAllOpenApiProviders(
      "Hello test",
      "en",
      ["google", "lovable", "gemini"],
      (completed, total, _current) => {
        progressUpdates.push(completed);
      },
    );

    assert(testResults.length === 3, "Expected 3 provider test results");
    assert(testResults.every((r) => r.ok), "All provider test results succeeded");
    assert(testResults.every((r) => Boolean(r.audioUrl)), "All provider test results returned audioUrl");
    assert(progressUpdates.length === 3, "Received 3 progress callbacks");
    console.log("✔ testAllOpenApiProviders executed successfully with 3 providers:", testResults.map(r => r.provider));
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log("=== All OpenAPI Multi-Provider Testing assertions PASSED ===");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
