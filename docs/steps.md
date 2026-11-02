# Steps to Build the Application: Isolated Design, Isolated Testing & Minimal Integration (`docs/steps.md`)

This guide defines the ordered architectural blueprint for building the multi-language parallel subtitle video player. Every module and component is structured so that it can be **designed in complete isolation** (using Storybook and mock fixtures) and **tested in complete isolation** (using Vitest unit tests, synthetic clocks, and mock schemas) before being integrated into the application shell with **minimal glue code**.

---

## Architectural Principles of Isolated Modularity

1. **Pure Functional Core**: All text transformations, time calculations, and alignment algorithms are pure functions with zero React, DOM, or network dependencies.
2. **Headless State & Clock Bus**: Playback timing, sentence coordination, and TTS synchronization are decoupled into a headless finite state machine (FSM) that responds to discrete time ticks.
3. **Storybook-Driven UI**: Visual components accept only explicit props (data in, callbacks out) and are developed and visually verified in Storybook without running the video player or hitting backend APIs.
4. **Boundary Schema Gates**: Ingested subtitle payloads must pass a contract gate before entering the pipeline, guaranteeing that downstream components never deal with malformed data.
5. **Minimal Integration Layer**: The top-level application shell only connects the clock bus to the player, feeds state into UI props, and delegates events back to store actions.

---

## Ordered Steps by Importance

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ IMPORTANCE HIERARCHY                                                         │
│                                                                              │
│ [Step 1: CRITICAL] Pure Transformation Pipeline (Sanitize, Parse, Split)     │
│       │                                                                      │
│       ▼                                                                      │
│ [Step 2: HIGH]     Multi-Language Temporal Alignment Matrix Engine           │
│       │                                                                      │
│       ▼                                                                      │
│ [Step 3: HIGH]     Headless Playback & Speech Coordination State Machine     │
│       │                                                                      │
│       ▼                                                                      │
│ [Step 4: MEDIUM]   Ingestion, Network Adapters & Schema Conformance Gate     │
│       │                                                                      │
│       ▼                                                                      │
│ [Step 5: MEDIUM]   Isolated UI Components Developed in Storybook             │
│       │                                                                      │
│       ▼                                                                      │
│ [Step 6: MINIMAL]  Application Shell & Reactive Binding (Integration Layer)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Step 1 (Highest Importance): Pure Transformation Pipeline (Sanitization & Sentence Splitting)

#### 1. Goal
Convert raw caption segments with arbitrary timing into clean, grammatically complete sentence segments with linearly interpolated timestamps.

#### 2. Why It Has Highest Importance
If text sanitization or sentence splitting is buggy, the entire user experience collapses: alignment will break, translations will be misaligned, TTS will stumble on noise tags, and playback highlighting will stutter. Because this is pure computation, it must be developed and verified before any UI exists.

#### 3. Module Design in Isolation
- Input: An array of raw cues `{ startMs: number; durationMs: number; text: string }[]`.
- Output: An array of sanitized, split sentence cues `{ id: string; startMs: number; durationMs: number; text: string }[]`.
- Sub-modules:
  - `sanitizeCueText(rawText: string, options: SanitizeOptions): string` (strips speaker labels like `[Speaker 1]:`, noise tokens `[Music]`, HTML entities, and formatting artifacts).
  - `splitIntoSentences(cues: RawCue[], options: SplitOptions): SentenceCue[]` (splits streams on punctuation boundaries `. ! ?` and interpolates start/end times based on character weight ratios).

#### 4. Isolated Testing Strategy (Vitest)
- Test with synthetic text arrays containing complex punctuation, edge-case abbreviations (e.g. `Mr. Smith`), trailing ellipses, and non-Latin punctuation (Hebrew, Arabic, Japanese, Chinese).
- Assert mathematical invariants: `endMs >= startMs`, total duration is conserved, no empty cues emitted.
- Run tests in milliseconds with 0 external dependencies:
  ```typescript
  // Example isolated test:
  test("splits continuous caption stream into punctuated sentences with interpolated timestamps", () => {
    const rawCues = [
      { startMs: 0, durationMs: 2000, text: "Hello world! This is" },
      { startMs: 2000, durationMs: 2500, text: "a second sentence." }
    ];
    const sentences = parseAndSplitSentences(rawCues);
    expect(sentences).toHaveLength(2);
    expect(sentences[0].text).toBe("Hello world!");
    expect(sentences[1].text).toBe("This is a second sentence.");
    expect(sentences[0].startMs).toBe(0);
    expect(sentences[1].endMs).toBe(4500);
  });
  ```

---

### Step 2 (High Importance): Multi-Language Temporal Alignment Matrix Engine

#### 1. Goal
Synchronize the base language track (e.g. English) with one or more target language tracks (e.g. Hebrew, Spanish, Japanese) into a 2D matrix of synchronized sentence rows.

#### 2. Why It Ranks High
Parallel language learning requires side-by-side row synchronization. Because subtitle tracks from different languages often have differing cue counts and time offsets, the alignment algorithm must robustly map target cues to base sentences without relying on active video playback or DOM rendering.

#### 3. Module Design in Isolation
- Input:
  - Base language sentence cues: `SentenceCue[]`.
  - Target language subtitle tracks: `Record<LangCode, SentenceCue[]>`.
  - Alignment strategy: `time_overlap | nearest_center | proportional_span`.
- Output:
  - Aligned Matrix: `AlignedSentenceRow[]`, where each row contains:
    - `id`: unique sentence row ID
    - `startMs`: row start time
    - `endMs`: row end time
    - `baseCue`: base sentence cue
    - `targetCues`: dictionary mapping each `LangCode` to its aligned target sentence(s)

#### 4. Isolated Testing Strategy (Vitest)
- Test scenarios with mismatched durations, late-starting translations, missing cues in target tracks, and overlapping intervals.
- Verify determinism: Given the same inputs, the output matrix is identical 100% of the time.
  ```typescript
  // Example isolated test:
  test("aligns divergent multi-language tracks into synchronized matrix rows", () => {
    const baseCues = [{ id: "b1", startMs: 1000, endMs: 4000, text: "Good morning." }];
    const targetCues = {
      es: [{ id: "es1", startMs: 900, endMs: 3800, text: "Buenos días." }],
      he: [{ id: "he1", startMs: 1200, endMs: 4100, text: "בוקר טוב." }]
    };
    const matrix = buildAlignmentMatrix(baseCues, targetCues);
    expect(matrix[0].targetCues["es"]?.text).toBe("Buenos días.");
    expect(matrix[0].targetCues["he"]?.text).toBe("בוקר טוב.");
  });
  ```

---

### Step 3 (High Importance): Headless Playback & Speech Coordination State Machine

#### 1. Goal
Manage the synchronized lifecycle of video playback, subtitle row highlighting, and audio speech synthesis (TTS).

#### 2. Why It Ranks High
Coordinating video pauses while a synthetic voice speaks the translation is the primary source of race conditions and player stutter in subtitle-player apps. Isolating this orchestration into a state machine eliminates player-specific quirks.

#### 3. Module Design in Isolation
- Pure finite state machine (FSM) or lightweight headless store (e.g. Zustand store without UI bindings).
- States: `IDLE | PLAYING_VIDEO | PAUSED_FOR_TTS | RESUMING | SEEKING`.
- Inputs / Actions:
  - `onClockTick(timeMs: number)`
  - `onRowEnter(rowIndex: number)`
  - `onTtsStart()`
  - `onTtsEnd()`
  - `setPreferences({ pauseVideoDuringTts: boolean; speechRate: number })`
- Outputs / Commands:
  - `command: "PAUSE_VIDEO" | "RESUME_VIDEO" | "SPEAK_TEXT" | "HIGHLIGHT_ROW"`

#### 4. Isolated Testing Strategy (Vitest with Synthetic Clock)
- Create a test runner that feeds artificial millisecond ticks:
  ```typescript
  test("pauses video when entering row if TTS is active and resumes when speech finishes", () => {
    const coordinator = createPlaybackCoordinator({ pauseVideoDuringTts: true });
    coordinator.loadRows(mockRows);

    // Simulate playback tick entering row 0
    const cmd1 = coordinator.onClockTick(1050);
    expect(cmd1).toEqual({ type: "PAUSE_VIDEO", reason: "TTS_NARRATION" });
    expect(coordinator.getState()).toBe("PAUSED_FOR_TTS");

    // Simulate speech completion callback
    const cmd2 = coordinator.onTtsEnd();
    expect(cmd2).toEqual({ type: "RESUME_VIDEO" });
    expect(coordinator.getState()).toBe("PLAYING_VIDEO");
  });
  ```

---

### Step 4 (Medium Importance): Caption Ingestion & Schema Conformance Gate

#### 1. Goal
Acquire subtitle data from heterogeneous sources (YouTube JSON3 timedtext, Android native bridge, local fixture JSON) and validate against a strict schema contract.

#### 2. Why It Is Decoupled Here
Network errors, HTML bot-detection pages, or malformed JSON payloads must be trapped and rejected at the outer boundary. The rest of the app never deals with raw network quirks.

#### 3. Module Design in Isolation
- Parser & Validator Interface: `validateAndParseJson3(payload: unknown): Result<RawCue[], SchemaError>`
- Rules enforced:
  - Payload must be non-HTML valid JSON.
  - Must have top-level `events` array with `events.length > 0`.
  - Each valid event must possess numeric `tStartMs`, `dDurationMs`, and `segs[].utf8` string values.
  - Zero-cue responses are rejected with descriptive diagnostic codes.

#### 4. Isolated Testing Strategy (Vitest)
- Test against real fixture JSON (`public/fixtures/L2Ryrr6txwA/en.json`).
- Test against edge cases: 403 HTML captcha response, empty `{ events: [] }`, missing `segs` array, malformed timestamps.
- Ensure strict error handling without thrown unhandled exceptions.

---

### Step 5 (Medium Importance): Isolated UI Components in Storybook

#### 1. Goal
Design, layout, theme, and test all UI visual elements completely independent of YouTube players, network calls, and global application state.

#### 2. Why It Matters
When UI components are coupled to global contexts or YouTube DOM elements, styling and refactoring become slow and fragile. In Storybook, every component is rendered against explicit props with instant visual feedback.

#### 3. Component Breakdown & Stories

| Component | Responsibility | Storybook Variations |
| :--- | :--- | :--- |
| `SentenceRow` | Displays parallel columns for base & target languages with highlight state and audio button | `Default`, `ActiveHighlight`, `RTL-Language`, `MultiTargetColumns`, `LongTextWrapping` |
| `SubtitleMatrixView` | Virtualized or scrollable grid rendering parallel `SentenceRow` elements | `EmptyState`, `FewRows`, `1000+Rows (Performance)`, `LoadingSkeleton` |
| `PlaybackToolbar` | Play/pause, speed selector, loop toggle, and jump controls | `PlayingState`, `PausedState`, `Disabled` |
| `LanguageSelector` | Dropdown/modal for picking base & target languages, showing favorite badges | `DefaultList`, `SearchFilterActive`, `Disabled` |
| `TtsControlPanel` | Reactive TTS settings (voice selection, speech speed, provider fallback) | `WebSpeechOnly`, `AlternativeProviderActive`, `TokenConfigured` |
| `PreferencesDrawer` | User settings for display density, font size, and layout order | `CompactDensity`, `SpaciousDensity`, `DarkMode` |

#### 4. Isolated Component Design Pattern
```tsx
// Pure presentational component: zero global hooks, zero player API
export interface SentenceRowProps {
  id: string;
  isActive: boolean;
  baseText: string;
  targetTexts: Record<string, string>;
  onPlaySentence: (id: string) => void;
  onSpeakSentence: (id: string, lang: string) => void;
}

export const SentenceRow: React.FC<SentenceRowProps> = ({
  isActive,
  baseText,
  targetTexts,
  onPlaySentence,
  onSpeakSentence,
}) => (
  <div className={`grid grid-cols-2 p-3 border-b ${isActive ? "bg-amber-100 dark:bg-amber-950 font-bold" : ""}`}>
    <div className="text-gray-900 dark:text-gray-100">{baseText}</div>
    <div className="text-blue-600 dark:text-blue-400">{targetTexts["target"]}</div>
  </div>
);
```

#### 5. Verification via Storybook
- Run `npm run storybook` locally to inspect components in isolation.
- Automatically built and deployed via CI (`npm run build:storybook`) to GitHub Pages for instant visual regression auditing.

---

### Step 6 (Minimal Integration Layer): The Glue Shell

#### 1. Goal
Connect the pre-tested, pre-designed modules together with minimal integration surface.

#### 2. Design of the Integration Layer
The application container (`App.tsx` or `PlayerView.tsx`) does only 3 tasks:
1. **Clock Forwarding**: Subscribes to the video player's time update event (e.g. `onTimeUpdate(t)`) and forwards `t` to the Headless Coordinator (Step 3).
2. **State Selection**: Reads derived matrix rows and active row index from the state store and passes them as props to `SubtitleMatrixView` (Step 5).
3. **Action Dispatch**: Forwards user click events from toolbar/rows to the store actions (`seekTo(startMs)`, `togglePlay()`, `selectLanguage(code)`).

#### 3. Why This Integration is "Minimal"
- The container contains **no text parsing logic** (delegated to Step 1).
- The container contains **no alignment math** (delegated to Step 2).
- The container contains **no pause/resume timing logic** (delegated to Step 3).
- The container contains **no raw network parsing** (delegated to Step 4).
- The container contains **no custom DOM layout for subtitles** (delegated to Step 5).
- If the video player changes (e.g. from YouTube IFrame to HTML5 video or ExoPlayer on Android), only Step 6's clock adapter changes. Everything else remains untouched.

---

## Summary Matrix: Isolation & Integration Table

| Step | Component / Module | How to Design in Isolation | How to Test in Isolation | Integration Surface |
| :--- | :--- | :--- | :--- | :--- |
| **1. Transformation Pipeline** | `sanitizeCueText`, `splitIntoSentences` | Pure functions with TypeScript contracts | Vitest unit tests with synthetic text & edge cases | Function call: `RawCue[] -> SentenceCue[]` |
| **2. Alignment Matrix** | `buildAlignmentMatrix` | Pure data structure mapping function | Vitest unit tests with shifted/mismatched time intervals | Function call: `(Base, Targets) -> AlignedRow[]` |
| **3. Playback Coordinator** | `PlaybackFSM` / `usePlaybackStore` | Headless event-driven state machine | Vitest tests with simulated millisecond clock ticks & mock TTS events | Clock tick input, pause/resume command dispatch |
| **4. Schema Gate** | `validateAndParseJson3` | Defensive schema validators | Vitest tests with valid/invalid JSON fixtures & error payloads | Function call: `unknown -> Result<RawCue[]>` |
| **5. Visual Components** | `SentenceRow`, `SubtitleMatrixView`, etc. | Storybook stories with mock props and responsive states | Storybook visual audit & component snapshot tests | React Props (data in, callbacks out) |
| **6. Integration Shell** | `App.tsx` / `MainPlayerContainer` | Minimal glue wiring clock & store to components | Playwright E2E smoke tests | Reactive subscriber binding |

---

## Verification & Compliance

This architecture satisfies:
- **100% Isolated Testability**: Core logic is verifiable in milliseconds without web servers, browsers, or YouTube players.
- **100% Isolated Designability**: Every UI screen and widget can be modified and styled in Storybook in complete isolation.
- **Zero Architectural Entanglement**: Components communicate across well-defined data interfaces without leaking implementation details.
