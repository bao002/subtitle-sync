# YouTube Timedtext Subtitle Auto-Retry & Anti-Abuse Architecture (`docs/auto-retry.md`)

This document outlines the design, best practices, and implementation mechanics for automated subtitle retries and rate-controlled request pacing in the YouTube Viewer application.

---

## 1. The Challenge: Anti-Bot Protection & Timedtext API Abuse Prevention

YouTube protects its subtitle services (`https://www.youtube.com/api/timedtext`) using automated bot-detection and rate-limiting infrastructure:
1. **Concurrency Penalties**: Submitting multiple simultaneous requests across several target languages immediately flags client network traffic as an automated scraper, triggering `HTTP 429 (Too Many Requests)` or `HTTP 403 (Forbidden)`.
2. **Periodic Fingerprints**: Firing requests on fixed periodic intervals (e.g., exactly every 5.0 seconds) produces an artificial pattern easily identified by server-side anomaly detectors.
3. **Redundant Burden**: Blindly retrying every language track—including tracks that have already succeeded or tracks with cached cues—multiplies API load unnecessarily.
4. **Hard IP Throttling**: Continuing to hammer the endpoint after receiving a `429` status code can convert a temporary throttle into a prolonged network block.

To operate reliably without abusing YouTube's services or degrading user experience, the application enforces a strict **Zero-Parallelism, Paced Jitter, and Selective Retry** protocol.

---

## 2. Core Architectural Principles

```
User Action / Auto-Retry Event
              │
              ▼
    [Check Subtitle Cache] ──── (Cached & Valid) ───► Instant Load (0 Network Requests)
              │ (Cache Miss)
              ▼
   [Selective Filter Gate] ──── (Already Succeeded?) ─► Skip / Ignore
              │ (Only Failed Languages)
              ▼
  ┌────────────────────────────────────────────────────────┐
  │         Central SubtitleRequestQueue (Singleton)       │
  │  • Strict Concurrency = 1 (Single-flight execution)    │
  │  • FIFO Ordering based on Favorite Language priority   │
  │  • Video Context Scoping (cleared on video change)     │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
                 [Is Cooldown Active?] ──► Wait Cooldown Timer (Backoff)
                             │
                             ▼
            [Execute Single Request via Native Bridge]
               Mode: tlang / lang  |  Send: session / anon
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
         [HTTP 200 & Valid JSON]   [HTTP 429 / Error]
                │                         │
      • Save to Subtitle Cache   • Record Error
      • Promote Winning Strategy • Increment Failure Counter
      • Reset Backoff Multiplier • Exponential Backoff + Jitter
      • Mark Language Succeeded  • Keep in Failed Pool for Next Paced Cycle
                │                         │
                └────────────┬────────────┘
                             │
                             ▼
             [Pacing Delay: Random Jitter (3s - 8s)]
                             │
                             ▼
               [Advance to Next Queued Task]
```

---

## 3. Five Pillars of the Paced Auto-Retry Engine

### Pillar 1: Strict Concurrency = 1 (Never Submit Multiple Requests Simultaneously)
- **Single-Flight Guarantee**: Under no circumstances does the application make parallel HTTP calls to YouTube's timedtext endpoint.
- All requests—whether triggered by the initial video load, adding a new language from the language selector, clicking "Fetch again" on a failed row, or the floating auto-retry timer—are routed through `SubtitleRequestQueue`.
- The queue enforces `concurrency = 1`. If three languages (e.g., `he`, `ar`, `es`) need subtitles, they are executed in strict serial order:
  - Language 1 is requested and awaited.
  - A randomized pacing delay is observed.
  - Language 2 is requested and awaited.
  - A randomized pacing delay is observed.
  - Language 3 is requested and awaited.

### Pillar 2: Randomized Paced Jitter (Defeating Periodic Bot Heuristics)
- Fixed timer intervals (such as `setInterval(fetch, 5000)`) are strictly forbidden.
- The interval between consecutive requests is randomized dynamically:
  $$\text{Delay} = \text{RandomBetween}(\text{minPacingSec}, \text{maxPacingSec}) \times 1000 + \text{JitterMs}$$
- Defaults are configured to **3 to 8 seconds** (configurable in the application Settings accordion under `retryPacingMinSec` and `retryPacingMaxSec`).
- Randomized spacing mimics authentic human interactions and ensures the timedtext server treats requests as natural client activity.

### Pillar 3: Selective Retry (Only Failed Requests are Scheduled)
- The application separates languages into three discrete sets:
  1. **Succeeded**: Contains valid parsed `Json3` cues (`cuesCount > 0`). These are stored in memory and `subtitleCache`. They are **never retried**.
  2. **Pending / Active**: Currently queued or currently in-flight. Duplicate requests for this code are de-duplicated and ignored.
  3. **Failed**: Received HTTP 4xx/5xx, invalid non-JSON payloads, HTML error pages, or 0 cues. **Only this set is scheduled for auto-retry.**
- When the auto-retry indicator fires, it evaluates:
  ```typescript
  const pendingLanguages = targetLanguages.filter((code) => {
    const track = tracks?.[code];
    return !track || !track.events || track.events.length === 0;
  });
  ```
- As soon as a language succeeds, it drops out of `pendingLanguages` immediately, freeing resources and minimizing requests.

### Pillar 4: Strategy Load Balancing (`tlang` vs `lang` and `session` vs `anon`)
- Rather than repeating the exact same failing query parameters, the application rotates strategies:
  - **Translation Mode (`tlang`)**: Preserves original spoken language in `lang=` (e.g. `lang=en`) and specifies target translation in `tlang=he`.
  - **Direct Track Mode (`lang`)**: Replaces `lang=he` directly without `tlang` to search for authored native tracks.
  - **Session Transport (`session`)**: Mirrors live session cookies (`PREF`, `YSC`, `VISITOR_INFO1_LIVE`) and authorization tokens intercepted from the WebView player.
  - **Anonymous Transport (`anon`)**: Dispatches the request with a clean mobile Chrome user-agent and client hints (`sec-ch-ua`, `sec-ch-ua-mobile`), avoiding sticky session throttling.
- The **Winner Promotion** mechanism automatically moves the successful mode to the top of the attempt order (`promoteSuccessfulAttempt: true`).

### Pillar 5: Exponential Backoff & Cooldown on 429
- If YouTube returns `HTTP 429 (Too Many Requests)` or a network failure:
  1. The queue immediately enters a cooldown pause.
  2. The backoff multiplier is calculated:
     $$\text{Cooldown} = \min(\text{baseDelay} \times 2^{\text{consecutiveErrors}}, 60000)\text{ ms}$$
  3. All pending retries are paused during the cooldown window.
  4. Once the cooldown passes, retries resume one by one with randomized jitter.
  5. The first successful response resets the error counter and returns pacing to normal.

---

## 4. Lifecycle Management & Invalidation Rules

1. **Video Navigation Invalidation**:
   - When the user changes the active YouTube video (via URL input, Library selection, or `ACTION_VIEW` intent), any pending requests or retries queued for the previous video are immediately aborted and cancelled.
   - The queue resets its state for the new video ID, preventing stale subtitles from polluting the new video session.
2. **Language Removal Invalidation**:
   - If a user removes a language box from the favorites list, that language code is evicted from the retry queue immediately.
3. **Explicit User Pause**:
   - The floating retry indicator and Settings toggle allow users to pause auto-retries at any time. When paused, active timers are cleared, and no background requests are issued.

---

## 5. Summary Matrix of Request Behaviors

| Scenario | Behavior | Concurrency | Pacing / Delay |
| :--- | :--- | :--- | :--- |
| **Initial Video Load** | Fetches favorite languages one-by-one | 1 | 3s - 8s randomized jitter |
| **User Adds Language** | Appends language to queue | 1 | Runs immediately if idle, else after pacing |
| **Subtitle Track Succeeded** | Saved to cache; removed from retry pool | - | Zero subsequent requests |
| **Subtitle Track Failed** | Added to failed pool; auto-retry scheduled | 1 | Paced according to min/max jitter settings |
| **HTTP 429 Encountered** | Cooldown activated; backoff applied | 0 (Paused) | Exponential backoff (up to 60s) |
| **Video Switched** | Queue cleared; active timers cancelled | 0 (Reset) | Re-initializes for new video context |
| **Auto-Retry Disabled** | No background retries scheduled | 0 (Disabled) | User may manually click "Fetch again" |
