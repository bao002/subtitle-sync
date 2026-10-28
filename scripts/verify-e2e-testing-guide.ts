import fs from "fs";
import path from "path";

console.log("=========================================================================");
console.log("🧪 Verifying docs/e2e_testing_including_android_codespace_docker_and_github_pages.md");
console.log("=========================================================================");

let failureCount = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failureCount++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Verify docs/e2e_testing_including_android_codespace_docker_and_github_pages.md exists under docs/
const guidePath = path.resolve(
  process.cwd(),
  "docs/e2e_testing_including_android_codespace_docker_and_github_pages.md"
);
assert(
  fs.existsSync(guidePath),
  "docs/e2e_testing_including_android_codespace_docker_and_github_pages.md must exist under docs/"
);

const content = fs.existsSync(guidePath) ? fs.readFileSync(guidePath, "utf-8") : "";

// 2. Verify key sections and topics
const requiredSections = [
  "Executive Summary & AI Studio Platform Trial Results",
  "Effective Android E2E Testing",
  "Producing Screencast and Image Artifacts",
  "GitHub Pages Report & Telemetry Dashboard [Later Enhancements]",
  "E2E Alternatives Comparison Matrix",
  "Benefits of Using Docker for E2E Testing",
  "Recommended Codespace Template for Android Development",
  "Answers to Specific Technical Questions",
];

for (const section of requiredSections) {
  assert(
    content.includes(section),
    `Guide must contain section heading: "${section}"`
  );
}

// 3. Verify specific required technical concepts
const requiredKeyPhrases = [
  // Trial details
  "which docker || echo \"no docker\"",
  "Docker is required but was not found in PATH",
  // Android E2E
  "API 34",
  "DEVICE_INFO_SETTINGS",
  "ACTION_VIEW",
  "ACTION_SEND",
  "shouldInterceptRequest",
  "step-01-about-phone.png",
  // Screencast & Images
  "adb shell screenrecord",
  "pkill -2 -f screenrecord",
  "moov",
  "PLAYWRIGHT_VIDEO=on",
  // GitHub Pages
  "gh-pages",
  "<video controls",
  // Alternatives
  "Native Android Emulator",
  "Docker-Based Playwright E2E",
  "Browser Viewport Emulation",
  // Docker Benefits
  "Host Dependency Isolation",
  "Exact Version Pinning",
  // Codespace
  "devcontainer.json",
  "/dev/kvm",
  // Questions
  "Can Docker for Android be used to run E2E testing?",
  "Can screencast artifacts be used?",
  "Can GitHub Pages reports use those Dockers?",
  "Can GitHub Pages reports generate video artifacts?",
  "Any MCP (Model Context Protocol) recommended for these practices?",
  // MCP details
  "Playwright MCP Server",
  "Android ADB MCP Server",
  "Docker MCP Server",
  "GitHub MCP Server",
];

for (const phrase of requiredKeyPhrases) {
  assert(
    content.includes(phrase),
    `Guide must include technical phrase: "${phrase}"`
  );
}

// 4. Verify no duplicate in root directory
const rootDuplicatePath = path.resolve(
  process.cwd(),
  "e2e_testing_including_android_codespace_docker_and_github_pages.md"
);
assert(
  !fs.existsSync(rootDuplicatePath),
  "No duplicate file may exist in project root"
);

// 5. Verify registration in docs/files.md
const filesMdPath = path.resolve(process.cwd(), "docs/files.md");
const filesMdContent = fs.readFileSync(filesMdPath, "utf-8");
assert(
  filesMdContent.includes(
    "docs/e2e_testing_including_android_codespace_docker_and_github_pages.md"
  ),
  "docs/files.md must catalog docs/e2e_testing_including_android_codespace_docker_and_github_pages.md"
);

// 6. Verify registration in package.json
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
assert(
  Boolean(packageJson.scripts && packageJson.scripts["test:e2e-testing-guide"]),
  "package.json must contain script 'test:e2e-testing-guide'"
);

console.log("=========================================================================");
if (failureCount === 0) {
  console.log("🎉 ALL E2E TESTING GUIDE VERIFICATIONS PASSED!");
  process.exit(0);
} else {
  console.error(`❌ ${failureCount} VERIFICATION(S) FAILED.`);
  process.exit(1);
}
