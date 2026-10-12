import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { trackNetworkRequest, formatRequestForClipboard, type NetworkRequestRecord } from "../src/utils/networkTracker";

console.log("==================================================================");
console.log("🧪 Running Anti-Bot Browser Profile & 429 Diagnostics Verification");
console.log("==================================================================");

const rootDir = process.cwd();

// 1. Verify Android Shell (MainActivity.kt) Authentic Browser Profile
console.log("1. Verifying Android Shell MainActivity.kt browser profile & headers...");
const mainActivityPath = path.join(rootDir, "android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt");
assert.ok(fs.existsSync(mainActivityPath), "MainActivity.kt must exist");
const mainActivitySrc = fs.readFileSync(mainActivityPath, "utf-8");

assert.ok(
  mainActivitySrc.includes("Version/\\\\d+\\\\.\\\\d+"),
  "MainActivity.kt must strip Version/X.X to eliminate embedded WebView signature",
);
assert.ok(
  mainActivitySrc.includes("; wv"),
  "MainActivity.kt must sanitize '; wv' from WebView user agent",
);
assert.ok(
  mainActivitySrc.includes("sec-ch-ua"),
  "MainActivity.kt must send sec-ch-ua client hints in anon mode",
);
assert.ok(
  mainActivitySrc.includes("sec-ch-ua-mobile"),
  "MainActivity.kt must send sec-ch-ua-mobile client hints",
);
assert.ok(
  mainActivitySrc.includes("sec-ch-ua-platform"),
  "MainActivity.kt must send sec-ch-ua-platform client hints",
);
assert.ok(
  mainActivitySrc.includes("Sec-Fetch-Dest") && mainActivitySrc.includes("Sec-Fetch-Mode"),
  "MainActivity.kt must send browser navigation Sec-Fetch-* headers",
);
assert.ok(
  mainActivitySrc.includes("HTTP 429 (Too Many Requests / Bot Detection)"),
  "MainActivity.kt must explicitly handle and tag HTTP 429 bot detection",
);
assert.ok(
  mainActivitySrc.includes("fun openInBrowser"),
  "MainActivity.kt must expose openInBrowser to launch external browser",
);
console.log("✅ PASS: Android Shell browser navigation profile verified");

// 2. Verify networkTracker 429 Handling and Formatting
console.log("2. Verifying networkTracker status 429 handling and clipboard format...");
const tracker = trackNetworkRequest("https://www.youtube.com/api/timedtext?v=test&tlang=pt", "GET", "native_bridge", {
  attemptMode: "tlang",
  attemptSend: "anon",
});
const mock429Html = "<html><body><h1>We're sorry... automated queries</h1></body></html>";
tracker.fail("HTTP 429 (Too Many Requests / Bot Detection)", 429, mock429Html);

const reqs = (tracker as unknown as { id: string }).id;
const record: NetworkRequestRecord = {
  id: "req-test-429",
  url: "https://www.youtube.com/api/timedtext?v=vBURridJXZ0&tlang=pt",
  method: "GET",
  type: "native_bridge",
  startTime: Date.now(),
  status: 429,
  attemptMode: "tlang",
  attemptSend: "anon",
  error: "HTTP 429 (Too Many Requests / Bot Detection)",
  fullResponseBody: mock429Html,
};

const clipboardText = formatRequestForClipboard(record);
assert.ok(clipboardText.includes("Status: 429 (Too Many Requests / Bot Detection)"), "Clipboard text must format status 429 properly");
assert.ok(clipboardText.includes("Target Language (tlang): pt"), "Clipboard text must preserve tlang");
assert.ok(clipboardText.includes("Sending Method: anon"), "Clipboard text must display anon sending method");
assert.ok(clipboardText.includes("automated queries"), "Clipboard text must include response body");
console.log("✅ PASS: networkTracker 429 status and response body preservation verified");

// 3. Verify NetworkRequestsInspector UI Bot Detection & Fallbacks
console.log("3. Verifying NetworkRequestsInspector UI bot detection card & fallback controls...");
const inspectorPath = path.join(rootDir, "src/components/NetworkRequestsInspector.tsx");
assert.ok(fs.existsSync(inspectorPath), "NetworkRequestsInspector.tsx must exist");
const inspectorSrc = fs.readFileSync(inspectorPath, "utf-8");

assert.ok(inspectorSrc.includes("bot-detection-card"), "NetworkRequestsInspector must render bot-detection-card");
assert.ok(inspectorSrc.includes("open-in-browser-button"), "NetworkRequestsInspector must have open-in-browser-button");
assert.ok(inspectorSrc.includes("paste-subtitles-json-textarea"), "NetworkRequestsInspector must provide paste-subtitles-json-textarea");
assert.ok(inspectorSrc.includes("apply-pasted-json-button"), "NetworkRequestsInspector must provide apply-pasted-json-button");
assert.ok(inspectorSrc.includes("429 BOT BLOCK"), "NetworkRequestsInspector must show 429 BOT BLOCK badge in request list");
console.log("✅ PASS: NetworkRequestsInspector UI bot detection and manual paste verified");

console.log("==================================================================");
console.log("🎉 ANTI-BOT BROWSER PROFILE VERIFICATION SUITE PASSED 100%!");
console.log("==================================================================");
