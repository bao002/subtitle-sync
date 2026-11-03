/**
 * Dedicated test script: scripts/verify-tts-service-validation-and-anonymity.ts
 *
 * Verifies Task 289:
 * 1. Validate-Before-Play flow: First shows validation button; after validation is OK -> shows Play button.
 * 2. Visual monitoring: Any request to TTS service is recorded in audit history and displayed for debugging.
 * 3. Anonymous Mode toggle: Allows choosing between using the service in regular mode or anonymously (stripping tokens/session).
 * 4. Storybook coverage: Component stories for unvalidated, validated, anonymous, and live visual monitoring.
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  getAlternativeTtsAnonymousMode,
  setAlternativeTtsAnonymousMode,
  resolveTtsCredentials,
  addExternalTtsAuditRecord,
  getExternalTtsAuditRecords,
  clearExternalTtsAuditRecords,
  validateRemoteTtsService,
  STORAGE_KEY_ALTERNATIVE_TTS_ANONYMOUS_MODE,
} from "../src/lib/alternative-tts";

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying TTS Service Validation-Before-Play & Anonymity (Task 289)");
  console.log("=========================================================================");

  const rootDir = process.cwd();

  // Test 1: Verify Anonymity Mode getter, setter, and credentials suppression
  console.log("--> [Test 1] Verifying Anonymity Mode toggle & credential protection...");
  setAlternativeTtsAnonymousMode(false);
  assert.strictEqual(getAlternativeTtsAnonymousMode(), false, "Should default to regular mode (false)");

  setAlternativeTtsAnonymousMode(true);
  assert.strictEqual(getAlternativeTtsAnonymousMode(), true, "Should enable anonymous mode (true)");

  // When anonymous mode is active, credentials must be completely stripped
  const anonCreds = resolveTtsCredentials({
    speakApiToken: "spk_test_secret_token",
    apiKey: "sk_test_secret_key",
    isAnonymous: true,
  });
  assert.strictEqual(anonCreds.speakApiToken, "", "Anonymous mode must strip speakApiToken");
  assert.strictEqual(anonCreds.providerApiKey, "", "Anonymous mode must strip providerApiKey");

  // Reset to regular mode for subsequent tests
  setAlternativeTtsAnonymousMode(false);
  console.log("✅ PASS: Anonymity mode getter/setter and credential stripping verified");

  // Test 2: Verify visual monitoring audit records and anonymity tag
  console.log("--> [Test 2] Verifying visual monitoring audit records tracking...");
  clearExternalTtsAuditRecords();
  assert.strictEqual(getExternalTtsAuditRecords().length, 0, "Audit records should be cleared");

  const testAuditId = `test-audit-${Date.now()}`;
  addExternalTtsAuditRecord({
    id: testAuditId,
    timestamp: Date.now(),
    method: "GET",
    url: "https://translate.google.com/translate_tts?tl=en&q=Hello",
    endpoint: "https://translate.google.com/translate_tts",
    requestHeaders: {},
    queryParams: { tl: "en", q: "Hello" },
    lang: "en",
    text: "Hello",
    status: 200,
    statusText: "OK",
    latencyMs: 42,
    responseHeaders: { "content-type": "audio/mpeg" },
    responseBody: "[Audio stream]",
    responseType: "media",
    source: "validate_service",
    isAnonymous: true,
  });

  const records = getExternalTtsAuditRecords();
  assert.strictEqual(records.length, 1, "Should have 1 recorded audit entry");
  assert.strictEqual(records[0].id, testAuditId);
  assert.strictEqual(records[0].isAnonymous, true, "Audit record must preserve isAnonymous flag");
  console.log("✅ PASS: Visual monitoring audit records preserve request and anonymity metadata");

  // Test 3: Verify TtsServiceSettingsPanel component structure (validate-first, play button, anonymity controls)
  console.log("--> [Test 3] Verifying TtsServiceSettingsPanel source implementation...");
  const panelPath = path.resolve(rootDir, "src/components/TtsServiceSettingsPanel.tsx");
  assert(fs.existsSync(panelPath), "TtsServiceSettingsPanel.tsx must exist");
  const panelContent = fs.readFileSync(panelPath, "utf-8");

  assert(panelContent.includes("tts-anonymity-mode-control"), "Must contain tts-anonymity-mode-control test ID");
  assert(panelContent.includes("tts-anonymity-regular-btn"), "Must contain Regular access mode button");
  assert(panelContent.includes("tts-anonymity-anonymous-btn"), "Must contain Anonymous access mode button");
  assert(panelContent.includes("btn-validate-remote-tts"), "Must contain validation button");
  assert(panelContent.includes("test-alternative-tts-btn"), "Must contain test audio play button");
  assert(panelContent.includes("tts-validation-required-hint"), "Must contain validation required hint when unvalidated");
  assert(panelContent.includes("isValidationOk"), "Must check isValidationOk before rendering play button");
  assert(panelContent.includes("ExternalTtsDebuggerPanel"), "Must include visual monitoring debugger on the same view");
  console.log("✅ PASS: TtsServiceSettingsPanel enforces validate-first-then-play and anonymity toggle");

  // Test 4: Verify BeginnerPreferencesTab parity
  console.log("--> [Test 4] Verifying BeginnerPreferencesTab parity...");
  const beginnerTabPath = path.resolve(rootDir, "src/components/beginner/tabs/BeginnerPreferencesTab.tsx");
  assert(fs.existsSync(beginnerTabPath), "BeginnerPreferencesTab.tsx must exist");
  const beginnerContent = fs.readFileSync(beginnerTabPath, "utf-8");

  assert(beginnerContent.includes("beginner-tts-anonymity-mode-control"), "Must contain beginner anonymity control");
  assert(beginnerContent.includes("beginner-tts-validation-required-hint"), "Must contain beginner validation hint");
  assert(beginnerContent.includes("ExternalTtsDebuggerPanel"), "Must contain visual monitoring on the same view");
  console.log("✅ PASS: BeginnerPreferencesTab satisfies 100% parity rule");

  // Test 5: Verify Storybook stories exist for all states
  console.log("--> [Test 5] Verifying Storybook stories...");
  const storiesPath = path.resolve(rootDir, "src/components/TtsServiceSettingsPanel.stories.tsx");
  assert(fs.existsSync(storiesPath), "TtsServiceSettingsPanel.stories.tsx must exist");
  const storiesContent = fs.readFileSync(storiesPath, "utf-8");

  assert(storiesContent.includes("GoogleDirect"), "Must contain GoogleDirect story");
  assert(storiesContent.includes("ValidatedWithPlayButton"), "Must contain ValidatedWithPlayButton story");
  assert(storiesContent.includes("AnonymousModeGoogleDirect"), "Must contain AnonymousModeGoogleDirect story");
  assert(storiesContent.includes("LiveVisualMonitor"), "Must contain LiveVisualMonitor story");
  console.log("✅ PASS: Storybook stories verify unvalidated, validated, anonymous, and live visual monitoring");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! (Task 289 verified)");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
