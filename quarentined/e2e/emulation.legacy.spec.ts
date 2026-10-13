import { test, expect, type Page } from "@playwright/test";

// Quarantined legacy complex emulation test suite
const observedUrl = "https://www.youtube.com/api/timedtext?v=L2Ryrr6txwA&lang=en&fmt=json3";
type NativeCaptionRequest = { url: string; language: string; format: string };

async function getNativeCaptionRequests(page: Page): Promise<NativeCaptionRequest[]> {
  return page.evaluate(
    () =>
      (window as typeof window & { __nativeCaptionRequests?: NativeCaptionRequest[] })
        .__nativeCaptionRequests ?? [],
  );
}

async function deliverDefaultCaptions(page: Page) {
  await page.evaluate((url) => {
    const nativeWindow = window as typeof window & {
      onNativeCaptionsInterceptedBase64?: (payload: string) => void;
    };
    const payload = {
      url,
      rawData: JSON.stringify({
        events: [
          { tStartMs: 0, dDurationMs: 4000, segs: [{ utf8: "Default caption line dialog" }] },
        ],
      }),
    };
    nativeWindow.onNativeCaptionsInterceptedBase64?.(btoa(JSON.stringify(payload)));
  }, observedUrl);
}

test.describe("Quarantined Android native subtitle emulation (legacy)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((url) => {
      const nativeWindow = window as typeof window & {
        AndroidNativeShell?: {
          isNativeShell(): boolean;
          getLastObservedTimedTextUrl(): string;
          fetchTranslatedCaptionsWithUrl(url: string, language: string, format: string): string;
        };
        __nativeCaptionRequests?: NativeCaptionRequest[];
        __failTlangOnce?: boolean;
      };

      nativeWindow.__nativeCaptionRequests = [];
      nativeWindow.AndroidNativeShell = {
        isNativeShell: () => true,
        getLastObservedTimedTextUrl: () => url,
        fetchTranslatedCaptionsWithUrl: (requestUrl, language, format) => {
          nativeWindow.__nativeCaptionRequests?.push({ url: requestUrl, language, format });
          if (nativeWindow.__failTlangOnce && requestUrl.includes("tlang=")) {
            return "<html><body>404 Not Found</body></html>";
          }
          const events = [];
          for (let i = 0; i < 15; i++) {
            events.push({
              tStartMs: i * 4000,
              dDurationMs: 4000,
              segs: [{ utf8: `[${language.toUpperCase()}] Line ${i + 1} dialog` }],
            });
          }
          return JSON.stringify({ events });
        },
      };
    }, observedUrl);

    await page.goto("./");
    await expect(page.locator("[data-testid='router-error-component']")).toHaveCount(0);
    await expect(page.locator("text=This page didn't load")).toHaveCount(0);
    await expect(page).toHaveTitle(/Parallel Subtitles/i);
  });

  test("replays the observed timedtext URL with original lang preserved and favorite langs applied via tlang", async ({
    page,
  }) => {
    expect(await getNativeCaptionRequests(page)).toEqual([]);
    await deliverDefaultCaptions(page);

    await expect
      .poll(async () => (await getNativeCaptionRequests(page)).map((request) => request.language))
      .toEqual(expect.arrayContaining(["he", "it"]));
  });
});
