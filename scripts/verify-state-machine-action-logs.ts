import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { logBuffer, logError, logStateMachineAction } from "../src/utils/logBuffer";

logBuffer.clear();
const startedAt = Date.now();
const action = logStateMachineAction("PLAYBACK_RESUMED", {
  from: "paused",
  to: "playing",
});
logError("State Machine", "TTS playback failed", { section: 12 });

assert.ok(action.timestamp >= startedAt, "Action records must include a current timestamp");
assert.match(action.formattedTime, /^\d{2}:\d{2}:\d{2}\.\d{3}$/);
assert.equal(action.level, "ACTION");

const copiedLogs = logBuffer.copyAll();
assert.match(copiedLogs, /PLAYBACK_RESUMED/);
assert.match(copiedLogs, /TTS playback failed/);
assert.match(copiedLogs, /\[ERROR\] \[State Machine\]/);

const inspectorPath = path.resolve(
  process.cwd(),
  "src/components/StateMachineActionLogsInspector.tsx",
);
const inspectorSource = fs.readFileSync(inspectorPath, "utf-8");
assert.ok(
  inspectorSource.includes('entry.level === "ACTION" || entry.level === "ERROR"'),
  "The inspector must display both state-machine actions and error records",
);
assert.ok(
  inspectorSource.includes("new Date(entry.timestamp).toISOString()"),
  "Each displayed log record must include its timestamp",
);
assert.ok(
  inspectorSource.includes("navigator.clipboard.writeText(logBuffer.copyAll())"),
  "Copy All Logs must copy the complete diagnostic report",
);

console.log("PASS: Timestamped actions and errors are visible and included in copy-all logs.");
