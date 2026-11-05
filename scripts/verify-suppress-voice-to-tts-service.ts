/**
 * Verification test for Task 310: Suppress Passing Voice to the TTS Service
 * Validates that neither GET query parameters nor POST request body pass 'voice' to the TTS service.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  buildLovableTtsUrl,
  buildLovableTtsRequestBody,
  synthesizeLovableTtsPost,
  fetchLovableTtsJson,
  fetchLovableTtsBinaryBlob,
  LOVABLE_TTS_PROVIDERS,
  getExternalTtsAuditRecords,
  clearExternalTtsAuditRecords,
} from "../src/lib/alternative-tts";

console.log("=========================================================================");
console.log("🧪 Verifying Task 310: Suppress Passing Voice to the TTS Service");
console.log("=========================================================================\n");

// -------------------------------------------------------------------------
// 1. Verify buildLovableTtsUrl suppresses voice parameter
// -------------------------------------------------------------------------
console.log("🔹 Test 1: buildLovableTtsUrl suppresses voice parameter across all providers...");

for (const provider of LOVABLE_TTS_PROVIDERS) {
  const urlWithVoice = buildLovableTtsUrl("Hello world test sentence", "en", {
    provider,
    voice: "Kore",
  });
  const parsed = new URL(urlWithVoice);
  assert.strictEqual(
    parsed.searchParams.has("voice"),
    false,
    `buildLovableTtsUrl must not include 'voice' parameter for provider '${provider}'`,
  );
  assert.strictEqual(
    parsed.searchParams.get("voice"),
    null,
    `'voice' query param must be null for provider '${provider}'`,
  );
}

// Custom / arbitrary voice name test
const urlCustom = buildLovableTtsUrl("Testing custom voice suppression", "en", {
  provider: "lovable",
  voice: "Zephyr-Custom-Voice-123",
});
assert.strictEqual(
  new URL(urlCustom).searchParams.has("voice"),
  false,
  "buildLovableTtsUrl must suppress custom voice from query parameters",
);
console.log("✅ PASS: buildLovableTtsUrl never passes voice parameter in URL query.");

// -------------------------------------------------------------------------
// 2. Verify buildLovableTtsRequestBody suppresses voice parameter
// -------------------------------------------------------------------------
console.log("\n🔹 Test 2: buildLovableTtsRequestBody suppresses voice in POST body...");

for (const provider of LOVABLE_TTS_PROVIDERS) {
  const body = buildLovableTtsRequestBody("Testing body voice suppression", "en", {
    provider,
    voice: "Charon",
  });
  assert.strictEqual(
    body.voice,
    undefined,
    `body.voice must be undefined for provider '${provider}'`,
  );
  assert.strictEqual(
    "voice" in body,
    false,
    `'voice' key must not be present in body object for provider '${provider}'`,
  );
  const serialized = JSON.stringify(body);
  assert.strictEqual(
    serialized.includes('"voice"'),
    false,
    `Serialized JSON body must not contain '"voice"' key for provider '${provider}'`,
  );
}

console.log("✅ PASS: buildLovableTtsRequestBody never includes voice in request body.");

// -------------------------------------------------------------------------
// 3. Mock fetch & test synthesizeLovableTtsPost outbound request
// -------------------------------------------------------------------------
console.log("\n🔹 Test 3: synthesizeLovableTtsPost outbound payload inspection...");

clearExternalTtsAuditRecords();
const originalFetch = globalThis.fetch;
let capturedPostRequest: { url: string; headers: Record<string, string>; body: any } | null = null;

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input.toString();
  const rawBody = init?.body ? JSON.parse(init.body as string) : null;
  capturedPostRequest = {
    url,
    headers: (init?.headers as Record<string, string>) || {},
    body: rawBody,
  };
  return new Response(JSON.stringify({ audio: "dGVzdGF1ZGlv", mime: "audio/mpeg" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}) as any;

try {
  await synthesizeLovableTtsPost("Outbound POST test", "en", {
    provider: "auto",
    voice: "Kore",
  });

  assert.ok(capturedPostRequest, "Outbound POST request must be captured");
  assert.strictEqual(
    capturedPostRequest!.body.voice,
    undefined,
    "Outbound POST body must have undefined voice",
  );
  assert.strictEqual(
    "voice" in capturedPostRequest!.body,
    false,
    "Outbound POST body must not contain 'voice' property",
  );
  assert.strictEqual(
    JSON.stringify(capturedPostRequest!.body).includes('"voice"'),
    false,
    "Serialized outbound POST body must not include 'voice'",
  );
  console.log("✅ PASS: synthesizeLovableTtsPost sent clean payload without voice to TTS service.");
} finally {
  globalThis.fetch = originalFetch;
}

// -------------------------------------------------------------------------
// 4. Mock fetch & test fetchLovableTtsJson / BinaryBlob outbound request URL
// -------------------------------------------------------------------------
console.log("\n🔹 Test 4: fetchLovableTtsJson and fetchLovableTtsBinaryBlob URL inspection...");

let capturedGetUrl: string | null = null;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  capturedGetUrl = typeof input === "string" ? input : input.toString();
  return new Response(JSON.stringify({ audio: "dGVzdGF1ZGlv", mime: "audio/mpeg" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}) as any;

try {
  await fetchLovableTtsJson("Outbound GET test", "en", {
    provider: "lovable",
    voice: "Fenrir",
  });

  assert.ok(capturedGetUrl, "Outbound GET request URL must be captured");
  const parsedGet = new URL(capturedGetUrl!);
  assert.strictEqual(
    parsedGet.searchParams.has("voice"),
    false,
    "Outbound GET request URL must not contain 'voice' query param",
  );
  console.log("✅ PASS: fetchLovableTtsJson sent clean URL without voice to TTS service.");
} finally {
  globalThis.fetch = originalFetch;
}

// -------------------------------------------------------------------------
// 5. Inspect ExternalTtsAuditRecord instances
// -------------------------------------------------------------------------
console.log("\n🔹 Test 5: Verify external TTS audit records omit voice...");
const auditRecords = getExternalTtsAuditRecords();
for (const rec of auditRecords) {
  assert.strictEqual(
    rec.voice,
    undefined,
    `Audit record ${rec.id} must have undefined voice`,
  );
  if (rec.requestBody && typeof rec.requestBody === "object") {
    assert.strictEqual(
      "voice" in (rec.requestBody as Record<string, unknown>),
      false,
      `Audit record ${rec.id} requestBody must not contain voice property`,
    );
  }
}
console.log("✅ PASS: Audit records correctly reflect voice suppression.");

// -------------------------------------------------------------------------
// 6. Source inspection: ensure playAlternativeTtsAudio callers omit voice
// -------------------------------------------------------------------------
console.log("\n🔹 Test 6: Verify index.tsx and BeginnerPreferencesTab.tsx do not pass voice...");

const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexTsxPath, "utf-8");
assert.strictEqual(
  indexContent.includes("voice: altVoice"),
  false,
  "src/routes/index.tsx must not pass 'voice: altVoice' to playAlternativeTtsAudio",
);
assert.strictEqual(
  indexContent.includes("tts3Voice: altVoice"),
  false,
  "src/routes/index.tsx must not pass 'tts3Voice: altVoice' to executeTtsFallbackSequence",
);

const beginnerTabPath = path.resolve(process.cwd(), "src/components/beginner/tabs/BeginnerPreferencesTab.tsx");
const beginnerContent = fs.readFileSync(beginnerTabPath, "utf-8");
assert.strictEqual(
  beginnerContent.includes("voice: lovableTtsVoiceState"),
  false,
  "BeginnerPreferencesTab.tsx must not pass 'voice: lovableTtsVoiceState'",
);

console.log("✅ PASS: Caller source files confirmed to suppress passing voice.");

console.log("\n=========================================================================");
console.log("🎉 ALL TESTS PASSED: Suppress passing voice to the TTS service verified!");
console.log("=========================================================================");
