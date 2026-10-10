import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const assetsDir = path.join(rootDir, "android-shell", "app", "src", "main", "assets");

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  throw new Error("Production web build is missing dist/index.html; run npm run build first.");
}

fs.rmSync(assetsDir, { recursive: true, force: true });
fs.mkdirSync(assetsDir, { recursive: true });
fs.cpSync(distDir, assetsDir, { recursive: true });

if (!fs.existsSync(path.join(assetsDir, "index.html"))) {
  throw new Error("Android asset synchronization did not produce assets/index.html.");
}

console.log(`Synchronized current production web assets to ${path.relative(rootDir, assetsDir)}.`);
