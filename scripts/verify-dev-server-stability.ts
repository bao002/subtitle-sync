import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import http from "node:http";

console.log("====================================================");
console.log("🧪 Starting Dev Server Stability & Health Verification");
console.log("====================================================");

const rootDir = process.cwd();

// 1. Verify vite.config.ts configuration contracts
console.log("1. Verifying vite.config.ts configuration contracts...");
const viteConfigPath = path.resolve(rootDir, "vite.config.ts");
assert(fs.existsSync(viteConfigPath), "vite.config.ts must exist");
const viteConfigContent = fs.readFileSync(viteConfigPath, "utf8");

assert(viteConfigContent.includes("port: 3000"), "vite.config.ts must configure port: 3000");
assert(
  viteConfigContent.includes("strictPort: true"),
  "vite.config.ts must configure strictPort: true to prevent port drifting",
);
assert(
  viteConfigContent.includes('host: "0.0.0.0"'),
  'vite.config.ts must configure host: "0.0.0.0"',
);
console.log("✅ PASS: vite.config.ts specifies host: 0.0.0.0, port: 3000, and strictPort: true");

// 2. Verify package.json scripts
console.log("2. Verifying package.json dev script contract...");
const pkgPath = path.resolve(rootDir, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
assert(
  pkg.scripts.dev && pkg.scripts.dev.includes("--port 3000"),
  "package.json dev script must bind to port 3000",
);
console.log("✅ PASS: package.json dev script explicitly targets port 3000");

// 3. Helper to probe local dev server endpoints
function probeEndpoint(pathname: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        host: "127.0.0.1",
        port: 3000,
        path: pathname,
        timeout: 5000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode || 0, body: data });
        });
      },
    );

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout probing ${pathname}`));
    });
  });
}

async function verifyDevServerLive() {
  console.log("3. Probing live dev server on http://localhost:3000/...");
  try {
    const rootRes = await probeEndpoint("/");
    assert.strictEqual(
      rootRes.statusCode,
      200,
      `Expected HTTP 200 from root endpoint, got ${rootRes.statusCode}`,
    );
    assert(
      rootRes.body.includes("Parallel Subtitles") || rootRes.body.includes("root"),
      "Root endpoint HTML must contain title or root element",
    );
    console.log("✅ PASS: Dev server responds with HTTP 200 on /");

    console.log("4. Probing /src/main.tsx Vite module compilation...");
    const mainRes = await probeEndpoint("/src/main.tsx");
    assert.strictEqual(
      mainRes.statusCode,
      200,
      `Expected HTTP 200 from /src/main.tsx, got ${mainRes.statusCode}`,
    );
    console.log("✅ PASS: /src/main.tsx transforms and serves cleanly");

    console.log("5. Probing /src/routes/index.tsx Vite module compilation...");
    const indexRes = await probeEndpoint("/src/routes/index.tsx");
    assert.strictEqual(
      indexRes.statusCode,
      200,
      `Expected HTTP 200 from /src/routes/index.tsx, got ${indexRes.statusCode}`,
    );
    console.log("✅ PASS: /src/routes/index.tsx transforms and serves cleanly");

    console.log("====================================================");
    console.log("🎉 All Dev Server Stability & Health Tests PASSED Successfully!");
    console.log("====================================================");
  } catch (err: any) {
    console.error("❌ FAILED: Dev server probe failed:", err.message);
    process.exit(1);
  }
}

verifyDevServerLive();
