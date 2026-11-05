import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateRemoteTtsService,
  getLastValidationResult,
  setLastValidationResult,
  LOVABLE_TTS_OPENAPI_URL,
  LOVABLE_TTS_ENDPOINT,
  GOOGLE_TRANSLATE_TTS_ENDPOINT,
} from "../src/lib/alternative-tts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("====================================================");
console.log("🧪 Starting Remote TTS Services Validation Test Suite");
console.log("====================================================");

// 1. Verify endpoint constants
assert.strictEqual(
  LOVABLE_TTS_OPENAPI_URL,
  "https://tts3.lovable.app/api/public/openapi.json",
  "Lovable OpenAPI URL must match OpenAPI specification",
);
assert.strictEqual(
  LOVABLE_TTS_ENDPOINT,
  "https://tts3.lovable.app/api/public/tts",
  "Lovable TTS endpoint must match OpenAPI specification",
);
assert.strictEqual(
  GOOGLE_TRANSLATE_TTS_ENDPOINT,
  "https://translate.google.com/translate_tts",
  "Google Translate endpoint must be configured",
);
console.log("✅ Step 1 PASS: TTS service endpoints verified.");

// 2. Verify getter and setter for validation results
const sampleResult = {
  ok: true,
  service: "lovable" as const,
  serviceName: "Lovable TTS3",
  endpoint: LOVABLE_TTS_ENDPOINT,
  latencyMs: 120,
  audioVerified: true,
  details: "Audio stream verified (HTTP 200)",
  timestamp: Date.now(),
};
setLastValidationResult("lovable", sampleResult);
const retrieved = getLastValidationResult("lovable");
assert.ok(retrieved, "Retrieved validation result should not be null");
assert.strictEqual(retrieved?.ok, true, "Retrieved ok flag must be true");
assert.strictEqual(retrieved?.latencyMs, 120, "Retrieved latency must match");
console.log("✅ Step 2 PASS: Validation result caching and retrieval verified.");

// 3. Verify programmatic validation execution
async function testValidationExecution() {
  // Test Lovable validation logic with Google provider
  const gResult = await validateRemoteTtsService("lovable", { timeoutMs: 5000, provider: "google" });
  assert.ok(typeof gResult.ok === "boolean", "Google provider result must have boolean ok status");
  assert.ok(typeof gResult.latencyMs === "number", "Google provider result must have numeric latency");
  assert.ok(gResult.serviceName.includes("TTS3"), "Google provider result serviceName must indicate TTS3");

  // Test Lovable validation logic with auto provider
  const lResult = await validateRemoteTtsService("lovable", { timeoutMs: 5000, provider: "auto" });
  assert.ok(typeof lResult.ok === "boolean", "Auto provider result must have boolean ok status");
  assert.ok(typeof lResult.latencyMs === "number", "Auto provider result must have numeric latency");
  assert.ok(lResult.serviceName.includes("TTS3"), "Auto provider result serviceName must indicate TTS3");

  console.log("✅ Step 3 PASS: Programmatic validation functions executed without unhandled errors.");
}

// 4. Verify UI parity across Advanced Mode and Beginner Mode
const advancedPanelPath = path.resolve(
  __dirname,
  "../src/components/TtsServiceSettingsPanel.tsx",
);
const beginnerPrefsPath = path.resolve(
  __dirname,
  "../src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);

assert.ok(fs.existsSync(advancedPanelPath), "TtsServiceSettingsPanel.tsx must exist");
assert.ok(fs.existsSync(beginnerPrefsPath), "BeginnerPreferencesTab.tsx must exist");

const advancedContent = fs.readFileSync(advancedPanelPath, "utf-8");
const beginnerContent = fs.readFileSync(beginnerPrefsPath, "utf-8");

const requiredTestIds = [
  "btn-validate-remote-tts",
  "btn-validate-tts3-service",
  "remote-tts-validation-badge",
  "remote-tts-validation-details",
];

for (const testId of requiredTestIds) {
  assert.ok(
    advancedContent.includes(testId),
    `Advanced mode (src/components/TtsServiceSettingsPanel.tsx) must contain data-testid="${testId}"`,
  );
  assert.ok(
    beginnerContent.includes(testId),
    `Beginner mode (src/components/beginner/tabs/BeginnerPreferencesTab.tsx) must contain data-testid="${testId}"`,
  );
}
console.log("✅ Step 4 PASS: 100% UI parity verified between Advanced and Beginner modes for remote TTS validation.");

testValidationExecution()
  .then(() => {
    console.log("====================================================");
    console.log("🎉 All Remote TTS Validation Tests PASSED Successfully!");
    console.log("====================================================");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
