import { test, expect } from "@playwright/test";

test("app smoke test renders the subtitle workspace", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveTitle(/Parallel Subtitles/i);
  await expect(
    page.getByRole("heading", { name: "Parallel Subtitles", exact: true }),
  ).toBeVisible();
  const languagesPanel = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Languages" }) });
  await expect(languagesPanel).toBeVisible();
  await expect(languagesPanel.locator("table tbody tr")).toHaveCount(6);

  // Assert default OFF states for audio-track mode and auto-scroll
  await expect(page.locator("#audio-track-mode-toggle")).not.toBeChecked();
  await expect(page.locator("#auto-scroll-toggle")).not.toBeChecked();
});
