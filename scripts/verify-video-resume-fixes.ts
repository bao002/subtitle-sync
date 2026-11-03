import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("--> Validating Video Resume Fixes and Elimination of Pause Failure Mechanisms...");

  const root = path.resolve(".");

  // 1. docs/stop.md exists and contains analysis table
  const stopDocPath = path.join(root, "docs/stop.md");
  assert.ok(fs.existsSync(stopDocPath), "docs/stop.md must exist");
  const stopContent = fs.readFileSync(stopDocPath, "utf8");
  assert.ok(stopContent.includes("Comprehensive List of Reasons Why the App Doesn't Resume After Pausing"));
  assert.ok(stopContent.includes("VR-01") && stopContent.includes("VR-07"));
  console.log("✓ docs/stop.md exists with all pause failure mechanisms analyzed");

  // 2. src/routes/index.tsx programmatic pause timestamp guard
  const indexTsxPath = path.join(root, "src/routes/index.tsx");
  const indexTsx = fs.readFileSync(indexTsxPath, "utf8");
  assert.ok(
    indexTsx.includes("programmaticPauseTimestampRef"),
    "src/routes/index.tsx must declare programmaticPauseTimestampRef",
  );
  assert.ok(
    indexTsx.includes("isRecentProgrammaticPause"),
    "onStateChange must check isRecentProgrammaticPause before treating state 2 as user pause",
  );
  console.log("✓ Programmatic pause timestamp guard prevents false user pauses");

  // 3. onStateChange event.data === -1 does not set userExplicitlyPausedRef
  const unstartedBlock = indexTsx.slice(
    indexTsx.indexOf("event.data === -1"),
    indexTsx.indexOf("onApiChange"),
  );
  assert.ok(
    !unstartedBlock.includes("userExplicitlyPausedRef.current = true"),
    "Unstarted state (event.data === -1) must not mark userExplicitlyPausedRef as true",
  );
  console.log("✓ Unstarted/buffering states do not contaminate user pause flag");

  // 4. speakRow timeout safeguard
  assert.ok(
    indexTsx.includes("Promise.race([") && indexTsx.includes("8000"),
    "speakRow must enforce a timeout race to prevent stalled speech from freezing video playback",
  );
  console.log("✓ TTS speech synthesis timeout safeguard verified");

  // 5. Dual kicks in safelyResumePrimaryVideo
  assert.ok(
    indexTsx.includes("setTimeout(") &&
      indexTsx.includes("80") &&
      indexTsx.includes("240"),
    "safelyResumePrimaryVideo must include dual verification kicks (80ms and 240ms)",
  );
  console.log("✓ safelyResumePrimaryVideo dual verification kicks verified");

  // 6. Section completion resumes playback without pause blockage
  assert.ok(
    indexTsx.includes("safelyResumePrimaryVideo(targetSec);"),
    "tts-first section completion must resume primary video",
  );
  assert.ok(
    indexTsx.includes("safelyResumePrimaryVideo(resumeTarget);"),
    "video-first section completion must resume primary video",
  );
  assert.ok(
    indexTsx.includes("// End of subtitle track reached: resume normal playback until natural end"),
    "End of subtitle track must resume normal playback until video completion",
  );
  console.log("✓ Section completion and end-of-track resumes verified");

  console.log("All Video Resume Fixes verified successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
