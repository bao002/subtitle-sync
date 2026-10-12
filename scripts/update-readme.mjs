import fs from "fs";
import path from "path";

/**
 * Script to update README.md repository owner and repository name in all links & badge URLs.
 * Enables zero-touch synchronization across forks and repository renames.
 *
 * Usage:
 *   node scripts/update-readme.mjs [owner] [repo]
 *   node scripts/update-readme.mjs owner/repo
 *
 * Environment variables supported:
 *   GITHUB_REPOSITORY (standard GitHub Actions format: "owner/repo")
 *   GITHUB_REPOSITORY_OWNER
 */

let targetOwner = "mostuf2556";
let targetRepo = "Youtubenet6";

if (process.env.GITHUB_REPOSITORY) {
  const [envOwner, envRepo] = process.env.GITHUB_REPOSITORY.split("/");
  if (envOwner) targetOwner = envOwner;
  if (envRepo) targetRepo = envRepo;
} else if (process.env.GITHUB_REPOSITORY_OWNER) {
  targetOwner = process.env.GITHUB_REPOSITORY_OWNER;
}

if (process.argv[2]) {
  if (process.argv[2].includes("/")) {
    const [argOwner, argRepo] = process.argv[2].split("/");
    if (argOwner) targetOwner = argOwner;
    if (argRepo) targetRepo = argRepo;
  } else {
    targetOwner = process.argv[2];
  }
}

if (process.argv[3]) {
  targetRepo = process.argv[3];
}

const readmePath = path.resolve(process.cwd(), "README.md");

if (!fs.existsSync(readmePath)) {
  console.error("❌ README.md file not found at:", readmePath);
  process.exit(1);
}

let content = fs.readFileSync(readmePath, "utf8");

// 1. Update GitHub badge and action workflow links:
// e.g. https://github.com/<owner>/<repo>/actions/workflows/
content = content.replace(
  /https:\/\/github\.com\/[a-zA-Z0-9_\-.]+\/[a-zA-Z0-9_\-.]+\/actions\/workflows\//g,
  `https://github.com/${targetOwner}/${targetRepo}/actions/workflows/`,
);

// 2. Update release download links:
// e.g. https://github.com/<owner>/<repo>/releases/
content = content.replace(
  /https:\/\/github\.com\/[a-zA-Z0-9_\-.]+\/[a-zA-Z0-9_\-.]+\/releases\//g,
  `https://github.com/${targetOwner}/${targetRepo}/releases/`,
);

// 3. Update raw.githubusercontent.com links:
// e.g. https://raw.githubusercontent.com/<owner>/<repo>/main/
content = content.replace(
  /https:\/\/raw\.githubusercontent\.com\/[a-zA-Z0-9_\-.]+\/[a-zA-Z0-9_\-.]+\/main\//g,
  `https://raw.githubusercontent.com/${targetOwner}/${targetRepo}/main/`,
);

// 4. Update GitHub Pages URLs:
// e.g. https://<owner>.github.io/<repo>/
content = content.replace(
  /https:\/\/[a-zA-Z0-9_\-.]+\.github\.io\/[a-zA-Z0-9_\-.]+\//g,
  `https://${targetOwner}.github.io/${targetRepo}/`,
);

// 5. Fallback replacement for historical username patterns
content = content.replace(/mostuf\d+/g, targetOwner);

// 6. Update Android Emulator Screencast Video link & exact size:
let videoSizeBytes = 6724502; // Default verified size (6.41 MB)
if (process.env.VIDEO_SIZE_BYTES && Number(process.env.VIDEO_SIZE_BYTES) > 0) {
  videoSizeBytes = Number(process.env.VIDEO_SIZE_BYTES);
} else {
  const localCandidates = [
    path.resolve(process.cwd(), "android-emulator-video.mp4"),
    path.resolve(process.cwd(), "public/screenshots/android-emulator-video.mp4"),
    path.resolve(process.cwd(), "gh-pages-staging/screenshots/android-emulator-video.mp4"),
  ];
  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      const stats = fs.statSync(candidate);
      if (stats.size > 0) {
        videoSizeBytes = stats.size;
        break;
      }
    }
  }
}

const mb = (videoSizeBytes / (1024 * 1024)).toFixed(2);
const videoRow = `| 🎬 **Android Emulator Screencast Video**               | [**View/Download MP4 Screencast (${mb} MB)**](https://${targetOwner}.github.io/${targetRepo}/screenshots/android-emulator-video.mp4) | Full authentic screen recording from Android Emulator E2E run (API 34 Google APIs, size: ${videoSizeBytes.toLocaleString()} bytes / ${mb} MB).          |`;

const videoRegex = /\|\s*🎬\s*\*\*Android Emulator Screencast Video\*\*[^|\n]*\|[^|\n]*\|[^|\n]*\|/;
if (videoRegex.test(content)) {
  content = content.replace(videoRegex, videoRow);
} else {
  const screenshotRegex = /(\|\s*📸\s*\*\*Android Emulator Screenshot\*\*[^|\n]*\|[^|\n]*\|[^|\n]*\|\n)/;
  if (screenshotRegex.test(content)) {
    content = content.replace(screenshotRegex, `$1${videoRow}\n`);
  }
}

fs.writeFileSync(readmePath, content, "utf8");
console.log(`✅ README.md successfully updated with repository: "${targetOwner}/${targetRepo}" and video size: ${mb} MB`);

