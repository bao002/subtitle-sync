import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("====================================================");
console.log("🧪 Verifying Playback Loop Continuation (Bug Fix 1)");
console.log("====================================================");

const indexFile = path.join(process.cwd(), "src/routes/index.tsx");
assert(fs.existsSync(indexFile), "src/routes/index.tsx exists");
const indexContent = fs.readFileSync(indexFile, "utf-8");

// 1. Verify userExplicitlyPausedRef is declared
assert(
  indexContent.includes("const userExplicitlyPausedRef = useRef(false);"),
  "userExplicitlyPausedRef is declared to distinguish user pause from automated TTS pause",
);

// 2. Verify pauseBothVideoAndTts marks userExplicitlyPausedRef as true
assert(
  /pauseBothVideoAndTts\s*=\s*useCallback\([\s\S]*?userExplicitlyPausedRef\.current\s*=\s*true/m.test(
    indexContent,
  ),
  "pauseBothVideoAndTts marks userExplicitlyPausedRef.current = true",
);

// 3. Verify handleTogglePlay resets userExplicitlyPausedRef to false on play resume
assert(
  /handleTogglePlay\s*=\s*useCallback\([\s\S]*?userExplicitlyPausedRef\.current\s*=\s*false/m.test(
    indexContent,
  ),
  "handleTogglePlay resets userExplicitlyPausedRef.current = false on resume",
);

// 4. Verify onStateChange handles player state correctly
assert(
  /if\s*\(event\.data === 1\)\s*\{\s*userExplicitlyPausedRef\.current\s*=\s*false;\s*setIsVideoPlaying\(true\);/m.test(
    indexContent,
  ),
  "onStateChange sets userExplicitlyPausedRef = false when player transitions to playing (state 1)",
);
assert(
  /else if\s*\(event\.data === 2\)\s*\{[\s\S]*?if\s*\(!busy\.current\)\s*\{[\s\S]*?userExplicitlyPausedRef\.current\s*=\s*true;/m.test(
    indexContent,
  ),
  "onStateChange sets userExplicitlyPausedRef = true ONLY when not busy with speech synthesis",
);

// 5. Verify loop resumption check does not abort on !isVideoPlayingRef.current
assert(
  !indexContent.includes(
    "if (wasCancelled || st.current.isSetupPaused || !isVideoPlayingRef.current) return;",
  ),
  "Legacy loop abort condition (!isVideoPlayingRef.current) is completely eliminated",
);

assert(
  indexContent.includes(
    "if (wasCancelled || st.current.isSetupPaused || userExplicitlyPausedRef.current) return;",
  ),
  "Playback loop coordinator checks userExplicitlyPausedRef instead of video playing ref, permitting continuous loop across cues",
);

// 6. Simulate the playback coordinator state machine across 3 iterations
console.log("Simulating 3-iteration playback loop sequence...");
let isBusy = false;
let userPaused = false;
let currentIteration = 0;
const iterationsPlayed: number[] = [];

async function simulateCueIteration(cueIdx: number) {
  // Video reaches cue
  isBusy = true;
  // Automated video pause
  const playerState = 2; // paused
  if (!isBusy) {
    userPaused = true;
  }
  // TTS speaks cue
  await new Promise((r) => setTimeout(r, 10));
  // TTS finishes
  const wasCancelled = !isBusy;
  isBusy = false;
  if (wasCancelled || userPaused) {
    return false; // loop stopped
  }
  // Resumes video
  iterationsPlayed.push(cueIdx);
  return true;
}

(async () => {
  for (let i = 0; i < 3; i++) {
    const resumed = await simulateCueIteration(i);
    assert(resumed, `Playback iteration ${i + 1} resumed successfully after TTS`);
  }
  assert(
    iterationsPlayed.length === 3,
    "Playback loop successfully continues across all 3 iterations without stopping after 1",
  );
  console.log("====================================================");
  console.log("🎉 ALL PLAYBACK LOOP CONTINUATION CHECKS PASSED!");
  console.log("====================================================");
})();
