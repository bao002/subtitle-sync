import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  logBuffer,
  logInfo,
  logError,
  logStateMachineAction,
  copyErrorOnlyToClipboard,
  copyLogAroundErrorToClipboard,
} from "../src/utils/logBuffer";

console.log("=== Verifying Task 399: Log Element Error Copy Modes (Error Only & Around Error) ===");

logBuffer.clear();

// Seed distant early entries that MUST NOT appear in "around error" window or "error only" output
for (let i = 1; i <= 12; i++) {
  logInfo("FarBefore", `DISTANT_BEFORE_${i}`);
}

// Seed entries immediately before Error A
logStateMachineAction("NEAR_BEFORE_1", { step: 1 });
logInfo("NearBefore", "NEAR_BEFORE_2");
logInfo("NearBefore", "NEAR_BEFORE_3");

const errorA = logError("SubtitleFetch", "ERROR_A_TIMEDTEXT_403", { code: 403 });

// Seed entries after Error A and far later
logInfo("NearAfter", "NEAR_AFTER_1");
logInfo("NearAfter", "NEAR_AFTER_2");

for (let i = 1; i <= 10; i++) {
  logInfo("FarAfter", `DISTANT_AFTER_${i}`);
}

const errorB = logError("TtsEngine", "ERROR_B_VOICE_TIMEOUT", { timeout: 5000 });

// 1. Verify formatOnlyErrorLogs(errorA.id) includes ONLY errorA
const onlyErrorA = logBuffer.formatOnlyErrorLogs(errorA.id);
assert.ok(onlyErrorA.includes("ERROR_A_TIMEDTEXT_403"), "Error-only output must include target errorA");
assert.ok(!onlyErrorA.includes("ERROR_B_VOICE_TIMEOUT"), "Error-only output for errorA must not include errorB");
assert.ok(!onlyErrorA.includes("DISTANT_BEFORE_1"), "Error-only output must not include non-error logs");
assert.ok(!onlyErrorA.includes("NEAR_BEFORE_2"), "Error-only output must not include surrounding info logs");
assert.ok(!onlyErrorA.includes("DISTANT_AFTER_1"), "Error-only output must not include later info logs");
console.log("✔ formatOnlyErrorLogs(errorId) isolates the exact error log.");

// 2. Verify formatOnlyErrorLogs() without ID includes both errors and zero non-error logs
const onlyAllErrors = logBuffer.formatOnlyErrorLogs();
assert.ok(onlyAllErrors.includes("ERROR_A_TIMEDTEXT_403"), "All-errors-only must include errorA");
assert.ok(onlyAllErrors.includes("ERROR_B_VOICE_TIMEOUT"), "All-errors-only must include errorB");
assert.ok(!onlyAllErrors.includes("NEAR_BEFORE_2"), "All-errors-only must not include non-error logs");
console.log("✔ formatOnlyErrorLogs() excludes all non-error logs.");

// 3. Verify formatLogAroundError(errorA.id, 3, 2) copies ONLY the window around errorA (NOT all logs)
const aroundErrorA = logBuffer.formatLogAroundError(errorA.id, 3, 2);
assert.ok(aroundErrorA.includes(">>> [TARGET ERROR]"), "Around-error output must highlight target error");
assert.ok(aroundErrorA.includes("ERROR_A_TIMEDTEXT_403"), "Around-error output must include target error");
assert.ok(aroundErrorA.includes("NEAR_BEFORE_1"), "Around-error output must include preceding window entry 1");
assert.ok(aroundErrorA.includes("NEAR_BEFORE_3"), "Around-error output must include preceding window entry 3");
assert.ok(aroundErrorA.includes("NEAR_AFTER_1"), "Around-error output must include trailing window entry 1");
assert.ok(aroundErrorA.includes("NEAR_AFTER_2"), "Around-error output must include trailing window entry 2");
assert.ok(!aroundErrorA.includes("DISTANT_BEFORE_1"), "Around-error output MUST NOT copy distant early logs");
assert.ok(!aroundErrorA.includes("DISTANT_BEFORE_5"), "Around-error output MUST NOT copy outside-window early logs");
assert.ok(!aroundErrorA.includes("DISTANT_AFTER_5"), "Around-error output MUST NOT copy distant later logs");
assert.ok(!aroundErrorA.includes("ERROR_B_VOICE_TIMEOUT"), "Around-error output for errorA must not pull unrelated distant errorB");
console.log("✔ formatLogAroundError slices strictly the window around the target error (not all logs).");

// 4. Verify clipboard copy functions write expected payloads
let copiedText = "";
Object.defineProperty(globalThis, "navigator", {
  value: {
    clipboard: {
      writeText: async (text: string) => {
        copiedText = text;
      },
    },
  },
  configurable: true,
});

const okOnly = await copyErrorOnlyToClipboard(errorA.id);
assert.equal(okOnly, true, "copyErrorOnlyToClipboard should resolve true");
assert.equal(copiedText, onlyErrorA, "Clipboard should receive exact error-only text");

const okAround = await copyLogAroundErrorToClipboard(errorA.id, 3, 2);
assert.equal(okAround, true, "copyLogAroundErrorToClipboard should resolve true");
assert.equal(copiedText, aroundErrorA, "Clipboard should receive exact around-error text");
console.log("✔ Clipboard helpers write error-only and around-error slices accurately.");

// 5. Verify BottomLogViewer.tsx and FloatingErrorButton.tsx expose both error copy buttons
const bottomViewerSrc = fs.readFileSync(path.resolve("src/components/BottomLogViewer.tsx"), "utf-8");
assert.ok(bottomViewerSrc.includes('data-testid="bottom-log-copy-error-only-btn"'));
assert.ok(bottomViewerSrc.includes('data-testid="bottom-log-copy-around-error-btn"'));
assert.ok(bottomViewerSrc.includes("log-record-copy-error-btn-"));
assert.ok(bottomViewerSrc.includes("log-record-copy-around-btn-"));
assert.ok(bottomViewerSrc.includes("copyErrorOnlyToClipboard"));
assert.ok(bottomViewerSrc.includes("copyLogAroundErrorToClipboard"));

const floatingErrorSrc = fs.readFileSync(path.resolve("src/components/FloatingErrorButton.tsx"), "utf-8");
assert.ok(floatingErrorSrc.includes('data-testid="copy-error-only-clipboard-btn"'));
assert.ok(floatingErrorSrc.includes('data-testid="copy-around-error-clipboard-btn"'));
assert.ok(floatingErrorSrc.includes("btn-copy-error-only-"));
assert.ok(floatingErrorSrc.includes("btn-copy-around-error-"));
assert.ok(floatingErrorSrc.includes("copyErrorOnlyToClipboard"));
assert.ok(floatingErrorSrc.includes("copyLogAroundErrorToClipboard"));

console.log("✔ UI components expose Copy Error Only and Copy Around Error buttons on errors.");
console.log("=== Task 399 Verification PASSED ===");
