# Next Version From Scratch: Clean Application Architecture & Build Blueprint

## Overview & Purpose

This document provides a clean-slate architectural blueprint for building the **Parallel Multi-Language Subtitle Video Player** in its simplest, most robust form. It explains the high-level design, sequential pipeline, and component responsibilities without getting bogged down in low-level code implementation.

Critically, this document intentionally identifies and discards the historical architectural pitfalls, accumulated technical debt, and accidental complexities ("the bad parts") from the project's evolution, establishing an authoritative guide for a clean, maintainable rebuild.

---

## 1. The Zoom-Out View (The 30,000-Foot Architectural Mental Model)

At its core, the application serves a single, powerful mission: **to be an interactive language-learning companion that synchronizes a video stream with a parallel, multi-lingual sentence matrix.**

### The Core Paradigm: A Unidirectional Media-Driven Pipeline

Instead of juggling disparate state mechanisms, the entire application revolves around a clean, unidirectional flow:

```
[ Video Player Clock ] ──(timestamp ticks)──> [ Playback & Audio Coordinator ]
                                                        │
                                                        ▼
[ Raw Captions (JSON3) ] ──> [ Sanitizer ] ──> [ Sentence Splitter ] ──> [ Alignment Grid ]
                                                                                │
                                                                                ▼
                                                                     [ Aligned Sentence UI ]
```

1. **The Clock Heartbeat**: The video player emits a continuous stream of playback timestamps ($t_{\text{video}}$).
2. **The Subtitle Ingestion Gate**: Raw timed text is ingested once, strictly validated, sanitized, and transformed into discrete sentence units.
3. **The Multi-Language Matrix**: Multiple language streams (base language + target learning languages) are aligned side-by-side using sentence time boundaries.
4. **The Coordination State Machine**: An orchestration engine observes the player clock, highlights the active sentence, and pauses between sentences to allow sentence-repeat or text-to-speech (TTS) synthesis to complete before resuming video.

### Clean-Slate Simplicity Principle
- **100% Client-Side Reactive State**: No database servers, no external auth, no backend microservices. The app runs completely in the browser or WebView.
- **State as a Single Source of Truth**: User preferences and active tracks live in a single reactive store (e.g. Zustand) with automated `localStorage` persistence.
- **Pure Functional Transformations**: Text sanitization, sentence splitting, and matrix alignment are pure functions with no DOM or player side-effects.

---

## 2. The Closer Overview: 5 Sequential Build Steps

Building this application from scratch requires only 5 sequential, decoupled steps:

```
Step 1: Media Host & Time Bus
   └── Step 2: Caption Ingestion & Schema Gate
          └── Step 3: Text Sanitization & Sentence Boundary Splitting
                 └── Step 4: Multi-Language Sentence Matrix Alignment
                        └── Step 5: Read-Along & Audio Synthesis Coordinator
```

### Step 1: Media Host & Playback Clock
- **Goal**: Abstract the video player (YouTube iframe, native Android player, or HTML5 video) behind a lightweight player interface.
- **How it works simply**:
  - Exposes standard controls: `play()`, `pause()`, `seekTo(ms)`, `getCurrentTimeMs()`, `setPlaybackRate(speed)`.
  - Publishes a continuous time tick event (throttled to ~100ms) to a sync bus so child components can react to time changes without triggering full UI re-renders.

### Step 2: Caption Ingestion & Schema Gate
- **Goal**: Ingest subtitle streams safely and reliably, rejecting invalid data before it enters the application.
- **How it works simply**:
  - Connects to subtitle sources: authentic YouTube `timedtext` endpoints (or native WebView intercepted requests), direct user-provided caption URLs, or an isolated local fixture for development.
  - Validates incoming payloads at the boundary: HTTP 200 status, valid JSON structure matching the YouTube `json3` format (`events` containing `tStartMs`, `dDurationMs`, and `segs[].utf8`), and a non-zero cue count.
  - Rejects HTML error pages or empty payloads immediately.

### Step 3: Text Sanitization & Sentence Boundary Splitting (The Parser)
- **Goal**: Transform raw, continuous stream cues into clean, grammatically coherent sentences with interpolated start and end timestamps.
- **How it works simply**:
  - **Sub-step A (Sanitization)**: Execute sanitization *strictly before* splitting and translating. Strip speaker annotations (`[Speaker 1]:`), sound/music indicators (`[Music]`, `[Applause]`), angle brackets/chevrons (`>`, `>>`), and HTML entities.
  - **Sub-step B (Sentence Boundary Detection)**: Scan text for terminal punctuation marks (`.`, `!`, `?`, `…`) or language-specific sentence terminators.
  - **Sub-step C (Timestamp Interpolation)**: Linearly interpolate millisecond start and end timestamps across token boundaries so each new sentence gets an accurate time range $[t_{\text{start}}, t_{\text{end}}]$.

### Step 4: Multi-Language Sentence Matrix Alignment
- **Goal**: Align multiple subtitle language tracks into parallel, synchronized rows.
- **How it works simply**:
  - Designates the primary/base track (e.g., the video's spoken language) as the "spine" that defines the sentence rows.
  - For each target learning language, maps foreign subtitle cues whose timestamps overlap with the primary sentence's $[t_{\text{start}}, t_{\text{end}}]$ window.
  - Assembles a clean 2D data structure: an array of Sentence Rows, where each row contains the time interval and a map of `[langCode: sentenceText]`.

### Step 5: Read-Along & Audio Synthesis Coordinator (The State Machine)
- **Goal**: Orchestrate the learning flow by pausing video at sentence boundaries, speaking target translations via Web Speech or external TTS, and resuming playback.
- **How it works simply**:
  - Driven by a clean Finite State Machine (FSM):
    - `IDLE`: Video paused, ready.
    - `PLAYING_VIDEO`: Video running, active sentence highlighted.
    - `PAUSED_FOR_TTS`: Video paused at sentence boundary; TTS voice reads the target sentence.
    - `PAUSED_FOR_USER`: Video paused for user repeat/practice loop.
  - Transitions happen deterministically on clear events (`onSentenceEnd`, `onTtsFinished`, `onUserPlay`), eliminating timing glitches.

---

## 3. Component Inventory: Goals & Responsibilities

In a clean architecture, every component has one clear, single responsibility:

| Component | Primary Goal & Responsibility |
| :--- | :--- |
| **`VideoPlayerHost`** | Wraps the video player iframe/native view, emits playback state and millisecond clock ticks, and accepts seek/pause/play commands. |
| **`SubtitleMatrixView`** | Renders the virtualized/paged parallel subtitle grid; automatically scrolls the currently active sentence into visible view during playback. |
| **`SentenceRow`** | Renders a single synchronized row displaying the base sentence and all selected target languages side-by-side, with one-click replay, loop, and speak buttons. |
| **`AudioCoordinator`** | Headless controller that listens to clock updates, detects sentence boundary crossings, triggers TTS synthesis, and manages the pause/resume cycle. |
| **`LanguageSelector`** | Allows the user to select their native base language and toggle one or more target learning languages from available tracks. |
| **`PlaybackToolbar`** | Minimal floating or docked control bar providing play/pause, playback speed, subtitle font size, auto-scroll toggle, and loop mode. |
| **`PreferencesDrawer`** | Slide-out or collapsible settings panel for secondary options (TTS voice selection, speech rate, custom punctuation criteria, fetch preferences). |
| **`CaptionSourceGate`** | Headless service that abstracts caption fetching, handles CORS/interception headers, validates schemas, and provides mock fallbacks during offline testing. |

---

## 4. The "Bad Parts" of Project History (Explicitly Avoided)

A critical requirement for building the next version from scratch is deliberately omitting the architectural anti-patterns that complicated previous iterations:

### 1. No Monolithic Mega-Files (Avoid 9,000+ Line Route Files)
- **The Historical Anti-Pattern**: A single central file (`src/routes/index.tsx`) grew to over 9,000 lines, mixing video player hooks, DOM markup, TTS queuing, accordion state, style declarations, and debug utilities in one tangled scope.
- **The Clean-Slate Solution**: Strict decomposition. Every component lives in its own focused file under `src/components/` (< 250 lines). State is isolated in custom hooks (`usePlayerClock`, `useSubtitleMatrix`, `useTtsCoordinator`).

### 2. No Dual-Mode DOM Duplication ("Beginner" vs "Advanced" Trees)
- **The Historical Anti-Pattern**: Forking the interface into separate "Beginner Mode" and "Advanced Mode" views resulted in duplicated DOM structures, redundant accordion trees, and complex cross-mode parity rules to keep features in sync.
- **The Clean-Slate Solution**: Progressive disclosure using a single unified component tree. The UI remains identical under the hood; a simple "simplified/compact" mode toggle merely hides advanced settings drawers without duplicating rendering logic or state stores.

### 3. No Premature Database or Backend Sprawl
- **The Historical Anti-Pattern**: Introducing database tables (Supabase/PostgreSQL) and server migrations for an application that operates entirely as a personal client-side media companion, resulting in quarantine overhead and unnecessary network dependencies.
- **The Clean-Slate Solution**: 100% serverless, client-first architecture. All user configurations, favorite languages, and video notes persist in standard, lightweight browser `localStorage` or `IndexedDB`.

### 4. No Ad-hoc Race Conditions or Timer Hacks
- **The Historical Anti-Pattern**: Using scattered `setTimeout` delays, manual cooldown flags, and ad-hoc pause-reason variables to coordinate video pausing with TTS playback, leading to audio overlaps and frozen playback states.
- **The Clean-Slate Solution**: A formal, deterministic Finite State Machine (FSM). The state machine transitions strictly on discrete signals (`speechSynthesis.onend`, `player.onStateChange`), providing rock-solid audio coordination.

### 5. No Hardcoded Subtitle Pollution Across Source Files
- **The Historical Anti-Pattern**: Inlining mock cue arrays and static translation dictionaries across configuration files (`appConfig.ts`, `fixtures.ts`), which risked leaking synthetic data into real video sessions.
- **The Clean-Slate Solution**: A strict zero-hardcoded-subtitles policy. Application code contains zero static subtitles. Offline fixtures are isolated to a mock provider used strictly in development environments and end-to-end tests.

### 6. No Deeply Nested Accordion Mazes
- **The Historical Anti-Pattern**: Nesting accordions inside accordions (e.g. Settings containing Accordion containing Sub-Accordion) to tuck away controls, which degraded mobile touch usability and created visual clutter.
- **The Clean-Slate Solution**: Clean, flat visual hierarchy. Primary actions (video, parallel subtitles, play controls) remain permanently accessible, while configuration options are organized in a clean tabbed settings sheet.

---

## 5. Technology Stack & Implementation Recommendations

For an optimal developer experience and performance, the clean-slate implementation should use:

1. **Framework**: React 18+ with TypeScript on Vite (fast HMR, lightweight bundling).
2. **Styling**: Tailwind CSS for responsive, mobile-first design without style collision.
3. **State Management**: Zustand or Nanostores for lightweight, decoupled reactive stores outside the React render tree.
4. **Speech Engine**: Web Speech API (`window.speechSynthesis`) with pluggable fallback to remote REST TTS services.
5. **Component Development**: Storybook for developing and testing UI components in isolation before wiring them to live video events.
6. **Testing**: Vitest for pure functional pipeline tests (sanitization, splitting, alignment) and Playwright for real browser playback verification.

---

## 6. Build Roadmap Summary

```
Phase 1: Pure Functions (Zero UI)
  ├─ Write text sanitizer (strip brackets, noise tokens, arrows).
  ├─ Write sentence boundary splitter with linear timestamp interpolation.
  └─ Write multi-language temporal alignment matrix.

Phase 2: Headless State & Player Integration
  ├─ Build player wrapper with monotonic clock subscriber.
  ├─ Build caption ingestion gate with JSON3 validator.
  └─ Build FSM coordinator (Video Playing <-> Pause for Speech <-> Resume).

Phase 3: Modular UI Assembly
  ├─ Assemble SubtitleMatrixView & SentenceRow components.
  ├─ Add LanguageSelector & PlaybackToolbar.
  └─ Add PreferencesDrawer for configuration options.
```

---

## 7. Architectural Review: Key App-Level Design Decisions (Yes/No Diagnostic Guide)

This section conducts an architectural review using diagnostic Yes/No questions to reveal and solidify the most important app-level design decisions while exposing the exact pitfalls they avoid.

### 1. Data Flow & Clock Heartbeat
> **Question**: *Should the video player clock serve as the single, unidirectional heartbeat driving both the subtitle matrix and the audio coordinator?*
>
> **Decision: YES**
>
> - **Architectural Rationale**: The video player is the physical time authority. Emitting monotonic clock ticks to a lightweight subscription bus decouples subtitle row highlighting and pause triggers from UI render lifecycles.
> - **Bad Part Avoided**: Eliminates scattered, bidirectional event listeners and polling loops where multiple components independently queried `player.getCurrentTime()`.

### 2. Pipeline Sequence & Text Sanitization
> **Question**: *Must text sanitization (stripping speaker brackets, sound effects, arrows) occur strictly before sentence boundary detection and translation?*
>
> **Decision: YES**
>
> - **Architectural Rationale**: Terminal punctuation scanners and translation engines must receive clean prose. Translating noise tags like `[Applause]` or `>>` corrupts the translation engine's grammar model and produces mistranslated tokens.
> - **Bad Part Avoided**: Avoids post-translation cleanup hacks and duplicate sanitization routines in both the player and the parser views.

### 3. Backend & Persistence Strategy
> **Question**: *Does the application require a backend database (PostgreSQL, Supabase, Firestore) or server-side state?*
>
> **Decision: NO**
>
> - **Architectural Rationale**: 100% Client-First Architecture. This application is fundamentally an interactive personal media companion. All user configurations, favorite languages, and playback settings fit naturally into browser `localStorage` or `IndexedDB`.
> - **Bad Part Avoided**: Prevents premature backend sprawl, database migrations, network latency, and the quarantine debt seen in previous iterations.

### 4. Audio Coordination & Video Pausing
> **Question**: *Should read-along and speech synthesis (TTS) timing be governed by an explicit Finite State Machine (FSM) rather than `setTimeout` delays and manual flags?*
>
> **Decision: YES**
>
> - **Architectural Rationale**: Media playback and synthetic speech operate on asynchronous hardware queues. State transitions must occur strictly on discrete signals (`speechSynthesis.onend`, `player.onStateChange`).
> - **Bad Part Avoided**: Eradicates race conditions, audio overlaps, and frozen player states caused by ad-hoc `setTimeout` hacks and cooldown timers.

### 5. User Interface Hierarchy & Modes
> **Question**: *Should "Beginner Mode" and "Advanced Mode" be built as separate, parallel component hierarchies?*
>
> **Decision: NO**
>
> - **Architectural Rationale**: Single Unified Component Tree with Progressive Disclosure. The core interaction is identical regardless of user level: a video player and parallel subtitles. Progressive disclosure uses a simple density/visibility toggle to hide secondary controls without duplicating DOM trees or state stores.
> - **Bad Part Avoided**: Avoids dual-mode DOM duplication, sync bugs, and the need for complex parity tests across separate mode implementations.

### 6. Subtitle Ingestion & Fixture Boundaries
> **Question**: *Should the application bundle hardcoded subtitle cue arrays or static translation dictionaries in source configuration files?*
>
> **Decision: NO**
>
> - **Architectural Rationale**: Strict Zero-Hardcoded-Subtitles Policy. Subtitles must always flow dynamically through the Caption Ingestion Gate (from authentic timedtext streams or direct user URLs). Fixtures are strictly isolated to a mock provider for offline development and tests.
> - **Bad Part Avoided**: Eliminates stale mock data leaking into real video sessions and ensures the parser always validates real-world subtitle payloads.

### 7. Component Responsibilities & Modularity
> **Question**: *Should route/page components contain business logic, caption parsing algorithms, and speech synthesis handlers?*
>
> **Decision: NO**
>
> - **Architectural Rationale**: Strict Component Decomposition (< 250 lines per component) & Pure Functional Parsers. Transforming raw cues into sentences and aligning multi-language matrices are pure mathematical/string functions with zero DOM or player side-effects. Keeping them pure enables instant, reliable unit testing.
> - **Bad Part Avoided**: Prevents monolithic mega-files (such as central route files growing into 9,000+ tangled lines).

### 8. Subtitle Matrix Grid Model
> **Question**: *Should secondary/translated subtitle tracks define their own independent sentence rows?*
>
> **Decision: NO**
>
> - **Architectural Rationale**: Primary Spoken Language as the Master Temporal "Spine". Subtitles in different languages rarely share identical clause breaks. Using the primary language track's $[t_{\text{start}}, t_{\text{end}}]$ sentence windows as the fixed anchor ensures consistent row alignment across any number of target languages.
> - **Bad Part Avoided**: Avoids jagged, misaligned rows and visual drift across languages during video playback.

---

### Summary Checklist for a Clean-Slate Rebuild

| Architectural Dimension | Decision |
| :--- | :--- |
| **Clock Authority** | Unidirectional video clock heartbeat |
| **Stage Order** | Ingestion ➔ Sanitization ➔ Splitting ➔ Translation ➔ Alignment ➔ Coordination |
| **Backend Footprint** | Zero (100% client-side reactive store) |
| **Audio/Pause Timing** | Deterministic Finite State Machine (no `setTimeout`) |
| **UI Structure** | Unified tree with progressive disclosure (no duplicated modes) |
| **Data Hygiene** | Zero hardcoded subtitles in application source |
| **Code Structure** | Pure functional pipelines + isolated single-responsibility components |

