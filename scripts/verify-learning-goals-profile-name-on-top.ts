/**
 * Automated Verification Script: Task 358 (Prompt 125)
 *
 * Verifies that the learning goals profile name is prominently set on top:
 * 1. LanguageRatioCompositionSelector component presents the profile name on top:
 *    - data-testid="profile-name-top-bar"
 *    - data-testid="profile-name-top-label"
 *    - data-testid="active-profile-name-text"
 * 2. Stage 1 Learning Goals card in src/routes/index.tsx presents the active profile name on top:
 *    - data-testid="stage-2-top-profile-container"
 *    - data-testid="stage-2-profile-top-label"
 *    - data-testid="stage-2-active-profile-name"
 *    - Appears directly at the top of #stage-2-learning-goals-card before language ingredient sections
 * 3. 100% Parity in Beginner Mode (BeginnerPreferencesTab.tsx):
 *    - data-testid="beginner-top-profile-container"
 *    - data-testid="beginner-profile-top-label"
 *    - data-testid="beginner-active-profile-name"
 * 4. Component level render testing for LanguageRatioCompositionSelector verifying profile name output
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Mock localStorage for node environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage: Storage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) {
      delete mockStorage[k];
    }
  },
  key: (index: number) => Object.keys(mockStorage)[index] ?? null,
  get length() {
    return Object.keys(mockStorage).length;
  },
};

(globalThis as any).localStorage = mockLocalStorage;
if (typeof window === "undefined") {
  (globalThis as any).window = {
    localStorage: mockLocalStorage,
  };
}

async function runVerification() {
  console.log("==================================================================");
  console.log("🧪 Verifying Task 358: Learning Goals Profile Name Set on Top");
  console.log("==================================================================");

  // 1. Audit LanguageRatioCompositionSelector.tsx source
  console.log("--> [Step 1] Auditing LanguageRatioCompositionSelector.tsx for top profile name...");
  const selectorFile = path.resolve(process.cwd(), "src/components/LanguageRatioCompositionSelector.tsx");
  assert(fs.existsSync(selectorFile), "LanguageRatioCompositionSelector.tsx must exist");
  const selectorContent = fs.readFileSync(selectorFile, "utf-8");

  const requiredSelectorTestIds = [
    'data-testid="profile-name-top-bar"',
    'data-testid="profile-name-top-label"',
    'data-testid="active-profile-name-text"',
  ];

  for (const tid of requiredSelectorTestIds) {
    assert.ok(
      selectorContent.includes(tid),
      `LanguageRatioCompositionSelector must contain test ID: ${tid}`,
    );
  }
  console.log("✅ Step 1: LanguageRatioCompositionSelector declares top profile name bar and labels");

  // 2. Component Render Test of LanguageRatioCompositionSelector
  console.log("--> [Step 2] Testing server-side render of LanguageRatioCompositionSelector...");
  const { LanguageRatioCompositionSelector } = await import(
    "../src/components/LanguageRatioCompositionSelector"
  );

  const sampleCompositions = [
    {
      id: "comp-sample-1",
      name: "Custom Polyglot Goal",
      ratios: { en: 50, es: 50 },
      isBuiltIn: false,
      createdAt: 1000,
    },
  ];

  const renderedHtml = renderToStaticMarkup(
    React.createElement(LanguageRatioCompositionSelector, {
      activeCompositionId: "comp-sample-1",
      onSelectComposition: () => {},
      compositions: sampleCompositions,
    }),
  );

  assert.ok(
    renderedHtml.includes('data-testid="profile-name-top-bar"'),
    "Rendered HTML must contain profile-name-top-bar",
  );
  assert.ok(
    renderedHtml.includes("Custom Polyglot Goal"),
    "Rendered HTML must display active profile name 'Custom Polyglot Goal'",
  );
  assert.ok(
    renderedHtml.includes("Profile:"),
    "Rendered HTML must label profile name on top",
  );
  console.log("✅ Step 2: LanguageRatioCompositionSelector renders profile name on top successfully");

  // 3. Audit src/routes/index.tsx for Stage 1 Learning Goals top placement
  console.log("--> [Step 3] Auditing src/routes/index.tsx for top profile name container in Learning Goals...");
  const indexTsxPath = path.resolve(process.cwd(), "src/routes/index.tsx");
  const indexContent = fs.readFileSync(indexTsxPath, "utf-8");

  assert.ok(
    indexContent.includes('id="stage-2-top-profile-container"') &&
      indexContent.includes('data-testid="stage-2-top-profile-container"'),
    "src/routes/index.tsx must contain #stage-2-top-profile-container",
  );
  assert.ok(
    indexContent.includes('data-testid="stage-2-active-profile-name"'),
    "src/routes/index.tsx must contain data-testid='stage-2-active-profile-name'",
  );
  assert.ok(
    indexContent.includes('data-testid="stage-2-profile-top-label"'),
    "src/routes/index.tsx must contain data-testid='stage-2-profile-top-label'",
  );

  // Verify that the top profile container is positioned BEFORE Default Source Language in Learning Goals card
  const topProfileIndex = indexContent.indexOf('data-testid="stage-2-top-profile-container"');
  const defaultSourceLangIndex = indexContent.indexOf('1. Default Source Language');
  assert.ok(
    topProfileIndex > 0 && topProfileIndex < defaultSourceLangIndex,
    "Top profile container must be positioned on top before 1. Default Source Language",
  );
  console.log("✅ Step 3: src/routes/index.tsx positions profile name prominently on top of Learning Goals card");

  // 4. Audit BeginnerPreferencesTab.tsx for parity
  console.log("--> [Step 4] Auditing BeginnerPreferencesTab.tsx for profile name on top parity...");
  const beginnerTabPath = path.resolve(
    process.cwd(),
    "src/components/beginner/tabs/BeginnerPreferencesTab.tsx",
  );
  const beginnerContent = fs.readFileSync(beginnerTabPath, "utf-8");

  assert.ok(
    beginnerContent.includes('id="beginner-top-profile-container"') &&
      beginnerContent.includes('data-testid="beginner-top-profile-container"'),
    "BeginnerPreferencesTab.tsx must contain #beginner-top-profile-container",
  );
  assert.ok(
    beginnerContent.includes('data-testid="beginner-active-profile-name"'),
    "BeginnerPreferencesTab.tsx must contain data-testid='beginner-active-profile-name'",
  );
  assert.ok(
    beginnerContent.includes('data-testid="beginner-profile-top-label"'),
    "BeginnerPreferencesTab.tsx must contain data-testid='beginner-profile-top-label'",
  );
  console.log("✅ Step 4: Beginner Mode preserves 100% parity with profile name set on top");

  console.log("==================================================================");
  console.log("🎉 ALL CHECKS PASSED: Learning goals profile name set on top (Task 358)!");
  console.log("==================================================================");
}

runVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
