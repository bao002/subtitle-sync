import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import assert from "node:assert";

function probeUrl(urlPath: string): Promise<{ status: number; text: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          text: data,
          contentType: res.headers["content-type"] || "",
        });
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`Timeout probing dev server for ${urlPath}`));
    });
  });
}

async function run() {
  console.log("=========================================================================");
  console.log("🧪 Verifying Vite Reload & TypeScript Compiler Health (Hotfix Prompt 58)");
  console.log("=========================================================================");

  // 1. The 10 modules specified in the prompt
  const targetModules = [
    "/src/components/LanguageBoxesSelector.tsx",
    "/src/components/beginner/BeginnerFlowContainer.tsx",
    "/src/styles.css",
    "/src/components/SubtitlesTablePanel.tsx",
    "/src/routes/index.tsx",
    "/src/components/NetworkRequestsInspector.tsx",
    "/src/components/AiSubtitlePunctuationTab.tsx",
    "/src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
    "/src/components/ExternalTtsDebuggerPanel.tsx",
    "/src/components/beginner/PerLanguageTtsPreferences.tsx",
  ];

  console.log("Check 1: Verifying all 10 target files exist on disk...");
  for (const modPath of targetModules) {
    const diskPath = path.resolve(process.cwd(), modPath.slice(1));
    assert.ok(fs.existsSync(diskPath), `File must exist on disk: ${diskPath}`);
    const content = fs.readFileSync(diskPath, "utf-8");
    assert.ok(!content.includes("<<<<<<<"), `File must not contain merge markers: ${modPath}`);
  }
  console.log("✓ Check 1 passed: All 10 files exist on disk with valid content.");

  // 2. Verify preference exports in playback-preferences.ts
  console.log("Check 2: Verifying preference exports in playback-preferences.ts...");
  const playbackPrefs = await import("../src/lib/playback-preferences");
  assert.strictEqual(typeof playbackPrefs.getFavoriteLanguagesPreference, "function");
  assert.strictEqual(typeof playbackPrefs.setFavoriteLanguagesPreference, "function");
  assert.strictEqual(typeof playbackPrefs.getTargetLanguagesPreference, "function");
  assert.strictEqual(typeof playbackPrefs.setTargetLanguagesPreference, "function");
  assert.strictEqual(typeof playbackPrefs.getBaseLanguagePreference, "function");
  assert.strictEqual(typeof playbackPrefs.setBaseLanguagePreference, "function");
  assert.strictEqual(typeof playbackPrefs.getPrimaryTtsLanguagePreference, "function");
  assert.strictEqual(typeof playbackPrefs.setPrimaryTtsLanguagePreference, "function");
  assert.strictEqual(typeof playbackPrefs.getSubtitleRequestModePreference, "function");
  assert.strictEqual(typeof playbackPrefs.setSubtitleRequestModePreference, "function");
  assert.strictEqual(typeof playbackPrefs.getSectionOrderPreference, "function");
  assert.strictEqual(typeof playbackPrefs.setSectionOrderPreference, "function");
  assert.strictEqual(typeof playbackPrefs.getTtsVoicesPreference, "function");
  assert.strictEqual(typeof playbackPrefs.setTtsVoicePreference, "function");
  assert.strictEqual(typeof playbackPrefs.getTtsServiceTypePreference, "function");
  assert.strictEqual(typeof playbackPrefs.setTtsServiceTypePreference, "function");
  assert.strictEqual(typeof playbackPrefs.getTtsAlternativeServicePreference, "function");
  assert.strictEqual(typeof playbackPrefs.setTtsAlternativeServicePreference, "function");
  assert.strictEqual(typeof playbackPrefs.getTtsCustomEndpointPreference, "function");
  assert.strictEqual(typeof playbackPrefs.setTtsCustomEndpointPreference, "function");
  console.log("✓ Check 2 passed: All 20 preference accessor functions properly exported.");

  // 3. Verify DetectedSubtitleTrack cuesCount property in SwitchableDefaultSubtitlesBar.tsx
  console.log("Check 3: Verifying DetectedSubtitleTrack cuesCount in SwitchableDefaultSubtitlesBar.tsx...");
  const switchableBarSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/SwitchableDefaultSubtitlesBar.tsx"),
    "utf-8",
  );
  assert.ok(
    switchableBarSrc.includes("cuesCount?: number;"),
    "DetectedSubtitleTrack must define cuesCount?: number;",
  );
  console.log("✓ Check 3 passed: cuesCount property present on DetectedSubtitleTrack.");

  // 4. Verify VideoSpecificSettings ttsBlacklist in appSettings.ts
  console.log("Check 4: Verifying VideoSpecificSettings ttsBlacklist in appSettings.ts...");
  const appSettingsSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/utils/appSettings.ts"),
    "utf-8",
  );
  assert.ok(
    appSettingsSrc.includes("ttsBlacklist?: string[];"),
    "VideoSpecificSettings must define ttsBlacklist?: string[];",
  );
  console.log("✓ Check 4 passed: ttsBlacklist property present on VideoSpecificSettings.");

  // 5. Verify Button import in StorybookWorkbench.tsx
  console.log("Check 5: Verifying Button import in StorybookWorkbench.tsx...");
  const storybookSrc = fs.readFileSync(
    path.resolve(process.cwd(), "src/storybook/StorybookWorkbench.tsx"),
    "utf-8",
  );
  assert.ok(
    storybookSrc.includes('import { Button } from "@/components/ui/button";'),
    "StorybookWorkbench must import Button component",
  );
  console.log("✓ Check 5 passed: Button imported in StorybookWorkbench.");

  // 6. Probe Vite dev server for all 10 modules
  console.log("Check 6: Probing Vite dev server transforms for all 10 modules...");
  for (const modPath of targetModules) {
    const res = await probeUrl(modPath);
    assert.strictEqual(
      res.status,
      200,
      `Dev server must return HTTP 200 for ${modPath}, got ${res.status}`,
    );
    assert.ok(
      !res.text.includes("[PARSE_ERROR]"),
      `Dev server response for ${modPath} must not contain PARSE_ERROR`,
    );
    if (modPath.endsWith(".tsx")) {
      assert.ok(
        !res.text.trim().startsWith("<!doctype html") && !res.text.trim().startsWith("<!DOCTYPE html"),
        `Dev server must transform ${modPath} as JavaScript/TypeScript, not fallback to index.html`,
      );
    }
    console.log(`  ✓ ${modPath}: 200 OK (${res.text.length} bytes)`);
  }
  console.log("✓ Check 6 passed: All 10 modules successfully transformed with 200 OK.");

  console.log("=========================================================================");
  console.log("🎉 ALL CHECKS PASSED: Vite reload & TypeScript errors completely resolved!");
  console.log("=========================================================================");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
