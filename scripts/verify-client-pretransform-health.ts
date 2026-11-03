import fs from "node:fs";
import path from "node:path";
import http from "node:http";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
}

function probeUrl(urlPath: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({ status: res.statusCode || 0, text: data });
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Timeout probing dev server"));
    });
  });
}

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Client Pre-transform Health & Vite Parsing (Hotfix)");
  console.log("=========================================================================");

  // 1. Verify index.tsx syntax and export integrity
  const indexRoutePath = path.resolve(process.cwd(), "src/routes/index.tsx");
  assert(fs.existsSync(indexRoutePath), "src/routes/index.tsx must exist");
  const indexRoute = fs.readFileSync(indexRoutePath, "utf-8");
  assert(!indexRoute.includes("<<<<<<<"), "No git merge conflict markers");
  assert(indexRoute.includes("export const Route = createFileRoute"), "Route export must be present");
  console.log("✅ PASS: src/routes/index.tsx passes basic syntactic integrity checks");

  // 2. Verify alternative-tts.ts syntax and exports
  const ttsLibPath = path.resolve(process.cwd(), "src/lib/alternative-tts.ts");
  assert(fs.existsSync(ttsLibPath), "src/lib/alternative-tts.ts must exist");
  const ttsLib = fs.readFileSync(ttsLibPath, "utf-8");
  assert(ttsLib.includes("export function getLovableTtsProvider"), "getLovableTtsProvider export must be present");
  console.log("✅ PASS: src/lib/alternative-tts.ts passes syntactic integrity checks");

  // 3. Probe Vite dev server for client.tsx pre-transform
  const clientRes = await probeUrl("/src/client.tsx");
  assert(clientRes.status === 200, `Dev server /src/client.tsx should return 200, got ${clientRes.status}`);
  assert(!clientRes.text.includes("[PARSE_ERROR]"), "/src/client.tsx must not contain PARSE_ERROR");
  assert(clientRes.text.includes("setupEarlyCaptionInterceptor"), "/src/client.tsx transformed correctly");
  console.log("✅ PASS: Dev server transforms /src/client.tsx with HTTP 200 and no parse errors");

  // 4. Probe Vite dev server for routes/index.tsx pre-transform
  const routesRes = await probeUrl("/src/routes/index.tsx");
  assert(routesRes.status === 200, `Dev server /src/routes/index.tsx should return 200, got ${routesRes.status}`);
  assert(!routesRes.text.includes("[PARSE_ERROR]"), "/src/routes/index.tsx must not contain PARSE_ERROR");
  console.log("✅ PASS: Dev server transforms /src/routes/index.tsx with HTTP 200 and no parse errors");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Client pre-transform and syntax errors resolved!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Unexpected test error:", err);
  process.exit(1);
});
