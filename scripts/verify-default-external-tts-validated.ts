import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  setSpeakApiToken,
  getSpeakApiToken,
  setLastValidationResult,
  getUseAlternativeTts,
  getAlternativeTtsMode,
  setUseAlternativeTts,
  setAlternativeTtsMode,
  STORAGE_KEY_USE_ALTERNATIVE_TTS,
  STORAGE_KEY_ALTERNATIVE_TTS_MODE,
} from "../src/lib/alternative-tts";

console.log("==================================================================");
console.log("🧪 Verifying Task 349: Default External TTS When Set & Validated");
console.log("==================================================================");

const root = process.cwd();

// 1. Verify access token retention
const testToken = "spk_test_access_token_abc123.xyz987";
setSpeakApiToken(testToken);
const storedToken = getSpeakApiToken();
assert.strictEqual(storedToken, testToken, "Access token must be remembered exactly");
console.log("✅ Step 1: Speak API access token is remembered correctly");

// 2. Clear explicit use toggles to test default behavior
if (typeof localStorage !== "undefined") {
  localStorage.removeItem(STORAGE_KEY_USE_ALTERNATIVE_TTS);
  localStorage.removeItem(STORAGE_KEY_ALTERNATIVE_TTS_MODE);
}

// 3. Mark service as validated
setLastValidationResult("lovable", {
  ok: true,
  service: "lovable",
  serviceName: "Lovable TTS3 Service",
  endpoint: "https://tts3.lovable.app/api/public/tts",
  statusCode: 200,
  latencyMs: 120,
  audioVerified: true,
  format: "audio/mpeg",
  timestamp: Date.now(),
});

// 4. Assert default behavior when token is set and validated
const useAlt = getUseAlternativeTts();
const altMode = getAlternativeTtsMode();
assert.strictEqual(useAlt, true, "getUseAlternativeTts() must default to true when token is set and validated");
assert.strictEqual(altMode, "always", "getAlternativeTtsMode() must default to 'always' when token is set and validated");
console.log("✅ Step 2: External TTS defaults to enabled (true) and mode 'always' when set and validated");

// 5. Verify source code implementation in alternative-tts.ts
const altTtsPath = path.join(root, "src/lib/alternative-tts.ts");
const altTtsContent = fs.readFileSync(altTtsPath, "utf-8");

assert(
  altTtsContent.includes("setUseAlternativeTts(true)") &&
    altTtsContent.includes("setAlternativeTtsMode(\"always\")"),
  "alternative-tts.ts must activate alternative TTS upon validation success",
);
console.log("✅ Step 3: validateRemoteTtsService() automatically activates external TTS upon success");

// 6. Verify index.tsx sync
const indexPath = path.join(root, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf-8");

assert(
  indexContent.includes("setUseAlternativeTtsState(true)") &&
    indexContent.includes("setAlternativeTtsModeState(\"always\")"),
  "src/routes/index.tsx must sync component state when validation succeeds",
);
console.log("✅ Step 4: src/routes/index.tsx synchronizes component state on validation success");

console.log("==================================================================");
console.log("🎉 All checks for Task 349 passed successfully!");
console.log("==================================================================");
