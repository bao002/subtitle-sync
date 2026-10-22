# AGENTS.md Optimization Suggestions & Feasibility Analysis (`docs/suggestions.md`)

This document catalogs actionable optimization steps, priority rankings, feasibility assessments, and architectural recommendations for maintaining `AGENTS.md` as a thin, highly efficient instruction set that stays safely beneath platform rule injection limits while guaranteeing 100% compliance with automated verification suites.

---

## 1. Context & Motivation

### The 24KB Rule Limit

In Google AI Studio Build environments, rules defined in repository rule files (such as `AGENTS.md`) are automatically ingested into the system prompt prefix under `<RULE[AGENTS_md]>`.

- **Platform Limit**: Files exceeding **24,576 bytes (24 KB)** are hard-truncated by the environment:
  `[TRUNCATED: This file exceeded the 24KB rule limit. Content beyond this point was omitted.]`
- **Consequence of Truncation**: When `AGENTS.md` reached 25,710 bytes (25.1 KB), critical directives at the bottom of the file (including Subtitles Caching rules and the `## Last raw prompt` section) were omitted from the active agent system prompt, increasing token cost and risking prompt context loss.
- **Target Size**: Maintain `AGENTS.md` strictly under **20,000 bytes (< 19.5 KB)**, leaving at least **4.5 KB – 6.5 KB of safety headroom** for new raw user prompts.

---

## 2. Optimization Steps Ordered by Urgency and Importance

The following optimization steps are ordered hierarchically by urgency (speed of required remediation) and importance (impact on stability, test suites, and compliance).

### Priority 1 (Level: Critical Urgency | Critical Importance)

#### Step 1: Streamline Verbose Narrative Prose & Redundant Theoretical Descriptions

- **Description**: Condense wordy narrative explanations, redundant theoretical justifications, and duplicate Agile/Kanban rationale into concise, high-density bullet directives.
- **Feasibility**: **Bullet-proof (Recommended to Implement)**.
- **Implementation Status**: **Fully Implemented**.
- **Results**: File size reduced from 25,710 bytes to 17,981 bytes (a 30% reduction, saving 7,729 bytes). The file now sits comfortably at 17.55 KB with 6.6 KB of buffer.
- **Action**: Keep all directives actionable, imperative, and minimal. Avoid multi-paragraph philosophical treatises in `AGENTS.md`.

---

### Priority 2 (Level: High Urgency | Critical Importance)

#### Step 2: Strict Keyword & Assertion Contract Preservation

- **Description**: Ensure that any trimming or refactoring strictly retains 100% of the exact section headers, keywords, and text fragments asserted by the project's automated verification suites.
- **Feasibility**: **Bullet-proof (Mandatory Requirement)**.
- **Implementation Status**: **Fully Implemented**.
- **Audited Assertions Preserved**:
  1. `verify-agents-last-prompt-rule.ts`: `Always keep last raw prompt in AGENTS.md` and `## Last raw prompt`.
  2. `verify-agents-push-rule.ts`: `After git commit, try using git push` and `Enforce updating .md tracking files first before action`.
  3. `verify-agents-subtitles-spec.ts`: `Subtitles fetch fallback strategy`, `` `lang` replacement vs `tlang` parameterization ``, `Anti-bot strategy for YouTube API execution`, `Request validation & "Good" response criteria`, `Caching mechanism & invalidation rules`, `isValidJsonSubtitleResponse`.
  4. `verify-agents-version-rule.ts`: `the app version number must not stay 1.0 always`.
  5. `verify-android-e2e-spec.ts`: `Android app E2E validation, screencast video & GitHub Pages reporting`, `screenrecord`, `pkill -2`, `android.md`.
  6. `verify-application-stages-pipeline.ts`: `Application stages pipeline & execution order`, Stages 1–7 headers, `Special characters removal MUST happen BEFORE the translation stage`, `Absolute Parity Rule Between Advanced and Beginner Modes`.
  7. `verify-code-modularity-standards.ts`: `## Code architecture, modularity, and standards`, `Avoid single-file overload`, `index.tsx`, `Component decomposition discipline`, `src/components/`, `Custom hooks and state isolation`, `src/hooks/`.
  8. `verify-hotfix-and-done-workflow.ts`: `Mandatory migration to `docs/done.md``, `Prompt task completion audit`, `EVERY task and subtask planned for the prompt`, `Hotfix workflow with task suspension`, `Suspend current task`, `ON HOLD`, `Resume held task`.
  9. `verify-no-duplicate-md-files.ts`: `Mandatory location of all .md files under `docs/*.md` & zero duplicates policy`, `ZERO duplicate `.md` files`, `docs/tokens.md`, `docs/android.md`.
  10. `verify-numbered-chapters-protocol.ts`: `Numbered chapters as serial tasks protocol`, `numbered chapters`, `sub-tasks`, `serially`.
  11. `verify-readme-git-sync-rule.ts`: `README.md is to be created by GitHub Actions`, `do not copy it when syncing git`, `update-readme.yml`, `update-readme.mjs`.
  12. `verify-subtitles-fixtures-restriction.ts`: `Subtitles fixtures restriction & zero hardcoded subtitles policy`, `L2Ryrr6txwA`, `public/fixtures/L2Ryrr6txwA`, `Zero hardcoded subtitles policy`.
  13. `verify-task-management-workflow.ts`: `Move completed tasks and sub-tasks completely out of `current-sub-task.md`, ` `docs/tasks.md` is strictly an active backlog containing ONLY pending, active, and upcoming tasks ``.
  14. `verify-tokens-economy.ts`: `tokens.md`, `current-sub-task.md`.
  15. `verify-web-demo-design-preservation.ts`: `Strict UI & Web-Demo Design Preservation Mandate`, `NEVER alter, redesign, replace, re-theme, or disrupt`, `without explicit user confirmation and request`.

---

### Priority 3 (Level: High Urgency | High Importance)

#### Step 3: Offload Deep Technical Specifications to `docs/*.md` Reference Pointers

- **Description**: Treat `AGENTS.md` as a lightweight rule constitution, delegating comprehensive technical specifications, sequence diagrams, and exhaustive data dictionaries to dedicated Markdown documents under `docs/*.md`.
- **Feasibility**: **Bullet-proof (Recommended to Implement)**.
- **Implementation Status**: **Fully Implemented**.
- **Canonical Destinations**:
  - Subtitle Fetch Strategy & Fallbacks: `docs/reliable-subtitles-fetching.md`
  - Caching Architecture & Anti-Abuse: `docs/cache.md` and `docs/auto-retry.md`
  - Android Emulator E2E & Telemetry: `docs/android.md`
  - Parser Timing & Stage Pipeline: `docs/parser.md`
  - Token Economy & Task Flow: `docs/tokens.md`

---

### Priority 4 (Level: Medium Urgency | Medium Importance)

#### Step 4: Extract Application Stages Pipeline & Anti-Bot Tables Entirely Out of AGENTS.md

- **Description**: Relocating Stage 1–7 definitions and Subtitle Anti-Bot / Good Response criteria completely out of `AGENTS.md` into `docs/parser.md` or `docs/reliable-subtitles-fetching.md`, leaving only brief 1-line links in `AGENTS.md`.
- **Feasibility**: **NOT Bullet-Proof (HIGH REGRESSION RISK)**.
- **Recommendation**: **PARTIALLY IMPLEMENT ONLY (Do NOT fully extract)**.
- **Risk Analysis**:
  - Verification scripts `verify-application-stages-pipeline.ts` and `verify-agents-subtitles-spec.ts` contain regex and string assertion checks looking directly inside `AGENTS.md` for `Stage 1: Acquisition & Interception`, `Special characters removal MUST happen BEFORE the translation stage`, `json3`, `tStartMs`, etc.
  - Completely removing these blocks from `AGENTS.md` breaks CI verification suites immediately unless the test scripts are refactored in tandem.
  - _Correct Strategy_: Condense the stages into tight, single-sentence bullet points containing the required keywords, rather than deleting the section.

---

### Priority 5 (Level: Low Urgency | Low Importance)

#### Step 5: Aggressively Truncate or Summarize `## Last raw prompt`

- **Description**: Truncating long user prompts or replacing the raw prompt with a SHA hash or abbreviated excerpt.
- **Feasibility**: **NOT Bullet-Proof (HIGH COMPLIANCE RISK)**.
- **Recommendation**: **SKIP ENTIRELY (Do NOT implement)**.
- **Risk Analysis**:
  - Violates the core mandate: _"AGENTS.md must continuously record and preserve the exact, unedited raw text of the user's latest prompt in a dedicated ## Last raw prompt section."_
  - `verify-agents-last-prompt-rule.ts` specifically verifies that the unedited raw text matches verbatim.
  - Since `AGENTS.md` now sits at ~17.9 KB, there is over 6.5 KB of headroom, making prompt truncation unnecessary.

---

## 3. Decision Matrix & Action Summary

| Step # | Proposed Optimization                                  | Urgency  | Importance | Bullet-Proof? | Action Taken / Recommendation                    |
| :----: | :----------------------------------------------------- | :------: | :--------: | :-----------: | :----------------------------------------------- |
| **1**  | Condense narrative prose & theory                      | Critical |  Critical  |    **Yes**    | **Fully Implemented** (saved 7.7 KB)             |
| **2**  | Preserve all 16 test suite assertion strings           |   High   |  Critical  |    **Yes**    | **Fully Implemented** (100% tests pass)          |
| **3**  | Delegate deep specs to `docs/*.md` pointers            |   High   |    High    |    **Yes**    | **Fully Implemented**                            |
| **4**  | Extract Stage 1–7 pipeline entirely out of `AGENTS.md` |  Medium  |   Medium   |    **No**     | **Partially Implemented** (kept keyword anchors) |
| **5**  | Truncate / summarize `## Last raw prompt`              |   Low    |    Low     |    **No**     | **Skipped** (preserves raw prompt contract)      |

---

## 4. Maintenance Guidelines

1. **Size Budget**: Always check byte count with `wc -c AGENTS.md` before concluding any turn modifying `AGENTS.md`. The size must not exceed 21,000 bytes.
2. **Pre-Action Audit**: Run `npm run test:agents-subtitles-spec` and `npm run test:agents-last-prompt-rule` whenever editing `AGENTS.md`.
3. **Docs Hygiene**: Place all supporting analysis under `docs/*.md` and never duplicate files in the root directory.
