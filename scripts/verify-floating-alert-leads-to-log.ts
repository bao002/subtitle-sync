import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logBuffer, logError, logStateMachineAction, leadToLogRecord, copyAllLogToClipboard } from "../src/utils/logBuffer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=== Running Verification: Floating Alert Button Leads to Log Element, Focused Record & Copy All Log ===");

// 1. Verify logBuffer capturing stack trace on logError
logBuffer.clear();

const testError = new Error("Sample synthetic timedtext decoding failure");
logStateMachineAction("SELECT_VIDEO", { videoId: "L2Ryrr6txwA" });
logStateMachineAction("FETCH_SUBTITLES_START", { lang: "en" });
logStateMachineAction("FETCH_SUBTITLES_PROGRESS", { step: "request_sent" });

const errorEntry = logError("SubtitleEngine", testError.message, { error: testError });

assert.ok(errorEntry.id, "Error entry should have an ID");
assert.equal(errorEntry.level, "ERROR", "Level should be ERROR");
assert.equal(errorEntry.message, "Sample synthetic timedtext decoding failure");
assert.ok(errorEntry.stack, "Error entry must have stack trace captured");
assert.ok(errorEntry.stack.includes("Sample synthetic timedtext decoding failure"), "Stack trace must contain error message");

console.log("✔ logError captures message and stack trace successfully.");

// 2. Verify preceding state machine actions up to error timestamp for reproduction
const preceding = logBuffer.getPrecedingActions(errorEntry.timestamp, 5);
assert.ok(preceding.length >= 3, `Expected at least 3 preceding actions, found ${preceding.length}`);
assert.equal(preceding[0].message, "SELECT_VIDEO");
assert.equal(preceding[1].message, "FETCH_SUBTITLES_START");
assert.equal(preceding[2].message, "FETCH_SUBTITLES_PROGRESS");

console.log("✔ Preceding state machine actions sequence extracted accurately for reproduction.");

// 3. Verify leadToLogRecord dispatches custom event and sets storage flags
let eventDispatched = false;
let dispatchedDetail: any = null;

// Mock window in Node environment
const mockListeners: Record<string, ((e: any) => void)[]> = {};
(globalThis as any).window = {
  dispatchEvent: (event: any) => {
    eventDispatched = true;
    dispatchedDetail = event.detail;
    if (mockListeners[event.type]) {
      mockListeners[event.type].forEach(fn => fn(event));
    }
    return true;
  },
  addEventListener: (type: string, fn: any) => {
    mockListeners[type] = mockListeners[type] || [];
    mockListeners[type].push(fn);
  },
  removeEventListener: (type: string, fn: any) => {
    if (mockListeners[type]) {
      mockListeners[type] = mockListeners[type].filter(f => f !== fn);
    }
  }
};

const mockStorage: Record<string, string> = {};
(globalThis as any).sessionStorage = {
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  getItem: (k: string) => mockStorage[k] || null
};
(globalThis as any).localStorage = {
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  getItem: (k: string) => mockStorage[k] || null
};

leadToLogRecord(errorEntry.id);

assert.equal(eventDispatched, true, "leadToLogRecord must dispatch window event");
assert.equal(dispatchedDetail?.entryId, errorEntry.id, "dispatched event detail must contain target entryId");
assert.equal(mockStorage["yt_show_bottom_log"], "true", "Storage key yt_show_bottom_log must be set to 'true'");

console.log("✔ leadToLogRecord dispatches event and activates bottom log viewer visibility.");

// 4. Verify generateTroubleshootingPrompt produces reproduction sequence and stack trace
const promptReport = logBuffer.generateTroubleshootingPrompt("Video failed to play subtitle track");
assert.ok(promptReport.includes("## 2.5 State Machine Actions Sequence for Reproduction"), "Report must include state machine reproduction sequence");
assert.ok(promptReport.includes("SELECT_VIDEO"), "Report must include SELECT_VIDEO action");
assert.ok(promptReport.includes("Stack Trace"), "Report must contain stack trace section");
assert.ok(promptReport.includes("Sample synthetic timedtext decoding failure"), "Report must contain error message");

console.log("✔ generateTroubleshootingPrompt contains state machine actions, timestamps, and stack traces.");

// 5. Verify source code conformance in FloatingErrorButton.tsx, BottomLogViewer.tsx, and routes/index.tsx
const floatingErrorBtnSrc = fs.readFileSync(path.join(__dirname, "../src/components/FloatingErrorButton.tsx"), "utf-8");
assert.ok(floatingErrorBtnSrc.includes('data-testid="floating-error-button"'), "FloatingErrorButton must have data-testid='floating-error-button'");
assert.ok(floatingErrorBtnSrc.includes('data-action="floating-alert-button"'), "FloatingErrorButton must identify as floating-alert-button");
assert.ok(floatingErrorBtnSrc.includes("leadToLogRecord("), "FloatingErrorButton click handler must invoke leadToLogRecord");
assert.ok(floatingErrorBtnSrc.includes('data-testid="btn-lead-to-log-record"'), "FloatingErrorButton items must provide inspect in log button");
assert.ok(floatingErrorBtnSrc.includes('data-testid="copy-all-log-clipboard-btn"'), "FloatingErrorButton must provide copy-all-log-clipboard-btn");

const bottomLogViewerSrc = fs.readFileSync(path.join(__dirname, "../src/components/BottomLogViewer.tsx"), "utf-8");
assert.ok(bottomLogViewerSrc.includes('id="bottom-log-viewer"'), "BottomLogViewer must have id='bottom-log-viewer'");
assert.ok(bottomLogViewerSrc.includes('"bottom-log-focused-record"'), "BottomLogViewer must highlight focused record with data-testid='bottom-log-focused-record'");
assert.ok(bottomLogViewerSrc.includes('"log-record-error-message"'), "BottomLogViewer must have log-record-error-message");
assert.ok(bottomLogViewerSrc.includes('data-testid="log-record-stack-trace"'), "BottomLogViewer must have log-record-stack-trace");
assert.ok(bottomLogViewerSrc.includes('data-testid="log-record-timestamp"'), "BottomLogViewer must have log-record-timestamp");
assert.ok(bottomLogViewerSrc.includes('data-testid="log-record-reproduction-sequence"'), "BottomLogViewer must render log-record-reproduction-sequence");
assert.ok(bottomLogViewerSrc.includes('data-testid="bottom-log-copy-all-button"'), "BottomLogViewer must have bottom-log-copy-all-button");

const indexSrc = fs.readFileSync(path.join(__dirname, "../src/routes/index.tsx"), "utf-8");
assert.ok(indexSrc.includes('window.addEventListener("lead-to-log-record"'), "index.tsx must listen to lead-to-log-record to reveal bottom log viewer");

console.log("✔ Source code contracts for floating alert button, bottom log viewer and routes/index.tsx fully conform.");
console.log("=== All Floating Alert Button & Log Record Lead-To Checks PASSED ===");
