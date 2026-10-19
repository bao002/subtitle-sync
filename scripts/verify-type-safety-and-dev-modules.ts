import { execSync } from "child_process";
import http from "http";

console.log("=== Verifying Hotfix: Type Safety & Dev Server Modules ===");

// 1. Verify TypeScript type checking passes cleanly
console.log("1. Running npx tsc --noEmit...");
try {
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  console.log("[PASS] npx tsc --noEmit passed with 0 errors!");
} catch (err) {
  console.error("[FAIL] npx tsc --noEmit encountered errors:", err);
  process.exit(1);
}

// 2. Verify all files mentioned in the Vite reload issue respond with HTTP 200 from dev server
const filesToCheck = [
  "/src/components/beginner/tabs/BeginnerPlayerTab.tsx",
  "/src/styles.css",
  "/src/routes/index.tsx",
  "/src/components/ApkReleaseModal.tsx",
  "/src/components/LanguageBoxesSelector.tsx",
  "/src/components/NetworkRequestsInspector.tsx",
  "/src/components/AiSubtitlePunctuationTab.tsx",
  "/src/components/beginner/BeginnerFlowContainer.tsx",
  "/src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
  "/src/components/VideoLibraryPanel.tsx",
];

console.log("2. Verifying dev server module loading on port 3000...");

function checkEndpoint(path: string): Promise<number> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      resolve(res.statusCode || 0);
    });
    req.on("error", () => resolve(0));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(0);
    });
  });
}

async function verifyDevServer() {
  let allPassed = true;
  for (const f of filesToCheck) {
    const status = await checkEndpoint(f);
    if (status === 200) {
      console.log(`[PASS] ${f} -> HTTP 200`);
    } else {
      console.error(`[FAIL] ${f} -> HTTP ${status}`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.error("[FAIL] One or more dev server endpoints failed to respond with HTTP 200.");
    process.exit(1);
  }

  console.log("=== ALL HOTFIX VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

verifyDevServer();
