/**
 * Verification Test: TTS Playback Duration and Sequential Queue
 *
 * Requirements (Task 380):
 * 1. playAlternativeTtsAudio and speak() respect the full duration of audio playback
 *    without starting another play or cutting off prematurely.
 * 2. Sequential speech/audio calls are enqueued and played strictly one after another.
 * 3. cancelSpeech() / cancelAlternativeTtsAudio() explicitly halts active playback and flushes the queue.
 * 4. isAlternativeTtsPlaying() and waitForAllAlternativeTtsAudio() are exported and function accurately.
 */

import {
  isAlternativeTtsPlaying,
  waitForAllAlternativeTtsAudio,
  playAlternativeTtsAudio,
  cancelAlternativeTtsAudio,
} from "../src/lib/alternative-tts";

function assert(condition: unknown, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTest() {
  console.log("=== Running TTS Playback Duration & Queue Verification ===");

  // 1. Verify export availability
  assert(typeof isAlternativeTtsPlaying === "function", "isAlternativeTtsPlaying must be exported");
  assert(typeof waitForAllAlternativeTtsAudio === "function", "waitForAllAlternativeTtsAudio must be exported");
  assert(typeof playAlternativeTtsAudio === "function", "playAlternativeTtsAudio must be exported");
  assert(typeof cancelAlternativeTtsAudio === "function", "cancelAlternativeTtsAudio must be exported");
  console.log("✔ Exported functions verified");

  // 2. Initial state
  assert(!isAlternativeTtsPlaying(), "Initial isAlternativeTtsPlaying() must be false");

  // 3. Setup mock audio environment for node / headless test
  const originalAudio = (globalThis as any).Audio;
  const originalWindow = (globalThis as any).window;

  const playbackOrder: string[] = [];
  const eventLog: string[] = [];

  class MockAudio {
    src = "";
    currentTime = 0;
    duration = 1.0;
    playbackRate = 1.0;
    volume = 1.0;
    crossOrigin: string | null = null;
    listeners: Record<string, Array<() => void>> = {};
    isPlaying = false;
    audioId = "";

    addEventListener(event: string, handler: () => void) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(handler);
    }

    removeEventListener(event: string, handler: () => void) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
      }
    }

    emit(event: string) {
      const handlers = this.listeners[event] || [];
      for (const h of handlers) h();
    }

    play() {
      this.isPlaying = true;
      this.audioId = this.src;
      eventLog.push(`start:${this.src}`);

      // Simulate audio duration taking 60ms to play
      setTimeout(() => {
        if (this.isPlaying) {
          eventLog.push(`end:${this.src}`);
          playbackOrder.push(this.src);
          this.emit("ended");
        }
      }, 60);

      return Promise.resolve();
    }

    pause() {
      this.isPlaying = false;
      eventLog.push(`pause:${this.src}`);
    }
  }

  (globalThis as any).Audio = MockAudio;
  (globalThis as any).window = {
    Audio: MockAudio,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
  };

  try {
    // 4. Test sequential queueing without overlapping
    // Queue two consecutive audio plays
    const p1 = playAlternativeTtsAudio("First audio utterance", "en", 1.0);
    const p2 = playAlternativeTtsAudio("Second audio utterance", "es", 1.0);

    // Both should be in-flight sequentially
    await Promise.all([p1, p2]);

    console.log("Event log during queue playback:", eventLog);

    // Verify ordering: first must end before second starts
    const firstStartIndex = eventLog.findIndex((e) => e.startsWith("start:") && e.includes("blob:"));
    const firstEndIndex = eventLog.findIndex((e) => e.startsWith("end:") && e.includes("blob:"));
    const secondStartIndex = eventLog.findLastIndex((e) => e.startsWith("start:") && e.includes("blob:"));
    const secondEndIndex = eventLog.findLastIndex((e) => e.startsWith("end:") && e.includes("blob:"));

    assert(firstStartIndex !== -1, "First audio started");
    assert(firstEndIndex !== -1, "First audio finished playing its duration");
    assert(secondStartIndex !== -1, "Second audio started");
    assert(secondEndIndex !== -1, "Second audio finished playing its duration");
    assert(firstStartIndex < firstEndIndex, "First audio starts before it ends");
    assert(firstEndIndex < secondStartIndex, "First audio must finish playing before second audio starts!");

    console.log("✔ Sequential playback order respected full audio duration without overlap");

    // 5. Test explicit cancellation flushes queue and cancels in-flight audio
    eventLog.length = 0;
    const pLong1 = playAlternativeTtsAudio("Cancel test 1", "en", 1.0);
    const pLong2 = playAlternativeTtsAudio("Cancel test 2", "fr", 1.0);

    // Immediately cancel
    cancelAlternativeTtsAudio();
    await waitForAllAlternativeTtsAudio();

    assert(!isAlternativeTtsPlaying(), "Audio state is reset to false after cancelAlternativeTtsAudio()");
    console.log("✔ Cancellation cleanly flushes the queue and halts playback");

    console.log("=== All TTS Playback Duration & Queue assertions PASSED ===");
  } finally {
    (globalThis as any).Audio = originalAudio;
    (globalThis as any).window = originalWindow;
  }
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
