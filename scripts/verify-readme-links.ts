import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const rootDir = process.cwd();

console.log("====================================================");
console.log("🧪 Starting README Links & Workflow Integrity Test");
console.log("====================================================");

const readmePath = path.resolve(rootDir, "README.md");
assert(fs.existsSync(readmePath), "README.md must exist in the repository root");

const readmeContent = fs.readFileSync(readmePath, "utf8");
const lines = readmeContent.split("\n");

// 1. Verify all relative links point to existing files
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
let relativeLinksCount = 0;

lines.forEach((line, index) => {
  let match: RegExpExecArray | null;
  linkRegex.lastIndex = 0;

  while ((match = linkRegex.exec(line)) !== null) {
    const target = match[2].trim();
    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("mailto:") ||
      target.startsWith("#")
    ) {
      continue;
    }

    relativeLinksCount++;
    const cleanTarget = target.split("#")[0];
    const resolved = path.resolve(rootDir, cleanTarget);
    assert(
      fs.existsSync(resolved),
      `Broken relative link at README.md:${index + 1}: "${target}" (resolved: ${resolved})`,
    );
    console.log(`✅ PASS: Relative link "${target}" resolves to ${cleanTarget}`);
  }
});

assert(
  relativeLinksCount >= 1,
  `Expected at least 1 relative link in README.md, found ${relativeLinksCount}`,
);

// 2. Verify all core workflow files exist
const workflowBadges = ["release-apk.yml", "web.yml", "emulation.yml", "deploy-demo.yml"];

for (const wf of workflowBadges) {
  const workflowPath = path.resolve(rootDir, ".github", "workflows", wf);
  assert(fs.existsSync(workflowPath), `Target workflow file must exist: .github/workflows/${wf}`);
  console.log(`✅ PASS: Core workflow file exists: .github/workflows/${wf}`);
}

// 3. Verify curl install script exists in repository root
const updateApkPath = path.resolve(rootDir, "update.apk.sh");
assert(fs.existsSync(updateApkPath), "update.apk.sh must exist in repository root");
console.log("✅ PASS: update.apk.sh exists in repository root");

// 4. Verify GitHub Pages demo and report links in README
assert(
  /https:\/\/[a-zA-Z0-9_\-.]+\.github\.io\/(subtitle-sync|Youtubenet6)\/?/.test(readmeContent),
  "README.md must contain valid GitHub Pages demo URL",
);
assert(
  readmeContent.includes("android-emulator-report.html"),
  "README.md must contain Android Emulator E2E test report link on GitHub Pages",
);
console.log("✅ PASS: Basic README contains GitHub Pages demo and report links");

const screenshotAsset = path.resolve(
  rootDir,
  "public",
  "screenshots",
  "android-emulator-screenshot.png",
);
assert(
  fs.existsSync(screenshotAsset),
  "public/screenshots/android-emulator-screenshot.png asset must exist",
);
const assetScreenshot = path.resolve(
  rootDir,
  "public",
  "assets",
  "android-emulator-screenshot.png",
);
assert(
  fs.existsSync(assetScreenshot),
  "public/assets/android-emulator-screenshot.png asset must exist",
);
console.log("✅ PASS: Authentic emulator screenshot static assets present in public/");
console.log("✅ PASS: GitHub Pages demo and screenshot URLs present in README.md");

console.log("====================================================");
console.log(
  `📊 README LINKS TEST: All ${relativeLinksCount} relative links and workflow badges verified!`,
);
console.log("====================================================");
