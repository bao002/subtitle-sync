# Current Subtask (`current-sub-task.md`)

- **Status**: [DONE]
- **Summary**: All 4 prompt chapters completed:
  1. Fix bug where playing loop stops after 1 iteration (video stops playing after 1 playing of tts-play) - resolved by distinguishing internal coordinator speech pause from user manual pause via `userExplicitlyPausedRef`.
  2. Advanced mode parallel subtitles container refined to match the sleek professional dedicated section styling of Beginner mode (`border border-emerald-500/25 bg-emerald-500/5 rounded-xl p-3`).
  3. Non-relevant favorite visibility toolbar view removed cleanly.
  4. Switchable Primary/Secondary TTS ratio with relative activation implemented (e.g. Italian primary, Spanish secondary 1:4 activates Spanish only on 1 in 4 of Italian's activated records) and app version bumped to `2.0.28`.
- **Focused check**: `npm run test:agents-all` (19/19 passed 100%)
