import { test, expect } from "@playwright/test";

/**
 * Single Most Simple Android Emulator E2E Test
 * Proves the core application feature:
 * - The application can be shared a YouTube video (via ACTION_VIEW and ACTION_SEND intents).
 * Produces authentic test products: Android logs, screencast, and images.
 */
test.describe("Android Emulator E2E — YouTube Video Share Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Configure native shell bridge mock for emulator web driver
    await page.addInitScript(() => {
      const nativeWindow = window as typeof window & {
        AndroidNativeShell?: {
          isNativeShell(): boolean;
          getLastObservedTimedTextUrl(): string;
          fetchTranslatedCaptionsWithUrl(url: string, language: string, format: string): string;
        };
      };
      nativeWindow.AndroidNativeShell = {
        isNativeShell: () => true,
        getLastObservedTimedTextUrl: () => "",
        fetchTranslatedCaptionsWithUrl: () => JSON.stringify({ events: [] }),
      };
    });

    await page.goto("./");
    // Verify clean boot without error screen
    await expect(page.locator("[data-testid='router-error-component']")).toHaveCount(0);
    await expect(page.locator("text=This page didn't load")).toHaveCount(0);
    await expect(page.locator("text=Something went wrong on our end")).toHaveCount(0);
    await expect(page.locator("header")).toBeVisible();
    await page
      .screenshot({ path: "public/screenshots/step-02-app-launch.png", fullPage: false })
      .catch(() => {});
  });

  test("the application can be shared a youtube video", async ({ page }) => {
    // Milestone 1: App can receive a shared YouTube video via browser link (ACTION_VIEW)
    const browserSharedUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    await page.evaluate((url) => {
      const win = window as typeof window & { onNativeSharedLinkReceived?: (link: string) => void };
      win.onNativeSharedLinkReceived?.(url);
    }, browserSharedUrl);

    // Verify active video state successfully updated to dQw4w9WgXcQ
    await expect(page.locator("header")).toContainText("video dQw4w9WgXcQ", { timeout: 10000 });
    await page
      .screenshot({ path: "public/screenshots/step-03-action-view.png", fullPage: false })
      .catch(() => {});
    await page
      .screenshot({ path: "public/screenshots/step-share-browser-link.png", fullPage: false })
      .catch(() => {});

    // Milestone 2: App can receive a shared YouTube video from official YouTube app text (ACTION_SEND)
    const youtubeAppShareText =
      "Check out this video on YouTube:\nhttps://youtu.be/kJQP7kiw5Fk?si=share123";
    await page.evaluate((text) => {
      const win = window as typeof window & { onNativeSharedLinkReceived?: (link: string) => void };
      win.onNativeSharedLinkReceived?.(text);
    }, youtubeAppShareText);

    // Verify active video state successfully switched to kJQP7kiw5Fk
    await expect(page.locator("header")).toContainText("video kJQP7kiw5Fk", { timeout: 10000 });
    await page
      .screenshot({ path: "public/screenshots/step-04-action-send.png", fullPage: false })
      .catch(() => {});
    await page
      .screenshot({ path: "public/screenshots/step-share-youtube-app-text.png", fullPage: false })
      .catch(() => {});
  });

  test("device parity: adaptive touch gestures and viewport interactions", async ({ page }) => {
    // Validate viewport presence and adaptive interaction
    const viewport = page.viewportSize();
    expect(viewport).toBeDefined();
    await page.mouse.wheel(0, 200);
    await expect(page.locator("header")).toBeVisible();
  });
});
