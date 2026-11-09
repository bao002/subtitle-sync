# Programmatic Caption Automation Without Native YouTube Caption Icon (`docs/automation_enable_captions.md`)

This architectural specification details how the application programmatically activates YouTube closed captions (timedtext streams) directly through code **without requiring the user to manually click the native YouTube player `[CC]` chrome button**, reducing visual noise and automating multi-language ingestion.

---

## 1. Executive Summary & Problem Context

- **The Friction of Manual Caption Activation**:
  In standard YouTube web embeds, closed captions are often inactive by default unless the user manually identifies, hovers over, and clicks the native YouTube caption icon (`[CC]` button) in the player control bar. If an application waits passively for the user to click the caption icon, it must display intrusive alert banners (e.g., "Captions Required" or "Action Required: Turn ON Captions").
- **The Noise Reduction Solution**:
  By intercepting video initialization and user language preferences (such as clicking the default language), the application **programmatically triggers the YouTube caption module** directly via the YouTube IFrame API.
- **Grace Window Before Fallback Alert**:
  Before falling back to the intrusive floating red "Captions Required" notification (`floating-no-captions-alert`), the application initiates an automatic programmatic caption trigger and observes a quiet grace window (e.g., 3.5 seconds). If captions are captured during this window, the alert is suppressed completely, providing a silent, frictionless experience.

---

## 2. YouTube IFrame API Programmatic Controls

YouTube's embedded HTML5 player provides an internal `captions` module accessible through `window.YT.Player` instances. The application leverages this API surface to control caption tracks without simulating mouse clicks or touching player chrome DOM elements.

### 2.1. Initializing Player Parameters (`playerVars`)

When constructing the `YT.Player` instance, caption readiness is requested declaratively:

```typescript
player.current = new window.YT.Player(hostElement, {
  videoId,
  playerVars: {
    cc_load_policy: 1,   // Directs YouTube player to activate captions by default
    cc_lang_pref: targetLang, // Pre-selects the preferred default caption language
    playsinline: 1,
    origin: window.location.origin,
  },
  events: {
    onReady: () => {
      // Programmatic caption activation hook
      triggerProgrammaticCaptions(targetLang);
    },
    onApiChange: () => {
      // Captions module state change listener
      inspectActiveCaptionTrack();
    },
  },
});
```

### 2.2. Loading the Captions Module & Setting Caption Tracks

To activate captions dynamically at runtime (for example, when a user clicks a default language button or when a new video loads):

```typescript
// 1. Explicitly load the internal captions module
player.loadModule?.("captions");

// 2. Instruct the captions module to select a specific language track
player.setOption?.("captions", "track", {
  languageCode: targetLangCode, // e.g., "en", "he", "es", "it"
});

// 3. Optional: Reload captions module or query available tracklists
const tracklist = player.getOption?.("captions", "tracklist");
player.setOption?.("captions", "reload", true);
```

### 2.3. How Clicking Default Language Triggers Captions

In `src/routes/index.tsx`, `handleSelectDefaultSubtitle` coordinates both application state and the primary video player:

```typescript
const handleSelectDefaultSubtitle = useCallback((langCode: string) => {
  if (!langCode) return;
  setBaseLanguage(langCode);
  setPrimaryTtsLangState(langCode);
  setDefaultLanguage(langCode);
  setBaseLanguagePreference(langCode);

  // Programmatically command the primary player to switch to this caption track
  try {
    const primaryPlayer = multiVideoPlayerRegistry.get("primary") || player.current;
    primaryPlayer?.loadModule?.("captions");
    primaryPlayer?.setOption?.("captions", "track", { languageCode: langCode });
  } catch (err) {
    // Non-fatal if player is mounting
  }
}, []);
```

---

## 3. The TimedText Interception Mechanism

Once `player.setOption("captions", "track", { languageCode })` is invoked:
1. The YouTube player iframe emits an authentic HTTP GET request:
   ```
   GET https://www.youtube.com/api/timedtext?v=<videoId>&lang=<langCode>&fmt=json3
   ```
2. **On Android (Native Shell)**:
   - `MainActivity.kt`'s `WebViewClient.shouldInterceptRequest` detects `youtube.com/api/timedtext`.
   - The native shell captures the authentic headers, cookies, and tokens from the live session and dispatches the raw timedtext payload through the JavaScript bridge `window.AndroidNativeShell.onTimedTextIntercepted(url, jsonString)`.
3. **On Web**:
   - The early caption interceptor (`setupEarlyCaptionInterceptor()`) intercepts network queries or streams local authentic fixtures (for video `L2Ryrr6txwA` under `public/fixtures/L2Ryrr6txwA`).
4. **Validation & Formulation**:
   - The intercepted JSON is validated against strict YouTube `json3` schema rules (`events`, `tStartMs`, `dDurationMs`, `segs[].utf8`).
   - Clean cues are ingested into `tracks[langCode]`, immediately satisfying `detectedSubtitleCount > 0`.

---

## 4. Quiet Grace Window & Alert Noise Suppression

To prevent the annoying flash of the "Captions Required" notification:

```
[Video Loaded / Stage 1 Activated]
               │
               ▼
   [Start Quiet Grace Window] (3.5s)
   [Programmatic Caption Trigger] (player.setOption("captions", "track", ...))
               │
       ┌───────┴───────┐
       ▼               ▼
[Captions Captured?]   [Grace Window Expires?]
       │                       │
      YES                      NO (captions captured)
       │                       │
       ▼                       ▼
 [Alert NEVER shown]     [Subtitles exist: NO alert]
 [Silent & Clean UX]           │
                               ▼ (only if 0 subtitles)
                         [Fallback Alert Displayed]
```

### Implementation Pattern in `src/routes/index.tsx`:

```tsx
// Quiet grace period state
const [captionsAlertGraceActive, setCaptionsAlertGraceActive] = useState<boolean>(true);

useEffect(() => {
  setCaptionsAlertGraceActive(true);
  triggerProgrammaticCaptions();

  const timer = setTimeout(() => {
    setCaptionsAlertGraceActive(false);
  }, 3500);

  return () => clearTimeout(timer);
}, [videoId, currentAccordionStage, triggerProgrammaticCaptions]);

// Alert renders ONLY after the grace window expires without captured captions
{currentAccordionStage === 1 && detectedSubtitleCount === 0 && !captionsAlertGraceActive && (
  <aside id="floating-no-captions-alert" data-testid="floating-no-captions-alert">
    <h4>Captions Required</h4>
    ...
  </aside>
)}
```

---

## 5. Summary of Benefits

1. **Zero User Effort**: Subtitles load automatically upon video selection without hunting for the YouTube `[CC]` button.
2. **Noise Reduction**: Eliminates misleading or premature warning banners while programmatic activation is in flight.
3. **Graceful Fallback**: If a video genuinely has no captions or requires manual login/captcha resolution, the fallback notification appears cleanly after the grace window expires.
4. **Platform Parity**: Operates identically on Android native shell, desktop browsers, and mobile web.
