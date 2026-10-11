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

## Work tracking

- Enforce updating .md tracking files first before action: BEFORE jumping to any code edits, actions, or test implementations on a prompt, the agent MUST update `docs/tasks.md` and `docs/todo.md`. The workflow of updating tracking Markdown files prior to taking action is mandatory and takes absolute precedence over jumping directly into source changes.
- Break every new prompt into clear tasks and smaller subtasks in `docs/tasks.md`: immediately record the new task and subtasks in `docs/tasks.md` before writing code.
- Keep `docs/todo.md` strictly focused: it must always contain only the single active sub-task currently being executed, staged in `docs/todo.md` before executing work on that sub-task.
- Follow prompt steps: break every prompt into clear numbered steps and execute them sequentially step after step.
- For each sub-task in `docs/todo.md`:
  1. Ensure the sub-task is explicitly staged in `docs/todo.md` first.
  2. Implement the sub-task's changes.
  3. Add or update dedicated tests covering the specific feature requirements.
  4. Test the changes thoroughly with the dedicated tests, verify app compilation (`compile_applet` / `npm run build`), and run code verification (`lint_applet` / `npm run lint`).
  5. Perform a dedicated Git commit after completing each step (`git commit`) to keep progress incremental and transparent.
  6. After git commit, try using git push: after performing each git commit, attempt `git push` (handling failure gracefully if no remote or push credentials are configured) to keep remote branches and editor synchronized.
  7. Move completed sub-task from `docs/todo.md` to `docs/done.md` and update `docs/tasks.md` to mark it complete `[x]`.
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
- GitHub Pages report: should produce a video of the e2e test running on android emulator and present it on github pages along the e2e reports for web and emulator/device and the demo web app (the video and other build outputs should not exist on the main branch).
- Do not add credentials or invent external service values; document and request anything required.

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
