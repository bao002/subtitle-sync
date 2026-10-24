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

test("shared subtitles link plays the real video and alternates authentic Hebrew/Italian subtitles", async ({
  page,
}) => {
  const videoId = "WJlWKB8qrf0";
  const subtitlesUrl = process.env.E2E_SHARED_SUBTITLES_URL;
  if (!subtitlesUrl) {
    test.skip(true, "requires an unexpired authentic E2E_SHARED_SUBTITLES_URL");
    return;
  }
  const sharedTimedTextUrl = new URL(subtitlesUrl);
  expect(sharedTimedTextUrl.searchParams.get("v")).toBe(videoId);
  expect(sharedTimedTextUrl.searchParams.get("lang")).toBe("iw");

  let signedTimedTextRequested = false;
  const translationRequests: string[] = [];
  const mediaStreamRequests: boolean[] = [];

  page.on("request", (request) => {
    try {
      const url = new URL(request.url());
      if (
        url.hostname === "www.youtube.com" &&
        url.pathname === "/api/timedtext" &&
        url.searchParams.get("v") === videoId &&
        url.searchParams.get("lang") === "iw" &&
        Boolean(url.searchParams.get("signature"))
      ) {
        signedTimedTextRequested = true;
      }
      if (url.hostname === "translate.googleapis.com" && url.searchParams.get("tl") === "it") {
        translationRequests.push("it");
      }
    } catch {
      // Ignore non-URL requests.
    }
  });
  page.on("request", (request) => {
    try {
      const url = new URL(request.url());
      if (url.hostname.endsWith("googlevideo.com") && url.pathname.includes("/videoplayback")) {
        mediaStreamRequests.push(true);
      }
    } catch {
      // Ignore non-URL requests.
    }
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
  await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("subtitles_url");
    params.delete("source_lang_code");
    params.delete("sub_lang");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}${window.location.hash}`,
    );
  });

  await expect(page.locator("header")).toContainText(`video ${videoId}`);
  await page.getByTestId("header-mode-toggle").click();
  const playerPanel = page.locator('details[data-panel-id="player"]');
  if (!(await playerPanel.getAttribute("open"))) {
    await page.getByTestId("accordion-bar-player").click();
  }
  const pinPlayerButton = page.getByTestId("accordion-pin-player");
  await pinPlayerButton.click();
  await expect(pinPlayerButton).toHaveAttribute("aria-pressed", "true");
  if (!(await playerPanel.getAttribute("open"))) {
    await page.getByTestId("accordion-bar-player").click();
  }
  const youtubeFrame = page.locator('iframe[src*="youtube.com/embed"]');
  await expect(youtubeFrame).toBeVisible({ timeout: 30000 });
  const sourceCell = page.getByTestId("subtitle-cell-0-iw");
  const italianCell = page.getByTestId("subtitle-cell-0-it");
  await expect(sourceCell).not.toBeEmpty({ timeout: 60000 });
  await expect(italianCell).not.toBeEmpty({ timeout: 60000 });
  expect(signedTimedTextRequested).toBe(true);
  await expect.poll(() => translationRequests.includes("it"), { timeout: 60000 }).toBe(true);

  const hebrewText = (await sourceCell.innerText()).trim();
  const italianText = (await italianCell.innerText()).trim();
  expect(hebrewText).not.toBe(italianText);

  await expect(youtubeFrame).toBeVisible({ timeout: 30000 });
  const overlayToggle = page.getByTestId("video-subtitles-overlay-toggle");
  await expect(overlayToggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("active-subtitle-cue-text")).toBeVisible({ timeout: 30000 });
  await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="active-subtitle-cue-text"]');
    const language = document.querySelector('[data-testid="active-subtitle-language"]');
    const testWindow = window as typeof window & { __sharedOverlayHistory?: string[] };
    const recordOverlay = () => {
      const text = overlay?.textContent?.trim();
      const lang = language?.textContent?.trim();
      if (text && lang) testWindow.__sharedOverlayHistory?.push(`${lang}: ${text}`);
    };
    testWindow.__sharedOverlayHistory = [];
    recordOverlay();
    const observer = new MutationObserver(recordOverlay);
    if (overlay) observer.observe(overlay, { childList: true, subtree: true, characterData: true });
    if (language)
      observer.observe(language, { childList: true, subtree: true, characterData: true });
  });

  const playButton = page.getByTestId("video-overlay-play-pause-btn").first();
  await playButton.click();
  await expect(playButton).toHaveAttribute("aria-label", "Pause playback");
  await expect.poll(() => mediaStreamRequests.length, { timeout: 60000 }).toBeGreaterThan(0);
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const history = (window as typeof window & { __sharedOverlayHistory?: string[] })
            .__sharedOverlayHistory;
          return history?.filter((text) => text.startsWith("Italian:")).length || 0;
        }),
      { timeout: 120000 },
    )
    .toBeGreaterThan(0);

  const playbackEvidence = await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __sharedOverlayHistory?: string[];
    };
    return {
      overlayHistory: testWindow.__sharedOverlayHistory || [],
    };
  });
  const firstItalianOverlay = playbackEvidence.overlayHistory.findIndex((text) =>
    text.startsWith("Italian:"),
  );
  const firstHebrewOverlay = playbackEvidence.overlayHistory.findIndex((text) =>
    text.startsWith("Hebrew:"),
  );
  const firstItalianLanguageOverlay = playbackEvidence.overlayHistory.findIndex((text) =>
    text.startsWith("Italian:"),
  );
  const nextHebrewOverlay = playbackEvidence.overlayHistory.findIndex(
    (text, index) => index > firstItalianLanguageOverlay && text.startsWith("Hebrew:"),
  );
  expect(firstItalianOverlay).toBeGreaterThanOrEqual(0);
  expect(firstHebrewOverlay).toBeGreaterThanOrEqual(0);
  expect(firstItalianLanguageOverlay).toBeGreaterThan(firstHebrewOverlay);
  expect(nextHebrewOverlay).toBeGreaterThan(firstItalianLanguageOverlay);
  expect(playbackEvidence.overlayHistory.some((text) => text.endsWith(hebrewText))).toBe(true);
  expect(playbackEvidence.overlayHistory.some((text) => text.endsWith(italianText))).toBe(true);
});
