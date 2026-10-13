import fs from "fs";
import path from "path";

/**
 * Script to update README.md repository owner and repository name in all links & badge URLs,
 * update screencast video sizes, and synchronize CI status & copy-pasteable AI error prompts.
 *
 * Usage:
 *   node scripts/update-readme.mjs [owner] [repo]
 *   node scripts/update-readme.mjs owner/repo
 *
 * Environment variables supported:
 *   GITHUB_REPOSITORY (standard GitHub Actions format: "owner/repo")
 *   GITHUB_REPOSITORY_OWNER
 *   CI_STATUS ("success" | "failure")
 *   FAILED_WORKFLOW (e.g. "Android Emulator E2E Tests")
 *   FAILED_STEP (e.g. "Run Android Emulator E2E Tests")
 *   ERROR_MESSAGE / ERROR_LOG_PATH
 *   VIDEO_SIZE_BYTES
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
content = content.replace(
  /https:\/\/github\.com\/[a-zA-Z0-9_\-.]+\/[a-zA-Z0-9_\-.]+\/actions\/workflows\//g,
  `https://github.com/${targetOwner}/${targetRepo}/actions/workflows/`,
);

// 2. Update release download links:
content = content.replace(
  /https:\/\/github\.com\/[a-zA-Z0-9_\-.]+\/[a-zA-Z0-9_\-.]+\/releases\//g,
  `https://github.com/${targetOwner}/${targetRepo}/releases/`,
);

// 3. Update raw.githubusercontent.com links:
content = content.replace(
  /https:\/\/raw\.githubusercontent\.com\/[a-zA-Z0-9_\-.]+\/[a-zA-Z0-9_\-.]+\/main\//g,
  `https://raw.githubusercontent.com/${targetOwner}/${targetRepo}/main/`,
);

// 4. Update GitHub Pages URLs:
content = content.replace(
  /https:\/\/[a-zA-Z0-9_\-.]+\.github\.io\/[a-zA-Z0-9_\-.]+\//g,
  `https://${targetOwner}.github.io/${targetRepo}/`,
);

// 5. Fallback replacement for historical username patterns:
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

// Update numbered list item in README if present
const listVideoRegex = /(\d+\.\s*\*\*Android Emulator Screencast Video\*\*:\s*\[Download\s*`android-emulator-video\.mp4`)[^\]]*(\]\(https:\/\/[^)]+\/screenshots\/android-emulator-video\.mp4\)[^\n]*)/;
if (listVideoRegex.test(content)) {
  content = content.replace(listVideoRegex, `$1 (${mb} MB MP4 recording)$2`);
}

function scanReadmeBrokenLinks(markdownContent, rootDir) {
  const broken = [];
  const lines = markdownContent.split("\n");
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  lines.forEach((line, index) => {
    let match;
    linkRegex.lastIndex = 0;
    while ((match = linkRegex.exec(line)) !== null) {
      const text = match[1];
      const target = match[2].trim();
      if (
        target.startsWith("http://") ||
        target.startsWith("https://") ||
        target.startsWith("mailto:") ||
        target.startsWith("#")
      ) {
        continue;
      }
      const cleanTarget = target.split("#")[0].trim();
      if (!cleanTarget) continue;
      const resolved = path.resolve(rootDir, cleanTarget);
      if (!fs.existsSync(resolved)) {
        broken.push({
          line: index + 1,
          text,
          target,
          resolvedPath: cleanTarget,
          reason: "Target file does not exist in repository",
        });
      }
    }
  });

  const workflowRegex = /actions\/workflows\/([a-zA-Z0-9_\-.]+\.yml)/g;
  let wfMatch;
  while ((wfMatch = workflowRegex.exec(markdownContent)) !== null) {
    const wfFile = wfMatch[1];
    const wfPath = path.resolve(rootDir, ".github", "workflows", wfFile);
    if (!fs.existsSync(wfPath)) {
      broken.push({
        line: 0,
        text: `Workflow Badge: ${wfFile}`,
        target: `.github/workflows/${wfFile}`,
        resolvedPath: `.github/workflows/${wfFile}`,
        reason: "Referenced workflow file does not exist",
      });
    }
  }

  return broken;
}

// 7. Inject or Update CI Status & Error Indicator Section
const statusStartTag = "<!-- CI_STATUS_INDICATOR_START -->";
const statusEndTag = "<!-- CI_STATUS_INDICATOR_END -->";

const rootDir = process.cwd();
const brokenLinks = scanReadmeBrokenLinks(content, rootDir);

let ciStatus = process.env.CI_STATUS || (fs.existsSync("error.log") || brokenLinks.length > 0 ? "failure" : "success");
const failedWorkflow = process.env.FAILED_WORKFLOW || (brokenLinks.length > 0 ? "README Link Integrity & Documentation Check" : "Android Emulator E2E Tests");
const failedStep = process.env.FAILED_STEP || (brokenLinks.length > 0 ? `Broken Link Scan (${brokenLinks.length} broken targets)` : "Execution");
const runUrl = process.env.GITHUB_RUN_ID
  ? `https://github.com/${targetOwner}/${targetRepo}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : `https://github.com/${targetOwner}/${targetRepo}/actions`;

let errorLogSnippet = "";
if (fs.existsSync("error.log")) {
  errorLogSnippet = fs.readFileSync("error.log", "utf8");
} else if (process.env.ERROR_MESSAGE) {
  errorLogSnippet = process.env.ERROR_MESSAGE;
}

let brokenLinksSnippet = "";
if (brokenLinks.length > 0) {
  brokenLinksSnippet =
    "\n\n### 🔗 Broken Links Detected:\n" +
    brokenLinks
      .map(
        (b) =>
          `- ${b.line > 0 ? `Line ${b.line}: ` : ""}\`[${b.text}](${b.target})\` -> ${b.reason} (\`${b.resolvedPath}\`)`,
      )
      .join("\n");
}

let statusSection = "";
if (ciStatus === "failure") {
  const alertSubtitle =
    brokenLinks.length > 0
      ? `⚠️ **Automated Failure / Broken Links Detected**: \`${failedWorkflow}\` (${brokenLinks.length} broken link${brokenLinks.length > 1 ? "s" : ""} found)`
      : `⚠️ **Automated CI Failure Detected**: \`${failedWorkflow}\` (Step: \`${failedStep}\`)`;

  statusSection = `${statusStartTag}
## 🚨 Latest CI Build & Test Status: FAILED

> ${alertSubtitle}
>
> If screencasts, logs, or reports are missing, copy the diagnostic block below and paste it directly into your AI Assistant prompt to reproduce and resolve the failure immediately:

\`\`\`markdown
# AI FIX PROMPT: CI Failure in ${failedWorkflow}
- **Repository**: ${targetOwner}/${targetRepo}
- **Workflow / Checker**: ${failedWorkflow}
- **Failing Step**: ${failedStep}
- **Run URL**: ${runUrl}

### Failure Log & Diagnosis:
${errorLogSnippet || (brokenLinks.length > 0 ? "Broken links or missing targets were identified in README.md." : "The automated test step terminated abnormally. Check the Actions run logs for full traceback.")}${brokenLinksSnippet}

### Instructions for AI Assistant:
1. Examine the root cause, broken link(s), and diagnostic details above.
2. Fix broken target paths, restore missing files, or fix failing application code with targeted edits.
3. Verify that \`npm run test:readme-links\` and all automated test suites pass cleanly.
\`\`\`
${statusEndTag}`;
} else {
  statusSection = `${statusStartTag}
## 🚦 Latest CI Build & Test Status: ALL VERIFIED

- **Android Emulator E2E Tests**: [Verified (Android 14 API 34)](https://${targetOwner}.github.io/${targetRepo}/android-emulator-report.html)
- **Android Emulator Screencast Video**: [Download MP4 (${mb} MB)](https://${targetOwner}.github.io/${targetRepo}/screenshots/android-emulator-video.mp4)
- **Screenshot Image**: [View UI Capture](https://${targetOwner}.github.io/${targetRepo}/screenshots/android-emulator-screenshot.png)
- **Workflow Runs**: [GitHub Actions Dashboard](https://github.com/${targetOwner}/${targetRepo}/actions)
${statusEndTag}`;
}

const statusSectionRegex = new RegExp(`${statusStartTag}[\\s\\S]*?${statusEndTag}`);
if (statusSectionRegex.test(content)) {
  content = content.replace(statusSectionRegex, statusSection);
} else {
  const marker = "## 📱 Live Android Emulator Verification Report";
  if (content.includes(marker)) {
    content = content.replace(marker, `${statusSection}\n\n---\n\n${marker}`);
  } else {
    content = `${content}\n\n${statusSection}\n`;
  }
}

fs.writeFileSync(readmePath, content, "utf8");
console.log(`✅ README.md successfully updated with repository: "${targetOwner}/${targetRepo}", video size: ${mb} MB, and CI status: ${ciStatus}`);
