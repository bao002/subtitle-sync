# YouTube Subtitles Architecture: `tlang` vs `lang`, NPM Modules & Rate-Limit Optimization (docs/youtube.md)

This document provides a comprehensive technical guide explaining:

1. How to distinguish between YouTube videos that use `tlang` (machine translation) vs `lang` (direct authored captions).
2. Evaluation of client-side npm modules for subtitle extraction and their browser constraints.
3. Evaluation of server-side alternatives for extracting video language tracks.
4. The optimal architecture for avoiding YouTube anti-bot rate limitations (HTTP 429).

---

## 1. Distinguishing `tlang` vs `lang`-Only Caption Tracks

YouTube's timedtext subtitle backend (`https://www.youtube.com/api/timedtext`) operates with two distinct caption delivery modes:

### 1.1 Direct Authored Track Mode (`lang` Parameter Only)

```http
GET /api/timedtext?v=VIDEO_ID&lang=es&fmt=json3
```

- **When it applies**: The video creator, channel owner, or a volunteer translation team explicitly uploaded or authored an authentic subtitle track in the target language (e.g. Spanish `es`).
- **Characteristics**:
  - The `lang` query parameter specifies the desired language directly (`lang=es`).
  - No `tlang` parameter is present.
  - The default spoken audio track of the video is **always** requested via `lang=<default>` (e.g., `lang=en` for an English video).
  - In YouTube's internal track manifest (`captionTracks`), authored tracks have `vssId` prefixed with a dot (e.g., `vssId: ".es"` or `vssId: ".en"`) and `kind: "standard"` (or omitted `kind`).
  - Requesting an authored track with `tlang` instead of `lang` can result in unwanted machine re-translation or HTTP 404.

### 1.2 Machine Translation Mode (`tlang` Parameterization)

```http
GET /api/timedtext?v=VIDEO_ID&lang=en&tlang=es&fmt=json3
```

- **When it applies**: The video only possesses an original spoken track (often automatic speech recognition ASR, e.g. `vssId: "a.en"`), and YouTube dynamically translates it into the requested language using Google Translate.
- **Characteristics**:
  - The `lang` parameter **must retain the source language** (the video's spoken transcript, e.g. `lang=en`).
  - The `tlang` parameter specifies the target language into which YouTube should translate the text (e.g. `tlang=es`).
  - If you omit `tlang` and request `lang=es` directly on an ASR-only video, YouTube returns HTTP 404 or an empty cue array because no native Spanish track exists on the server!

### 1.3 How to Distinguish Dynamically in Code

When inspecting YouTube's player response (`ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer`):

```typescript
interface CaptionTrack {
  baseUrl: string;
  vssId: string; // e.g. ".es" (authored) vs "a.en" (ASR auto-generated)
  languageCode: string; // e.g. "en", "es", "he"
  kind?: string; // "asr" if auto-generated, undefined/standard if authored
  isTranslatable: boolean; // true if machine translation is supported
}

interface TranslationLanguage {
  languageCode: string;
  languageName: { simpleText: string };
}
```

#### Decision Matrix:

1. **Target Language in `captionTracks`**:
   If the target language code matches a track in `captionTracks`:
   $$\text{Mode} = \mathbf{lang} \quad (\text{URL: } \texttt{lang=target})$$
2. **Target Language NOT in `captionTracks`, but `isTranslatable === true`**:
   If the target language is listed under `translationLanguages` and the base track is translatable:
   $$\text{Mode} = \mathbf{tlang} \quad (\text{URL: } \texttt{lang=base\&tlang=target})$$
3. **Session Interception Fallback (Our Application Architecture)**:
   When sniffing requests in an embedded WebView where full player manifest is not directly accessible:
   - Execute the configured primary mode (`requestMode`, default `tlang`).
   - If non-200, invalid JSON, or empty cues are returned, immediately execute the alternate mode (`subtitleRequestModeOrder`).
   - Retain all authentic session parameters (`v`, `expire`, `sparams`, `signature`, `key`) to guarantee query validity.

---

## 2. Client-Side YouTube NPM Modules: Capabilities & Realities

Several open-source NPM modules claim client-side YouTube subtitle extraction:

| Module                          | Mechanism                               | Client-Side Browser Feasibility | Main Limitation                                       |
| :------------------------------ | :-------------------------------------- | :------------------------------ | :---------------------------------------------------- |
| **`youtube-caption-extractor`** | Scrapes `get_video_info` or player HTML | ❌ **Fails in pure browser**    | Blocked by CORS; triggers Google bot detection.       |
| **`get-youtube-subtitle`**      | Fetches timedtext XML/VTT directly      | ❌ **Fails in pure browser**    | Blocked by CORS; no session cookie capture.           |
| **`yt-caption-scraper`**        | Parses player response                  | ❌ **Fails in pure browser**    | Requires Node.js runtime or backend proxy.            |
| **`youtube-captions-scraper`**  | Scrapes video page and timedtext        | ❌ **Fails in pure browser**    | Node.js `cheerio`/`axios` dependencies; CORS failure. |

### Why Pure Client-Side Web Modules Fail in Browsers:

1. **Cross-Origin Resource Sharing (CORS)**: YouTube's `timedtext` endpoints do NOT send `Access-Control-Allow-Origin: *`. A standard web browser running on `localhost:3000` or GitHub Pages is blocked by browser security policy.
2. **Anti-Bot Signatures**: YouTube checks User-Agent and TLS fingerprints. Naked client fetches lack session cookies (`VISITOR_INFO1_LIVE`, `PREF`) and receive HTTP 429 (Too Many Requests).

### The Working Client Solution: Android Shell / WebView Bridge

Our Android shell (`MainActivity.kt`) solves this by:

- Embedding the genuine YouTube mobile web player in a sanitized WebView (stripping `; wv` from User-Agent).
- Intercepting the authentic `timedtext` network call triggered by the player.
- Using native `OkHttpClient` to repeat the call with genuine browser session cookies, bypassing CORS and bot blocks.

---

## 3. Server-Side Options for Subtitle Extraction

When running on a backend server (Node.js, Python, or Go), CORS is not enforced. Here is how the primary server options compare:

### 3.1 `youtubei.js` (InnerTube by LuanRT) — _Recommended Node.js Library_

- **Mechanism**: Reverse-engineers YouTube's internal InnerTube API (used by official Android, iOS, and Web clients).
- **Capabilities**:
  ```typescript
  import { Innertube } from "youtubei.js";
  const yt = await Innertube.create();
  const info = await yt.getInfo("VIDEO_ID");
  const transcript = await info.getTranscript(); // full captions with word timing!
  ```
- **Strengths**: Can extract available `captionTracks` and `translationLanguages`, supports visitor data, and handles session tokens.
- **Rate Limit Resilience**: High, especially when authenticated or configured with rotating session data.

### 3.2 `yt-dlp` (Python / CLI Microservice) — _Gold Standard for Reliability_

- **Mechanism**: Dedicated open-source command-line tool actively maintained against YouTube's anti-scraping changes.
- **Capabilities**:
  - `yt-dlp --list-subs https://www.youtube.com/watch?v=VIDEO_ID`: Lists all native and translated subtitles.
  - `yt-dlp --write-auto-sub --sub-lang "es,he" --skip-download`: Downloads requested captions cleanly.
- **Strengths**: Best-in-class evasion against HTTP 429; supports `--cookies` export from browser.

### 3.3 `@distube/ytdl-core` (Node.js)

- **Mechanism**: Parses player page HTML and decipher tokens.
- **Limitations**: High maintenance overhead; frequently breaks whenever YouTube updates its obfuscated player code.

### 3.4 Official YouTube Data API v3 (`captions.list`)

- **Mechanism**: Google's official REST API (`GET https://www.googleapis.com/youtube/v3/captions?videoId=...`).
- **Quota Cost**: **50 quota units per call** out of a default 10,000 daily project quota (permits only **200 requests per day**).
- **Limitation**: Official API only allows downloading subtitle files for videos owned by the authenticated account. Third-party video captions cannot be downloaded through the official Data API.

---

## 4. Rate-Limiting & Anti-Bot Strategy: Which Approach Yields the Best Results?

To avoid exceeding YouTube rate limitations and triggering HTTP 429 blocks, the optimal architectural strategy is:

```
[Target Languages Request]
            │
            ▼
    [Check Local Cache] ──► (Cache Hit) ──► Instant Return (0 Network Requests)
            │
            ▼ (Cache Miss)
    [Paced Staggered Jitter]
    (Wait X=3s to Y=8s random delay between calls)
            │
            ▼
    [Authentic Session OkHttp Fetch]
    (Using captured WebView cookies + sanitized UA)
            │
            ▼
    [Validate JSON3 Payload]
            │
     ┌──────┴──────┐
   (200 OK)     (429 Rate Block)
     │             │
     ▼             ▼
[Store Cache]   [Exponential Backoff Pause]
```

### Key Pillars of Anti-Bot Protection:

1. **Paced Staggered Jitter ($X \to Y$ Seconds)**:
   - Concurrent requests for 5+ languages simultaneously are an immediate red flag for YouTube's bot detectors.
   - Pacing requests serially with randomized delay between $X=3\text{s}$ and $Y=8\text{s}$ mimics human interaction.
2. **Immutable Client-Side Caching**:
   - Cache every valid response by `videoId + lang`. Once fetched, a language is never requested again across the user's session.
3. **Session Cookie Propagation**:
   - Never send naked requests. Always propagate `PREF`, `YSC`, `VISITOR_INFO1_LIVE`, and `Referer: https://www.youtube.com/`.
4. **WebView User-Agent Sanitization**:
   - Strip `; wv` and `Version/X.X` so YouTube treats the client as mobile Chrome rather than an automated app shell.
5. **Clear Deprecation of External Server Proxies**:
   - External server proxies funnel multiple users through a single server IP, rapidly exhausting YouTube's IP rate limits. Local client-side fetching with paced jitter distributes traffic across individual user devices, virtually eliminating IP blocks.
