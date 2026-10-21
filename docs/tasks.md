# Tasks (Active Backlog)

This file is strictly the active backlog containing pending, active, and upcoming tasks. Completed tasks are migrated directly into `docs/done.md`.

## Active Tasks

### Task 175: Prefer Lovable TTS Service Over Native Capabilities with Configured Target Language, Current Text, Configured Speed, and Streamlined Voice-Types Dropdown (Version 1.0.68) [ACTIVE]

#### Objective:

When the user prefers the TTS service over native device/browser capabilities, speak subtitles using the current text, the configured target language, the configured TTS speed, and provider: "lovable". Eliminate all playground controls (no method, format, raw JSON options, or multi-provider experimental inputs) and present a clean, dedicated drop-down list of Lovable voice-types (Kore, Puck, Charon, Fenrir, Aoede) in both Advanced Mode and Beginner Mode with 100% parity.

#### Subtasks:

- [x] **Subtask 175.1**: Update `src/lib/alternative-tts.ts` to enforce provider: "lovable", pass current text, configured target language, configured speed, and selected Lovable voice-type [DONE].
- [x] **Subtask 175.2**: Streamline UI in Advanced Mode (`src/routes/index.tsx`) and Beginner Mode (`BeginnerPreferencesTab.tsx`) to remove all playground controls, show a clean preference toggle and Lovable voice-types dropdown, and wire subtitle playback in `speak()` [DONE].
- [ ] **Subtask 175.3**: Bump version to 1.0.68 across 5 targets, author `scripts/verify-lovable-tts-service-preference.ts`, update `docs/files.md`, run tests, compile, lint, commit, attempt push, and migrate to `docs/done.md` [ACTIVE].

## Later Tasks

_(No remaining later tasks — all staged into active backlog)_
