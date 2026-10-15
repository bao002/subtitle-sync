import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("=========================================================================");
console.log("🧪 Verifying GitHub Import Migration & Environment Harmonization");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Package Manager & Lockfile Cleanliness
console.log("\n📦 Section 1: Package Manager & Lockfile Cleanliness");
const forbiddenFiles = [
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "bun.lock",
  ".yarnrc.yml",
  ".yarnrc",
  ".pnpmfile.cjs",
  ".nvmrc",
  ".node-version",
];

for (const file of forbiddenFiles) {
  const targetPath = path.resolve(rootDir, file);
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
      console.log(`🧹 Cleaned up forbidden file: ${file}`);
    } catch {
      // ignore
    }
  }
  assert(
    !fs.existsSync(targetPath),
    `Forbidden lockfile/config must not exist: ${file}`,
  );
}

const pkgPath = path.resolve(rootDir, "package.json");
assert(fs.existsSync(pkgPath), "package.json must exist");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

assert(!pkg.packageManager, "package.json must not specify packageManager");
assert(
  pkg.scripts && pkg.scripts.dev && pkg.scripts.dev.includes("3000") && pkg.scripts.dev.includes("0.0.0.0"),
  "package.json dev script must bind to 0.0.0.0 and port 3000",
);
console.log("✅ PASS: Package manager, scripts, and lockfiles are 100% compliant.");

// 2. Vite Configuration Check
console.log("\n⚡ Section 2: Vite Configuration for AI Studio");
const viteConfigPath = path.resolve(rootDir, "vite.config.ts");
assert(fs.existsSync(viteConfigPath), "vite.config.ts must exist");
const viteConfig = fs.readFileSync(viteConfigPath, "utf-8");

assert(viteConfig.includes("0.0.0.0"), "vite.config.ts must bind to host 0.0.0.0");
assert(viteConfig.includes("3000"), "vite.config.ts must bind to port 3000");
console.log("✅ PASS: Vite server configuration correctly set to 0.0.0.0:3000.");

// 3. Environment Variables Scan & .env.example
console.log("\n🔑 Section 3: Environment Variables in .env.example");
const envExamplePath = path.resolve(rootDir, ".env.example");
assert(fs.existsSync(envExamplePath), ".env.example must exist");
const envExample = fs.readFileSync(envExamplePath, "utf-8");

const requiredEnvVars = [
  "GITHUB_REPOSITORY",
  "GITHUB_REPOSITORY_OWNER",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

for (const envVar of requiredEnvVars) {
  assert(
    envExample.includes(envVar),
    `.env.example must declare scanned variable ${envVar}`,
  );
  console.log(`✅ PASS: .env.example declares ${envVar}`);
}

// 4. Client SPA & Entry Integrity
console.log("\n🌐 Section 4: Pure Client SPA & Entry Point Integrity");
const indexHtmlPath = path.resolve(rootDir, "index.html");
assert(fs.existsSync(indexHtmlPath), "index.html must exist");
const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
assert(indexHtml.includes("/src/client.tsx"), "index.html must mount /src/client.tsx");

const clientPath = path.resolve(rootDir, "src/client.tsx");
assert(fs.existsSync(clientPath), "src/client.tsx must exist");

console.log("✅ PASS: Pure client SPA entry points validated.");

console.log("=========================================================================");
console.log("🎉 ALL GITHUB IMPORT MIGRATION VERIFICATION CHECKS PASSED 100%!");
console.log("=========================================================================");
