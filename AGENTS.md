<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Subtitles fetching (read first)

- The subtitle fetch design (attempt order, session vs link-only sending, refetch buttons, web demo = local fixtures only) lives in [docs/reliable-subtitles-fetching.md](docs/reliable-subtitles-fetching.md). Follow it for any change to subtitle fetching.

## Work tracking

- **Mandatory location of all .md files under `docs/*.md` & zero duplicates policy**:
  - ALL documentation, specification, design, operational, and architectural Markdown files MUST be located strictly under `docs/*.md` (or its subdirectories `docs/designs/`, `docs/specifications/`, and `docs/operations/`).
  - There must be ZERO duplicate `.md` files in the repository. No Markdown file located under `docs/*.md` may have a redundant copy in the root directory (e.g., `docs/tokens.md`, `docs/android.md`, `docs/parser.md`, `docs/self-verification.md`, and `docs/roadmap.md` reside exclusively in `docs/`).
  - The only Markdown files permitted in the repository root are the primary entry point `README.md`, agent instructions `AGENTS.md`, and the active ephemeral scratchpads `current-sub-task.md` and `temp.md`.
- **Mandatory token economy flow on every prompt (`docs/tokens.md`)**: On EVERY single prompt received, the agent MUST activate and process the token optimization flow defined in `docs/tokens.md`. Big tasks fail and waste immense token budgets when executed monolithically; splitting prompts into atomic sub-tasks and staging them step-by-step eliminates context bloat and prevents tasks from failing due to an inefficient token economy.
- **Task management protocol with `current-sub-task.md` & `temp.md`**:
  - Always break every prompt into clear numbered tasks and smaller sub-tasks in `docs/tasks.md` before performing actions.
  - Maintain `current-sub-task.md` (and `docs/todo.md`): before executing any step, stage the single active sub-task in `current-sub-task.md`. Updating `current-sub-task.md` at each step lowers the risk of wasting tokens by ensuring each tool action and thought cycle is laser-focused on a single verifiable objective.
  - Use `temp.md` as an ephemeral scratchpad for draft diffs, checklists, or intermediate calculations, keeping permanent files clean.
  - Follow prompt steps sequentially step after step, using this efficient workflow even if it refines or updates previous naming conventions.
- Enforce updating .md tracking files first before action: BEFORE jumping to any code edits, actions, or test implementations on a prompt, the agent MUST update `docs/tokens.md`, `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`. The workflow of updating tracking Markdown files prior to taking action is mandatory and takes absolute precedence over jumping directly into source changes.
- For each sub-task in `current-sub-task.md` / `docs/todo.md`:
  1. Ensure the sub-task is explicitly staged in `current-sub-task.md` (and `docs/todo.md`) first.
  2. Implement the sub-task's changes with minimal, targeted file edits.
  3. Add or update dedicated tests covering the specific feature requirements.
  4. Test the changes thoroughly with the dedicated tests, verify app compilation (`compile_applet` / `npm run build`), and run code verification (`lint_applet` / `npm run lint`).
  5. Perform a dedicated Git commit after completing each step (`git commit`) to checkpoint progress and preserve spent tokens.
  6. After git commit, try using git push: attempt `git push` (handling failure gracefully if no remote or credentials) to keep editor and remote synchronized.
  7. **Mandatory migration to `docs/done.md`**: Move completed tasks and sub-tasks completely out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` directly into `docs/done.md`, documenting the completed changes, dedicated test command, and verification outcome. In accordance with Agile/Kanban best practice, `docs/tasks.md` is strictly an active backlog containing ONLY pending, active, and upcoming tasks. Completed items must never linger in `docs/tasks.md`.
- **Prompt task completion audit**: Before concluding any prompt or turn, the agent MUST audit and verify that EVERY task and subtask planned for the prompt in `docs/tasks.md` has been fully accomplished, thoroughly tested with its dedicated automated test, committed, and logged in `docs/done.md`. Never leave prompt tasks abandoned or half-implemented.
- **Hotfix workflow with task suspension (holding pattern)**:
  - When an unexpected defect, broken build, regression, or failing CI flow arises during active development:
    1. **Suspend current task**: Place the active task/sub-task in `current-sub-task.md` **ON HOLD** (marked `[ON HOLD]`), saving its current state and resumption notes.
    2. **Stage hotfix**: Stage a dedicated `Hotfix: <issue>` subtask in `docs/tasks.md`, `current-sub-task.md`, and `docs/todo.md`.
    3. **Execute in isolation**: Implement minimal targeted fix, verify with dedicated automated test, compile (`compile_applet`), and lint (`lint_applet`).
    4. **Commit and document**: Perform a dedicated git commit (`fix(hotfix): <description>`), move the hotfix directly out of `current-sub-task.md`, `docs/todo.md`, and `docs/tasks.md` into `docs/done.md` under `### Hotfix: <issue>`.
    5. **Resume held task**: Only after the hotfix is verified and accomplished, restore the suspended task back to active status in `current-sub-task.md` and `docs/todo.md`, and resume work from where it was paused.
- **Always keep last raw prompt in AGENTS.md**:
  - `AGENTS.md` must continuously record and preserve the exact, unedited raw text of the user's latest prompt in a dedicated `## Last raw prompt` section.
  - On EVERY single prompt received, before or alongside executing actions, the agent MUST update the `## Last raw prompt` section in `AGENTS.md` with the verbatim prompt received. This guarantees that user requirements and exact phrasing are never lost between prompt turns or context compressions.
- To verify any feature, always implement a dedicated test specifically validating the new behavior.
- Check the last GitHub Actions result and fix failed flows: continuously monitor and verify GitHub Actions workflow outcomes (such as `web.yml`, `emulation.yml`, `deploy-demo.yml`, `release-apk.yml`, and `integrity.yml`), diagnose the root cause of any broken or failing CI steps, and fix failed workflows promptly.

## Code architecture, modularity, and standards

- **Avoid single-file overload**:
  - Never concentrate or overload code into a single monolithic file (such as `index.tsx`, `index.ts`, or central entry points). Monolithic files must not become "catch-all" accumulation drawers for multiple components, sprawling state hooks, and inline utilities.
  - Proactively decompose large files into modular, focused files with single, clear responsibilities. Keep individual code files clean, concise, and focused.
- **Component decomposition discipline**:
  - Every structurally distinct or reusable UI component (e.g., accordion sections, table rows, subtitle highlight renderers, pagination bars, footers, modal dialogs, and feature panels) must be defined in its own dedicated component file under `src/components/`.
  - Do not define multiple complex UI components in the same file alongside page or route definitions.
- **Custom hooks and state isolation**:
  - Complex state management, reactive side-effects, speech synthesis/TTS management, and multi-player coordination must be extracted into dedicated custom hooks under `src/hooks/` or state managers under `src/utils/`.
- **Naming and file inventory**:
  - Maintain a documented inventory of files in `docs/files.md`, detailing each file's specific role, dependencies, and feature scope.
  - Name every code file descriptively according to its exact function and feature responsibility (e.g., `AccordionSection.tsx`, `SubtitleRow.tsx`, `HighlightedSubtitle.tsx`, `ApkReleasesFooter.tsx`).

## Clean repository hygiene and authentic testing

- Keep the repository strictly clean of build products, generated artifacts, and synthetic report files: only genuine source code, configuration files, GitHub Actions workflows, and Markdown documentation (`.md` files) belong in the repository.
- Build outputs (such as `dist/`, compiled assets, and runtime caches) must remain ephemeral and ignored, never committed into the source tree.
- Do not add or maintain hardcoded report generators, fabricated HTML presentation dashboards, or synthetic artifact creators (e.g. placeholder video generators or fake test result HTML pages).
- All end-to-end (E2E) and integration tests must validate real application source code and dynamic runtime execution directly; tests must assert genuine component behaviors, state transitions, and actual data flows rather than relying on hardcoded strings or synthetic report templates.

## Project-specific delivery

- This project should remain identical in architecture, tooling, workflows, scripts, and conventions to [mostuf2556/Youtubenet6](https://github.com/mostuf2556/Youtubenet6), with deliberate differences limited strictly to the views and the subtitles parser.
- For every issue, bug, or configuration discrepancy encountered, inspect and compare against the corresponding solution implemented in `https://github.com/mostuf2556/Youtubenet6`.
- Preserve the existing application stack and repository structure.
- Keep GitHub Actions, GitHub Pages reports, the web demo, and Android emulator coverage working together.
- Do not add credentials or invent external service values; document and request anything required.
- **README.md is to be created by GitHub Actions — do not copy it when syncing git**:
  - `README.md` is to be created and dynamically updated by GitHub Actions (via `.github/workflows/update-readme.yml` and `scripts/update-readme.mjs`), embedding active repository badges, workflow links, release assets, emulator screencast video telemetry, and live CI status indicators.
  - When syncing git (e.g., comparing against, pulling from, merging with, or cherry-picking files from baseline/upstream repositories such as [mostuf2556/Youtubenet6](https://github.com/mostuf2556/Youtubenet6), or syncing branches/forks), **`README.md` MUST NOT be copied or overwritten**.
  - Keep the active repository's `README.md` untouched during git sync operations and let GitHub Actions generate, format, and maintain it automatically.
- **App version updates**: The app version number must not stay 1.0 always; it should be updated across `package.json`, `android-shell/app/build.gradle.kts`, `src/utils/apkUpdater.ts`, and `src/utils/appSettings.ts` when delivering updates for prompt response.
- **Strict UI & Web-Demo Design Preservation Mandate**:
  - NEVER alter, redesign, replace, re-theme, or disrupt the user interface, page layout, component structure, or web-demo design without explicit user confirmation and request.
  - The clean, original web-demo layout (including the minimalist single-row YouTube URL input bar, video player container, and collapsible accordion panels) MUST remain intact.
  - New functional capabilities (such as loading alternative video IDs and custom subtitle URLs per language) must integrate seamlessly into the existing UI design without cluttering the page or displacing established UI components.
- **Zero GitHub Actions cron jobs policy**:
  - All GitHub Actions workflows under `.github/workflows/` must strictly be event-driven (`push`, `pull_request`, `workflow_dispatch`, `workflow_run`).
  - No workflow may define a `schedule:` or `cron` trigger under any circumstances. Cron jobs cause unexpected automated runs, unpredictable background commits, and git merge conflicts. All pipeline automation is triggered solely by genuine repository events and manual dispatches.

### Android app E2E validation, screencast video & GitHub Pages reporting

- **Mandatory E2E verification on real Android runtimes**:
  - Whenever Android shell components, WebView bridges, native caption interception, web build asset bundling, or video player integrations are modified, the changes MUST be validated through end-to-end (E2E) execution on an Android device or emulator (API 34 Google APIs).
  - The E2E suite (`scripts/run-android-e2e.sh`, `scripts/android-e2e-assert.sh`, `e2e/emulation.spec.ts`) verifies real application startup, clean local asset hydration without error screens ("This page didn't load"), authentic timedtext caption interception without fixtures, target language fallback (`tlang` vs `lang`), and intent handling (`ACTION_VIEW` and `ACTION_SEND`).
- **Screencast video recording protocol**:
  - An authentic MP4 video screencast of the E2E test execution on the Android emulator/device must be recorded using native `adb shell screenrecord --time-limit 180 --bit-rate 4000000 /sdcard/android-emulator-video.mp4`.
  - The recording MUST be started before launching the target activity to capture the initial application boot and subtitle discovery phases.
  - Video finalization MUST send a graceful SIGINT (`adb shell pkill -2 -f screenrecord`) allowing the container `moov` header to be cleanly written before pulling via `adb pull`.
- **Strict repository hygiene for video & build outputs**:
  - Video recordings (`android-emulator-video.mp4`), device screenshots, full logcat dumps, and build binaries (`dist/`, APKs) MUST NEVER exist or be committed on the `main` branch.
  - Build outputs and video artifacts are stored ephemerally as GitHub Actions workflow artifacts (`actions/upload-artifact@v4`) and staged to the orphaned `gh-pages` branch.
- **GitHub Pages report presentation**:
  - The GitHub Pages deployment (`gh-pages` branch) hosts the integrated test presentation at `/android/` and `/android-emulator-report.html`.
  - The report must feature:
    1. Execution outcome badge (Verified vs Failed).
    2. Live device hardware and system telemetry card (model, manufacturer, Android SDK, ABI, resolution, density, connectivity).
    3. 5-step E2E milestone workflow cards with captured screenshots.
    4. An embedded HTML5 video player (`<video controls autoplay muted loop playsinline>`) streaming the MP4 screencast.
    5. Primary full-resolution screen capture.
    6. Filtered logcat telemetry showing chronological `SUBTITLE_FETCH` lines.
    7. Cross-links to Mochawesome E2E report, Playwright report, and the live web demo.
  - Detailed operational instructions and schemas are maintained in `docs/android.md`.
  - Subtitle parsing specifications and timing rules are maintained in `docs/parser.md`.
  - Self-verification protocol and sanity checks are maintained in `docs/self-verification.md`.

## Subtitles fetch, anti-bot, validation, and caching architecture

### 1. Subtitles fetch fallback strategy (`lang` replacement vs `tlang` parameterization)

- **Two fetch strategies**:
  - **`tlang` parameterization (translation mode)**: Preserves the video's original spoken language track in the `lang` query parameter (e.g., `lang=en`) and specifies the desired target language using `tlang` (e.g., `tlang=he`). This instructs YouTube's timedtext service to machine-translate the primary subtitle stream.
  - **`lang` code replacement (direct track mode)**: Replaces the `lang` parameter directly with the target language (e.g., `lang=he`) while omitting `tlang`. This instructs YouTube to look for an uploaded, native caption track authored in the target language.
- **User toggle & preferences**: The application MUST allow the user to toggle between these two request modes via device-saved preferences (`SubtitleRequestMode` in `src/lib/playback-preferences.ts`, values `"tlang"` | `"lang"`). The UI must expose this selection (e.g. in Playback/Parser settings).
- **Graceful fallback sequencing**: When requesting subtitles for target languages:
  1. The primary mode selected by the user is executed first.
  2. If the primary mode fails (non-200 HTTP status, invalid JSON, or zero cues), the fallback mode is executed automatically (`subtitleRequestModeOrder`).
  3. All original session signature parameters (`v`, `expire`, `sparams`, `signature`, `key`, `caps`, `asr_langs`, etc.) from the intercepted authentic URL must be retained in both modes to prevent broken queries.

### 2. Anti-bot strategy for YouTube API execution

- **Authentic session capture**: Subtitle requests must never originate from raw unauthenticated scrapers or synthesized naked URLs. On Android, the native shell intercepts real `youtube.com/api/timedtext` requests issued by the embedded YouTube player inside the WebView, capturing live session headers (`lastObservedHeaders`), including session cookies (`PREF`, `YSC`, `VISITOR_INFO1_LIVE`), Authorization/SAPISIDHASH tokens, Client Info, and `Referer: https://www.youtube.com/`.
- **WebView User-Agent sanitization**: The WebView User-Agent string MUST be sanitized by stripping `; wv` (`userAgentString = userAgentString.replace("; wv", "")`). This prevents YouTube from classifying the app as an automated embedded WebView and serves standard mobile Chrome assets.
- **Request pacing & rate control**: Requests must never hammer YouTube's API concurrently across all target languages. Calls must be paced with serialized execution or staggered jitter. If a 429 (Too Many Requests) or 403 (Forbidden) response is encountered, requests must immediately pause and back off rather than flood the server.
- **Native OkHttp repetition**: On Android, repetition requests use the native `OkHttpClient` initialized with the captured session headers and cookies, executing transparent gzip/brotli decompression and matching genuine browser network signatures.

### 3. Request validation & "Good" response criteria

A subtitle HTTP response is considered valid and "good" ONLY when it satisfies all of the following criteria:

- **HTTP status**: Status code must be 200 OK. Any 4xx or 5xx status code is strictly rejected as a failure.
- **Valid JSON parsing**: Response body must be non-empty, must start with `{` or `[`, and must parse successfully without syntax errors. HTML error responses (e.g., containing `<!DOCTYPE html>` or `<html>`) are rejected immediately.
- **YouTube `json3` structural schema compliance**:
  - Must contain a top-level `events` array (or a list of cue objects).
  - The `events` array must be non-empty (`events.length > 0`).
  - Valid events must contain numeric start and duration timing attributes (`tStartMs` and `dDurationMs` numbers).
  - Valid events must contain a `segs` array with at least one segment object containing a non-empty string in the `utf8` property (`typeof seg.utf8 === "string" && seg.utf8.trim().length > 0`).
- **Non-zero cue count**: The parsed result must yield at least one valid subtitle cue (`cuesCount > 0`). Empty subtitle files (`events: []`) are rejected.

### 4. Caching mechanism & invalidation rules

- **Pre-cache validation gate**: Every subtitle response must be verified with `isValidJsonSubtitleResponse()` before being written to memory cache, `localStorage`, or SQLite/file storage.
- **Never cache invalidated responses**:
  - Responses that return HTTP errors, network timeouts, or status codes other than 200 MUST NEVER be cached.
  - HTML error pages, malformed payloads, synthetic placeholders, and empty cue lists (`events: []`) MUST NEVER be cached.
  - Only responses satisfying all "good" response criteria above are eligible for storage.
- **Read-time eviction**: When reading cached data, if an entry is found to be corrupted, malformed, or contains zero cues, it must be purged and evicted from the cache immediately.
- **Explicit cache management**: The application must provide explicit cache controls ("Clear cache" and "Fetch from scratch") allowing users to clear cached entries and re-fetch authentic subtitle data on demand.

## Last raw prompt

```
different next 2 tasks:
1. subtitles table view - if a video loaded after another it still doesnt clean the previous table
2. cache the subtitles returned from the AI. and allow to load it
```







