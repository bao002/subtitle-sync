# Player Provider Specification (`DESIGN_PLAYER_PROVIDER.md`)

This document defines the vendor-agnostic media playback provider interface, time-synchronization contracts, and event streams.

---

## 1. Architectural Role

The media player provider abstracts underlying video players (such as the YouTube IFrame API, HTML5 `<video>`, or native Android media players) behind a standardized TypeScript interface:

```text
[ Underlying Video Player (YouTube IFrame / HTML5) ]
                         │
                         ▼ (Wrapped By)
             [ PlayerProvider Interface ]
                         │
                         ▼ (Emits)
               [ PlayerStateStream ]
                         │
                         ▼ (Injected Into)
            [ State Coordinator / Pure Views ]
```

---

## 2. Core Player Provider Interface

```ts
export type PlayerPlaybackState =
  "unstarted" | "ended" | "playing" | "paused" | "buffering" | "cued";

export interface PlayerTimeUpdate {
  currentTime: number; // Current playback time in fractional seconds
  duration: number; // Total media duration in fractional seconds
}

export interface PlayerProvider {
  // Playback Control
  play(): Promise<void>;
  pause(): Promise<void>;
  seekTo(seconds: number, allowSeekAhead?: boolean): Promise<void>;
  setVolume(volume: number): Promise<void>; // 0 to 100
  getVolume(): number;

  // State Queries
  getCurrentTime(): number;
  getDuration(): number;
  getPlaybackState(): PlayerPlaybackState;

  // Event Listeners
  onTimeUpdate(callback: (update: PlayerTimeUpdate) => void): () => void;
  onStateChange(callback: (state: PlayerPlaybackState) => void): () => void;
  onError(callback: (error: Error) => void): () => void;
}
```

---

## 3. Pure Component Integration Mandates

1. **Decoupled Renderers**: Subtitle views and playback controls never call YouTube APIs directly; they communicate through callbacks (`onSeek`, `onPlayPause`) handled by the controller implementing this provider contract.
2. **Deterministic Tick Stream**: The provider guarantees time updates at least once every 100ms during active playback to enable smooth sub-line segment syntax highlighting.
3. **Safe Cleanup**: All event subscription methods return an unsubscribe closure (`() => void`) to ensure zero memory leaks when components unmount.

---

## 4. Video Playground Standalone Instance

While the primary PlayerProvider coordinates multi-instance swiper sync and auto-pause loops, the **Video Playground** (`src/components/VideoPlayground.tsx`) renders an uninhibited player embed:

- **No External Seeking or Forcible Pauses**: Operates without external interval timers driving `pauseVideo()` or `seekTo()`.
- **User-Centric Caption Switching**: Allows direct, unhindered access to native YouTube CC and quality menus.
- **Background Interception**: Listens to network and native Android bridge caption streams to populate the detected tracks catalog in real time.
- **Interactive Speed Adjustment**: Exposes explicit playback rate controls (`setPlaybackRate`) from 0.5x to 2.0x.
- **Bi-Directional Timestamp Handoff**: Supports seamless transitions back to the main PlayerProvider at the exact playback position (`onSwitchToViewerAtTime`).
