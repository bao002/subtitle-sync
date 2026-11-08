/**
 * Verification test for:
 * 0. Lovable TTS Docs Compliance (https://tts3.lovable.app/docs and OpenAPI 3.1.0)
 * 1. Direct using of Google TTS services parity (bao002/subtitle-sync)
 * 2. External TTS Service Debugger (full request and response details)
 * 3. App version 2.0.70 synchronization
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  LOVABLE_TTS_DOCS_URL,
  LOVABLE_TTS_OPENAPI_URL,
  LOVABLE_TTS_PROVIDERS,
  LOVABLE_VOICES,
  OPENROUTER_VOICES,
  GEMINI_VOICES,
  OPENAI_VOICES,
  ELEVENLABS_VOICES,
  DEEPGRAM_VOICES,
  getVoicesForProvider,
  getDefaultVoiceForProvider,
  addExternalTtsAuditRecord,
  getExternalTtsAuditRecords,
  clearExternalTtsAuditRecords,
  buildLovableTtsUrl,
} from "../src/lib/alternative-tts";
import { APP_VERSION } from "../src/config/appConfig";
import { CURRENT_APK_VERSION } from "../src/utils/apkUpdater";

console.log("====================================================");
console.log("🧪 Running TTS3 Docs, Google TTS Parity & Debugger Verification");
console.log("====================================================");

// -----------------------------------------------------------------------------
// Test 1: Chapter 0 - Lovable TTS Docs Compliance
// -----------------------------------------------------------------------------
console.log("\n[Test 1] Verifying Chapter 0: https://tts3.lovable.app/docs Compliance...");

assert.strictEqual(
  LOVABLE_TTS_DOCS_URL,
  "https://tts3.lovable.app/docs",
  "LOVABLE_TTS_DOCS_URL must equal https://tts3.lovable.app/docs",
);
assert.strictEqual(
  LOVABLE_TTS_OPENAPI_URL,
  "https://tts3.lovable.app/api/public/openapi.json",
  "LOVABLE_TTS_OPENAPI_URL must point to canonical OpenAPI spec",
);

// Verify all providers supported by https://tts3.lovable.app/docs
const expectedProviders = [
  "auto",
  "google",
  "lovable",
  "openrouter",
  "gemini",
  "openai",
  "elevenlabs",
  "deepgram",
];
for (const p of expectedProviders) {
  assert.ok(
    LOVABLE_TTS_PROVIDERS.includes(p as any),
    `LOVABLE_TTS_PROVIDERS must include "${p}" from tts3 docs`,
  );
}
console.log(`✅ Providers catalog verified: ${LOVABLE_TTS_PROVIDERS.join(", ")}`);

// Verify voice catalogs for all providers
assert.ok(LOVABLE_VOICES.length >= 5, "LOVABLE_VOICES must contain at least 5 voices");
assert.ok(OPENROUTER_VOICES.length >= 6, "OPENROUTER_VOICES must contain at least 6 voices");
assert.ok(GEMINI_VOICES.length >= 5, "GEMINI_VOICES must contain at least 5 voices");
assert.ok(OPENAI_VOICES.length >= 6, "OPENAI_VOICES must contain at least 6 voices");
assert.ok(ELEVENLABS_VOICES.length >= 6, "ELEVENLABS_VOICES must contain at least 6 voices");
assert.ok(DEEPGRAM_VOICES.length >= 6, "DEEPGRAM_VOICES must contain at least 6 voices");

// Test helper methods
assert.deepStrictEqual(getVoicesForProvider("lovable"), LOVABLE_VOICES);
assert.deepStrictEqual(getVoicesForProvider("openrouter"), OPENROUTER_VOICES);
assert.deepStrictEqual(getVoicesForProvider("gemini"), GEMINI_VOICES);
assert.deepStrictEqual(getVoicesForProvider("openai"), OPENAI_VOICES);
assert.deepStrictEqual(getVoicesForProvider("elevenlabs"), ELEVENLABS_VOICES);
assert.deepStrictEqual(getVoicesForProvider("deepgram"), DEEPGRAM_VOICES);
assert.deepStrictEqual(getVoicesForProvider("google"), []);
assert.deepStrictEqual(getVoicesForProvider("auto"), []);

assert.strictEqual(getDefaultVoiceForProvider("lovable"), "Kore");
assert.strictEqual(getDefaultVoiceForProvider("openrouter"), "alloy");
assert.strictEqual(getDefaultVoiceForProvider("gemini"), "Kore");
assert.strictEqual(getDefaultVoiceForProvider("openai"), "coral");
assert.strictEqual(getDefaultVoiceForProvider("elevenlabs"), "JBFqnCBsd6RMkjVDRZzb");
assert.strictEqual(getDefaultVoiceForProvider("deepgram"), "aura-asteria-en");

// Check UI integration of docs link in Beginner and Advanced modes
const beginnerTabPath = path.resolve(
  process.cwd(),
  "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
);
const beginnerTabContent = fs.readFileSync(beginnerTabPath, "utf-8");
assert.ok(
  beginnerTabContent.includes("lovable-tts-docs-link"),
  "BeginnerPreferencesTab must render lovable-tts-docs-link",
);
assert.ok(
  beginnerTabContent.includes("LOVABLE_TTS_DOCS_URL"),
  "BeginnerPreferencesTab must link to LOVABLE_TTS_DOCS_URL",
);

const ttsPanelPath = path.resolve(process.cwd(), "src/components/TtsServiceSettingsPanel.tsx");
const ttsPanelContent = fs.readFileSync(ttsPanelPath, "utf-8");
assert.ok(
  ttsPanelContent.includes('data-testid="lovable-tts-docs-link"'),
  "Advanced mode settings must render lovable-tts-docs-link in TtsServiceSettingsPanel",
);
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexPath, "utf-8");
console.log("✅ PASS: Chapter 0 Lovable TTS Docs compliance verified.");

// -----------------------------------------------------------------------------
// Test 2: Chapter 1 - Direct Google TTS Routing Parity (bao002/subtitle-sync)
// -----------------------------------------------------------------------------
console.log("\n[Test 2] Verifying Chapter 1: Direct Google TTS Routing Parity...");

// Verify URL building for google provider
const googleUrl = buildLovableTtsUrl("Hello world", "en", {
  provider: "google",
});
assert.ok(
  googleUrl.includes("provider=google"),
  "URL for google provider must contain provider=google",
);
assert.ok(
  googleUrl.includes("lang=en") || googleUrl.includes("language=en"),
  "URL must include lang parameter",
);
assert.ok(
  googleUrl.startsWith("https://tts3.lovable.app/api/public/tts"),
  "URL must point to canonical Lovable public TTS endpoint",
);

// Verify BeginnerTtsServiceControl exists and is rendered in both Beginner and Advanced modes
const beginnerTtsControlPath = path.resolve(
  process.cwd(),
  "src/components/beginner/BeginnerTtsServiceControl.tsx",
);
assert.ok(fs.existsSync(beginnerTtsControlPath), "BeginnerTtsServiceControl.tsx must exist");
const beginnerTtsControlContent = fs.readFileSync(beginnerTtsControlPath, "utf-8");
assert.ok(
  beginnerTtsControlContent.includes('data-testid="beginner-tts-service-google"'),
  "BeginnerTtsServiceControl must provide beginner-tts-service-google option",
);

// Check that Advanced mode renders BeginnerTtsServiceControl below video
assert.ok(
  indexContent.includes("<BeginnerTtsServiceControl"),
  "Advanced mode in index.tsx must render BeginnerTtsServiceControl below video player",
);

// Verify selecting 'google' sets provider to 'google' and engine to 'lovable' (NOT blocked google_translate)
assert.ok(
  indexContent.includes('setLovableTtsProviderState("google")') &&
    indexContent.includes('setAlternativeTtsEngineState("lovable")'),
  "Selecting google speech service must set provider to google and engine to lovable Speak API",
);
console.log("✅ PASS: Chapter 1 Google TTS direct service parity verified.");

// -----------------------------------------------------------------------------
// Test 3: Chapter 2 - External TTS Service Debugger (Full Request & Response)
// -----------------------------------------------------------------------------
console.log("\n[Test 3] Verifying Chapter 2: External TTS Debugger...");

// Verify ExternalTtsDebuggerPanel component exists
const debuggerPanelPath = path.resolve(
  process.cwd(),
  "src/components/ExternalTtsDebuggerPanel.tsx",
);
assert.ok(fs.existsSync(debuggerPanelPath), "ExternalTtsDebuggerPanel.tsx must exist");
const debuggerContent = fs.readFileSync(debuggerPanelPath, "utf-8");
assert.ok(
  debuggerContent.includes('data-testid="external-tts-debugger-panel"'),
  "Debugger panel must have data-testid='external-tts-debugger-panel'",
);
assert.ok(
  debuggerContent.includes('data-testid="external-tts-audit-record"'),
  "Debugger panel must render audit record with data-testid='external-tts-audit-record'",
);
assert.ok(
  debuggerContent.includes('data-testid="clear-external-tts-audit-btn"'),
  "Debugger panel must provide clear button",
);
assert.ok(
  debuggerContent.includes('data-testid="copy-external-tts-record-btn"'),
  "Debugger panel must provide copy button for request/response JSON",
);

// Test audit store functionality
clearExternalTtsAuditRecords();
assert.strictEqual(getExternalTtsAuditRecords().length, 0, "Audit store should be empty initially");

const testRecord = {
  id: "test-rec-1",
  timestamp: Date.now(),
  engine: "lovable",
  provider: "google",
  voice: "default",
  text: "Testing debugger audit flow",
  language: "en",
  request: {
    method: "POST" as const,
    url: "https://tts3.lovable.app/api/public/tts",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: {
      text: "Testing debugger audit flow",
      provider: "google",
      voice: "default",
    },
    queryParams: { provider: "google" },
  },
  response: {
    status: 200,
    statusText: "OK",
    headers: {
      "content-type": "audio/mpeg",
      "access-control-allow-origin": "*",
    },
    durationMs: 142,
    body: { audioBytes: 4096, sampleRate: 24000 },
  },
};

addExternalTtsAuditRecord(testRecord);
const records = getExternalTtsAuditRecords();
assert.strictEqual(records.length, 1, "Audit record should be added");
assert.strictEqual(records[0].id, "test-rec-1");
assert.strictEqual(records[0].request.method, "POST");
assert.strictEqual(records[0].response.status, 200);
assert.strictEqual(records[0].response.durationMs, 142);
assert.strictEqual(records[0].response.headers["content-type"], "audio/mpeg");

// Verify debugger panel is present in both BeginnerPreferencesTab and Advanced mode (via TtsServiceSettingsPanel or index.tsx)
assert.ok(
  beginnerTabContent.includes("<ExternalTtsDebuggerPanel"),
  "BeginnerPreferencesTab must render <ExternalTtsDebuggerPanel />",
);
assert.ok(
  ttsPanelContent.includes("<ExternalTtsDebuggerPanel") || indexContent.includes("<ExternalTtsDebuggerPanel"),
  "Advanced mode (via TtsServiceSettingsPanel or index.tsx) must render <ExternalTtsDebuggerPanel />",
);
console.log("✅ PASS: Chapter 2 External TTS Debugger verified.");

// -----------------------------------------------------------------------------
// Test 4: App Version Synchronization (2.0.70 / 20070)
// -----------------------------------------------------------------------------
console.log("\n[Test 4] Verifying App Version 2.0.70 Synchronization...");

const pkgPath = path.resolve(process.cwd(), "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
assert.strictEqual(pkg.version, APP_VERSION, "package.json version must match APP_VERSION");
assert.strictEqual(CURRENT_APK_VERSION, `v${APP_VERSION}`, "apkUpdater.ts CURRENT_APK_VERSION must match APP_VERSION");

const gradlePath = path.resolve(process.cwd(), "android-shell/app/build.gradle.kts");
const gradleText = fs.readFileSync(gradlePath, "utf-8");
assert.ok(gradleText.includes(`versionName = "${APP_VERSION}"`), "build.gradle.kts versionName must match APP_VERSION");

const appSettingsPath = path.resolve(process.cwd(), "src/utils/appSettings.ts");
const appSettingsText = fs.readFileSync(appSettingsPath, "utf-8");
assert.ok(
  appSettingsText.includes(`version: APP_VERSION`) || appSettingsText.includes(`version: "${APP_VERSION}"`),
  "appSettings.ts snapshot version must match APP_VERSION",
);

console.log(`✅ PASS: App version ${APP_VERSION} synchronized across all 5 files.`);

console.log("====================================================");
console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
console.log("====================================================");
