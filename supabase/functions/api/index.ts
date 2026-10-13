const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const started = Date.now();

const human = (ms: number) => {
  let s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b, null, 2), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const openapi = (base: string) => ({
  openapi: "3.0.3",
  info: { title: "Subtitle Sync API", version: "1.0.0" },
  servers: [{ url: base }],
  paths: {
    "/proxy": {
      get: {
        summary: "Anonymous GET of a YouTube timedtext URL",
        parameters: [{
          name: "url", in: "query", required: true, schema: { type: "string" },
          description: "Full https://www.youtube.com/api/timedtext?... URL",
        }],
        responses: { "200": { description: "Upstream body (json3)" }, "400": { description: "Bad url" } },
      },
    },
    "/health": { get: { summary: "Health + uptime", responses: { "200": { description: "OK" } } } },
  },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const u = new URL(req.url);
  const route = u.pathname.replace(/^.*\/api/, "") || "/";
  const base = `https://${u.host}/functions/v1/api`;

  if (route === "/health") {
    const up = Date.now() - started;
    return json({ ok: true, uptime: human(up), uptime_ms: up, now: new Date().toISOString() });
  }
  if (route === "/openapi.json") return json(openapi(base));

  if (route === "/proxy") {
    const target = u.searchParams.get("url") || "";
    let t: URL;
    try { t = new URL(target); } catch { return json({ error: "url is required" }, 400); }
    if (t.protocol !== "https:" || !/(^|\.)youtube\.com$/.test(t.hostname) || t.pathname !== "/api/timedtext") {
      return json({ error: "Only https://*.youtube.com/api/timedtext is allowed" }, 400);
    }
    try {
      const r = await fetch(t.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0 Mobile Safari/537.36",
          Accept: "application/json, text/plain, */*",
        },
      });
      const body = await r.text();
      return new Response(body, {
        status: r.status,
        headers: { ...cors, "Content-Type": r.headers.get("content-type") || "text/plain", "X-Upstream-Status": String(r.status) },
      });
    } catch (e) {
      return json({ error: String(e) }, 502);
    }
  }
  return json({ error: "Not found", routes: ["/proxy?url=", "/health", "/openapi.json"] }, 404);
});
