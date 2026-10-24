import { expect, test } from "@playwright/test";

test("web-demo video input remains playable without recreating the YouTube player", async ({
  page,
}) => {
  await page.addInitScript(() => {
    type PlayerStats = { created: number; destroyed: number; state: number; currentTime: number };
    type PlayerOptions = {
      videoId: string;
      events: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    };

    const stats: PlayerStats = { created: 0, destroyed: 0, state: 2, currentTime: 0 };
    const testWindow = window as typeof window & {
      __playbackTestStats: PlayerStats;
      YT: { Player: new (target: HTMLElement, options: PlayerOptions) => object };
    };

    class MockYouTubePlayer {
      constructor(
        _target: HTMLElement,
        private readonly options: PlayerOptions,
      ) {
        stats.created += 1;
        queueMicrotask(() => options.events.onReady?.());
      }

      getCurrentTime() {
        return stats.currentTime;
      }

      getDuration() {
        return 60;
      }

      getPlaybackRate() {
        return 1;
      }

      getPlayerState() {
        return stats.state;
      }

      getVideoData() {
        return { video_id: this.options.videoId, title: "Playback lifecycle test" };
      }

      playVideo() {
        stats.state = 1;
        this.options.events.onStateChange?.({ data: 1 });
      }

      pauseVideo() {
        stats.state = 2;
        this.options.events.onStateChange?.({ data: 2 });
      }

      seekTo(seconds: number) {
        stats.currentTime = seconds;
      }

      loadVideoById(videoId: string) {
        stats.currentTime = 0;
        this.options.videoId = videoId;
      }

      destroy() {
        stats.destroyed += 1;
      }
    }

    Object.defineProperty(testWindow, "__playbackTestStats", { value: stats });
    Object.defineProperty(testWindow, "YT", {
      value: { Player: MockYouTubePlayer },
      configurable: true,
    });
  });

  await page.goto("./");
  await expect(page.locator("header")).toBeVisible();

  await page.getByTestId("youtube-url-input").fill("dQw4w9WgXcQ");
  await page.getByTestId("play-video-button").click();
  await expect(page.locator("header")).toContainText("video dQw4w9WgXcQ");

  await expect
    .poll(async () => {
      const stats = await page.evaluate(() => {
        const testWindow = window as typeof window & {
          __playbackTestStats: { created: number };
        };
        return testWindow.__playbackTestStats.created;
      });
      return stats;
    })
    .toBeGreaterThan(0);
  await page.waitForTimeout(300);

  const initialStats = await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __playbackTestStats: { created: number; destroyed: number };
    };
    return testWindow.__playbackTestStats;
  });

  const playButton = page.locator('[data-testid="video-overlay-play-pause-btn"]').first();
  await expect(playButton).toBeVisible();
  await playButton.click();
  await expect(playButton).toHaveAttribute("aria-label", "Pause playback");
  await page.waitForTimeout(450);

  const stats = await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __playbackTestStats: { created: number; destroyed: number; state: number };
    };
    return testWindow.__playbackTestStats;
  });

  expect(stats.state).toBe(1);
  expect(stats.created).toBe(initialStats.created);
  expect(stats.destroyed).toBe(initialStats.destroyed);
});

test("shared subtitles link plays video and alternates Hebrew and Italian subtitles", async ({
  page,
}) => {
  const videoId = "WJlWKB8qrf0";
  const subtitlesUrl =
    process.env.E2E_SHARED_SUBTITLES_URL ||
    `https://www.youtube.com/api/timedtext?v=${videoId}&kind=asr&lang=iw&fmt=json3`;
  const sharedTimedTextUrl = new URL(subtitlesUrl);
  expect(sharedTimedTextUrl.searchParams.get("v")).toBe(videoId);
  expect(sharedTimedTextUrl.searchParams.get("lang")).toBe("iw");

  const timedTextRequests: string[] = [];
  const translationRequests: string[] = [];

  await page.addInitScript(() => {
    type PlayerOptions = {
      videoId: string;
      events: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    };
    type UtteranceLike = {
      text: string;
      lang: string;
      rate: number;
      onend?: (event: SpeechSynthesisEvent) => void;
      onerror?: (event: SpeechSynthesisErrorEvent) => void;
    };

    const stats = { created: 0, destroyed: 0, state: 2, currentTime: 0, states: [] as number[] };
    const speechCalls: Array<{ text: string; lang: string }> = [];
    const testWindow = window as typeof window & {
      __sharedPlaybackStats: typeof stats;
      __sharedSpeechCalls: typeof speechCalls;
      YT: { Player: new (target: HTMLElement, options: PlayerOptions) => object };
    };

    class MockYouTubePlayer {
      private timer: number | undefined;

      constructor(
        _target: HTMLElement,
        private readonly options: PlayerOptions,
      ) {
        stats.created += 1;
        queueMicrotask(() => options.events.onReady?.());
      }

      getCurrentTime() {
        return stats.currentTime;
      }

      getDuration() {
        return 60;
      }

      getPlaybackRate() {
        return 1;
      }

      getPlayerState() {
        return stats.state;
      }

      getVideoData() {
        return { video_id: this.options.videoId, title: "Shared subtitle E2E" };
      }

      playVideo() {
        stats.state = 1;
        stats.states.push(1);
        this.options.events.onStateChange?.({ data: 1 });
        if (this.timer === undefined) {
          this.timer = window.setInterval(() => {
            if (stats.state === 1) stats.currentTime += 0.25;
          }, 250);
        }
      }

      pauseVideo() {
        stats.state = 2;
        stats.states.push(2);
        this.options.events.onStateChange?.({ data: 2 });
      }

      seekTo(seconds: number) {
        stats.currentTime = seconds;
      }

      loadVideoById(videoId: string) {
        stats.currentTime = 0;
        this.options.videoId = videoId;
      }

      destroy() {
        stats.destroyed += 1;
        if (this.timer !== undefined) window.clearInterval(this.timer);
      }
    }

    class MockSpeechSynthesisUtterance {
      text: string;
      lang = "";
      rate = 1;
      onend?: (event: SpeechSynthesisEvent) => void;
      onerror?: (event: SpeechSynthesisErrorEvent) => void;

      constructor(text: string) {
        this.text = text;
      }
    }

    const synthesis = {
      paused: false,
      cancel() {},
      resume() {},
      getVoices: () => [],
      addEventListener() {},
      removeEventListener() {},
      speak(utterance: UtteranceLike) {
        speechCalls.push({ text: utterance.text, lang: utterance.lang });
        window.setTimeout(() => utterance.onend?.(new Event("end") as SpeechSynthesisEvent), 80);
      },
    };

    Object.defineProperty(testWindow, "__sharedPlaybackStats", { value: stats });
    Object.defineProperty(testWindow, "__sharedSpeechCalls", { value: speechCalls });
    Object.defineProperty(testWindow, "YT", {
      value: { Player: MockYouTubePlayer },
      configurable: true,
    });
    Object.defineProperty(testWindow, "SpeechSynthesisUtterance", {
      value: MockSpeechSynthesisUtterance,
      configurable: true,
    });
    Object.defineProperty(testWindow, "speechSynthesis", {
      value: synthesis,
      configurable: true,
    });
  });

  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());

  await page.route("https://www.youtube.com/api/timedtext**", async (route) => {
    timedTextRequests.push(route.request().url());
    const track = {
      events: [
        {
          tStartMs: 0,
          dDurationMs: 1500,
          segs: [{ utf8: "Default subtitle sentence one." }],
        },
        {
          tStartMs: 1500,
          dDurationMs: 1500,
          segs: [{ utf8: "Default subtitle sentence two." }],
        },
        {
          tStartMs: 3000,
          dDurationMs: 1500,
          segs: [{ utf8: "Default subtitle sentence three." }],
        },
      ],
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(track),
    });
  });

  await page.route("https://translate.googleapis.com/translate_a/single**", async (route) => {
    const requestUrl = new URL(route.request().url());
    translationRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ translatedText: `Italiano: ${requestUrl.searchParams.get("q")}` }),
    });
  });

  const configuredBaseUrl =
    process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || "http://127.0.0.1:3000/";
  const appBaseUrl = configuredBaseUrl.endsWith("/") ? configuredBaseUrl : `${configuredBaseUrl}/`;
  const shareQueryParams = new URLSearchParams({
    v: videoId,
    subtitles_url: subtitlesUrl,
    source_lang_code: "iw",
    sub_lang: "iw",
    target_lang: "italian",
  });
  const sharedLink = `${appBaseUrl}?${shareQueryParams.toString()}`;
  const sharedParams = new URL(sharedLink).searchParams;
  expect(sharedParams.get("v")).toBe(videoId);
  expect(sharedParams.get("target_lang")).toBe("italian");
  await page.goto(sharedLink, { waitUntil: "domcontentloaded" });

  await expect(page.locator("header")).toContainText(`video ${videoId}`);
  await expect(page.getByTestId("subtitle-cell-0-iw")).toContainText(
    "Default subtitle sentence one.",
  );
  await expect(page.getByTestId("subtitle-cell-0-it")).toContainText("Italiano:");
  expect(
    timedTextRequests.some((request) => {
      const requestUrl = new URL(request);
      return (
        requestUrl.searchParams.get("v") === videoId && requestUrl.searchParams.get("lang") === "iw"
      );
    }),
  ).toBe(true);
  expect(
    translationRequests.some((request) => new URL(request).searchParams.get("tl") === "it"),
  ).toBe(true);

  await page.getByTestId("header-mode-toggle").click();
  const overlayToggle = page.getByTestId("video-subtitles-overlay-toggle");
  await expect(overlayToggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("active-subtitle-cue-text")).toBeVisible();
  await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="active-subtitle-cue-text"]');
    const testWindow = window as typeof window & { __sharedOverlayHistory?: string[] };
    testWindow.__sharedOverlayHistory = overlay?.textContent ? [overlay.textContent] : [];
    if (!overlay) return;
    new MutationObserver(() => {
      const text = overlay.textContent?.trim();
      if (text) testWindow.__sharedOverlayHistory?.push(text);
    }).observe(overlay, { childList: true, subtree: true, characterData: true });
  });

  const playerLifecycleBeforePlayback = await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __sharedPlaybackStats: { created: number; destroyed: number };
    };
    return {
      created: testWindow.__sharedPlaybackStats.created,
      destroyed: testWindow.__sharedPlaybackStats.destroyed,
    };
  });
  const playButton = page.getByTestId("video-overlay-play-pause-btn").first();
  await playButton.click();
  await expect(playButton).toHaveAttribute("aria-label", "Pause playback");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const testWindow = window as typeof window & {
          __sharedSpeechCalls: Array<{ text: string; lang: string }>;
        };
        return testWindow.__sharedSpeechCalls.length;
      }),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const testWindow = window as typeof window & {
          __sharedPlaybackStats: { states: number[] };
        };
        return testWindow.__sharedPlaybackStats.states.filter((state) => state === 1).length;
      }),
    )
    .toBeGreaterThan(1);

  const playbackEvidence = await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __sharedPlaybackStats: { state: number; states: number[] };
      __sharedSpeechCalls: Array<{ text: string; lang: string }>;
      __sharedOverlayHistory?: string[];
    };
    return {
      ...testWindow.__sharedPlaybackStats,
      speechCalls: testWindow.__sharedSpeechCalls,
      overlayHistory: testWindow.__sharedOverlayHistory || [],
    };
  });
  expect(playbackEvidence.states[0]).toBe(1);
  expect(playbackEvidence.states).toContain(2);
  expect(playbackEvidence.states.filter((state) => state === 1).length).toBeGreaterThan(1);
  expect(playbackEvidence.created).toBe(playerLifecycleBeforePlayback.created);
  expect(playbackEvidence.destroyed).toBe(playerLifecycleBeforePlayback.destroyed);
  expect(playbackEvidence.speechCalls.some((call) => call.lang === "it-IT")).toBe(true);
  expect(playbackEvidence.speechCalls.some((call) => call.text.startsWith("Italiano:"))).toBe(true);
  const firstItalianOverlay = playbackEvidence.overlayHistory.findIndex((text) =>
    text.includes("Italiano:"),
  );
  expect(
    playbackEvidence.overlayHistory.some((text) => text.includes("Default subtitle sentence one.")),
  ).toBe(true);
  expect(firstItalianOverlay).toBeGreaterThanOrEqual(0);
  expect(
    playbackEvidence.overlayHistory.some(
      (text, index) =>
        index > firstItalianOverlay && text.includes("Default subtitle sentence two."),
    ),
  ).toBe(true);
});
