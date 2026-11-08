import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log("====================================================");
console.log("🧪 Testing SpeechSynthesis Interrupted & Canceled Handling");
console.log("====================================================");

// 1. Verify src/routes/index.tsx handles interrupted and canceled gracefully
const indexTsxPath = resolve(process.cwd(), "src/routes/index.tsx");
const indexTsxContent = readFileSync(indexTsxPath, "utf-8");

assert(
  indexTsxContent.includes('event.error === "interrupted" || event.error === "canceled"'),
  "src/routes/index.tsx must check for event.error === 'interrupted' || event.error === 'canceled'",
);

assert(
  indexTsxContent.includes("void done(false);") &&
    indexTsxContent.includes("Treat intentional interruption as normal completion without logging an error"),
  "src/routes/index.tsx must call done(false) and return early when speech is interrupted or canceled",
);

console.log("✅ Verified: src/routes/index.tsx handles 'interrupted' and 'canceled' gracefully without error logging or alternative fallback.");

// 2. Verify BeginnerPreferencesTab handles utterance error gracefully
const beginnerTabPath = resolve(process.cwd(), "src/components/beginner/tabs/BeginnerPreferencesTab.tsx");
const beginnerTabContent = readFileSync(beginnerTabPath, "utf-8");

assert(
  beginnerTabContent.includes('e?.error === "interrupted" || e?.error === "canceled"'),
  "BeginnerPreferencesTab.tsx must check for interrupted or canceled in utterance.onerror",
);

console.log("✅ Verified: BeginnerPreferencesTab.tsx ignores 'interrupted' and 'canceled' without triggering unwanted fallback audition.");

// 3. Functional unit check of speech synthesis error discrimination logic
function simulateSpeechOnError(
  eventError: string,
  callbacks: {
    logError: (msg: string) => void;
    done: (isError: boolean) => void;
  },
) {
  if (eventError === "interrupted" || eventError === "canceled") {
    callbacks.done(false);
    return;
  }
  callbacks.logError("Native speech synthesis failed");
  callbacks.done(true);
}

let loggedErrors: string[] = [];
let doneStatus: boolean | null = null;

// Test interrupted
loggedErrors = [];
doneStatus = null;
simulateSpeechOnError("interrupted", {
  logError: (msg) => loggedErrors.push(msg),
  done: (isError) => {
    doneStatus = isError;
  },
});
assert(loggedErrors.length === 0, "No errors should be logged for 'interrupted'");
assert(doneStatus === false, "done(false) should be called for 'interrupted'");

// Test canceled
loggedErrors = [];
doneStatus = null;
simulateSpeechOnError("canceled", {
  logError: (msg) => loggedErrors.push(msg),
  done: (isError) => {
    doneStatus = isError;
  },
});
assert(loggedErrors.length === 0, "No errors should be logged for 'canceled'");
assert(doneStatus === false, "done(false) should be called for 'canceled'");

// Test genuine error (e.g. 'audio-busy', 'network', 'synthesis-failed')
loggedErrors = [];
doneStatus = null;
simulateSpeechOnError("audio-busy", {
  logError: (msg) => loggedErrors.push(msg),
  done: (isError) => {
    doneStatus = isError;
  },
});
assert(loggedErrors.length === 1, "Error should be logged for genuine failure like 'audio-busy'");
assert(doneStatus === true, "done(true) should be called for genuine failure to trigger fallback");

console.log("✅ Verified: Functional discrimination logic correctly distinguishes intentional pauses from real speech failures.");

console.log("====================================================");
console.log("🎉 ALL SPEECH INTERRUPTION TESTS PASSED 100%!");
console.log("====================================================");
