# YouTube Video Subtitles Caching & Persistence Architecture (`docs/cache.md`)

This document details the multi-tier caching system, validation barriers, storage schemas, eviction policies, and cache hydration lifecycle implemented in the Parallel Subtitles application.

---

## 1. Architectural Motivation & Anti-Abuse Objectives

The YouTube timedtext caption endpoint (`https://www.youtube.com/api/timedtext`) is subject to aggressive rate counters, bot mitigation heuristics, and IP throttling. Repeatedly requesting identical subtitle tracks on every app launch, video switch, or tab switch causes:

1. **Network Throttling (HTTP 429)**: YouTube quickly throttles rapid duplicate requests.
2. **Session Cookie Invalidation**: Repeated identical calls risk triggering Captchas or session termination.
3. **Unnecessary Battery & Bandwidth Consumption**: Especially critical in mobile environments (Android WebView).
4. **Degraded User Experience**: Noticeable latency and layout shifts while waiting for redundant network roundtrips.

To resolve these challenges, the application implements a strict **multi-tier persistent caching hierarchy** paired with a **validation gate** that guarantees non-redundant requests, instant replay, and complete data integrity.

---

## 2. Multi-Tier Cache Hierarchy

The caching architecture consists of four coordinated layers, operating from the fastest synchronous memory layer to persistent browser storage:

```
+-------------------------------------------------------------------------+
| Layer 1: In-Memory Synchronous Map Cache (`memoryCache`)                |
| - Key: `yt_subtitles_${videoId}_${lang}`                                |
| - Value: Parsed, sanitized CaptionCue[]                                 |
| - Scope: Session runtime / instant zero-latency cue playback lookup     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| Layer 2: Dedicated Raw JSON3 Storage (`localStorage`)                    |
| - Key: `yt_subtitles_raw_${videoId}_${lang}`                            |
| - Value: Pristine YouTube json3 timedtext payload string                |
| - Purpose: Preserves original payload for re-parsing & format conversion|
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| Layer 3: Video Library History Store (`localStorage`)                   |
| - Key: `yt_video_library_v2`                                            |
| - Value: JSON Array of LibraryVideoItem objects (max 50 items)          |
| - Purpose: Persists watched and shared video metadata, titles, cues     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| Layer 4: Strategy Winner Promotion History (`localStorage`)             |
| - Key: `yt_winner_promotion_history_v1`                                 |
| - Value: JSON Array of WinnerPromotionRecord items (max 200 items)      |
| - Purpose: Remembers successful mode/transport strategies per video     |
+-------------------------------------------------------------------------+
```

### Layer Details:

1. **Layer 1: In-Memory Map (`memoryCache`)**
   - Lives in module memory (`Map<string, CaptionCue[]>`).
   - Provides synchronous $O(1)$ access during high-frequency video playback time updates (e.g. at 60fps or during scrubbing).
   - Eliminates `localStorage` JSON parsing overhead during playback.

2. **Layer 2: Dedicated Raw JSON3 Storage (`localStorage`)**
   - Key format: `yt_subtitles_raw_${videoId}_${cleanLang}` (e.g., `yt_subtitles_raw_L2Ryrr6txwA_he`).
   - Preserves the authentic YouTube JSON3 envelope (`events`, `segs`, `utf8`, `tStartMs`, `dDurationMs`).
   - Serves as the primary source for **Cache Hydration** when switching between videos or reloading the app.

3. **Layer 3: Video Library Storage (`localStorage`)**
   - Key: `yt_video_library_v2`.
   - Stores user watch history, video titles, thumbnail identifiers, and timestamp of last interaction.
   - Automatically updated whenever a video is shared into the app via Android intents or loaded via URL/search.

4. **Layer 4: Winner Promotion History (`localStorage`)**
   - Key: `yt_winner_promotion_history_v1`.
   - Records which fallback permutation (`tlang` vs `lang`, `session` vs `anon`) succeeded for every video and language track.
   - Enables data-driven strategy prioritization and inspection in the Winner Promotion Report.

---

## 3. Strict Pre-Cache Validation Gate

Under no circumstances is an unverified, errored, or synthetic payload written to cache. Every response must pass the `isValidJsonSubtitleResponse()` validator before writing to memory or `localStorage`.

### Validation Criteria:

1. **JSON Envelope Guard**: Payload must be non-empty, begin with `{` or `[`, and end with `}` or `]`.
2. **HTML / Error Page Rejection**: Any response containing HTML tags (`<!DOCTYPE html>`, `<html>`, `<body>`), error XML, or plain-text messages is rejected immediately.
3. **Schema Compliance**:
   - For YouTube `json3`: Must possess a top-level `events` array.
   - Non-Empty Cue List: The `events` array must have `length > 0`.
   - Valid Segments: At least one event must contain a non-empty `segs` array with non-whitespace `utf8` string content.
   - Timing Attributes: Events must feature numeric `tStartMs` and `dDurationMs`.
4. **Status Code**: Only HTTP 200 responses are eligible for caching. HTTP 403, 404, 429, or 500 responses are immediately routed to failure handlers and never cached.

---

## 4. Cache Eviction & Storage Quota Management

Mobile web storage quotas can be constrained (typically 5MB–10MB in WebView environments). The application employs multiple eviction mechanisms:

### Read-Time Eviction (Self-Healing)

Whenever `getCachedRawJson3` or `getCachedSubtitles` reads a cache entry:

1. If JSON parsing throws an exception: The entry is immediately deleted from `localStorage`.
2. If `isValidJsonSubtitleResponse()` returns `false` (e.g., empty events or corrupted data): The key is purged via `localStorage.removeItem(key)`.
3. If sanitized cue count is 0: The entry is evicted and `null` is returned.

### Least Recently Used (LRU) Quota Pruning

If a write throws a `QuotaExceededError`:

1. The cache manager scans all keys prefixed with `yt_subtitles_`.
2. Inspects record timestamps and sorts entries in ascending chronological order.
3. Purges the oldest 3 entries to free storage capacity.
4. Retries persisting the new entry.

---

## 5. Shared Video Persistence & Reactive Library Sync

A common issue in earlier versions was that videos shared with the application (via Android `ACTION_SEND` or `ACTION_VIEW`) were played transiently without being saved to the persistent Video Library.

### The Problem:

- The native Android shell intercepted the share intent and invoked `window.onNativeSharedLinkReceived(link)`.
- The handler updated the transient video ID state (`setVideoId(id)`), but did not immediately call `recordVideoWatch()`.
- Furthermore, the `VideoLibraryPanel` component only loaded its items on initial mount (`useState(() => loadVideoLibrary())`) without listening for runtime storage mutations, leaving the library panel stale.

### The Fix:

1. **Immediate Ingestion on Dispatch**:
   In `openLink(link)` (and in URL query parameter extraction), the video is parsed with `parseVideoId(link)` and immediately registered into persistent storage via:
   ```typescript
   recordVideoWatch({
     id,
     originalUrl: link.startsWith("http") ? link : `https://www.youtube.com/watch?v=${id}`,
   });
   ```
2. **Reactive Custom Event Bus**:
   `saveVideoLibrary()` now broadcasts a custom event:
   ```typescript
   window.dispatchEvent(new CustomEvent("video-library-updated", { detail: updatedList }));
   ```
3. **Cross-Component Synchronization**:
   `VideoLibraryPanel` actively listens to both `"video-library-updated"` and `"storage"` events, as well as `currentVideoId` prop changes, instantly re-rendering the library grid whenever a new video is watched or shared.

---

## 6. Cache Hydration Workflow on Video Load / Switch

When a user opens the app, selects a library card, or switches videos, the **Cache Hydration** workflow executes before issuing any network requests:

```
User switches video (videoId changes)
                  │
                  ▼
   Check targetLanguages (e.g., ["he", "en", "ru"])
                  │
                  ▼
   For each target language:
   Inspect getCachedRawJson3(videoId, lang)
                  │
          ┌───────┴───────┐
          │ Found         │ Missing / Invalid
          ▼               ▼
   parseJson3(cached)    Enqueue into subtitleRequestQueue
          │               (Paced network fetch Concurrency=1)
          ▼
   Hydrate into tracks state
   Mark succeeded in subtitleRequestQueue
   Render subtitles immediately (0ms delay)
```

### Benefits of Cache Hydration:

- **Instant UI rendering**: Subtitle tracks display immediately without waiting for network latency.
- **Queue bypass**: Cached languages are marked as succeeded in `subtitleRequestQueue`, preventing the queue from submitting redundant requests to YouTube's timedtext API.
- **Offline resilience**: Videos whose subtitles were cached previously remain fully readable even without active network connectivity.

---

## 7. User Cache Controls

The application empowers users with explicit cache management capabilities:

1. **Clear All Cache (`clearSubtitleCache`)**:
   - Removes all `yt_subtitles_` and `yt_subtitles_raw_` keys from `localStorage`.
   - Clears module `memoryCache`.
   - Available via settings or debug inspector.

2. **Per-Video Cache Eviction (`clearVideoSubtitleCache(videoId)`)**:
   - Selectively purges cached tracks specifically for the target video ID without deleting caches for other videos.
   - Available on each card in the Video Library panel.

3. **Fetch from Scratch**:
   - Evicts cached entries for the current video, clears the `attemptedRef` cache keys, and re-triggers the full fetch fallback pipeline (`runFetchAttempts`) to capture fresh live subtitles from YouTube.
