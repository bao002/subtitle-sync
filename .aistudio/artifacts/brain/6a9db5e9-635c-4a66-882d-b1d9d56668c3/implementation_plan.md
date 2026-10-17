# Per-Language Subtitle URL Input & Clean Web-Demo Top Bar (v1.0.29)

Provide an intuitive per-language subtitle URL modal directly from each language row in the Languages table, while cleaning the redundant drawer from the top bar to preserve the authentic minimalist web-demo design.

## User Review & Critical Decisions

> [!IMPORTANT]
> In accordance with the AGENTS.md **Strict UI & Web-Demo Design Preservation Mandate**, the top YouTube input bar must remain a clean, minimalist single-row input. Rather than cluttering the top bar with a multi-language textarea drawer, custom subtitle URLs are managed directly within the **Languages** table via dedicated per-language action buttons.

- **Confirmed Decision 1**: Keep the top-bar YouTube URL input minimalist and single-row, eliminating the redundant collapsible drawer from `WebDemoUrlsInput.tsx`.
- **Confirmed Decision 2**: Introduce a dedicated Subtitle URL action button (`[URL]`) in each language row within the Languages panel table.
- **Confirmed Decision 3**: Create a modular `LanguageSubtitleUrlModal.tsx` component that accepts custom subtitle URLs (direct URL, timedtext URL, or local fixture), validates payloads via `isValidJsonSubtitleResponse`, parses cues, and immediately updates the active track.
- **Confirmed Decision 4**: Increment the project version to `1.0.29` across `package.json`, `android-shell/app/build.gradle.kts`, `src/config/appConfig.ts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts`.

---

## 1. Overview & Core Concept

- **What It Does**: Enables users and testers to supply custom or alternative subtitle URLs for any specific language directly from the Languages table. Tapping the URL button on a language row opens a clean dialog where the user can enter a URL or load a local fixture, validate the format, and attach it to that language.
- **Target Audience / Persona**: Language learners and developers testing subtitles across multiple languages or custom caption streams without leaving the playback screen.
- **Key Value**: Preserves pristine layout ergonomics by removing top-bar UI noise while making subtitle source management contextual and language-specific.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Viewing Languages**:
   - The user expands the **Languages** accordion panel.
   - The table displays columns: `Language`, `Present in Table`, `TTS-Play`, `TTS Ratio`, `Subtitle Source`, and `Order`.
   - In the `Subtitle Source` column, each language displays an accessible action button with a link/file icon and label (e.g., `Set URL` or current status badge like `Custom URL` / `Loaded (N cues)`).

2. **Opening Subtitle URL Modal**:
   - Clicking the Subtitle URL button opens `LanguageSubtitleUrlModal`.
   - The modal header displays the language name and badge (e.g., `Hebrew (עברית) [he]`).
   - The modal contains:
     - URL input field with placeholder for timedtext or fixture URL.
     - Quick "Load Sample Fixture" button if a sample fixture exists for this language.
     - Live validation and status feedback indicator.
     - `Fetch & Apply` action button and `Cancel` button.

3. **Applying Subtitles**:
   - The user inputs the URL and clicks `Fetch & Apply`.
   - The URL is fetched, strictly validated against YouTube JSON3 schema (`isValidJsonSubtitleResponse`), parsed into cues, and dispatched to update `tracks[lang]`.
   - The modal automatically closes, and the subtitle table updates in real time.

4. **Minimalist Top Bar**:
   - The top bar maintains the original clean input row: YouTube URL field + "Load" button + direct video loading, free from collapsible drawers or textarea clutter.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Per-Language Modal vs. Global Multi-URL Drawer

- **Chosen Approach**: Modal dialog triggered per language from the Languages table.
- **Why**: Language-specific configuration naturally belongs in the Languages section. It avoids error-prone multi-line prefix parsing (e.g. `he: https://...`) and keeps the primary video URL input bar pristine.
- **Alternatives Considered**: Global drawer in top bar (rejected: violates UI preservation mandate and causes layout shifts).

### Decision 2: Re-use of Core Validation & Anti-Bot Architecture

- **Chosen Approach**: Use existing `isValidJsonSubtitleResponse` and `fetchViaServer` / native fetch mechanisms.
- **Why**: Ensures no invalid, empty, or HTML error responses ever enter state or cache, adhering strictly to AGENTS.md Section 3 & 4.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Web Demo / Android App                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ WebDemoUrlsInput (Clean Minimalist Single Row)         │  │
│  │ [ https://www.youtube.com/watch?v=... ] [ Load Video ] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Languages Accordion Panel                              │  │
│  │ ┌──────┬──────────┬──────────┬───────────┬──────────────┐  │  │
│  │ │ Lang │ In Table │ TTS-Play │ TTS Ratio │ Subtitle URL │  │  │
│  │ ├──────┼──────────┼──────────┼───────────┼──────────────┤  │  │
│  │ │ en   │   [x]    │   [ ]    │    1.0    │  [ Set URL ] │──┼┐ │
│  │ │ he   │   [x]    │   [x]    │    1.5    │  [ Set URL ] │  ││ │
│  │ └──────┴──────────┴──────────┴───────────┴──────────────┘  ││ │
│  └────────────────────────────────────────────────────────┘  ││ │
└──────────────────────────────────────────────────────────────┼┘ │
                                                               │  │
                                                               ▼  │
┌─────────────────────────────────────────────────────────────────┐
│ LanguageSubtitleUrlModal                                        │
│ • Language: Hebrew (עברית) [he]                                 │
│ • [ Input: https://... or /fixtures/L2Ryrr6txwA/he.json       ] │
│ • [ Load Sample Fixture ]                                       │
│ • [ Cancel ]  [ Fetch & Apply Subtitles ]                       │
│                                                                 │
│ ──► Validates via isValidJsonSubtitleResponse()                 │
│ ──► Dispatches updateTrack(lang, json3Data)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Component & State Mapping

- **`src/components/LanguageSubtitleUrlModal.tsx`**: Modular dialog component handling URL input, validation, sample fixture pre-fill, and callback invocation.
- **`src/routes/index.tsx`**: Adds state `selectedUrlModalLang: string | null`, renders URL action buttons in the language table rows, and updates active tracks upon confirmation.
- **`src/components/WebDemoUrlsInput.tsx`**: Strips out the redundant expanded drawer to restore clean single-row UI.
- **Version bump**:
  - `package.json`: `1.0.29`
  - `android-shell/app/build.gradle.kts`: `versionCode 10029`, `versionName "1.0.29"`
  - `src/config/appConfig.ts`: `APP_VERSION = "1.0.29"`
  - `src/utils/apkUpdater.ts`: `CURRENT_APK_VERSION = "v1.0.29"`
  - `src/utils/appSettings.ts`: `version: "1.0.29"`

### Verification Plan

- Dedicated automated test `scripts/verify-language-button-subtitle-url.ts` verifying:
  1. Version 1.0.29 consistency across all configuration files.
  2. `LanguageSubtitleUrlModal.tsx` exists and handles validation + applying tracks.
  3. Languages table in `src/routes/index.tsx` renders per-language subtitle URL triggers with test IDs.
  4. Top bar in `WebDemoUrlsInput.tsx` is clean and does not expose a redundant drawer.
- Run `compile_applet` and `lint_applet`.
- Stage progress via git commit and migrate to `docs/done.md`.
