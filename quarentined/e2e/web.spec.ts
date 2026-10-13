import { test, expect } from "@playwright/test";

test.describe("Parallel Subtitles web app", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("./");
    await expect(page).toHaveTitle(/Parallel Subtitles/i);
    await expect(page.locator('header[data-app-hydrated="true"]')).toBeVisible();
  });

  test("loads fixture subtitles with constant target-language tracks", async ({ page }) => {
    const subtitleTable = page.locator("details").filter({ hasText: "Parallel subtitles" });
    await expect(subtitleTable.locator("tbody tr").first()).toBeVisible();

    const languagesPanel = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: "Languages" }) });
    await expect(languagesPanel.locator("table")).toBeVisible();
    await expect(languagesPanel.locator("table tbody tr")).toHaveCount(6);

    // On web-app, target/favorite languages selector is exposed and contains fixture tracks
    await expect(page.locator("#target-language-select")).toBeVisible();
  });

  test("switches themes without losing the language controls", async ({ page }) => {
    const themeControls = page.locator('[aria-label="Color theme"]');
    const darkButton = themeControls.getByRole("button", { name: "dark", exact: true });

    await darkButton.click();
    await expect(darkButton).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.locator("details").filter({ has: page.locator("summary", { hasText: "Languages" }) }),
    ).toBeVisible();

    await themeControls.getByRole("button", { name: "light", exact: true }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("toggles audio-track mode and verifies default is OFF", async ({ page }) => {
    const audioTrackToggle = page.locator("#audio-track-mode-toggle");
    await expect(audioTrackToggle).toBeVisible();
    await expect(audioTrackToggle).not.toBeChecked();

    // Toggle on
    await audioTrackToggle.check();
    await expect(audioTrackToggle).toBeChecked();

    // Reload page and assert persistence
    await page.reload();
    await expect(page.locator('header[data-app-hydrated="true"]')).toBeVisible();
    await expect(page.locator("#audio-track-mode-toggle")).toBeChecked();

    // Toggle back off
    await page.locator("#audio-track-mode-toggle").uncheck();
    await expect(page.locator("#audio-track-mode-toggle")).not.toBeChecked();
  });

  test("toggles auto-focus and scroll and verifies default is OFF", async ({ page }) => {
    const autoScrollToggle = page.locator("#auto-scroll-toggle");
    await expect(autoScrollToggle).toBeVisible();
    await expect(autoScrollToggle).not.toBeChecked();

    // Toggle on
    await autoScrollToggle.check();
    await expect(autoScrollToggle).toBeChecked();

    // Reload page and assert persistence
    await page.reload();
    await expect(page.locator('header[data-app-hydrated="true"]')).toBeVisible();
    await expect(page.locator("#auto-scroll-toggle")).toBeChecked();

    // Toggle back off
    await page.locator("#auto-scroll-toggle").uncheck();
    await expect(page.locator("#auto-scroll-toggle")).not.toBeChecked();
  });

  test("does not produce React hydration mismatch on the Languages panel or initial state", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("./");
    await expect(page.locator('header[data-app-hydrated="true"]')).toBeVisible();

    const hydrationErrors = consoleErrors.filter(
      (msg) =>
        msg.toLowerCase().includes("hydration") ||
        msg.toLowerCase().includes("server rendered text") ||
        msg.toLowerCase().includes("did not match") ||
        msg.toLowerCase().includes("react error #418") ||
        msg.toLowerCase().includes("react error #423"),
    );

    expect(hydrationErrors).toEqual([]);

    const languagesPanel = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: "Languages" }) });
    await expect(languagesPanel).toBeVisible();
    await expect(languagesPanel.locator("#target-language-select")).toBeVisible();
  });
});
