import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying Task 370: TTS Playback Coordination & Overlap Prevention");
console.log("=========================================================================");

const rootDir = process.cwd();

// Section 1: Check speakRow dynamic timeouts in src/routes/index.tsx
console.log("\n⏱️ Section 1: Validating Elimination of Premature Static 8000ms Timeouts");
const indexContent = fs.readFileSync(path.resolve(rootDir, "src/routes/index.tsx"), "utf-8");

assert.ok(
  !indexContent.includes("speakPromise,\n                    new Promise<void>((resolve) => setTimeout(resolve, 8000))"),
  "Static 8000ms timeout for speakPromise must be eliminated from speakRow",
);
assert.ok(
  !indexContent.includes("speakWordPromise,\n                    new Promise<void>((resolve) => setTimeout(resolve, 8000))"),
  "Static 8000ms timeout for speakWordPromise must be eliminated from speakRow",
);
assert.ok(
  !indexContent.includes("speakTransPromise,\n                    new Promise<void>((resolve) => setTimeout(resolve, 8000))"),
  "Static 8000ms timeout for speakTransPromise must be eliminated from speakRow",
);

assert.ok(
  indexContent.includes("textWaitMs"),
  "speakRow must use dynamic textWaitMs based on text length and speed",
);
assert.ok(
  indexContent.includes("wordWaitMs"),
  "speakRow must use dynamic wordWaitMs based on word length and speed",
);
assert.ok(
  indexContent.includes("transWaitMs"),
  "speakRow must use dynamic transWaitMs based on translation length and speed",
);

console.log("✅ PASS: speakRow dynamic timeouts validated.");

// Section 2: Speech Mutex & Overlap Prevention
console.log("\n🔒 Section 2: Validating Speech Mutex & Interruption Handling");
assert.ok(
  indexContent.includes("activeSpeechJobId"),
  "src/routes/index.tsx must define activeSpeechJobId mutex for coordination",
);
assert.ok(
  indexContent.includes("cancelAlternativeTtsAudio()"),
  "speak function must cancel any existing alternative audio before starting new speech",
);
assert.ok(
  indexContent.includes("window.speechSynthesis.cancel()"),
  "speak function must cancel any existing Web Speech before starting new speech",
);

console.log("✅ PASS: Speech playback mutex and parallel overlap prevention validated.");

// Section 3: Check alternative-tts.ts watchdog timer
console.log("\n🛡️ Section 3: Validating Alternative TTS Watchdog Dynamic Scaling");
const altTtsContent = fs.readFileSync(path.resolve(rootDir, "src/lib/alternative-tts.ts"), "utf-8");

assert.ok(
  altTtsContent.includes("Math.max(16000,"),
  "playAlternativeTtsAudio watchdog timer must provide at least 16s baseline and scale with rate",
);
assert.ok(
  altTtsContent.includes("effectiveRate"),
  "playAlternativeTtsAudio watchdog timer must account for playback rate",
);

console.log("✅ PASS: Alternative TTS watchdog dynamic scaling validated.");

console.log("=========================================================================");
console.log("🎉 ALL TASK 370 CHECKS PASSED: TTS Playback Coordination Verified!");
console.log("=========================================================================");
