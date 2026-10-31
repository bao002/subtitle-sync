import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  buildGoogleTranslateTtsUrl,
  buildLovableTtsUrl,
  buildLovableTtsRequestBody,
  LOVABLE_TTS_OPENAPI_URL,
  LOVABLE_TTS_ENDPOINT,
} from "../src/lib/alternative-tts";
import { partitionTtsLanguagesByOrder } from "../src/lib/playback-preferences";

console.log("=========================================================================");
console.log("🧪 Verifying Supabase Quarantine, Direct Google TTS, Lovable OpenAPI,");
console.log("   Video Placement in Language Sequence, and Responsive Mobile Layout");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Supabase Quarantine & Prompt History Verification
console.log("\n--> [Step 1] Verifying Supabase quarantine and prompt history...");
const quarantinedSupabase = path.resolve(rootDir, "quarentined/supabase");
const quarantinedIntegrations = path.resolve(rootDir, "quarentined/supabase_integrations");
const activeSupabaseInSrc = path.resolve(rootDir, "src/integrations/supabase");
const activeSupabaseRoot = path.resolve(rootDir, "supabase");

assert(fs.existsSync(quarantinedSupabase), "quarentined/supabase must exist");
assert(fs.existsSync(quarantinedIntegrations), "quarentined/supabase_integrations must exist");
assert(!fs.existsSync(activeSupabaseInSrc), "src/integrations/supabase must not exist in active src/");
assert(!fs.existsSync(activeSupabaseRoot), "supabase/ must not exist in repository root (quarantined)");

const promptHistoryPath = path.resolve(rootDir, "prompt_history.md");
assert(fs.existsSync(promptHistoryPath), "prompt_history.md must exist in root");
const promptHistoryContent = fs.readFileSync(promptHistoryPath, "utf-8");
assert(promptHistoryContent.includes("Prompt 1"), "prompt_history.md must contain historic prompts");
assert(promptHistoryContent.includes("quarentine any superbase"), "prompt_history.md must include latest prompt");
console.log("✅ PASS: Supabase is strictly quarantined under quarentined/ and prompt_history.md is maintained.");

// 2. Direct Google TTS Service Verification
console.log("\n--> [Step 2] Verifying Direct Google TTS Service...");
const googleUrl = buildGoogleTranslateTtsUrl("Hello world", "es");
assert(googleUrl.includes("client=tw-ob"), `Google TTS URL must use client=tw-ob, got: ${googleUrl}`);
assert(googleUrl.includes("tl=es"), "Google TTS URL must contain tl=es");
assert(googleUrl.includes("q=Hello%20world"), "Google TTS URL must contain encoded query");
console.log("✅ PASS: Direct Google TTS endpoint correctly uses client=tw-ob.");

// 3. Lovable OpenAPI Endpoint & Provider Parameterization
console.log("\n--> [Step 3] Verifying Lovable TTS OpenAPI 3.1.0 Endpoint Compatibility...");
assert.strictEqual(
  LOVABLE_TTS_OPENAPI_URL,
  "https://tts3.lovable.app/api/public/openapi.json",
  "LOVABLE_TTS_OPENAPI_URL must match official spec",
);
assert.strictEqual(
  LOVABLE_TTS_ENDPOINT,
  "https://tts3.lovable.app/api/public/tts",
  "LOVABLE_TTS_ENDPOINT must match official public tts endpoint",
);

// Verify provider=google is preserved and sent
const lovableGoogleUrl = buildLovableTtsUrl("Hello world", "en", { provider: "google" });
assert(lovableGoogleUrl.includes("provider=google"), `Lovable TTS URL must include provider=google, got: ${lovableGoogleUrl}`);

const lovableGoogleBody = buildLovableTtsRequestBody("Hello world", "en", { provider: "google" });
assert.strictEqual(lovableGoogleBody.provider, "google", "Lovable TTS request body must include provider: 'google'");

const lovableOpenRouterUrl = buildLovableTtsUrl("Hello world", "en", { provider: "openrouter" });
assert(lovableOpenRouterUrl.includes("provider=openrouter"), "Lovable TTS URL must support openrouter");
console.log("✅ PASS: Lovable OpenAPI endpoint and multi-provider parameterization validated.");

// 4. In-Between Order & Video Placement in Sequence
console.log("\n--> [Step 4] Verifying In-Between Order & Video Placement in Sequence...");
const testLangs = [
  { code: "es", name: "Spanish" },
  { code: "he", name: "Hebrew" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
];

const partitionedMiddle = partitionTtsLanguagesByOrder(testLangs, {}, "video-middle");
assert.strictEqual(partitionedMiddle.ttsFirst.length, 2, "In-between order must place half languages before video");
assert.strictEqual(partitionedMiddle.videoFirst.length, 2, "In-between order must place half languages after video");
assert.strictEqual(partitionedMiddle.ttsFirst[0]?.code, "es", "First language should be in ttsFirst");
assert.strictEqual(partitionedMiddle.videoFirst[0]?.code, "fr", "Second half language should be in videoFirst");

// Verify VideoLanguageSequenceControl component file exists
const sequenceControlPath = path.resolve(rootDir, "src/components/VideoLanguageSequenceControl.tsx");
assert(fs.existsSync(sequenceControlPath), "VideoLanguageSequenceControl.tsx component must exist");
const sequenceControlContent = fs.readFileSync(sequenceControlPath, "utf-8");
assert(sequenceControlContent.includes("video-language-sequence-control"), "Must contain sequence control testid");
assert(sequenceControlContent.includes("btn-place-video-first"), "Must contain Video First button");
assert(sequenceControlContent.includes("btn-place-video-in-between"), "Must contain Video In-Between button");
assert(sequenceControlContent.includes("btn-place-video-last"), "Must contain Video Last button");

// Verify index.tsx playback loop has no premature return inside pauseMode
const indexTsxPath = path.resolve(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexTsxPath, "utf-8");
assert(
  !indexContent.includes("p.pauseVideo();\n            await speakRow(idx, \"tts-first\");\n            setPauseReason(null);\n            const wasCancelled = !busy.current;\n            busy.current = false;\n            if (wasCancelled || st.current.isSetupPaused || userExplicitlyPausedRef.current) return;\n            const targetSec = (rows[idx]?.start ?? 0) / 1000;\n            lastMs.current = targetSec * 1000;\n            multiVideoPlayerRegistry.unmuteOnly(\"primary\");\n            p.seekTo(targetSec, true);\n            p.playVideo();\n          }\n        }\n        return;"),
  "index.tsx must not have blocking return at the end of tts-first block",
);
assert(indexContent.includes("VideoLanguageSequenceControl"), "index.tsx must render VideoLanguageSequenceControl");
console.log("✅ PASS: In-between order and VideoLanguageSequenceControl verified.");

// 5. Mobile View Responsive Styling
console.log("\n--> [Step 5] Verifying Mobile View Responsive Styling...");
const stylesCssPath = path.resolve(rootDir, "src/styles.css");
const stylesCss = fs.readFileSync(stylesCssPath, "utf-8");
assert(stylesCss.includes("overflow-x: hidden"), "styles.css must enforce overflow-x: hidden on body");
assert(stylesCss.includes("max-width: 100vw"), "styles.css must enforce max-width: 100vw");
assert(stylesCss.includes("@media (max-width: 640px)"), "styles.css must include mobile responsive media queries");
assert(indexContent.includes("overflow-x-hidden"), "index.tsx root container must enforce overflow-x-hidden");
console.log("✅ PASS: Mobile responsive styles and viewport fitting verified.");

console.log("\n=========================================================================");
console.log("🎉 ALL SUPABASE QUARANTINE, TTS, AND SEQUENCE CHECKS PASSED 100%!");
console.log("=========================================================================");
