# End-to-End Test Plan: TTS Ratio Enforcement (`docs/plan_e2e_test.md`)

## 1. Executive Summary & Objective

This document establishes the comprehensive End-to-End (E2E) testing plan for Text-to-Speech (TTS) ratio enforcement across continuous video playback sessions.

### Problem Addressed by the Fix
Prior to Task 243, when multiple languages were configured for spoken narration, the playback loop fell back to a single global default ratio rather than honoring each spoken language's individual comprehension ratio (`ttsRatios[langCode]`). Furthermore, language codes with dialect tags (e.g. `pt-BR`) or legacy YouTube aliases (e.g. `iw` for Hebrew) failed to match configured language preferences (e.g. `pt` or `he`).

Task 243 resolved this by introducing:
1. `getLanguageTtsRatio`: Strict per-language ratio lookup with alias (`iw`/`il` <-> `he`) and dialect (`pt-BR` <-> `pt`) resolution.
2. Individual candidate filtering in `getEligibleLangs` and `speakRow` during the active playback loop.
3. Visual subtitle cell badge parity (`data-testid="row-${index}-tts-status-${code}"`).

This E2E plan outlines how Playwright tests simulate, execute, and assert this behavior throughout live playback sessions.

---

## 2. Invariants & Verification Criteria

| Invariant | Description | Verification Criterion |
| :--- | :--- | :--- |
| **I1: Multi-Language Independence** | Each spoken language follows its own `1:N` ratio independently. | If Hebrew is `1:1` and Italian is `1:2`, Hebrew speaks on rows 0, 1, 2, 3... while Italian speaks on rows 0, 2, 4... |
| **I2: Alias & Dialect Normalization** | Timedtext tracks with legacy or regional codes must resolve to preference codes. | YouTube `iw` track uses ratio set for `he`; subtitle track `pt-BR` uses ratio set for `pt`. |
| **I3: UI Cell Badge Parity** | Subtitle table visual indicators reflect exact eligibility before and during playback. | Eligible rows display active `TTS` badge; skipped rows display `line-through opacity-35` badge. |
| **I4: Video Transport Coordination** | Video only pauses when at least one language is eligible to speak. | If all enabled languages skip a row (ratio condition not met), video continues playing without pausing. |
| **I5: Reset Cadence Counter** | Clicking `reset-played-subtitles-btn` restarts the modulo count. | Next row played is treated as index 0 for ratio calculations. |
| **I6: Subtitle Table Highlighting Cessation** | Sentences skipped by TTS ratio must NOT be highlighted in the table. | Skipped row cells omit `data-tts-pronounced`, have `data-tts-pronounced-highlight="false"`, omit border/ring classes, and show line-through on the TTS badge. |

---

## 3. Playwright E2E Test Architecture & Harness

### 3.1. Speech Synthesis Interception Hook
Because headless browser environments lack physical audio output, the test harness exposes a mock listener on `window` before navigating:

```typescript
// Exposed to test context to record speech invocations
interface SpeechInvocation {
  text: string;
  lang: string;
  timestamp: number;
}

await page.addInitScript(() => {
  (window as any).__recordedSpeechEvents = [] as SpeechInvocation[];
  
  if (typeof window.speechSynthesis !== "undefined") {
    const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      (window as any).__recordedSpeechEvents.push({
        text: utterance.text,
        lang: utterance.lang,
        timestamp: Date.now(),
      });
      // Emit synthetic end event after simulated brief speaking duration
      setTimeout(() => {
        utterance.onend?.(new Event("end") as any);
      }, 50);
    };
  }
});
```

### 3.2. Subtitle Fixture Isolation
In accordance with the repository zero-hardcoded-subtitles policy, tests strictly utilize approved fixtures for video `L2Ryrr6txwA` located at `public/fixtures/L2Ryrr6txwA/{lang}.json` with explicit `[Fixture]` badging:
- Hebrew: `/fixtures/L2Ryrr6txwA/he.json`
- Italian: `/fixtures/L2Ryrr6txwA/it.json`
- Portuguese (Brazil): `/fixtures/L2Ryrr6txwA/pt-BR.json`

---

## 4. Test Scenarios Matrix

### Scenario 1: Setup Multi-Language Ratios in Beginner Preferences
1. **Action**: Navigate to `/?mode=beginner`.
2. **Action**: On General Preferences tab (`data-testid="beginner-tab-preferences"`), select favorite languages: Hebrew (`he`) and Italian (`it`).
3. **Action**: In Per-Language TTS Settings (`data-testid="beginner-per-language-tts-settings"`):
   - Set Hebrew ratio to `1:1` via `[data-testid="beginner-tts-ratio-he"]`.
   - Set Italian ratio to `1:2` via `[data-testid="beginner-tts-ratio-it"]`.
4. **Assert**: Preferences persist to `localStorage` under `yt_tts_ratios` with `{"he": 1, "it": 2}`.

---

### Scenario 2: Active Session Multi-Language Ratio Verification
1. **Action**: Navigate to Daily Video tab (`data-testid="beginner-tab-video"`).
2. **Action**: Start playback via `[data-testid="btn-player-play-pause"]`.
3. **Simulation**: Advance video through cues 0, 1, 2, and 3:
   - **Cue 0 (Row 0)**:
     - Hebrew (`1:1`): Eligible (`0 % 1 === 0`) -> Speaks Hebrew.
     - Italian (`1:2`): Eligible (`0 % 2 === 0`) -> Speaks Italian.
     - Video state: Pauses for speech, then resumes.
   - **Cue 1 (Row 1)**:
     - Hebrew (`1:1`): Eligible (`1 % 1 === 0`) -> Speaks Hebrew.
     - Italian (`1:2`): Skipped (`1 % 2 !== 0`) -> Does NOT speak Italian.
     - Table UI: `[data-testid="row-1-tts-status-it"]` has `line-through` style; `[data-testid="row-1-tts-status-he"]` is active.
   - **Cue 2 (Row 2)**:
     - Hebrew (`1:1`): Eligible (`2 % 1 === 0`) -> Speaks Hebrew.
     - Italian (`1:2`): Eligible (`2 % 2 === 0`) -> Speaks Italian.
   - **Cue 3 (Row 3)**:
     - Hebrew (`1:1`): Eligible -> Speaks Hebrew.
     - Italian (`1:2`): Skipped -> Does NOT speak Italian.
4. **Assert**: Verify `window.__recordedSpeechEvents` contains:
   - Row 0: `[he, it]`
   - Row 1: `[he]`
   - Row 2: `[he, it]`
   - Row 3: `[he]`

---

### Scenario 3: Dialect & Legacy Code Alias Resolution
1. **Action**: Configure ratio for generic Portuguese: `ratios["pt"] = 3` (`1:3`).
2. **Action**: Load video with authentic YouTube Brazilian Portuguese caption track (`pt-BR`).
3. **Assert**: `getLanguageTtsRatio(ratios, "pt-BR")` returns `3`.
4. **Assert**: In subtitle table, `data-testid="row-0-tts-status-pt-BR"` shows active `TTS`, rows 1 and 2 show `line-through`, and row 3 shows active `TTS`.
5. **Action**: Load YouTube track tagged with legacy Hebrew code `iw`.
6. **Assert**: Evaluates against `ratios["he"]` without falling back to default `1:1`.

---

### Scenario 4: Dynamic Ratio Change Mid-Session
1. **Action**: Start playing session with Hebrew at `1:3`.
2. **Observe**: Rows 0 speaks, Rows 1 & 2 are skipped.
3. **Action**: Mid-playback, change Hebrew ratio to `1:1`.
4. **Assert**: Next row (Row 3) and subsequent rows immediately speak without requiring a page reload or video re-initialization.

---

### Scenario 5: Reset Played Subtitles Counter
1. **Action**: Play 5 rows with ratio `1:3` (Rows 0 & 3 spoken, Rows 1, 2, 4 skipped).
2. **Action**: Click reset counter button (`data-testid="reset-played-subtitles-btn"`).
3. **Assert**: Next row processed resets offset to 0 and is immediately eligible for TTS speech.

---

### Scenario 6: Subtitles Table Highlighting Cessation on Ratio-Skipped Sentences
This scenario verifies that the subtitles table strictly stops applying pronounced styling to sentences that are skipped due to the configured TTS ratio:

1. **Setup**:
   - Spoken language enabled: Italian (`it`).
   - Ratio configured: `1:2` (Speak 1 of every 2 sentences).
   - Load video with at least 4 subtitle rows (rows 0, 1, 2, 3).
2. **Playwright DOM Assertions for Eligible Rows (Row 0 & Row 2)**:
   ```typescript
   // Row 0 is eligible (0 % 2 === 0):
   const cell0 = page.locator('[data-testid="subtitle-cell-0-it"]');
   await expect(cell0).toHaveAttribute("data-tts-pronounced", "true");
   await expect(cell0).toHaveClass(/border-primary/);

   const container0 = page.locator('[data-testid="sentence-container-0-it"]');
   await expect(container0).toHaveAttribute("data-tts-pronounced-highlight", "true");
   await expect(container0).toHaveClass(/ring-primary/);

   const badge0 = page.locator('[data-testid="row-0-tts-status-it"]');
   await expect(badge0).toHaveClass(/bg-primary/);
   await expect(badge0).not.toHaveClass(/line-through/);
   ```
3. **Playwright DOM Assertions for Skipped Rows (Row 1 & Row 3)**:
   ```typescript
   // Row 1 is skipped (1 % 2 !== 0): Highlighting MUST be stopped/omitted
   const cell1 = page.locator('[data-testid="subtitle-cell-1-it"]');
   // Assert data-tts-pronounced attribute is completely absent on the td
   expect(await cell1.getAttribute("data-tts-pronounced")).toBeNull();
   // Assert cell DOES NOT contain the highlight border class
   await expect(cell1).not.toHaveClass(/border-s-2/);

   const container1 = page.locator('[data-testid="sentence-container-1-it"]');
   // Assert data-tts-pronounced-highlight attribute is strictly 'false'
   await expect(container1).toHaveAttribute("data-tts-pronounced-highlight", "false");
   // Assert container DOES NOT contain active highlight ring or shadow
   await expect(container1).not.toHaveClass(/ring-primary/);

   const badge1 = page.locator('[data-testid="row-1-tts-status-it"]');
   // Assert badge indicates skipped status via line-through styling
   await expect(badge1).toHaveClass(/line-through/);
   await expect(badge1).toHaveClass(/opacity-35/);
   ```
4. **Transition to 1:1 Ratio (All Highlighting Cleared)**:
   - Change Italian ratio to `1:1`.
   - **Assert**: In 1:1 mode, all rows are spoken equally so differential ratio highlighting stops completely across all rows:
     ```typescript
     for (let r = 0; r < 4; r++) {
       const cell = page.locator(`[data-testid="subtitle-cell-${r}-it"]`);
       expect(await cell.getAttribute("data-tts-pronounced")).toBeNull();
       const container = page.locator(`[data-testid="sentence-container-${r}-it"]`);
       await expect(container).toHaveAttribute("data-tts-pronounced-highlight", "false");
     }
     ```

---

## 5. Automated Execution & CI Commands

To execute this suite:

```bash
# Focused Playwright check
npx playwright test e2e/web.spec.ts -g "tts-ratio"

# Docker containerized execution
./docker/manage.sh e2e web --grep "tts-ratio" --retries=0

# Unit & logic validation suite
npm run test:tts-ratio-enforcement
```

This plan guarantees full end-to-end verification of per-language TTS ratios in automated pipelines.
