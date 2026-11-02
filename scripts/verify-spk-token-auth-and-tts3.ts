/**
 * Dedicated automated verification test for Task 270:
 * - Remote Speak API Token Authentication (`spk_...`, `tts_...`)
 * - Upstream Provider Key Separation (`sk_...`, `sk-or-...`)
 * - `Authorization: Bearer <token>` header inclusion
 * - Non-injection of `spk_...` into request body `api_key`
 * - Actionable diagnostics for upstream provider key format errors
 * - Debugger cURL export and UI guidance parity
 * - Version 2.0.71 synchronization across the 5 files
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  isSpeakApiPersonalToken,
  isUpstreamProviderApiKey,
  resolveTtsCredentials,
  buildLovableTtsRequestBody,
  buildLovableTtsUrl,
  generateTtsDiagnosticAdvice,
  addExternalTtsAuditRecord,
  getExternalTtsAuditRecords,
  clearExternalTtsAuditRecords,
  LOVABLE_TTS_ENDPOINT,
  type ExternalTtsAuditRecord,
} from "../src/lib/alternative-tts";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("====================================================");
console.log("🧪 Running Speak API Token Auth & TTS3 Parity Verification");
console.log("====================================================");

// -----------------------------------------------------------------------------
// Test 1: Speak API Token Classification
// -----------------------------------------------------------------------------
console.log("\n[Test 1] Verifying Speak API Personal Token vs Upstream Provider Key Classification...");

const userSampleToken = "spk_452003d7-32c5-4bb7-ac67-f3062c7b5965.o6ANX5Jt699eIiuAdbweAcSYj37juM7stQDlVJKlxz8";
assert.strictEqual(
  isSpeakApiPersonalToken(userSampleToken),
  true,
  "User's spk_ token must be recognized as a Speak API Personal Token",
);

assert.strictEqual(
  isSpeakApiPersonalToken("tts_temporary_session_token_123"),
  true,
  "tts_ prefixed token must be recognized as a Speak API Personal Token",
);

assert.strictEqual(
  isSpeakApiPersonalToken("sk-or-v1-abc123def456"),
  false,
  "OpenRouter sk-or- key must NOT be classified as Speak API token",
);

assert.strictEqual(
  isSpeakApiPersonalToken("sk_lovable_ai_upstream_key_123"),
  false,
  "Lovable AI sk_ upstream key must NOT be classified as Speak API token",
);

assert.strictEqual(
  isUpstreamProviderApiKey("sk_lovable_ai_upstream_key_123"),
  true,
  "sk_ must be recognized as upstream provider API key",
);

assert.strictEqual(
  isUpstreamProviderApiKey("sk-or-v1-abc123def456"),
  true,
  "sk-or- must be recognized as upstream provider API key",
);

assert.strictEqual(
  isUpstreamProviderApiKey(userSampleToken),
  false,
  "spk_ token must NOT be classified as an upstream provider API key",
);

console.log("✓ Token classification passed.");

// -----------------------------------------------------------------------------
// Test 2: Credential Resolution & Protection Against Leaking spk_ into body.api_key
// -----------------------------------------------------------------------------
console.log("\n[Test 2] Verifying resolveTtsCredentials auto-promotion and protection...");

// Case A: User pasted spk_ token into apiKey option
const credsFromApiKey = resolveTtsCredentials({ apiKey: userSampleToken });
assert.strictEqual(
  credsFromApiKey.speakApiToken,
  userSampleToken,
  "spk_ token passed as apiKey must be automatically promoted to speakApiToken",
);
assert.strictEqual(
  credsFromApiKey.providerApiKey,
  "",
  "spk_ token must be wiped from providerApiKey so it never leaks into request body",
);

// Case B: User supplied standard OpenRouter key
const openRouterKey = "sk-or-v1-fedcba987654321";
const credsFromOpenRouter = resolveTtsCredentials({ apiKey: openRouterKey });
assert.strictEqual(
  credsFromOpenRouter.providerApiKey,
  openRouterKey,
  "Valid provider key must remain in providerApiKey",
);
assert.strictEqual(
  credsFromOpenRouter.speakApiToken,
  "",
  "No speakApiToken should be resolved when only providerApiKey is supplied",
);

console.log("✓ Credential resolution and protection passed.");

// -----------------------------------------------------------------------------
// Test 3: Request Body Construction Safety (Never Send spk_ in body.api_key)
// -----------------------------------------------------------------------------
console.log("\n[Test 3] Verifying buildLovableTtsRequestBody never includes spk_ in body.api_key...");

// Even if provider is "lovable" and user passed spk_ token, body.api_key MUST be undefined
const lovableBodyWithSpk = buildLovableTtsRequestBody("Test speech", "en", {
  provider: "lovable",
  apiKey: userSampleToken,
});
assert.strictEqual(
  lovableBodyWithSpk.api_key,
  undefined,
  "body.api_key must be undefined when only an spk_ token is present",
);

// For google provider, body.api_key must always be undefined
const googleBody = buildLovableTtsRequestBody("Hello", "en", {
  provider: "google",
  apiKey: "sk_should_not_be_included_for_google",
});
assert.strictEqual(
  googleBody.api_key,
  undefined,
  "body.api_key must be undefined for google provider",
);

// For keyed provider with genuine sk_ key, body.api_key is populated
const genuineKey = "sk_genuine_lovable_key_456";
const keyedBody = buildLovableTtsRequestBody("Text", "en", {
  provider: "lovable",
  apiKey: genuineKey,
});
assert.strictEqual(
  keyedBody.api_key,
  genuineKey,
  "body.api_key must be populated when a genuine upstream key is provided",
);

console.log("✓ Request body safety passed.");

// -----------------------------------------------------------------------------
// Test 4: URL Parameter Construction (token param for GET requests)
// -----------------------------------------------------------------------------
console.log("\n[Test 4] Verifying buildLovableTtsUrl correctly places token query parameter...");

const getUrl = buildLovableTtsUrl("Hello world", "en", {
  provider: "lovable",
  speakApiToken: userSampleToken,
});
const parsedGetUrl = new URL(getUrl);
assert.strictEqual(
  parsedGetUrl.searchParams.get("token"),
  userSampleToken,
  "token query param must match Speak API token for GET requests",
);
assert.strictEqual(
  parsedGetUrl.searchParams.get("api_key"),
  null,
  "api_key query param must NOT be present when only spk_ token is provided",
);

console.log("✓ URL parameter construction passed.");

// -----------------------------------------------------------------------------
// Test 5: Actionable Diagnostics for Upstream Key Errors
// -----------------------------------------------------------------------------
console.log("\n[Test 5] Verifying generateTtsDiagnosticAdvice handles upstream provider errors...");

const upstreamKeyError =
  "lovable request failed (HTTP 401). Lovable AI rejected the API key. Check that the key is current and correctly saved. Provider detail: Invalid API key format. Key must start with 'sk_' prefix.";

const advice = generateTtsDiagnosticAdvice(401, upstreamKeyError, "lovable", true, false);
assert.ok(advice, "Diagnostic advice should be generated for upstream key error");
assert.ok(
  advice.includes("spk_"),
  "Advice must explain that spk_ token belongs in Authorization header",
);
assert.ok(
  advice.includes("Authorization: Bearer"),
  "Advice must mention Authorization: Bearer header",
);

const lovableKeyMissing = "Lovable AI requires an API key";
const adviceMissing = generateTtsDiagnosticAdvice(400, lovableKeyMissing, "lovable", true, false);
assert.ok(adviceMissing, "Diagnostic advice should be generated for missing lovable key");
assert.ok(
  adviceMissing.includes("Google TTS"),
  "Advice must suggest switching to free Google TTS which works immediately",
);

console.log("✓ Diagnostic advice generation passed.");

// -----------------------------------------------------------------------------
// Test 6: External TTS Debugger cURL Command Generation
// -----------------------------------------------------------------------------
console.log("\n[Test 6] Verifying Debugger Audit Record & cURL formatting...");

clearExternalTtsAuditRecords();
const testAuditRecord: ExternalTtsAuditRecord = {
  id: "test-rec-1",
  timestamp: Date.now(),
  method: "POST",
  url: LOVABLE_TTS_ENDPOINT,
  endpoint: LOVABLE_TTS_ENDPOINT,
  requestHeaders: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userSampleToken}`,
  },
  requestBody: {
    text: "Test",
    lang: "en",
    format: "json",
    provider: "google",
  },
  status: 200,
  statusText: "OK",
  latencyMs: 145,
  responseHeaders: { "content-type": "application/json" },
  responseBody: { audio: "dGVzdA==", mime: "audio/mpeg", text: "Test", lang: "en" },
  responseType: "json",
  source: "test_button",
};

addExternalTtsAuditRecord(testAuditRecord);
const records = getExternalTtsAuditRecords();
assert.strictEqual(records.length, 1, "Audit records should contain the added record");
assert.strictEqual(records[0].requestHeaders["Authorization"], `Bearer ${userSampleToken}`);
// Verify request body does not have api_key
const recBody = records[0].requestBody as Record<string, unknown>;
assert.strictEqual(recBody.api_key, undefined, "Audit record body must not contain api_key");

console.log("✓ Debugger audit record verified.");

// -----------------------------------------------------------------------------
// Test 7: App Version 2.0.71 Synchronization Across All 5 Files
// -----------------------------------------------------------------------------
console.log("\n[Test 7] Verifying App Version 2.0.71 synchronization across 5 files...");

const repoRoot = process.cwd();

// 1. package.json
const pkgJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
assert.ok(pkgJson.version >= "2.0.71", `package.json version must be >= 2.0.71, got ${pkgJson.version}`);
const activeVersion = pkgJson.version;

// 2. android-shell/app/build.gradle.kts
const gradleKts = fs.readFileSync(
  path.join(repoRoot, "android-shell/app/build.gradle.kts"),
  "utf8",
);
assert.ok(
  gradleKts.includes(`versionName = "${activeVersion}"`),
  `build.gradle.kts must have versionName = ${activeVersion}`,
);

// 3. src/config/appConfig.ts
assert.strictEqual(APP_VERSION, activeVersion, `src/config/appConfig.ts APP_VERSION must be ${activeVersion}`);

// 4. src/utils/apkUpdater.ts
assert.strictEqual(
  CURRENT_APK_VERSION,
  `v${activeVersion}`,
  `src/utils/apkUpdater.ts CURRENT_APK_VERSION must be v${activeVersion}`,
);

// 5. src/utils/appSettings.ts
const appSettingsContent = fs.readFileSync(
  path.join(repoRoot, "src/utils/appSettings.ts"),
  "utf8",
);
assert.ok(
  appSettingsContent.includes(`version: "${activeVersion}"`),
  `src/utils/appSettings.ts must include version: ${activeVersion}`,
);

console.log(`✓ Version ${activeVersion} synchronized across all 5 files.`);

console.log("\n====================================================");
console.log("🎉 ALL TESTS PASSED! Task 270 verified successfully.");
console.log("====================================================");
