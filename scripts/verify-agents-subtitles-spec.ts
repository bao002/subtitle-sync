import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { isValidJsonSubtitleResponse } from "../src/utils/subtitleCache";
import {
  getSubtitleRequestMode,
  setSubtitleRequestMode,
  subtitleRequestModeOrder,
} from "../src/lib/playback-preferences";

console.log("==================================================================");
console.log("🧪 Running AGENTS.md Subtitles Architecture Specification Test");
console.log("==================================================================");

const rootDir = process.cwd();

// Setup local storage mock for Node environment
if (typeof globalThis.window === "undefined") {
  const storage = new Map<string, string>();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, String(v)),
      removeItem: (k: string) => storage.delete(k),
      clear: () => storage.clear(),
    },
  };
}

// 1. Verify AGENTS.md content & specifications
const agentsMdPath = path.join(rootDir, "AGENTS.md");
assert(fs.existsSync(agentsMdPath), "AGENTS.md must exist");
const agentsContent = fs.readFileSync(agentsMdPath, "utf8");

// Section 1: Fallback strategy
assert(
  agentsContent.includes("Subtitles fetch fallback strategy") &&
    agentsContent.includes("`lang` replacement vs `tlang` parameterization"),
  "AGENTS.md must specify subtitles fetch fallback strategy",
);
assert(
  agentsContent.includes("tlang") &&
    agentsContent.includes("lang") &&
    agentsContent.includes("user to toggle between these two request modes"),
  "AGENTS.md must document toggling between tlang and lang replacement",
);
console.log("✅ PASS: AGENTS.md documents subtitles fetch fallback strategy and toggle");

// Section 2: Anti-bot strategy
assert(
  agentsContent.includes("Anti-bot strategy for YouTube API execution"),
  "AGENTS.md must specify anti-bot strategy",
);
assert(
  agentsContent.includes("; wv") &&
    agentsContent.includes("userAgentString.replace") &&
    agentsContent.includes("lastObservedHeaders") &&
    agentsContent.includes("Request pacing"),
  "AGENTS.md must document User-Agent sanitization, header mirroring, and request pacing",
);
console.log("✅ PASS: AGENTS.md documents anti-bot execution and header capture strategy");

// Section 3: Request validation & "good" response criteria
assert(
  agentsContent.includes('Request validation & "Good" response criteria'),
  "AGENTS.md must specify request validation and good response criteria",
);
assert(
  agentsContent.includes("Request validation") &&
    agentsContent.includes("Status code must be 200 OK") &&
    agentsContent.includes("json3") &&
    agentsContent.includes("events") &&
    agentsContent.includes("tStartMs") &&
    agentsContent.includes("dDurationMs") &&
    agentsContent.includes("segs") &&
    agentsContent.includes("utf8") &&
    agentsContent.includes("Non-zero cue count"),
  "AGENTS.md must document HTTP 200, json3 events, timing, segs utf8, and cue count criteria",
);
console.log("✅ PASS: AGENTS.md documents json3 structural validation and cue verification");

// Section 4: Caching mechanism
assert(
  agentsContent.includes("Caching mechanism & invalidation rules") &&
    agentsContent.includes("Never cache invalidated responses"),
  "AGENTS.md must specify caching mechanism and never caching invalidated responses",
);
assert(
  agentsContent.includes("isValidJsonSubtitleResponse") &&
    agentsContent.includes("Pre-cache validation gate") &&
    agentsContent.includes("Read-time eviction"),
  "AGENTS.md must document pre-cache gate, eviction of corrupt entries, and cache controls",
);
console.log("✅ PASS: AGENTS.md documents caching rules and never caching invalid responses");

// 2. Functional verification of JSON3 validation rules
const validJson3Sample = JSON.stringify({
  wireMagic: "pb3",
  events: [
    {
      tStartMs: 1000,
      dDurationMs: 2000,
      segs: [{ utf8: "Hello world" }],
    },
  ],
});
assert.strictEqual(
  isValidJsonSubtitleResponse(validJson3Sample),
  true,
  "Valid JSON3 with non-empty cue segments must pass validation",
);

const emptyEventsSample = JSON.stringify({
  wireMagic: "pb3",
  events: [],
});
assert.strictEqual(
  isValidJsonSubtitleResponse(emptyEventsSample),
  false,
  "JSON3 with empty events array must fail validation",
);

const emptySegsSample = JSON.stringify({
  wireMagic: "pb3",
  events: [
    {
      tStartMs: 1000,
      dDurationMs: 2000,
      segs: [{ utf8: "   " }],
    },
  ],
});
assert.strictEqual(
  isValidJsonSubtitleResponse(emptySegsSample),
  false,
  "JSON3 with whitespace-only segs must fail validation",
);

const htmlErrorSample = "<!DOCTYPE html><html><body>Error 429 Too Many Requests</body></html>";
assert.strictEqual(
  isValidJsonSubtitleResponse(htmlErrorSample),
  false,
  "HTML error response must fail validation",
);

assert.strictEqual(isValidJsonSubtitleResponse(""), false, "Empty string must fail validation");
assert.strictEqual(isValidJsonSubtitleResponse(null), false, "Null must fail validation");
assert.strictEqual(isValidJsonSubtitleResponse(undefined), false, "Undefined must fail validation");

console.log(
  "✅ PASS: isValidJsonSubtitleResponse strictly enforces JSON3 schema and rejects invalid payloads",
);

// 3. Functional verification of Request Mode Toggling
setSubtitleRequestMode("tlang");
assert.strictEqual(getSubtitleRequestMode(), "tlang", "Should read tlang as primary");
assert.deepStrictEqual(
  subtitleRequestModeOrder("tlang"),
  ["tlang", "lang"],
  "tlang primary order must be [tlang, lang]",
);

setSubtitleRequestMode("lang");
assert.strictEqual(getSubtitleRequestMode(), "lang", "Should read lang as primary");
assert.deepStrictEqual(
  subtitleRequestModeOrder("lang"),
  ["lang", "tlang"],
  "lang primary order must be [lang, tlang]",
);
console.log("✅ PASS: SubtitleRequestMode toggles cleanly between 'tlang' and 'lang'");

// 4. Verification in MainActivity.kt implementation
const mainActivityPath = path.join(
  rootDir,
  "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
assert(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const activityContent = fs.readFileSync(mainActivityPath, "utf8");

assert(
  activityContent.includes('userAgentString.replace("; wv", "")'),
  "MainActivity.kt must sanitize User-Agent to prevent bot detection",
);
assert(
  activityContent.includes("lastObservedTimedTextUrl = url") &&
    activityContent.includes("lastObservedHeaders.putAll(h)"),
  "MainActivity.kt must capture authentic player timedtext session URL and headers",
);
assert(
  activityContent.includes('builder.appendQueryParameter("lang", targetLang)') &&
    activityContent.includes('builder.appendQueryParameter("tlang", targetLang)'),
  "MainActivity.kt must implement both lang replacement and tlang parameterization",
);
assert(
  activityContent.includes("isValidJsonSubtitle(bodyString)"),
  "MainActivity.kt must validate subtitle JSON before returning or storing",
);

console.log(
  "✅ PASS: MainActivity.kt implements anti-bot User-Agent sanitization, header mirroring, and validation",
);

console.log("==================================================================");
console.log("🎉 ALL AGENTS.MD SUBTITLES ARCHITECTURE VERIFICATIONS PASSED!");
console.log("==================================================================");
