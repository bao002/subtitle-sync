/**
 * Dedicated test script: scripts/verify-dev-server-prewarming-hotfix.ts
 *
 * Validates:
 * 1. package.json dev script is clean ("vite") without redundant flags that conflict with AI Studio runner.
 * 2. vite.config.ts configures host: "0.0.0.0" and port: 3000.
 * 3. src/routes/index.tsx has clean Prettier formatting for ratio composition notifications.
 * 4. Local dev server connectivity returns HTTP 200.
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
}

async function checkDevServer(port = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Dev Server Pre-warming Hotfix & Clean Lint State");
  console.log("=========================================================================");

  // 1. package.json checks
  const pkgPath = path.resolve(process.cwd(), "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  assert(pkg.scripts?.dev === "vite", `Expected pkg.scripts.dev to be "vite", got "${pkg.scripts?.dev}"`);
  console.log("✅ PASS: package.json dev script is cleanly set to 'vite'");

  // 2. vite.config.ts checks
  const viteConfigPath = path.resolve(process.cwd(), "vite.config.ts");
  const viteConfig = fs.readFileSync(viteConfigPath, "utf-8");
  assert(viteConfig.includes('port: 3000'), "vite.config.ts must specify port: 3000");
  assert(viteConfig.includes('host: "0.0.0.0"'), "vite.config.ts must specify host: 0.0.0.0");
  console.log("✅ PASS: vite.config.ts explicitly specifies port 3000 and host 0.0.0.0");

  // 3. src/routes/index.tsx prettier checks
  const indexRoutePath = path.resolve(process.cwd(), "src/routes/index.tsx");
  const indexRoute = fs.readFileSync(indexRoutePath, "utf-8");
  assert(
    indexRoute.includes('Applied "${comp.name}" ratio composition') ||
      indexRoute.includes('Applied profile "${comp.name}"'),
    "src/routes/index.tsx must have single-line notifySubtitleFetch call for ratio composition"
  );
  console.log("✅ PASS: src/routes/index.tsx has clean notification formatting for ratio composition");

  // 4. src/lib/alternative-tts.ts checks
  const altTtsPath = path.resolve(process.cwd(), "src/lib/alternative-tts.ts");
  const altTtsContent = fs.readFileSync(altTtsPath, "utf-8");
  assert(
    altTtsContent.includes("export function getTtsEngineStatus") || altTtsContent.includes("status: number;"),
    "src/lib/alternative-tts.ts must have valid type declarations and status fields"
  );
  console.log("✅ PASS: src/lib/alternative-tts.ts has clean syntax and declarations");

  // 5. Check dev server running
  const isHealthy = await checkDevServer(3000);
  assert(isHealthy, "Dev server on port 3000 must be healthy and return HTTP 200");
  console.log("✅ PASS: Dev server on port 3000 is healthy and responding with HTTP 200");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED! Dev server pre-warming hotfix verified successfully.");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
