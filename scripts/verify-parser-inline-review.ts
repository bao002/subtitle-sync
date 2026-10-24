import assert from "node:assert";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ParserDiffConfirmationModal } from "../src/components/ParserDiffConfirmationModal.tsx";

const diffResult = {
  totalBefore: 2,
  totalAfter: 3,
  totalChanges: 1,
  hasChanges: true,
  changedRecords: [
    {
      id: "split-1",
      changeType: "split",
      description: "A sentence breaks at a pause encoded by the timing-based parser.",
      timeRange: { start: 0, end: 5000, formatted: "0.0s–5.0s" },
      beforeRecords: [{ index: 0, text: "Hello world", formattedTime: "0.0s–5.0s" }],
      afterRecords: [
        { index: 0, text: "Hello", formattedTime: "0.0s–2.0s" },
        { index: 1, text: "world", formattedTime: "2.0s–5.0s" },
      ],
    },
  ],
};

const html = renderToStaticMarkup(
  React.createElement(ParserDiffConfirmationModal, {
    isOpen: true,
    inline: true,
    onClose: () => {},
    onConfirm: () => {},
    diffResult: diffResult as any,
    proposedCriteriaNames: ["Sentence","Pause"],
  }),
);

assert(html.includes('data-testid="parser-diff-inline-review-container"'), "inline review must render inside the section container");
assert(!html.includes("fixed inset-0 z-50"), "inline parser review must not render with a popup overlay");
assert(html.includes("Apply review"), "inline review should keep a compact action label");

console.log("✅ PASS: Parser inline review renders without popup overlay for Android-friendly comparison.");
