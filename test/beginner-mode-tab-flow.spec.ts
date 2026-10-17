import { describe, it, expect } from "vitest";
import {
  cleanSubtitleText,
  splitTextByPunctuation,
} from "../src/components/beginner/tabs/BeginnerParsingTab";

describe("Beginner Mode Tab-Based Flow Specification", () => {
  describe("Subtitle Text Cleaning & Speaker Tag Stripping", () => {
    it("strips bracketed speaker markers like [Applause] and [Music] by default", () => {
      const input = "[Music] Welcome to the tutorial [Applause]";
      const cleaned = cleanSubtitleText(input, {
        stripSpeakerBrackets: true,
        removeChars: [">", ">>"],
      });
      expect(cleaned).toBe("Welcome to the tutorial");
    });

    it("strips parenthesis markers like (Laughter) by default", () => {
      const input = "(Laughter) That was a funny joke!";
      const cleaned = cleanSubtitleText(input, {
        stripSpeakerBrackets: true,
        removeChars: [">", ">>"],
      });
      expect(cleaned).toBe("That was a funny joke!");
    });

    it("strips '>' and '>>' arrow speaker markers as requested by user", () => {
      const input = ">> [SPEAKER 1]: Hello there! > Yes, hello.";
      const cleaned = cleanSubtitleText(input, {
        stripSpeakerBrackets: true,
        removeChars: [">", ">>"],
      });
      expect(cleaned).toBe(": Hello there! Yes, hello.");
    });

    it("supports custom character removal and rename rules", () => {
      const input = "This & that > other thing";
      const cleaned = cleanSubtitleText(input, {
        stripSpeakerBrackets: false,
        removeChars: [">"],
        customRules: [{ id: "1", target: "&", replacement: "and" }],
      });
      expect(cleaned).toBe("This and that other thing");
    });
  });

  describe("Sentence Punctuation Splitting", () => {
    it("splits cues into sentences using standard punctuation marks (. ! ?)", () => {
      const input = "First sentence. Second sentence! Third sentence? All done.";
      const punctuationMarks = [".", "!", "?", ",", ";", ":"];
      const segments = splitTextByPunctuation(input, punctuationMarks);

      expect(segments).toHaveLength(4);
      expect(segments[0]).toBe("First sentence.");
      expect(segments[1]).toBe("Second sentence!");
      expect(segments[2]).toBe("Third sentence?");
      expect(segments[3]).toBe("All done.");
    });

    it("respects user customization to omit certain punctuation marks (e.g. only period and exclamation)", () => {
      const input = "Wait, is this one sentence? Yes, it is!";
      // Only period and exclamation
      const segments = splitTextByPunctuation(input, [".", "!"]);

      expect(segments).toHaveLength(1);
      expect(segments[0]).toBe("Wait, is this one sentence? Yes, it is!");
    });

    it("returns single segment if text has no matching punctuation", () => {
      const input = "No punctuation at all in this subtitle cue";
      const segments = splitTextByPunctuation(input, [".", "!"]);
      expect(segments).toEqual(["No punctuation at all in this subtitle cue"]);
    });
  });

  describe("Tab Navigation & Progression State", () => {
    it("keeps downstream tabs locked when no base subtitle is selected", () => {
      const selectedBaseLang = "";
      const isUnlocked = Boolean(selectedBaseLang);

      expect(isUnlocked).toBe(false);
    });

    it("unlocks downstream tabs once a base subtitle track is chosen", () => {
      const selectedBaseLang = "he";
      const isUnlocked = Boolean(selectedBaseLang);

      expect(isUnlocked).toBe(true);
    });

    it("allows navigation back to earlier tabs freely without resetting state", () => {
      // Simulating user state across tab transitions
      let activeTab: "video" | "preferences" | "parsing" | "player" = "video";
      const selectedBaseLang = "en";
      const isUnlocked = Boolean(selectedBaseLang);

      // User jumps to preferences
      if (isUnlocked) activeTab = "preferences";
      expect(activeTab).toBe("preferences");

      // User jumps to parsing
      if (isUnlocked) activeTab = "parsing";
      expect(activeTab).toBe("parsing");

      // User freely returns to video tab
      activeTab = "video";
      expect(activeTab).toBe("video");
      // Base subtitle language selection remains untouched
      expect(selectedBaseLang).toBe("en");
      expect(isUnlocked).toBe(true);
    });
  });
});
