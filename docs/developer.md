# Developer Mode

Developer mode is enabled by adding the exact query parameter `debug=true`, for example:

```text
https://mostuf2556.github.io/subtitle-sync/?debug=true
```

Without that parameter, the app stays in its normal Beginner or Advanced mode even when a diagnostic preference was previously saved. Removing `debug=true` hides developer-only views again.

## Experimental views and controls

The following surfaces are experimental/developer-only and use the blue category cue:

- OpenRouter free-model discovery/filtering and AI subtitle punctuation.
- Independent Video Playground.
- Manual subtitle fetching through a server proxy, including server-fetch configuration and retry actions.
- Network request inspection and timedtext diagnostics.

The shared video, subtitles table, and selected languages remain available in the normal app. Existing automatic subtitle loading/fallback behavior is not reclassified as a developer view merely because a server may be used internally; only manual experimental controls and inspectors are hidden.

## Access and safety

- `debug=true` is a visibility gate for diagnostics and experimental UI, not an authentication mechanism.
- Never put credentials or signed subtitle URLs in the debug query string.
- Developer tools must retain explicit error reporting and subtitle-response validation.
- Do not rely on a saved debug preference to make developer-only views visible.
