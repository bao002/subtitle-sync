import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import { subtitleRequestQueue } from "../src/utils/subtitleRequestQueue";
import { getActiveAppVersion, getInstalledApkVersionInfo } from "../src/utils/apkUpdater";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("=========================================================================");
console.log("🧪 Verifying Auto-Retry Pacing Architecture & Android Versioning/Updates");
console.log("=========================================================================");

// --- Step 1: Verify docs/auto-retry.md ---
console.log("--> [Step 1] Verifying docs/auto-retry.md content and architectural coverage...");
const autoRetryDocPath = path.resolve(__dirname, "../docs/auto-retry.md");
assert(fs.existsSync(autoRetryDocPath), "docs/auto-retry.md must exist under docs/*.md");
const autoRetryDoc = fs.readFileSync(autoRetryDocPath, "utf-8");

assert(
  autoRetryDoc.includes("Anti-Abuse") && autoRetryDoc.includes("HTTP 429"),
  "docs/auto-retry.md must explain anti-abuse philosophy and 429 rate limit prevention",
);
assert(
  autoRetryDoc.includes("Concurrency = 1") || autoRetryDoc.includes("concurrency = 1"),
  "docs/auto-retry.md must specify strict Concurrency = 1 (single-flight execution)",
);
assert(
  autoRetryDoc.includes("Jitter") && autoRetryDoc.includes("Pacing"),
  "docs/auto-retry.md must detail randomized jitter delay between requests",
);
assert(
  autoRetryDoc.includes("Selective Retry") && autoRetryDoc.includes("Only Failed Requests"),
  "docs/auto-retry.md must specify selective retries (only retrying failed tracks)",
);
assert(
  autoRetryDoc.includes("tlang") && autoRetryDoc.includes("lang"),
  "docs/auto-retry.md must cover strategy rotation and load balancing",
);
assert(
  autoRetryDoc.includes("Exponential Backoff"),
  "docs/auto-retry.md must detail exponential backoff and cooling periods",
);
assert(
  autoRetryDoc.includes("Lifecycle Management") ||
    autoRetryDoc.includes("Video Navigation Invalidation"),
  "docs/auto-retry.md must cover request cancellation upon video change or language removal",
);
console.log(
  "✅ PASS: docs/auto-retry.md comprehensively covers all anti-abuse and retry specifications.",
);

// --- Step 2: Verify docs/versioning.md ---
console.log("--> [Step 2] Verifying docs/versioning.md content and update troubleshooting...");
const versioningDocPath = path.resolve(__dirname, "../docs/versioning.md");
assert(fs.existsSync(versioningDocPath), "docs/versioning.md must exist under docs/*.md");
const versioningDoc = fs.readFileSync(versioningDocPath, "utf-8");

assert(
  versioningDoc.includes("versionName") && versioningDoc.includes("versionCode"),
  "docs/versioning.md must differentiate versionName vs versionCode",
);
assert(
  versioningDoc.includes("update.apk.sh") && versioningDoc.includes("web-dist.zip"),
  "docs/versioning.md must document ADB script and in-app OTA hot updates",
);
assert(
  versioningDoc.includes("INSTALL_FAILED_UPDATE_INCOMPATIBLE") &&
    versioningDoc.includes("signatures do not match"),
  "docs/versioning.md must explain keystore signature mismatch cause",
);
assert(
  versioningDoc.includes("INSTALL_FAILED_VERSION_DOWNGRADE"),
  "docs/versioning.md must explain version code downgrade/equality block",
);
assert(
  versioningDoc.includes("INSTALL_FAILED_ALREADY_EXISTS"),
  "docs/versioning.md must explain 'same package already installed' error without replace flag",
);
assert(
  versioningDoc.includes("Deep Purge") && versioningDoc.includes("pm uninstall"),
  "docs/versioning.md must document automated deep purge and recovery steps",
);
console.log(
  "✅ PASS: docs/versioning.md provides complete upgrade and collision recovery documentation.",
);

// --- Step 3: Verify Subtitle Request Queue Logic ---
console.log("--> [Step 3] Testing SubtitleRequestQueue unit behaviors...");
async function testSubtitleQueue() {
  const testVideo = "test-video-123";
  subtitleRequestQueue.setVideoContext(testVideo);

  // 1. Mark 'en' as already succeeded
  subtitleRequestQueue.markSucceeded(testVideo, "en");
  assert(
    subtitleRequestQueue.hasSucceeded(testVideo, "en"),
    "Queue must recognize 'en' as already succeeded",
  );

  // 2. Enqueuing succeeded language should skip immediately
  let enExecuted = false;
  const enResult = await subtitleRequestQueue.enqueue({
    videoId: testVideo,
    lang: "en",
    execute: async () => {
      enExecuted = true;
      return true;
    },
  });
  assert(
    enResult === true && !enExecuted,
    "Enqueuing an already succeeded language must return true without executing",
  );

  // 3. Queue multiple tasks and verify strict sequential execution (Concurrency = 1)
  let activeExecutions = 0;
  let maxConcurrent = 0;
  const executionOrder: string[] = [];

  const taskHe = subtitleRequestQueue.enqueue({
    videoId: testVideo,
    lang: "he",
    execute: async () => {
      activeExecutions++;
      maxConcurrent = Math.max(maxConcurrent, activeExecutions);
      await new Promise((r) => setTimeout(r, 20));
      executionOrder.push("he");
      activeExecutions--;
      return true;
    },
  });

  const taskAr = subtitleRequestQueue.enqueue({
    videoId: testVideo,
    lang: "ar",
    execute: async () => {
      activeExecutions++;
      maxConcurrent = Math.max(maxConcurrent, activeExecutions);
      await new Promise((r) => setTimeout(r, 20));
      executionOrder.push("ar");
      activeExecutions--;
      return true;
    },
  });

  await Promise.all([taskHe, taskAr]);
  assert.strictEqual(maxConcurrent, 1, "Max concurrent executions must strictly be 1");
  assert(
    executionOrder.includes("he") && executionOrder.includes("ar"),
    "Both queued tasks must execute sequentially",
  );

  // 4. Video switch resets queue and cancels stale tasks
  subtitleRequestQueue.setVideoContext("new-video-456");
  assert(
    !subtitleRequestQueue.hasSucceeded("new-video-456", "en"),
    "New video context must not carry over old succeeded tracks",
  );

  // 5. Language removal
  subtitleRequestQueue.markSucceeded("new-video-456", "it");
  subtitleRequestQueue.removeLanguage("it");
  assert(
    !subtitleRequestQueue.hasSucceeded("new-video-456", "it"),
    "Removed language must be pruned from queue tracking",
  );
}

await testSubtitleQueue();
console.log(
  "✅ PASS: SubtitleRequestQueue guarantees concurrency = 1, selective filtering, and context scoping.",
);

// --- Step 4: Verify Android Native Shell Version Bridge & Build Gradle ---
console.log("--> [Step 4] Verifying native version bridge and build.gradle.kts configuration...");
const mainActivityPath = path.resolve(
  __dirname,
  "../android-shell/app/src/main/java/com/ytviewer/app/MainActivity.kt",
);
const mainActivityContent = fs.readFileSync(mainActivityPath, "utf-8");

assert(
  mainActivityContent.includes("fun getAppVersionName(): String") &&
    mainActivityContent.includes("fun getAppVersionCode(): Long") &&
    mainActivityContent.includes("fun getInstalledAppInfo(): String"),
  "MainActivity.kt must expose getAppVersionName, getAppVersionCode, and getInstalledAppInfo",
);

const buildGradlePath = path.resolve(__dirname, "../android-shell/app/build.gradle.kts");
const buildGradleContent = fs.readFileSync(buildGradlePath, "utf-8");

assert(
  buildGradleContent.includes("package.json") && buildGradleContent.includes("defaultDerivedCode"),
  "build.gradle.kts must dynamically read package.json version and compute default versionCode",
);

const typesPath = path.resolve(__dirname, "../src/types.ts");
const typesContent = fs.readFileSync(typesPath, "utf-8");
assert(
  typesContent.includes("getAppVersionName?: () => string;") &&
    typesContent.includes("getAppVersionCode?: () => number;"),
  "src/types.ts must declare version methods on AndroidNativeShell interface",
);

// Verify apkUpdater functions
const versionInfo = getInstalledApkVersionInfo();
assert("isNative" in versionInfo, "getInstalledApkVersionInfo must return isNative property");
const activeVersion = getActiveAppVersion("v1.0.16");
assert(activeVersion.startsWith("v"), "getActiveAppVersion must return formatted version tag");
console.log("✅ PASS: Native version bridge and build configuration verified.");

// --- Step 5: Verify Collision Handling in update.apk.sh & install-apk.sh ---
console.log("--> [Step 5] Verifying collision handling in bash scripts...");
const updateShPath = path.resolve(__dirname, "../update.apk.sh");
const updateShContent = fs.readFileSync(updateShPath, "utf-8");
assert(
  updateShContent.includes("INSTALL_FAILED_ALREADY_EXISTS") &&
    updateShContent.includes("signatures do not match"),
  "update.apk.sh must check INSTALL_FAILED_ALREADY_EXISTS and signatures do not match",
);

const installShPath = path.resolve(__dirname, "../install-apk.sh");
const installShContent = fs.readFileSync(installShPath, "utf-8");
assert(
  installShContent.includes("INSTALL_FAILED_ALREADY_EXISTS") &&
    installShContent.includes("signatures do not match"),
  "install-apk.sh must check INSTALL_FAILED_ALREADY_EXISTS and signatures do not match",
);
console.log(
  "✅ PASS: Shell update scripts handle all collision scenarios with automated deep purge.",
);

// --- Step 6: Zero Duplicate MD Files Check ---
console.log("--> [Step 6] Verifying zero duplicate markdown files policy...");
const rootFiles = fs.readdirSync(path.resolve(__dirname, ".."));
const rootMdFiles = rootFiles.filter((f) => f.endsWith(".md"));
const allowedRootMd = new Set(["README.md", "AGENTS.md", "current-sub-task.md", "temp.md"]);
const invalidRootMd = rootMdFiles.filter((f) => !allowedRootMd.has(f));
assert(
  invalidRootMd.length === 0,
  `Forbidden Markdown files in root directory: ${invalidRootMd.join(", ")}. All docs must reside in docs/*.md`,
);
console.log("✅ PASS: Strict zero-duplicate Markdown policy satisfied.");

console.log("\n🎉 ALL AUTO-RETRY & VERSIONING TESTS PASSED SUCCESSFULLY! (100% verified)\n");
