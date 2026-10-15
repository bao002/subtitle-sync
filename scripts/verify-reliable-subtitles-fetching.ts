import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import {
  DEFAULT_ATTEMPT_ORDER,
  normalizeAttemptOrder,
  moveAttempt,
  promoteAttempt,
  runFetchAttempts,
  nativeExactFetch,
  buildAttemptUrl,
  type FetchAttempt,
  type ExactFetchResult,
} from "../src/lib/subtitle-fetch-plan";
import { isValidJsonSubtitleResponse } from "../src/utils/subtitleCache";

console.log("==================================================================");
console.log("🧪 Running Reliable Subtitles Fetching Implementation Verification");
console.log("==================================================================");

const rootDir = process.cwd();

// 1. Verify Attempt Order Defaults and Normalization
console.log("1. Verifying Attempt Order defaults and normalization...");
assert.strictEqual(DEFAULT_ATTEMPT_ORDER.length, 4, "Must have exactly 4 default attempts");
assert.deepStrictEqual(DEFAULT_ATTEMPT_ORDER[0], {
  mode: "tlang",
  send: "session",
  enabled: true,
});
assert.deepStrictEqual(DEFAULT_ATTEMPT_ORDER[1], {
  mode: "lang",
  send: "session",
  enabled: true,
});
assert.deepStrictEqual(DEFAULT_ATTEMPT_ORDER[2], {
  mode: "tlang",
  send: "anon",
  enabled: true,
});
assert.deepStrictEqual(DEFAULT_ATTEMPT_ORDER[3], {
  mode: "lang",
  send: "anon",
  enabled: true,
});

// Normalization preserves order and fills missing
const partial = normalizeAttemptOrder([{ mode: "lang", send: "anon", enabled: true }]);
assert.strictEqual(partial.length, 4, "Normalized list must contain 4 attempts");
assert.strictEqual(partial[0]?.mode, "lang");
assert.strictEqual(partial[0]?.send, "anon");
console.log("✅ PASS: Default attempt order and normalization verified");

// 2. Reordering and Promotion
console.log("2. Verifying moveAttempt and promoteAttempt...");
let order = [...DEFAULT_ATTEMPT_ORDER];
// Move 0 down -> should swap 0 and 1
order = moveAttempt(order, 0, 1);
assert.strictEqual(order[0]?.mode, "lang");
assert.strictEqual(order[1]?.mode, "tlang");

// Move back up
order = moveAttempt(order, 1, -1);
assert.strictEqual(order[0]?.mode, "tlang");

// Promote last to front
const promoted = promoteAttempt(order, { mode: "lang", send: "anon" });
assert.strictEqual(promoted[0]?.mode, "lang");
assert.strictEqual(promoted[0]?.send, "anon");
assert.strictEqual(promoted.length, 4);
console.log("✅ PASS: moveAttempt and promoteAttempt verified");

// 3. Execution Loop with runFetchAttempts
console.log("3. Verifying runFetchAttempts execution loop...");
const mockObserved = "https://www.youtube.com/api/timedtext?v=test1234567&lang=en";
const callsMade: string[] = [];
const goodJson = JSON.stringify({
  events: [
    {
      tStartMs: 0,
      dDurationMs: 1000,
      segs: [{ utf8: "שלום עולם" }],
    },
  ],
});

// Case A: First attempt fails, second attempt succeeds -> stops immediately
const execResult = runFetchAttempts({
  observedUrl: mockObserved,
  lang: "he",
  order: [
    { mode: "tlang", send: "session", enabled: true },
    { mode: "lang", send: "session", enabled: true },
    { mode: "tlang", send: "anon", enabled: true },
  ],
  send: (url, withSession): ExactFetchResult => {
    callsMade.push(`${url}|${withSession ? "session" : "anon"}`);
    if (callsMade.length === 1) {
      return { status: 404, body: "", sentUrl: url, send: "session", error: "Not Found" };
    }
    return { status: 200, body: goodJson, sentUrl: url, send: "session" };
  },
  isGood: (body) => isValidJsonSubtitleResponse(body),
});

assert(execResult !== null, "Execution must yield a winner");
assert.strictEqual(execResult?.winner.mode, "lang");
assert.strictEqual(
  callsMade.length,
  2,
  "Must stop at first good response without trying 3rd attempt",
);
console.log("✅ PASS: runFetchAttempts stops at first good response and returns winner");

// 4. Verify nativeExactFetch parser
console.log("4. Verifying nativeExactFetch bridge call parser...");
const fakeBridge = {
  fetchTimedTextExact: (url: string, withSession: boolean) =>
    JSON.stringify({
      status: 200,
      body: goodJson,
      sentUrl: url,
      send: withSession ? "session" : "anon",
    }),
};
const bridgeResult = nativeExactFetch(fakeBridge, "https://example.com/test", true);
assert.strictEqual(bridgeResult.status, 200);
assert.strictEqual(bridgeResult.send, "session");
assert.strictEqual(bridgeResult.body, goodJson);
console.log("✅ PASS: nativeExactFetch correctly formats bridge return");

// 5. Verify Component & Source Integrity
console.log("5. Verifying component and route integration...");
const attemptSettingsFile = path.join(rootDir, "src/components/AttemptOrderSettings.tsx");
assert(fs.existsSync(attemptSettingsFile), "AttemptOrderSettings.tsx must exist");
const attemptSettingsContent = fs.readFileSync(attemptSettingsFile, "utf8");
assert(attemptSettingsContent.includes("subtitle-attempt-order-settings"));
assert(attemptSettingsContent.includes("reset-attempt-order-button"));
assert(attemptSettingsContent.includes("promote-successful-attempt-toggle"));

const indexFile = path.join(rootDir, "src/routes/index.tsx");
const indexContent = fs.readFileSync(indexFile, "utf8");
assert(indexContent.includes("runFetchAttempts"), "index.tsx must use runFetchAttempts");
assert(indexContent.includes("AttemptOrderSettings"), "index.tsx must render AttemptOrderSettings");
assert(
  indexContent.includes("onFetchAgainWithSession"),
  "index.tsx must pass onFetchAgainWithSession",
);
assert(indexContent.includes("onFetchAgainAnon"), "index.tsx must pass onFetchAgainAnon");
assert(indexContent.includes("onUseTheseSubtitles"), "index.tsx must pass onUseTheseSubtitles");

const inspectorFile = path.join(rootDir, "src/components/NetworkRequestsInspector.tsx");
const inspectorContent = fs.readFileSync(inspectorFile, "utf8");
assert(
  inspectorContent.includes("fetch-again-session-button"),
  "Inspector must have Fetch again session button",
);
assert(
  inspectorContent.includes("fetch-again-anon-button"),
  "Inspector must have Fetch again anon button",
);
assert(
  inspectorContent.includes("use-these-subtitles-button"),
  "Inspector must have Use these subtitles button",
);

console.log("✅ PASS: All files, components, buttons, and handlers verified in code");

console.log("==================================================================");
console.log("🎉 RELIABLE SUBTITLES FETCHING VERIFICATION SUITE PASSED 100%!");
console.log("==================================================================");
