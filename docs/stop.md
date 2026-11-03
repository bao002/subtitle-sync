# Video Pause and Resume Failure Analysis & Remediation (`docs/stop.md`)

This document lists all the architectural and runtime reasons why the application previously paused the video and failed to resume playback, and details the permanent code removals and fixes implemented per Prompt 54 (Chapter 4).

---

## 1. Comprehensive List of Reasons Why the App Doesn't Resume After Pausing

| ID | Root Cause Category | Specific Mechanism | Impact on Playback | Fix / Removal in Code |
| :--- | :--- | :--- | :--- | :--- |
| **VR-01** | Pause Flag Race Condition | YouTube Player `onStateChange` fires asynchronously (`event.data === 2`). When the app calls `p.pauseVideo()` for TTS, this event could arrive when `isPausedForTtsRef.current` was temporarily unset or transitioning. This erroneously set `userExplicitlyPausedRef.current = true`. | Subsequent TTS completion checked `if (userExplicitlyPausedRef.current) return;` and permanently aborted resuming the video. | **FIXED**: Introduced a dedicated programmatic pause timestamp guard (`programmaticPauseTimestampRef`). State 2 ignores pause events that occur within 1000ms of any programmatic pause, preventing false user pause flags. |
| **VR-02** | Unstarted / Buffering State Flag Contamination | `event.data === -1` (unstarted / loading) and buffering events set `userExplicitlyPausedRef.current = true`. | Any buffer hiccup or stream re-sync permanently locked the pause flag, aborting resume logic. | **FIXED**: Removed `userExplicitlyPausedRef.current = true` from `event.data === -1`. Transient buffering states no longer pollute the user pause flag. |
| **VR-03** | TTS Synthesis Hang / Missing `onend` | Speech synthesis via Web Speech API or external TTS service hangs, loses socket connection, gets throttled, or fails to emit `onend` or `onerror`. | The `await speakRow(...)` Promise never resolves; `busy.current` remains `true` indefinitely; the video remains frozen forever. | **FIXED**: Enforced a hard timeout safeguard (max 8000ms per utterance) with guaranteed Promise resolution and fallback recovery so TTS never blocks playback indefinitely. |
| **VR-04** | Setup Pause (`isSetupPaused`) Lock | `st.current.isSetupPaused` remained `true` if previously toggled or un-cleared, blocking all `safelyResumePrimaryVideo` calls. | Video pauses for TTS and refuses to resume because the coordinator aborts whenever `isSetupPaused` is detected. | **FIXED**: Resuming playback automatically resets `isSetupPaused` when the user triggers playback or when section speech completes normally. |
| **VR-05** | Premature End-of-Track Freeze | At the end of the subtitle cue list (`nextRowIdx >= rows.length`), the coordinator called `p.pauseVideo()` with `"Reached end of subtitle track"` even if video had remaining runtime. | Video was forcibly halted and never resumed towards video completion. | **FIXED**: If no more subtitle cues remain, the player resumes normal unpaused playback until the YouTube player itself reaches the natural end of the video stream (`event.data === 0`). |
| **VR-06** | Single-Shot `p.playVideo()` PostMessage Drop | Standard `p.playVideo()` sends an iframe postMessage that YouTube occasionally drops if the iframe is unfocused or in a layout transition. | Video remains in paused state despite resume command being issued. | **FIXED**: Enhanced `safelyResumePrimaryVideo` with dual delayed verification kicks (at 80ms and 240ms) that inspect `getPlayerState()` and re-fire `playVideo()` if not playing. |
| **VR-07** | Repeated Immediate Re-pause on Section Boundary | After resuming from a section pause, if the video position was within the threshold of the previous row's end, the next tick immediately treated it as a new section crossing. | Video resumed for a fraction of a second and immediately stopped again in a stutter-pause loop. | **FIXED**: Enforced strict section record tracking (`handledVideoFirstSections.add` and `handledTtsFirstSections.add`) and advanced `lastMs.current` past the row boundary. |

---

## 2. Summary of Removals and Safeguards

All seven blockage mechanisms listed above have been systematically removed from the playback coordinator, player event handlers, and TTS execution pipeline. Video playback now reliably resumes after pauses across all playback modes.
