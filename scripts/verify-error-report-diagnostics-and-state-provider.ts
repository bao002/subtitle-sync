import assert from "node:assert";
import {
  logBuffer,
  logError,
  logInfo,
  logStateMachineAction,
  registerAppStateProvider,
} from "../src/utils/logBuffer";
import { trackNetworkRequest } from "../src/utils/networkTracker";

async function runVerification() {
  console.log("🧪 Starting verification: Error Report Diagnostics & App State Provider...");

  // 1. Clear logBuffer
  logBuffer.clear();

  // 2. Register mock app state provider
  registerAppStateProvider(() => ({
    videoId: "test_video_123",
    mode: "expert",
    stage: 2,
    isVideoPlaying: true,
    pauseReason: null,
    baseLanguage: "en",
    targetLanguages: ["es", "fr"],
    favoriteLanguages: ["es", "fr", "de"],
    rowsCount: 42,
    speakingRow: 3,
    speakingLang: "es",
  }));

  // 3. Emit some INFO and ACTION logs
  logInfo("System", "Application initialized successfully");
  logStateMachineAction("PLAYER_STATE_CHANGED", { videoId: "test_video_123", playerState: 1 });

  // 4. Track network requests (complete and fail)
  const req1 = trackNetworkRequest("https://www.youtube.com/api/timedtext?v=test_video_123&lang=en", "GET", "timedtext_interception");
  req1.complete(200, { events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "Hello world" }] }] });

  const req2 = trackNetworkRequest("https://api.example.com/tts", "POST", "fetch");
  req2.fail("Network connection timed out", 504);

  // 5. Emit an ERROR log
  logError("StateMachine", "TTS section playback failed", {
    videoId: "test_video_123",
    sectionId: "1000:2000",
    error: "Synthesis audio decoding error",
  });

  // 6. Generate troubleshooting prompt
  const report = logBuffer.generateTroubleshootingPrompt("Testing diagnostic generation");

  // Assertion: Active Errors & Failures section must appear at ## 0
  assert.ok(
    report.includes("## 0. Active Errors & Failures (1 recorded)"),
    "Report must contain Section 0 for active errors",
  );
  assert.ok(
    report.includes("Synthesis audio decoding error"),
    "Report must contain the exact error details in Section 0",
  );

  // Assertion: Live Application State Snapshot must contain registered state
  assert.ok(
    report.includes("## 1. Live Application State Snapshot"),
    "Report must contain Section 1 for live application state",
  );
  assert.ok(
    !report.includes("[State provider not registered]"),
    "Report must NOT say state provider is not registered when registered",
  );
  assert.ok(
    report.includes('"videoId": "test_video_123"'),
    "Report must output the videoId from the state provider",
  );
  assert.ok(
    report.includes('"rowsCount": 42'),
    "Report must output the rowsCount from the state provider",
  );

  // Assertion: Network Activity Table must capture network events
  assert.ok(
    report.includes("## 2. Network Activity & TimedText Requests"),
    "Report must contain Section 2 for network activity",
  );
  assert.ok(
    report.includes("timedtext?v=test_video_123"),
    "Report must list the timedtext interception request in network table",
  );
  assert.ok(
    report.includes("504"),
    "Report must list the failed network request status in network table",
  );

  // 7. Test truncation prevention with large state machine sequence (e.g. 150 actions)
  for (let i = 0; i < 150; i++) {
    logStateMachineAction(`ACTION_STEP_${i}`, { step: i, active: true });
  }

  const boundedReport = logBuffer.generateTroubleshootingPrompt();

  // Bounded report assertions
  assert.ok(
    boundedReport.includes("## 2.5 State Machine Actions Sequence for Reproduction"),
    "Bounded report must include reproduction sequence header",
  );
  assert.ok(
    boundedReport.includes("omitted for brevity"),
    "Actions exceeding bounds must include an omission notice to prevent clipboard truncation",
  );
  assert.ok(
    boundedReport.includes("ACTION_STEP_149"),
    "The most recent state machine action must be present in the bounded sequence",
  );
  assert.ok(
    boundedReport.length < 50000,
    `Report length (${boundedReport.length} bytes) must remain safely below 50KB clipboard cutoff`,
  );

  console.log("✅ All Error Report Diagnostics & State Provider verifications passed successfully!");
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
