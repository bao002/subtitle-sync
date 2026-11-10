import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("=========================================================================");
console.log("🧪 Verifying GitHub Pages Deployment Freshness & Cache-Control (Task 371)");
console.log("=========================================================================");

const rootDir = process.cwd();

// 1. Verify index.html contains HTTP cache-busting headers to prevent stale browser caches
const indexPath = path.join(rootDir, "index.html");
assert(fs.existsSync(indexPath), "index.html must exist");
const indexContent = fs.readFileSync(indexPath, "utf8");

assert(
  indexContent.includes('http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"'),
  "index.html must include Cache-Control no-cache, no-store, must-revalidate meta tag",
);
assert(
  indexContent.includes('http-equiv="Pragma" content="no-cache"'),
  "index.html must include Pragma no-cache meta tag",
);
assert(
  indexContent.includes('http-equiv="Expires" content="0"'),
  "index.html must include Expires 0 meta tag",
);
console.log("✅ PASS: index.html enforces anti-caching headers for GitHub Pages freshness.");

// 2. Verify deploy-demo.yml touches .nojekyll and properly builds & stages dist
const deployWorkflowPath = path.join(rootDir, ".github/workflows/deploy-demo.yml");
assert(fs.existsSync(deployWorkflowPath), "deploy-demo.yml must exist");
const deployContent = fs.readFileSync(deployWorkflowPath, "utf8");

assert(
  deployContent.includes("touch dist/.nojekyll"),
  "deploy-demo.yml must ensure .nojekyll is touched so GitHub Pages serves assets directly",
);
assert(
  deployContent.includes("publish_dir: ./dist"),
  "deploy-demo.yml must publish ./dist directory",
);
assert(
  deployContent.includes("keep_files: true"),
  "deploy-demo.yml must keep existing test/screencast artifacts on gh-pages",
);
console.log("✅ PASS: deploy-demo.yml properly configured for GitHub Pages deployment.");

// 3. Verify normalize-web-assets.mjs generates version.json with build metadata
const normalizeScriptPath = path.join(rootDir, "scripts/normalize-web-assets.mjs");
assert(fs.existsSync(normalizeScriptPath), "normalize-web-assets.mjs must exist");
const normalizeContent = fs.readFileSync(normalizeScriptPath, "utf8");

assert(
  normalizeContent.includes("version.json"),
  "normalize-web-assets.mjs must generate version.json in output directory",
);
console.log("✅ PASS: normalize-web-assets.mjs generates version.json for freshness checks.");

// 4. Verify package.json contains test script
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
assert(
  packageJson.scripts["test:gh-pages-freshness"],
  "package.json must contain test:gh-pages-freshness script",
);
console.log("✅ PASS: package.json registers test:gh-pages-freshness.");

console.log("=========================================================================");
console.log("🎉 ALL GITHUB PAGES DEPLOYMENT FRESHNESS CHECKS PASSED 100%!");
console.log("=========================================================================");
