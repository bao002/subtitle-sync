import assert from "node:assert";
import fs from "node:fs";
import { removeSpecialCharacters } from "../src/utils/captionParser";
import { translateWithGoogle } from "../src/utils/onDemandTranslationManager";
import { cleanSubtitleText } from "../src/components/beginner/tabs/BeginnerParsingTab";

console.log("=== Verifying Application Stages Pipeline & Restrict Rules (Task 158) ===");

// 1. Verify AGENTS.md documentation of stages
const agentsMd = fs.readFileSync("AGENTS.md", "utf-8");
assert.ok(
  agentsMd.includes("Application stages pipeline & execution order"),
  "AGENTS.md must contain 'Application stages pipeline & execution order'",
);
assert.ok(
  agentsMd.includes("Stage 1: Acquisition & Interception"),
  "AGENTS.md must define Stage 1 Acquisition",
);
assert.ok(
  agentsMd.includes("Stage 2: Validation & Schema Conformance"),
  "AGENTS.md must define Stage 2 Validation",
);
assert.ok(
  agentsMd.includes("Stage 3: Special Characters Removal & Sanitization"),
  "AGENTS.md must define Stage 3 Special Characters Removal",
);
assert.ok(
  agentsMd.includes("Stage 4: Sentence Boundary Detection & Punctuation Splitting"),
  "AGENTS.md must define Stage 4 Boundary Detection",
);
assert.ok(
  agentsMd.includes("Stage 5: Translation Stage"),
  "AGENTS.md must define Stage 5 Translation",
);
assert.ok(
  agentsMd.includes("Stage 6: Multi-Language Alignment & Grid Formulation"),
  "AGENTS.md must define Stage 6 Multi-Language Alignment",
);
assert.ok(
  agentsMd.includes("Stage 7: Audio Playback Coordination & TTS Synthesis"),
  "AGENTS.md must define Stage 7 Audio/TTS Playback",
);
console.log("✓ AGENTS.md all 7 sequential application stages verified.");

// 2. Verify Restrict Rule in AGENTS.md
assert.ok(
  agentsMd.includes("Special characters removal MUST happen BEFORE the translation stage"),
  "AGENTS.md must mandate special characters removal before translation",
);
assert.ok(
  agentsMd.includes("Absolute Parity Rule Between Advanced and Beginner Modes"),
  "AGENTS.md must mandate parity between Advanced and Beginner modes",
);
console.log("✓ AGENTS.md restrict rules (order and mode parity) verified.");

// 3. Test removeSpecialCharacters behavior
const rawInputWithNoise = ">> [Music] (applause) Welcome to the show! We are learning subtitles.";
const cleaned = removeSpecialCharacters(rawInputWithNoise);
assert.strictEqual(
  cleaned,
  "Welcome to the show! We are learning subtitles.",
  `Noise should be cleanly stripped. Got: "${cleaned}"`,
);

const pureNoise = "[Music] (applause)";
assert.strictEqual(removeSpecialCharacters(pureNoise), "", "Pure sound cues must resolve to empty string");
console.log("✓ removeSpecialCharacters successfully stripped speaker tags, arrows, and bracketed sound cues.");

// 4. Test that translation stage honors Special Characters Removal BEFORE Translation
async function testTranslationPreSanitization() {
  // Pure noise string must not even trigger network fetch and return empty string
  const res = await translateWithGoogle({
    text: "[Music] (cheering)",
    fromLang: "en",
    toLang: "es",
  });
  assert.strictEqual(res, "", "Translation of pure special characters must resolve to empty string");
  console.log("✓ translateWithGoogle verifies special characters removal before translation.");
}

// 5. Test Parity between Beginner Mode cleanSubtitleText and Advanced removeSpecialCharacters
const beginnerCleaned = cleanSubtitleText(">> [Music] Hello world!", {
  stripSpeakerBrackets: true,
  removeChars: [">>", ">"],
});
const advancedCleaned = removeSpecialCharacters(">> [Music] Hello world!", {
  stripSpeakerBrackets: true,
  removeChars: [">>", ">"],
});
assert.strictEqual(
  beginnerCleaned,
  advancedCleaned,
  "Beginner and Advanced clean logic must produce 100% identical outputs",
);
assert.strictEqual(beginnerCleaned, "Hello world!", "Cleaned string must be 'Hello world!'");
console.log("✓ Beginner Mode cleanSubtitleText and Advanced removeSpecialCharacters confirmed 100% identical.");

testTranslationPreSanitization().then(() => {
  console.log("=== All Application Stages Pipeline Checks Passed Successfully! ===");
});
