import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const rawBaseURL =
  process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || "http://127.0.0.1:3000";
const baseURL = rawBaseURL.endsWith("/") ? rawBaseURL : `${rawBaseURL}/`;
const videoMode = process.env.PLAYWRIGHT_VIDEO === "on" ? "on" : "off";

const isExternalServer = Boolean(
  process.env.PLAYWRIGHT_BASE_URL &&
  !process.env.PLAYWRIGHT_BASE_URL.includes("localhost") &&
  !process.env.PLAYWRIGHT_BASE_URL.includes("127.0.0.1"),
);

const fallbackExecutablePath = [
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
  "/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell",
  "/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell",
  "/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell",
].find((p) => p && fs.existsSync(p));

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: process.env.PLAYWRIGHT_HTML_OUTPUT_DIR || "playwright-report",
      },
    ],
  ],
  use: {
    baseURL,
    video: videoMode,
    trace: "off",
    screenshot: "on",
    launchOptions: {
      executablePath: fallbackExecutablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    },
  },
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || "test-results",
  webServer: isExternalServer
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
        timeout: 30000,
      },
  projects: [
    {
      name: "web",
      testMatch: /.*(?:emulation|web)\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        video: videoMode,
      },
    },
    {
      name: "emulation",
      testMatch: /.*emulation\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        video: videoMode,
      },
    },
    {
      name: "app",
      testMatch: /.*app\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        video: videoMode,
      },
    },
  ],
});
