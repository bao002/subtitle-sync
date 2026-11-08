import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import assert from "node:assert/strict";
import {
  FloatingSubtitleRetryIndicator,
} from "../src/components/FloatingSubtitleRetryIndicator";
import {
  getUseFetchServer,
  setUseFetchServer,
  getFetchStrategyConfig,
  setFetchStrategyConfig,
  buildActiveAttemptOrder,
  DEFAULT_ATTEMPT_ORDER,
} from "../src/lib/subtitle-fetch-plan";

// Set up mock window and localStorage for node environment
const storageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (k: string) => storageMock[k] || null,
  setItem: (k: string, v: string) => {
    storageMock[k] = String(v);
  },
  removeItem: (k: string) => {
    delete storageMock[k];
  },
  clear: () => {
    for (const key of Object.keys(storageMock)) {
      delete storageMock[key];
    }
  },
};

(globalThis as any).window = {
  localStorage: mockLocalStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
};
(globalThis as any).localStorage = mockLocalStorage;

async function runTests() {
  console.log("=== Testing Auto-Fetching Subtitles Server/Client and Session/No-Session Debug Display ===");

  // Reset local storage
  mockLocalStorage.clear();

  // Test 1: When debugMode is FALSE, debug panel should NOT render
  {
    console.log("Test 1: Debug panel hidden when debugMode is false");
    const html = renderToStaticMarkup(
      React.createElement(FloatingSubtitleRetryIndicator, {
        targetLanguages: ["es", "fr"],
        tracks: {},
        onFetchLanguage: async () => {},
        isFetching: false,
        debugMode: false,
      })
    );

    assert.ok(html.includes('data-testid="floating-subtitle-retry-indicator"'), "Indicator should render");
    assert.strictEqual(
      html.includes('data-testid="auto-fetch-debug-panel"'),
      false,
      "Debug panel must NOT render when debugMode=false"
    );
    console.log("✅ PASS: Debug panel hidden when debugMode=false");
  }

  // Test 2: When debugMode is TRUE, debug panel, route badge, and session badge MUST render
  {
    console.log("Test 2: Debug panel rendered when debugMode is true with Client Direct and Session & Anon");
    setUseFetchServer(false);
    setFetchStrategyConfig({
      mode: "random",
      allowSession: true,
      allowAnon: true,
    });

    const html = renderToStaticMarkup(
      React.createElement(FloatingSubtitleRetryIndicator, {
        targetLanguages: ["es"],
        tracks: {},
        onFetchLanguage: async () => {},
        isFetching: false,
        debugMode: true,
        defaultMinimized: false,
      })
    );

    assert.ok(
      html.includes('data-testid="auto-fetch-debug-panel"'),
      "Debug panel must render when debugMode=true"
    );
    assert.ok(
      html.includes('data-testid="debug-fetch-route-badge"'),
      "debug-fetch-route-badge must be present"
    );
    assert.ok(
      html.includes("Client (Direct)"),
      "Should indicate Client (Direct) when useServer is false"
    );
    assert.ok(
      html.includes('data-testid="debug-fetch-session-badge"'),
      "debug-fetch-session-badge must be present"
    );
    assert.ok(
      html.includes("Session &amp; Anon") || html.includes("Session & Anon"),
      "Should indicate Session & Anon when both are enabled"
    );
    assert.ok(
      html.includes('data-testid="debug-fetch-next-attempt-badge"'),
      "debug-fetch-next-attempt-badge must be present"
    );
    assert.ok(
      html.includes('data-testid="debug-toggle-server-btn"'),
      "debug-toggle-server-btn must be present"
    );
    assert.ok(
      html.includes('data-testid="debug-toggle-session-btn"'),
      "debug-toggle-session-btn must be present"
    );
    assert.ok(
      html.includes('data-testid="debug-toggle-anon-btn"'),
      "debug-toggle-anon-btn must be present"
    );
    assert.ok(
      html.includes('data-testid="debug-toggle-strategy-btn"'),
      "debug-toggle-strategy-btn must be present"
    );
    console.log("✅ PASS: Debug panel displays Server/Client origin, Session/Anon status, and debug toggle buttons");
  }

  // Test 3: When useServer is true and allowAnon is false (Session Only)
  {
    console.log("Test 3: Debug panel rendered when useServer=true and allowAnon=false (Session Only)");
    setUseFetchServer(true);
    setFetchStrategyConfig({
      mode: "ordered",
      allowSession: true,
      allowAnon: false,
    });

    const html = renderToStaticMarkup(
      React.createElement(FloatingSubtitleRetryIndicator, {
        targetLanguages: ["he"],
        tracks: {},
        onFetchLanguage: async () => {},
        isFetching: false,
        debugMode: true,
        defaultMinimized: false,
      })
    );

    assert.ok(
      html.includes("Server Proxy"),
      "Should indicate Server Proxy when useServer is true"
    );
    assert.ok(
      html.includes("Session Only"),
      "Should indicate Session Only when allowAnon is false"
    );
    assert.ok(
      html.includes("ordered"),
      "Should indicate ordered mode in strategy badge"
    );
    console.log("✅ PASS: Correctly reflects Server Proxy and Session Only");
  }

  // Test 4: Strategy config and attempt ordering logic verification
  {
    console.log("Test 4: subtitle-fetch-plan active attempt filtering");
    const active = buildActiveAttemptOrder(DEFAULT_ATTEMPT_ORDER, {
      mode: "ordered",
      allowSession: false,
      allowAnon: true,
      allowTlang: true,
      allowLang: true,
      windowSeconds: 5,
    });
    // With allowSession: false, all attempts must have send === 'anon'
    assert.ok(active.every((a) => a.send === "anon"), "All active attempts must be anon when session is disabled");
    assert.strictEqual(active.length, 2, "Expected 2 anon attempts (tlang/anon, lang/anon)");
    console.log("✅ PASS: Attempt filtering correctly respects session/no-session toggles");
  }

  console.log("=== All Auto-Fetching Subtitles Debug tests passed successfully! ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
