import { expect, test } from "@playwright/test";

test("web-demo video input remains playable without recreating the YouTube player", async ({
  page,
}) => {
  await page.addInitScript(() => {
    type PlayerStats = {
      created: number;
      destroyed: number;
      state: number;
      currentTime: number;
      origin: string;
    };
    type PlayerOptions = {
      videoId: string;
      playerVars?: { origin?: string };
      events: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    };

    const stats: PlayerStats = {
      created: 0,
      destroyed: 0,
      state: 2,
      currentTime: 0,
      origin: "",
    };
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
        stats.origin = options.playerVars?.origin || "";
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
  await expect
    .poll(() =>
      page.evaluate(() => {
        const testWindow = window as typeof window & {
          __playbackTestStats: { origin: string };
        };
        return testWindow.__playbackTestStats.origin;
      }),
    )
    .toBe(new URL(page.url()).origin);
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

test("shared subtitles link shows the video, subtitle table, and live parser updates", async ({
  page,
}) => {
  test.setTimeout(120_000);
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
  const timedTextResponsePromise = page.waitForResponse((response) => {
    try {
      const url = new URL(response.url());
      return (
        url.hostname === "www.youtube.com" &&
        url.pathname === "/api/timedtext" &&
        url.searchParams.get("v") === videoId &&
        url.searchParams.get("lang") === "iw" &&
        Boolean(url.searchParams.get("signature"))
      );
    } catch {
      return false;
    }
  });

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

  await page.setViewportSize({ width: 1440, height: 1800 });
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
  const timedTextResponse = await timedTextResponsePromise;
  expect(timedTextResponse.ok()).toBe(true);
  const timedTextJson3 = await timedTextResponse.json();
  const nativeTimedCueCount = Array.isArray(timedTextJson3.events)
    ? timedTextJson3.events.filter(
        (event: {
          tStartMs?: unknown;
          dDurationMs?: unknown;
          segs?: { utf8?: unknown }[];
        }) =>
          typeof event.tStartMs === "number" &&
          typeof event.dDurationMs === "number" &&
          Array.isArray(event.segs) &&
          event.segs.some((segment) => typeof segment.utf8 === "string" && segment.utf8.trim()),
      ).length
    : 0;
  expect(nativeTimedCueCount).toBeGreaterThan(1);
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
  const setExplanationCaption = (text: string) =>
    page.evaluate((captionText) => {
      let caption = document.querySelector<HTMLElement>('[data-testid="e2e-explainer-caption"]');
      if (!caption) {
        caption = document.createElement("aside");
        caption.dataset.testid = "e2e-explainer-caption";
        caption.setAttribute("aria-label", "E2E demonstration explanation");
        caption.style.cssText =
          "position:fixed;top:76px;left:50%;transform:translateX(-50%);z-index:1000;max-width:760px;width:calc(100vw - 32px);padding:12px 18px;border-radius:10px;background:rgba(15,23,42,.94);color:white;text-align:center;font:600 15px/1.45 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:none";
        document.body.append(caption);
      }
      caption.textContent = captionText;
    }, text);

  await expect(page.locator("header")).toContainText(`video ${videoId}`);
  await setExplanationCaption(
    "Video context: a Hebrew interview discussing Russia and new drones. The captions below are authentic Hebrew with Italian on-demand translation.",
  );
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

  const subtitlesPanel = page.locator('details[data-panel-id="subtitles"]');
  if (!(await subtitlesPanel.getAttribute("open"))) {
    await page.getByTestId("accordion-bar-subtitles").click();
  }
  const pinSubtitlesButton = page.getByTestId("accordion-pin-subtitles");
  if ((await pinSubtitlesButton.getAttribute("aria-pressed")) !== "true") {
    await pinSubtitlesButton.click();
  }
  await expect(pinSubtitlesButton).toHaveAttribute("aria-pressed", "true");
  if (!(await subtitlesPanel.getAttribute("open"))) {
    await page.getByTestId("accordion-bar-subtitles").click();
  }

  const youtubeFrame = page.locator('iframe[src*="youtube.com/embed"]');
  await expect(youtubeFrame).toBeVisible({ timeout: 30000 });
  const subtitlesTable = page.getByTestId("subtitles-table-panel");
  await expect(subtitlesTable).toBeVisible();
  await expect(page.getByTestId("subtitle-cell-0-iw")).not.toBeEmpty();
  expect(signedTimedTextRequested).toBe(true);
  const getAlignedRows = () =>
    subtitlesTable.locator("tbody tr[data-row]").evaluateAll((rows) =>
      rows.flatMap((row, index) => {
        const source = row.querySelector('[data-language-column="iw"]')?.textContent?.trim() || "";
        const translation =
          row.querySelector('[data-language-column="it"]')?.textContent?.trim() || "";
        return source && translation ? [{ index, source, translation }] : [];
      }),
    );
  await expect.poll(() => translationRequests.includes("it"), { timeout: 60000 }).toBe(true);
  await expect(subtitlesTable.getByTestId("column-source-on-demand-it")).toBeVisible();
  await expect.poll(async () => (await getAlignedRows()).length).toBeGreaterThan(0);
  const initialAlignedRows = await getAlignedRows();
  expect(initialAlignedRows.some(({ source, translation }) => source !== translation)).toBe(true);

  const initialRowCount = await subtitlesTable.locator("tbody tr[data-row]").count();
  expect(initialRowCount).toBeGreaterThan(nativeTimedCueCount);
  await setExplanationCaption(
    `Native caption track: ${nativeTimedCueCount} timed cues. The parser currently divides those cues into ${initialRowCount} readable sentence rows.`,
  );
  const intraCueToggle = page.getByTestId("parser-intra-cue-toggle");
  await expect(intraCueToggle).toBeVisible();
  await expect(intraCueToggle).toBeChecked();
  await intraCueToggle.uncheck();
  await expect(intraCueToggle).not.toBeChecked();
  await expect
    .poll(async () => subtitlesTable.locator("tbody tr[data-row]").count())
    .toBe(nativeTimedCueCount);
  await setExplanationCaption(
    `Parser setting changed: intra-cue splitting is off, so the table now has exactly ${nativeTimedCueCount} separate native timed-cue rows. Italian on-demand translation is realigned to the updated rows.`,
  );
  await expect.poll(async () => (await getAlignedRows()).length).toBeGreaterThan(0);
  const updatedAlignedRows = await getAlignedRows();
  expect(updatedAlignedRows.some(({ source, translation }) => source !== translation)).toBe(true);

  const bothPanelsVisibleInViewport = await page.evaluate(() => {
    window.scrollTo(0, 240);
    const frame = document.querySelector('iframe[src*="youtube.com/embed"]');
    const table = document.querySelector('[data-testid="subtitles-table-panel"]');
    if (!frame || !table) return false;
    const frameRect = frame.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    return (
      frameRect.top >= 0 &&
      frameRect.bottom <= window.innerHeight &&
      tableRect.top >= 0 &&
      tableRect.top < window.innerHeight
    );
  });
  expect(bothPanelsVisibleInViewport).toBe(true);
  const firstAlignedRow = updatedAlignedRows[0];
  if (!firstAlignedRow) throw new Error("No Hebrew subtitle row has an Italian translation.");
  await expect(
    subtitlesTable.getByTestId(`subtitle-cue-row-${firstAlignedRow.index}`),
  ).toBeInViewport();
  await expect(
    subtitlesTable.getByTestId(`subtitle-cell-${firstAlignedRow.index}-iw`),
  ).not.toBeEmpty();
  await expect(
    subtitlesTable.getByTestId(`subtitle-cell-${firstAlignedRow.index}-it`),
  ).not.toBeEmpty();
  await page.waitForTimeout(1200);
});
