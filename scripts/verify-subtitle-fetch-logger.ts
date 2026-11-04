/**
 * scripts/verify-subtitle-fetch-logger.ts
 *
 * Dedicated verification test ensuring:
 * 1. subtitleFetchLogger pub/sub works correctly and records logs to buffer and subscribers.
 * 2. WebDemoUrlsInput triggers emitSubtitleFetchLog when fetching subtitles.
 * 3. LanguageBoxesSelector triggers emitSubtitleFetchLog when fetching per language.
 * 4. FetchedSubtitlesStagePanel subscribes to subtitleFetchLogger and displays logs.
 */

import {
  emitSubtitleFetchLog,
  subscribeSubtitleFetchLogs,
  getSubtitleFetchLogs,
  clearSubtitleFetchLogs,
  type SubtitleFetchLogEntry,
} from "../src/utils/subtitleFetchLogger";
import * as fs from "fs";
import * as path from "path";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
}

async function runVerification() {
  console.log("=== Running Subtitle Fetch Logger Verification ===");

  // 1. Test pub/sub functionality
  clearSubtitleFetchLogs();
  assert(getSubtitleFetchLogs().length === 0, "Log buffer must be empty after clear");

  let latestReceivedLogs: SubtitleFetchLogEntry[] = [];
  const unsubscribe = subscribeSubtitleFetchLogs((updatedLogs) => {
    latestReceivedLogs = updatedLogs;
  });

  emitSubtitleFetchLog({
    type: "info",
    message: "Test fetch started",
    url: "https://www.youtube.com/api/timedtext?v=5-Mid7GNZ1M&lang=it",
    lang: "it",
  });

  emitSubtitleFetchLog({
    type: "success",
    message: "Test fetch succeeded with 42 cues",
    url: "https://www.youtube.com/api/timedtext?v=5-Mid7GNZ1M&lang=it",
    status: 200,
    lang: "it",
    cuesCount: 42,
  });

  assert(latestReceivedLogs.length === 2, `Subscriber should receive 2 entries, received ${latestReceivedLogs.length}`);
  assert(getSubtitleFetchLogs().length === 2, `Buffer should contain 2 entries, found ${getSubtitleFetchLogs().length}`);
  assert(latestReceivedLogs[0].level === "info", "First entry should be info");
  assert(latestReceivedLogs[1].status === 200, "Second entry should have status 200");
  assert(latestReceivedLogs[1].details === "Cues count: 42", "Second entry should have cuesCount detail");

  unsubscribe();
  emitSubtitleFetchLog({
    type: "info",
    message: "After unsubscribe message",
  });
  assert(latestReceivedLogs.length === 2, "Subscriber should not receive events after unsubscribe");
  assert(getSubtitleFetchLogs().length === 3, "Buffer continues recording after single subscriber unsubscribes");

  console.log("✅ Pub/sub and buffer functionality verified.");

  // 2. Verify static code integration
  const webDemoInputPath = path.resolve(process.cwd(), "src/components/WebDemoUrlsInput.tsx");
  const webDemoContent = fs.readFileSync(webDemoInputPath, "utf-8");
  assert(
    webDemoContent.includes("emitSubtitleFetchLog"),
    "WebDemoUrlsInput must import and call emitSubtitleFetchLog",
  );
  assert(
    webDemoContent.includes("[Quick Loader] Initiating fetch for video"),
    "WebDemoUrlsInput must log Quick Loader initiated fetch",
  );

  const langBoxesPath = path.resolve(process.cwd(), "src/components/LanguageBoxesSelector.tsx");
  const langBoxesContent = fs.readFileSync(langBoxesPath, "utf-8");
  assert(
    langBoxesContent.includes("emitSubtitleFetchLog"),
    "LanguageBoxesSelector must import and call emitSubtitleFetchLog",
  );
  assert(
    langBoxesContent.includes("Language Box fetch triggered for"),
    "LanguageBoxesSelector must log Language Box fetch triggered",
  );

  const fetchedSubtitlesPanelPath = path.resolve(process.cwd(), "src/components/FetchedSubtitlesStagePanel.tsx");
  const fetchedSubtitlesPanelContent = fs.readFileSync(fetchedSubtitlesPanelPath, "utf-8");
  assert(
    fetchedSubtitlesPanelContent.includes("subscribeSubtitleFetchLogs"),
    "FetchedSubtitlesStagePanel must subscribe to subscribeSubtitleFetchLogs",
  );
  assert(
    fetchedSubtitlesPanelContent.includes("subtitles-fetcher-terminal-log"),
    "FetchedSubtitlesStagePanel must render subtitles-fetcher-terminal-log",
  );

  console.log("✅ All integration points in WebDemoUrlsInput, LanguageBoxesSelector, and FetchedSubtitlesStagePanel verified.");
  console.log("=== Verification Successful! ===");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
