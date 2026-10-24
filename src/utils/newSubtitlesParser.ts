import { Cue, Json3, Row, parseCues } from "@/lib/subtitles";

/**
 * New and Easier Subtitles Parser
 * Replaces the old complex multi-criteria parser with an easy, transparent sentence-splitting engine.
 * Specifically enables reliable splitting on the dot '.' character and configurable punctuation marks.
 */

export interface SimpleParserConfig {
  enabled: boolean;
  splitOnDot: boolean;
  splitOnQuestion: boolean;
  splitOnExclamation: boolean;
  splitOnComma: boolean;
  splitIntraCue: boolean;
  customDelimiters: string;
}

export const DEFAULT_SIMPLE_PARSER_CONFIG: SimpleParserConfig = {
  enabled: true,
  splitOnDot: true,
  splitOnQuestion: true,
  splitOnExclamation: true,
  splitOnComma: false,
  splitIntraCue: true,
  customDelimiters: "",
};

/**
 * Builds a regex pattern matching any configured sentence-splitting delimiter.
 */
export function buildSplitRegex(config: SimpleParserConfig): RegExp | null {
  if (!config.enabled) return null;

  const escapedChars: string[] = [];
  if (config.splitOnDot) {
    escapedChars.push("\\.", "。");
  }
  if (config.splitOnQuestion) {
    escapedChars.push("\\?", "؟");
  }
  if (config.splitOnExclamation) {
    escapedChars.push("!");
  }
  if (config.splitOnComma) {
    escapedChars.push(",", "،", "、");
  }

  if (config.customDelimiters && config.customDelimiters.trim().length > 0) {
    for (const ch of config.customDelimiters.trim()) {
      const escaped = ch.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      if (!escapedChars.includes(escaped)) {
        escapedChars.push(escaped);
      }
    }
  }

  if (escapedChars.length === 0) return null;

  // Match delimiter followed by optional closing quotes/brackets and either whitespace or end of string
  return new RegExp(`([${escapedChars.join("")}]+["'»)”]*)(?=\\s+|$)`, "gu");
}

export interface SplitSegment {
  start: number;
  end: number;
  text: string;
}

/**
 * Parses cues from the base language track into sentence-split segments based on config.
 */
export function splitCuesIntoSentences(
  cues: Cue[],
  config: SimpleParserConfig = DEFAULT_SIMPLE_PARSER_CONFIG,
): SplitSegment[] {
  if (!cues || cues.length === 0) return [];
  if (!config.enabled) {
    return cues.map((c) => ({ start: c.start, end: c.end, text: c.text.trim() }));
  }

  const splitRegex = buildSplitRegex(config);
  if (!splitRegex) {
    return cues.map((c) => ({ start: c.start, end: c.end, text: c.text.trim() }));
  }

  const segments: SplitSegment[] = [];

  let curStart = 0;
  let curEnd = 0;
  let curText = "";
  let inProgress = false;

  for (let cIdx = 0; cIdx < cues.length; cIdx++) {
    const cue = cues[cIdx]!;
    const cueText = cue.text.trim();
    if (!cueText) continue;

    const cueStart = cue.start;
    const cueEnd = Math.max(cue.end, cueStart + 50);
    const cueDuration = cueEnd - cueStart;

    if (!config.splitIntraCue) {
      // Split only across cues when cue ends with a delimiter
      if (!inProgress) {
        curStart = cueStart;
        curText = cueText;
        inProgress = true;
      } else {
        curText += " " + cueText;
      }
      curEnd = cueEnd;

      // Check if current accumulated text ends with a delimiter
      splitRegex.lastIndex = 0;
      if (splitRegex.test(curText.trim())) {
        segments.push({
          start: curStart,
          end: curEnd,
          text: curText.trim(),
        });
        inProgress = false;
        curText = "";
      }
      continue;
    }

    // Intra-cue splitting: scan for delimiters inside the cue text
    splitRegex.lastIndex = 0;
    const matches = Array.from(cueText.matchAll(splitRegex));

    if (matches.length === 0) {
      // No delimiter inside this cue: accumulate
      if (!inProgress) {
        curStart = cueStart;
        curText = cueText;
        inProgress = true;
      } else {
        curText += " " + cueText;
      }
      curEnd = cueEnd;
    } else {
      let lastMatchEnd = 0;

      for (let mIdx = 0; mIdx < matches.length; mIdx++) {
        const match = matches[mIdx]!;
        const delimiterEnd = match.index + match[0].length;
        const partText = cueText.slice(lastMatchEnd, delimiterEnd).trim();

        // Interpolate time within the cue
        const charFraction = Math.min(1, Math.max(0, delimiterEnd / cueText.length));
        const splitTime = Math.round(cueStart + charFraction * cueDuration);

        if (partText) {
          if (inProgress) {
            curText += " " + partText;
            curEnd = splitTime;
            segments.push({
              start: curStart,
              end: Math.max(curEnd, curStart + 100),
              text: curText.trim(),
            });
            inProgress = false;
            curText = "";
          } else {
            const charStartFraction = Math.min(1, Math.max(0, lastMatchEnd / cueText.length));
            const partStart = Math.round(cueStart + charStartFraction * cueDuration);
            segments.push({
              start: partStart,
              end: Math.max(splitTime, partStart + 100),
              text: partText,
            });
          }
        }

        lastMatchEnd = delimiterEnd;
      }

      // Any remaining text after the last delimiter in this cue
      const leftover = cueText.slice(lastMatchEnd).trim();
      if (leftover) {
        const charStartFraction = Math.min(1, Math.max(0, lastMatchEnd / cueText.length));
        curStart = Math.round(cueStart + charStartFraction * cueDuration);
        curEnd = cueEnd;
        curText = leftover;
        inProgress = true;
      } else {
        inProgress = false;
        curText = "";
      }
    }
  }

  // Flush any final segment
  if (inProgress && curText.trim()) {
    segments.push({
      start: curStart,
      end: curEnd,
      text: curText.trim(),
    });
  }

  return segments;
}

/**
 * Extracts overlapping text from a target language track for a given time window [start, end].
 */
function getTextInWindow(cues: Cue[], start: number, end: number): string {
  if (!cues || cues.length === 0) return "";
  const overlapping: string[] = [];

  for (const c of cues) {
    // If cue overlaps with [start, end]
    if (c.start < end && c.end > start) {
      overlapping.push(c.text.trim());
    }
  }

  return overlapping.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * New simple align function that parses tracks into parallel language rows.
 */
export function simpleAlign(
  tracks: Record<string, Json3>,
  baseLanguage: string,
  config: SimpleParserConfig = DEFAULT_SIMPLE_PARSER_CONFIG,
): Row[] {
  if (!tracks || Object.keys(tracks).length === 0) return [];

  // Parse all tracks into clean cues
  const parsedTracks: Record<string, Cue[]> = {};
  for (const [code, j3] of Object.entries(tracks)) {
    if (j3) {
      parsedTracks[code] = parseCues(j3);
    }
  }

  // Find base cues
  let baseCues = parsedTracks[baseLanguage] || [];
  if (baseCues.length === 0) {
    const firstKey = Object.keys(parsedTracks).find((k) => (parsedTracks[k]?.length ?? 0) > 0);
    if (firstKey) baseCues = parsedTracks[firstKey]!;
  }

  if (baseCues.length === 0) return [];

  // Split base cues into sentences using simple parser
  const segments = splitCuesIntoSentences(baseCues, config);

  // Formulate rows aligned across all tracks
  const rows: Row[] = segments.map((seg) => {
    const texts: Record<string, string> = {
      [baseLanguage]: seg.text,
    };

    for (const [code, cues] of Object.entries(parsedTracks)) {
      if (code === baseLanguage) continue;
      texts[code] = getTextInWindow(cues, seg.start, seg.end);
    }

    return {
      start: seg.start,
      end: seg.end,
      texts,
      criteria: ["simple-sentence"],
    };
  });

  return rows;
}
