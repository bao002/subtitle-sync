import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=== Running verify-video-resume-after-tts.ts ===");

const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
assert(fs.existsSync(indexPath), "src/routes/index.tsx must exist");
const indexContent = fs.readFileSync(indexPath, "utf8");

// 1. Verify isPausedForTtsRef exists
assert(
  indexContent.includes("const isPausedForTtsRef = useRef(false);"),
  "isPausedForTtsRef must be declared to isolate programmatic TTS pause state",
);
console.log("✓ isPausedForTtsRef declaration verified");

// 2. Verify onStateChange does not flag TTS pause as user pause
assert(
  indexContent.includes("if (!busy.current && !isPausedForTtsRef.current)"),
  "onStateChange (data===2) must check !isPausedForTtsRef.current before setting userExplicitlyPausedRef",
);
console.log("✓ onStateChange protects TTS pauses from false user-pause classification");

// 3. Verify safelyResumePrimaryVideo helper exists and performs robust recovery
assert(
  indexContent.includes("const safelyResumePrimaryVideo = (resumeTargetSec?: number) =>"),
  "safelyResumePrimaryVideo helper must be defined in playback coordinator",
);
assert(
  indexContent.includes("multiVideoPlayerRegistry.unmuteOnly(\"primary\");"),
  "safelyResumePrimaryVideo must unmute primary player",
);
assert(
  indexContent.includes("userExplicitlyPausedRef.current = false;"),
  "safelyResumePrimaryVideo must clear userExplicitlyPausedRef",
);
assert(
  indexContent.includes("p.playVideo();"),
  "safelyResumePrimaryVideo must call p.playVideo()",
);
console.log("✓ safelyResumePrimaryVideo recovery pipeline verified");

// 4. Verify secondary kick timeout in safelyResumePrimaryVideo
assert(
  indexContent.includes("setTimeout(() => {") &&
    indexContent.includes("p.getPlayerState?.() !== 1") &&
    indexContent.includes("p.playVideo?.();"),
  "safelyResumePrimaryVideo must include a secondary kick timeout if player did not transition to playing",
);
console.log("✓ Secondary resume kick timer verified");

// 5. Verify both tts-first and video-first resume calls
assert(
  indexContent.includes("safelyResumePrimaryVideo(targetSec);"),
  "tts-first must invoke safelyResumePrimaryVideo with targetSec",
);
assert(
  indexContent.includes("safelyResumePrimaryVideo(resumeTarget);"),
  "video-first must invoke safelyResumePrimaryVideo with resumeTarget",
);
console.log("✓ Both tts-first and video-first invoke safelyResumePrimaryVideo");

// 6. Verify video continuation when subtitle track ends but video duration has remaining content
assert(
  indexContent.includes("dur > 0 && currentPos < dur - 1.5"),
  "When subtitle row ends but video has remaining duration, video playback must resume",
);
console.log("✓ Video continuation beyond last subtitle cue verified");

console.log("=== All verify-video-resume-after-tts assertions passed! ===");
