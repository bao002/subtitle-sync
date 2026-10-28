import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

console.log("=== Verifying Top Screen Title & Description Based on Video Metadata ===");

const rootDir = process.cwd();
const routesIndexPath = path.join(rootDir, "src/routes/index.tsx");

assert.ok(fs.existsSync(routesIndexPath), "src/routes/index.tsx must exist");
const routesContent = fs.readFileSync(routesIndexPath, "utf-8");

// 1. Verify memoized topScreenTitle and topScreenDescription hooks
assert.ok(
  routesContent.includes("const topScreenTitle = useMemo("),
  "src/routes/index.tsx must compute topScreenTitle",
);
assert.ok(
  routesContent.includes("const topScreenDescription = useMemo("),
  "src/routes/index.tsx must compute topScreenDescription",
);

// 2. Verify dependencies on videoMetadata and active videoId
assert.ok(
  routesContent.includes("videoMetadata?.title") && routesContent.includes("videoMetadata?.description"),
  "topScreenTitle and topScreenDescription must read videoMetadata properties",
);

// 3. Verify top screen header renders dynamic title & description elements
assert.ok(
  routesContent.includes('data-testid="top-screen-video-title"'),
  "Header must render data-testid='top-screen-video-title'",
);
assert.ok(
  routesContent.includes('data-testid="top-screen-video-description"'),
  "Header must render data-testid='top-screen-video-description'",
);
assert.ok(
  routesContent.includes('data-testid="top-screen-video-caption-status"'),
  "Header must render data-testid='top-screen-video-caption-status'",
);

// 4. Verify brand title and mode toggle are preserved
assert.ok(
  routesContent.includes("Parallel Subtitles"),
  "Header must preserve Parallel Subtitles branding",
);
assert.ok(
  routesContent.includes('data-testid="header-mode-toggle"'),
  "Header must preserve mode toggle",
);

console.log("✔ Top screen dynamic video title and description verified");
console.log("🎉 All Top Screen Video Metadata tests passed successfully!");
