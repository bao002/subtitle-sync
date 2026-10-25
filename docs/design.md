# Product Design Standards

## Product mission

Help people watch YouTube videos while listening to their preferred translations. On Android, the native WebView can observe and load authentic YouTube subtitle requests. In the web app, live subtitle access remains a challenge; shared links carrying a subtitle URL currently provide a practical path. Continue improving subtitle parsing efficiency and readability.

## Separate first-time setup from daily use

### New-user setup

These are occasional preferences, not controls that should dominate every viewing session:

- Choose a preferred TTS service. Google is the default; track additional service support in [`later.md`](./later.md).
- Set the default subtitle-overlay behavior.
- Choose favorite languages.

Beginner mode has exactly two flows: General Preferences, then Daily Video. Use a clear directional arrow between them. The Daily Video flow contains the video, a quick target-language selector from favorites, and the parallel subtitles table. Keep the Stage 3 character-removal accordion before the parser controls at the top of the table. Place overlay on/off and overlay-size minus/plus controls directly below the video. Keep caption discovery details secondary to this core daily view.

### Daily usage

Keep frequent actions close to the video and subtitle table:

- Select a target quickly from favorite languages.
- Share a video.
- Adjust subtitle parsing and immediately observe its effect in the subtitles table.

The shared video, active subtitle content, and selected target languages should remain the center of the viewing experience.

## Modes

- **Beginner mode** guides a new user through a clear setup path, then supports repeat viewing in the video-plus-subtitles-table experience.
- **Advanced mode** keeps useful, non-experimental controls near the feature they configure. It is not the home for developer diagnostics.
- **Developer mode** is an opt-in layer enabled only by the URL parameter `debug=true`. It reveals experimental and diagnostic views without changing the shared-link video, subtitle, or target-language state.
- A persisted debug preference alone must not reveal developer-only surfaces. Remove `debug=true` from the URL to return to the normal experience.

## Control placement and category colors

Color is a review cue for the control's intended audience and placement, not a substitute for labels, accessibility, or actual relocation. Apply a subtle tint to the containing card/panel rather than coloring every nested button.

| Category               | Visual cue                                 | Intended use                                                                                                                                   |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily usage            | Subtle green/emerald border and background | Frequent viewing actions that belong near the video/table, including favorite-language selection, sharing, playback, and live parsing feedback |
| New-user setup         | Subtle amber border and background         | Infrequent preference setup such as TTS service, overlay defaults, and favorite-language configuration                                         |
| Experimental/developer | Blue border and background                 | Experimental tools and diagnostics; these controls are hidden unless `debug=true`                                                              |

Do not treat the colors as final placement decisions. The user will review these category cues and decide which controls should move. Preserve the existing layout and control placement until that review; the preferences-first Beginner sequence is an explicit requested change.

## Guardrails

- Keep the YouTube video and subtitles table central to regular use.
- Do not present experimental tools as ordinary playback or setup actions.
- Preserve user-selected video, subtitle-link, and target-language state when navigating modes.
- Use accessible text and semantics in addition to color; category must not be communicated by color alone.
- Keep production defaults free of diagnostic panels, server-fetch tuning, and experimental model filters.
