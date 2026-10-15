/**
 * Verification test for Subtask 49.3: Multi-Video Pause/Resume Audio-Track Synchronization Loop.
 * Validates:
 * 1. executeMultiVideoSegmentSync coordinates pause/resume and unmuting across matched video elements.
 * 2. Accurate seek-to-segment and progress callback emission during playback interval.
 * 3. Graceful fallback to primary player if specific secondary language player is not yet registered.
 * 4. Cancellation cleanup: pauses speaking element and restores primary player state.
 * 5. Web Speech TTS fallback in src/routes/index.tsx when audio-track mode is disabled.
 * 6. Code integration in src/routes/index.tsx and MultiVideoPlayerRegistry.
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  MultiVideoPlayerRegistry,
  executeMultiVideoSegmentSync,
  type YTPlayerLike,
} from "../src/utils/multiVideoPlayerManager";

console.log("====================================================");
console.log("🧪 Running Subtask 49.3: Multi-Video Audio-Track Sync Verification");
console.log("====================================================");

// Mock player implementation for verification
class MockPlayer implements YTPlayerLike {
  public isPlaying = false;
  public currentTime = 0;
  public isMutedState = false;
  public volume = 100;
  public lastSeek: number | null = null;

  playVideo(): void {
    this.isPlaying = true;
  }

  pauseVideo(): void {
    this.isPlaying = false;
  }

  seekTo(seconds: number, _allowSeekAhead = true): void {
    this.lastSeek = seconds;
    this.currentTime = seconds;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  mute(): void {
    this.isMutedState = true;
  }

  unMute(): void {
    this.isMutedState = false;
  }

  isMuted(): boolean {
    return this.isMutedState;
  }

  setVolume(v: number): void {
    this.volume = v;
  }

  getVolume(): number {
    return this.volume;
  }
}

// Test 1: Registry pause/resume and unmute coordination across instances
console.log("Test 1: Registry pause/resume and unmute coordination...");
const registry = new MultiVideoPlayerRegistry();
const primaryPlayer = new MockPlayer();
const esPlayer = new MockPlayer();
const hePlayer = new MockPlayer();

registry.register("primary", primaryPlayer);
registry.register("lang_es", esPlayer);
registry.register("lang_he", hePlayer);

// Start with all playing to test pauseAllExcept
primaryPlayer.playVideo();
esPlayer.playVideo();
hePlayer.playVideo();

registry.pauseAllExcept("lang_es");
assert.strictEqual(primaryPlayer.isPlaying, false, "Primary must be paused");
assert.strictEqual(esPlayer.isPlaying, true, "Target es player must remain playing");
assert.strictEqual(hePlayer.isPlaying, false, "Hebrew player must be paused");

// Test unmuteOnly
primaryPlayer.unMute();
hePlayer.unMute();
registry.unmuteOnly("lang_es");
assert.strictEqual(esPlayer.isMuted(), false, "Target es player must be unmuted");
assert.strictEqual(primaryPlayer.isMuted(), true, "Primary player must be muted");
assert.strictEqual(hePlayer.isMuted(), true, "Hebrew player must be muted");
console.log("✅ PASS: Registry pause and unmute coordination works accurately");

// Test 2: executeMultiVideoSegmentSync seeks, plays, and emits progress on matched secondary player
console.log("Test 2: executeMultiVideoSegmentSync segment seek and playback execution...");
let progressCalled = false;
let lastPercent = 0;

// Setup clock advance simulation
esPlayer.currentTime = 5.0; // start 5000ms

const syncPromise = executeMultiVideoSegmentSync({
  registry,
  primaryPlayer,
  languageCode: "es",
  startMs: 5000,
  endMs: 5200,
  onProgress: (prog) => {
    progressCalled = true;
    lastPercent = prog.percent;
  },
});

assert.strictEqual(esPlayer.lastSeek, 5.0, "Target player must seek to startMs (5s)");
assert.strictEqual(esPlayer.isPlaying, true, "Target player must start playing");
assert.strictEqual(primaryPlayer.isPlaying, false, "Primary player must remain paused");
assert.strictEqual(esPlayer.isMuted(), false, "Target player must be unmuted");

// Simulate time progression to finish segment
setTimeout(() => {
  esPlayer.currentTime = 5.2; // 5200ms reached
}, 120);

await syncPromise;

assert.strictEqual(
  esPlayer.isPlaying,
  false,
  "Target player must be paused after segment finishes",
);
assert.strictEqual(
  primaryPlayer.isMuted(),
  false,
  "Primary player must be unmuted after completion",
);
assert.ok(progressCalled, "Progress callback must have been invoked");
console.log("✅ PASS: Segment playback seek, execution, and cleanup verified");

// Test 3: Fallback to primary player when dedicated language element is not registered
console.log("Test 3: Fallback to primary player when secondary instance is absent...");
const emptySecondaryRegistry = new MultiVideoPlayerRegistry();
const standalonePrimary = new MockPlayer();
emptySecondaryRegistry.register("primary", standalonePrimary);

let fallbackProgressEmitted = false;
standalonePrimary.currentTime = 10.0;

const fallbackPromise = executeMultiVideoSegmentSync({
  registry: emptySecondaryRegistry,
  primaryPlayer: standalonePrimary,
  languageCode: "ar", // "lang_ar" not registered
  startMs: 10000,
  endMs: 10150,
  onProgress: () => {
    fallbackProgressEmitted = true;
  },
});

assert.strictEqual(standalonePrimary.lastSeek, 10.0, "Primary player used as fallback must seek");
assert.strictEqual(standalonePrimary.isPlaying, true, "Primary player must play segment");

setTimeout(() => {
  standalonePrimary.currentTime = 10.2;
}, 120);

await fallbackPromise;
assert.strictEqual(
  standalonePrimary.isPlaying,
  false,
  "Fallback player must pause upon segment completion",
);
console.log("✅ PASS: Fallback to primary player functions smoothly");

// Test 4: Cancellation stops playback immediately and restores registry
console.log("Test 4: Cancellation handling during playback loop...");
let cancelled = false;
esPlayer.currentTime = 20.0;

const cancelPromise = executeMultiVideoSegmentSync({
  registry,
  primaryPlayer,
  languageCode: "es",
  startMs: 20000,
  endMs: 30000,
  checkCancelled: () => cancelled,
});

assert.strictEqual(esPlayer.isPlaying, true, "Player started");
cancelled = true; // Trip cancellation

await new Promise((r) => setTimeout(r, 150));
await cancelPromise;

assert.strictEqual(esPlayer.isPlaying, false, "Player must pause immediately when cancelled");
assert.strictEqual(
  primaryPlayer.isMuted(),
  false,
  "Primary player must be unmuted after cancellation",
);
console.log("✅ PASS: Cancellation stops multi-video playback and restores state");

// Test 5: Verify integration contracts in src/routes/index.tsx
console.log("Test 5: Source code integration in src/routes/index.tsx...");
const indexPath = path.resolve(process.cwd(), "src/routes/index.tsx");
const indexCode = fs.readFileSync(indexPath, "utf-8");

assert.ok(
  indexCode.includes("executeMultiVideoSegmentSync"),
  "src/routes/index.tsx must import and use executeMultiVideoSegmentSync",
);
assert.ok(
  indexCode.includes("registry: multiVideoPlayerRegistry"),
  "src/routes/index.tsx must pass multiVideoPlayerRegistry to executeMultiVideoSegmentSync",
);
assert.ok(
  indexCode.includes('multiVideoPlayerRegistry.unmuteOnly("primary")'),
  "src/routes/index.tsx must unmute primary upon video resumption",
);
assert.ok(
  indexCode.includes('multiVideoPlayerRegistry.pauseAllExcept("primary")'),
  "src/routes/index.tsx must pause secondaries upon speech cancellation and loop exit",
);
assert.ok(
  indexCode.includes("await speak("),
  "src/routes/index.tsx must retain fallback to Web Speech speak() when audioTrackMode is false",
);
console.log("✅ PASS: src/routes/index.tsx source integration contracts verified");

console.log("====================================================");
console.log("🎉 Subtask 49.3 Multi-Video Audio-Track Sync tests PASSED!");
console.log("====================================================");
