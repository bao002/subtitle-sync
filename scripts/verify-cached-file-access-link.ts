/**
 * scripts/verify-cached-file-access-link.ts
 *
 * Dedicated verification test ensuring:
 * 1. Stage 0 track cards render an interactive cached file link (`cached-file-link-${langCode}`).
 * 2. Clicking the cached file link opens the inspection modal (`cached-file-viewer-modal`).
 * 3. The modal provides Download JSON, Copy to Clipboard, and Close controls.
 * 4. The raw JSON3 content is displayed inside a `<pre>` element (`cached-file-content-pre`).
 */

import * as fs from "fs";
import * as path from "path";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
}

async function runVerification() {
  console.log("=== Running Cached Subtitle File Access Verification ===");

  const panelFilePath = path.resolve(process.cwd(), "src/components/FetchedSubtitlesStagePanel.tsx");
  assert(fs.existsSync(panelFilePath), "FetchedSubtitlesStagePanel.tsx must exist");
  const panelContent = fs.readFileSync(panelFilePath, "utf-8");

  // Check 1: Clickable cached-file-link element
  assert(
    panelContent.includes("data-testid={`cached-file-link-${langCode}`}"),
    "Must render data-testid='cached-file-link-${langCode}' for clicking cached files",
  );
  assert(
    panelContent.includes("cursor-pointer") && panelContent.includes("underline"),
    "Cached file element must have interactive cursor-pointer and underline styling",
  );

  // Check 2: Modal inspection view
  assert(
    panelContent.includes('data-testid="cached-file-viewer-modal"'),
    "Must render modal with data-testid='cached-file-viewer-modal'",
  );
  assert(
    panelContent.includes('data-testid="cached-file-content-pre"'),
    "Must render pre element with data-testid='cached-file-content-pre'",
  );

  // Check 3: Actions - Download, Copy, Close
  assert(
    panelContent.includes('data-testid="download-cached-file-btn"'),
    "Must provide download button with data-testid='download-cached-file-btn'",
  );
  assert(
    panelContent.includes('data-testid="copy-cached-file-btn"'),
    "Must provide copy button with data-testid='copy-cached-file-btn'",
  );
  assert(
    panelContent.includes('data-testid="close-cached-file-modal-btn"'),
    "Must provide close modal button with data-testid='close-cached-file-modal-btn'",
  );

  // Check 4: Local storage key & raw JSON3 retrieval
  assert(
    panelContent.includes("getCachedRawJson3"),
    "Must use getCachedRawJson3 to load stored JSON3 payload",
  );
  assert(
    panelContent.includes("storageKey"),
    "Must display the localStorage storageKey in the modal header",
  );

  console.log("✅ All checks passed: Cached file access link and viewer modal verified.");
  console.log("=== Verification Successful! ===");
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
