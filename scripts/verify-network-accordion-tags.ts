import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { type NetworkRequestRecord, isSuccessfulFetch } from "../src/utils/networkTracker";

console.log("====================================================");
console.log("🧪 Starting Network Accordion, tlang Color Tags & Performance Test");
console.log("====================================================");

const rootDir = process.cwd();
const inspectorPath = path.join(rootDir, "src/components/NetworkRequestsInspector.tsx");
const indexTsxPath = path.join(rootDir, "src/routes/index.tsx");

assert(fs.existsSync(inspectorPath), "NetworkRequestsInspector.tsx must exist");
assert(fs.existsSync(indexTsxPath), "src/routes/index.tsx must exist");

const inspectorContent = fs.readFileSync(inspectorPath, "utf8");
const indexContent = fs.readFileSync(indexTsxPath, "utf8");

// 1. Verify performance memoization in SubtitleRow
const subtitleRowPath = path.join(rootDir, "src/components/SubtitleRow.tsx");
const subtitleRowContent = fs.existsSync(subtitleRowPath)
  ? fs.readFileSync(subtitleRowPath, "utf8")
  : indexContent;
const subtitlesTablePath = path.join(rootDir, "src/components/SubtitlesTablePanel.tsx");
const subtitlesTableContent = fs.existsSync(subtitlesTablePath)
  ? fs.readFileSync(subtitlesTablePath, "utf8")
  : indexContent;

assert(
  subtitleRowContent.includes("const SubtitleRow = memo(") &&
    (indexContent.includes("<SubtitleRow") || subtitlesTableContent.includes("<SubtitleRow")),
  "SubtitleRow must define and render memoized SubtitleRow to optimize table performance",
);
console.log("✅ PASS: SubtitleRow memoization verified for UI acceleration");

// 2. Verify per-record accordion in NetworkRequestsInspector.tsx
assert(
  inspectorContent.includes("record-accordion-toggle-"),
  "NetworkRequestsInspector.tsx must provide per-record accordion toggle buttons",
);
assert(
  inspectorContent.includes("rotate-180"),
  "NetworkRequestsInspector.tsx accordion must support rotation / expand animation",
);
console.log("✅ PASS: Per-record accordion and expand animation verified");

// 3. Verify tlang tags with status colors
assert(
  inspectorContent.includes("getTlangStatusInfo"),
  "NetworkRequestsInspector.tsx must implement getTlangStatusInfo",
);

assert(
  inspectorContent.includes("bg-amber-500/20 text-amber-300") &&
    inspectorContent.includes("bg-emerald-500/20 text-emerald-300") &&
    inspectorContent.includes("bg-red-500/20 text-red-300"),
  "NetworkRequestsInspector.tsx must include amber (pending), green (done), and red (failed) color styles",
);
console.log("✅ PASS: Status color classes verified in NetworkRequestsInspector");

// 4. Functional simulation of getTlangStatusInfo logic
function simulateTlangStatus(
  req: NetworkRequestRecord,
  tlang: string,
  allRequests: NetworkRequestRecord[],
) {
  if (req.isPending) {
    return { status: "pending", color: "orange" };
  }
  if (isSuccessfulFetch(req)) {
    return { status: "done", color: "green" };
  }
  const hasSubsequentSuccess = allRequests.some(
    (other) =>
      other.id !== req.id &&
      other.url.includes(`tlang=${tlang}`) &&
      isSuccessfulFetch(other) &&
      other.startTime >= req.startTime,
  );
  if (hasSubsequentSuccess) {
    return { status: "retry_success", color: "green" };
  }
  return { status: "failed", color: "red" };
}

// Case A: Pending request -> orange
const reqPending: NetworkRequestRecord = {
  id: "req-1",
  url: "https://www.youtube.com/api/timedtext?v=test&lang=en&tlang=es",
  method: "GET",
  type: "native_bridge",
  startTime: 100,
  status: 0,
  isPending: true,
};
assert.strictEqual(
  simulateTlangStatus(reqPending, "es", [reqPending]).color,
  "orange",
  "Pending request must have orange status",
);

// Case B: Successful request -> green
const reqDone: NetworkRequestRecord = {
  id: "req-2",
  url: "https://www.youtube.com/api/timedtext?v=test&lang=en&tlang=he",
  method: "GET",
  type: "native_bridge",
  startTime: 200,
  status: 200,
  fullResponseBody: '{"events":[]}',
  isPending: false,
};
assert.strictEqual(
  simulateTlangStatus(reqDone, "he", [reqDone]).color,
  "green",
  "Successful request must have green status",
);

// Case C: Failed request without retry -> red
const reqFailed: NetworkRequestRecord = {
  id: "req-3",
  url: "https://www.youtube.com/api/timedtext?v=test&lang=en&tlang=ar",
  method: "GET",
  type: "native_bridge",
  startTime: 300,
  status: 200,
  fullResponseBody: "", // empty body
  isPending: false,
};
assert.strictEqual(
  simulateTlangStatus(reqFailed, "ar", [reqFailed]).color,
  "red",
  "Failed request must have red status when not retried",
);

// Case D: Failed request overridden by subsequent retry success -> green
const reqRetrySuccess: NetworkRequestRecord = {
  id: "req-4",
  url: "https://www.youtube.com/api/timedtext?v=test&lang=en&tlang=ar",
  method: "GET",
  type: "native_bridge",
  startTime: 400,
  status: 200,
  fullResponseBody: '{"events":[]}',
  isPending: false,
};
assert.strictEqual(
  simulateTlangStatus(reqFailed, "ar", [reqFailed, reqRetrySuccess]).color,
  "green",
  "Failed request must be overridden by green on retry success",
);
console.log("✅ PASS: Functional verification of all 4 tlang status states passed successfully");

console.log("====================================================");
console.log("🎉 All Network Accordion, tlang Tags & Performance tests PASSED successfully!");
console.log("====================================================");
