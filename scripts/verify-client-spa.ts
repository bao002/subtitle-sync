import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

console.log("====================================================");
console.log("🧪 Starting Pure Client SPA Architecture Verification");
console.log("====================================================");

const rootDir = process.cwd();

// Test 1: Assert package.json has NO server dependencies
const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const deps = pkgJson.dependencies || {};
const devDeps = pkgJson.devDependencies || {};

assert(!deps["@tanstack/react-start"], "Must NOT contain @tanstack/react-start in dependencies");
assert(!devDeps["nitro"], "Must NOT contain nitro in devDependencies");
assert(
  !devDeps["@lovable.dev/vite-tanstack-config"],
  "Must NOT contain @lovable.dev/vite-tanstack-config in devDependencies",
);
console.log("✅ PASS: Zero server dependencies in package.json");

// Test 2: Assert server entry files are completely removed
assert(!fs.existsSync(path.join(rootDir, "src", "server.ts")), "src/server.ts must not exist");
assert(!fs.existsSync(path.join(rootDir, "src", "start.ts")), "src/start.ts must not exist");
assert(
  !fs.existsSync(path.join(rootDir, "src", "lib", "error-page.ts")),
  "src/lib/error-page.ts must not exist",
);
assert(
  !fs.existsSync(path.join(rootDir, "src", "lib", "error-capture.ts")),
  "src/lib/error-capture.ts must not exist",
);
console.log("✅ PASS: Server entry files (src/server.ts, src/start.ts, etc.) are removed");

// Test 3: Assert root index.html exists and is properly structured
const indexHtmlPath = path.join(rootDir, "index.html");
assert(fs.existsSync(indexHtmlPath), "index.html must exist at repository root");
const indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf8");
assert(indexHtmlContent.includes('id="root"'), "index.html must contain #root mounting container");
assert(
  indexHtmlContent.includes('src="/src/client.tsx"'),
  "index.html must reference /src/client.tsx",
);
console.log("✅ PASS: Root index.html is present and mounts /src/client.tsx onto #root");

// Test 4: Assert client.tsx uses createRoot from react-dom/client
const clientTsxContent = fs.readFileSync(path.join(rootDir, "src", "client.tsx"), "utf8");
assert(clientTsxContent.includes("createRoot"), "src/client.tsx must use createRoot");
assert(!clientTsxContent.includes("hydrateRoot"), "src/client.tsx must not use hydrateRoot");
assert(
  !clientTsxContent.includes("@tanstack/react-start"),
  "src/client.tsx must not import from @tanstack/react-start",
);
console.log("✅ PASS: src/client.tsx is configured for client-side rendering (createRoot)");

// Test 5: Assert dist build exists and is valid
const distIndexPath = path.join(rootDir, "dist", "index.html");
if (!fs.existsSync(distIndexPath)) {
  const { execSync } = await import("node:child_process");
  execSync("npm run build", { cwd: rootDir, stdio: "pipe" });
}
assert(fs.existsSync(distIndexPath), "dist/index.html must exist from build");
const distHtml = fs.readFileSync(distIndexPath, "utf8");
assert(distHtml.includes('id="root"'), "dist/index.html must contain #root");
console.log("✅ PASS: dist/index.html built cleanly as pure client SPA");

console.log("====================================================");
console.log("📊 PURE CLIENT SPA VERIFICATION: All tests passed!");
console.log("====================================================");
