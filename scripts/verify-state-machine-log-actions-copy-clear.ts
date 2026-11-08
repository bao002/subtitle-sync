import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { logBuffer, logError, logStateMachineAction } from "../src/utils/logBuffer";

console.log("Starting verification for Task 318: State Machine Actions in Log View with Clear & Copy-to-Clipboard...");

// 1. Verify logBuffer state machine action recording
logBuffer.clear();
assert.equal(logBuffer.getEntries().length, 0, "logBuffer must be empty after clear()");

const t0 = Date.now();
const actionEntry = logStateMachineAction("TEST_STATE_TRANSITION", {
  previousState: "PAUSED",
  nextState: "PLAYING",
  trigger: "user_click_play",
});

assert.ok(actionEntry.id, "Action entry must have a unique ID");
assert.equal(actionEntry.level, "ACTION", "Level must be ACTION");
assert.equal(actionEntry.category, "State Machine", "Category must be State Machine");
assert.equal(actionEntry.message, "TEST_STATE_TRANSITION");
assert.equal(actionEntry.details.nextState, "PLAYING");
assert.ok(actionEntry.timestamp >= t0, "Timestamp must be >= test start time");
assert.match(actionEntry.formattedTime, /^\d{2}:\d{2}:\d{2}\.\d{3}$/, "formattedTime must match HH:MM:SS.mmm");

// 2. Verify error recording alongside state machine actions
const errorEntry = logError("State Machine", "Playback synchronization timeout", {
  cueIndex: 4,
  timeoutMs: 3000,
});
assert.equal(errorEntry.level, "ERROR");
assert.equal(logBuffer.getEntries().length, 2, "Buffer should contain 2 entries");

// 3. Verify copyAll() diagnostic report generation
const copyPayload = logBuffer.copyAll("Playback stalled at section 4");
assert.ok(copyPayload.includes("TEST_STATE_TRANSITION"), "Copy payload must contain the action message");
assert.ok(copyPayload.includes("Playback synchronization timeout"), "Copy payload must contain the error message");
assert.ok(copyPayload.includes("[ACTION] [State Machine]"), "Copy payload must contain the ACTION record");
assert.ok(copyPayload.includes("[ERROR] [State Machine]"), "Copy payload must contain the ERROR record");
assert.ok(copyPayload.includes("Playback stalled at section 4"), "Copy payload must include the user complaint / context");

// 4. Verify clear() operation
logBuffer.clear();
assert.equal(logBuffer.getEntries().length, 0, "Buffer should be empty after clear()");
assert.equal(logBuffer.getSnapshot().length, 0, "Snapshot should be empty after clear()");

// 5. Verify BottomLogViewer.tsx contains required elements & handlers
const viewerPath = path.resolve(process.cwd(), "src/components/BottomLogViewer.tsx");
const viewerSource = fs.readFileSync(viewerPath, "utf-8");

assert.ok(
  viewerSource.includes('data-testid="bottom-log-viewer"'),
  "BottomLogViewer must have data-testid='bottom-log-viewer'",
);
assert.ok(
  viewerSource.includes('data-testid="bottom-log-copy-button"'),
  "BottomLogViewer must include copy button with data-testid='bottom-log-copy-button'",
);
assert.ok(
  viewerSource.includes("navigator.clipboard.writeText(logBuffer.copyAll())"),
  "Copy button must write logBuffer.copyAll() to clipboard",
);
assert.ok(
  viewerSource.includes('data-testid="bottom-log-clear-button"'),
  "BottomLogViewer must include clear button with data-testid='bottom-log-clear-button'",
);
assert.ok(
  viewerSource.includes("logBuffer.clear()"),
  "Clear button must invoke logBuffer.clear()",
);
assert.ok(
  viewerSource.includes('data-testid="bottom-log-filter-actions-errors"'),
  "BottomLogViewer must include Actions/Errors filter toggle",
);
assert.ok(
  viewerSource.includes('entry.level === "ACTION" || entry.level === "ERROR"'),
  "Filter must isolate ACTION and ERROR entries",
);

// 6. Verify src/routes/index.tsx logs real state machine events
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexSource = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexSource.includes("logStateMachineAction"),
  "src/routes/index.tsx must import and use logStateMachineAction",
);
assert.ok(
  indexSource.includes('"PLAYBACK_PAUSE_REQUESTED"'),
  "Must log PLAYBACK_PAUSE_REQUESTED on pause",
);
assert.ok(
  indexSource.includes('"PLAYBACK_RESUME_REQUESTED"'),
  "Must log PLAYBACK_RESUME_REQUESTED on resume",
);
assert.ok(
  indexSource.includes('"PLAYER_STATE_CHANGED"'),
  "Must log PLAYER_STATE_CHANGED on YouTube player state change",
);
assert.ok(
  indexSource.includes('"TTS_SECTION_STARTED"'),
  "Must log TTS_SECTION_STARTED during TTS synthesis",
);
assert.ok(
  indexSource.includes('"TTS_SECTION_FINISHED"'),
  "Must log TTS_SECTION_FINISHED when TTS synthesis finishes",
);

console.log("PASS: Task 318 - State Machine Actions in Log View with Clear & Copy-to-Clipboard fully verified.");
