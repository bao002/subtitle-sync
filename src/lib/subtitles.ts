// json3 subtitle parsing + parallel sentence alignment strategies.

export type Json3 = {
  events?: {
    tStartMs?: number;
    dDurationMs?: number;
    segs?: { utf8?: string; tOffsetMs?: number }[];
  }[];
  length?: number;
};

export type Cue = { start: number; end: number; text: string };
/** A timed piece of text (word when offsets exist, otherwise a whole cue). */
type Token = { t: number; text: string };

export type Row = { start: number; end: number; texts: Record<string, string> };

export function subtitleTextForColumn(row: Row, languageCode: string): string {
  return Object.prototype.hasOwnProperty.call(row.texts, languageCode)
    ? (row.texts[languageCode] ?? "")
    : "";
}

export const LANGS: { code: string; name: string; tts: string }[] = [
  { code: "en", name: "English", tts: "en-US" },
  { code: "he", name: "Hebrew", tts: "he-IL" },
  { code: "ar", name: "Arabic", tts: "ar-SA" },
  { code: "it", name: "Italian", tts: "it-IT" },
  { code: "es", name: "Spanish", tts: "es-ES" },
  { code: "ru", name: "Russian", tts: "ru-RU" },
];

export const RTL = new Set(["he", "ar"]);

export function parseCues(j: Json3): Cue[] {
  const out: Cue[] = [];
  for (const e of j.events ?? []) {
    if (!e.segs) continue;
    const text = e.segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    const start = e.tStartMs ?? 0;
    out.push({ start, end: start + (e.dDurationMs ?? 0), text });
  }
  // Clip overlaps (ASR tracks overlap the next cue).
  for (let i = 0; i < out.length - 1; i++) out[i]!.end = Math.min(out[i]!.end, out[i + 1]!.start);
  return out;
}

function tokens(j: Json3): Token[] {
  const out: Token[] = [];
  for (const e of j.events ?? []) {
    if (!e.segs) continue;
    const base = e.tStartMs ?? 0;
    e.segs.forEach((s, i) => {
      // Cue boundaries are word boundaries: prefix the first segment with a space.
      const text = (i === 0 ? " " : "") + (s.utf8 ?? "").replace(/\s+/g, " ");
      if (text.trim()) out.push({ t: base + (s.tOffsetMs ?? 0), text });
    });
  }
  return out.sort((a, b) => a.t - b.t);
}

export type Strategy =
  | "cue"
  | "sentence"
  | "window"
  | "consensus"
  | "punctVote"
  | "union"
  | "intersection"
  | "pause"
  | "anchors";

export type CriteriaId =
  "sentence" | "pause" | "consensus" | "punctVote" | "anchors" | "cue" | "window";

export interface ParserCriteriaOption {
  id: CriteriaId;
  name: string;
  label: string;
  desc: string;
  category: "syntax" | "timing" | "alignment";
  badge: string;
}

export const PARSER_CRITERIA: ParserCriteriaOption[] = [
  {
    id: "sentence",
    name: "Sentence Endings",
    label: "Sentence Punctuation",
    desc: "Cuts at grammatical sentence endings (periods, question marks, exclamation marks) in base language.",
    category: "syntax",
    badge: "Syntax",
  },
  {
    id: "pause",
    name: "Speech Pauses",
    label: "Spoken Silence Pauses",
    desc: "Cuts at natural silences (>500ms) in speech, snapped to subtitle boundaries.",
    category: "timing",
    badge: "Audio",
  },
  {
    id: "punctVote",
    name: "Punctuation Consensus",
    label: "Multi-Track Punctuation Vote",
    desc: "Cuts where 2 or more language tracks share a sentence-ending punctuation mark.",
    category: "syntax",
    badge: "Multi-track",
  },
  {
    id: "consensus",
    name: "Timing Consensus",
    label: "Cue Start Alignment",
    desc: "Cuts where majority of parallel languages start a subtitle cue simultaneously (±400ms).",
    category: "alignment",
    badge: "Multi-track",
  },
  {
    id: "cue",
    name: "Authored Cues",
    label: "Individual Cue Starts",
    desc: "Cuts at original individual subtitle cue starts from the base track.",
    category: "timing",
    badge: "Granular",
  },
  {
    id: "anchors",
    name: "Entity Anchors",
    label: "Numbers & Named Entities",
    desc: "Cuts at shared numbers, proper nouns, and key context terms across translations.",
    category: "alignment",
    badge: "Context",
  },
  {
    id: "window",
    name: "Context Window",
    label: "Context Length Clamp",
    desc: "Restricts sections to ~7s–15s context windows, preventing unwieldy monologues.",
    category: "timing",
    badge: "Window",
  },
];

// Default to the best criteria in order not to cut a sentence in the middle: pure grammatical sentence endings
export const DEFAULT_PARSER_CRITERIA: CriteriaId[] = ["sentence"];

export interface SentenceInnerSettings {
  includeCommas: boolean;
  minWords: number;
  splitIntraCue: boolean;
}

export interface PauseInnerSettings {
  minPauseMs: number;
  snapToleranceMs: number;
}

export interface PunctVoteInnerSettings {
  minTrackVotes: number;
  clusterToleranceMs: number;
}

export interface ConsensusInnerSettings {
  majorityRatio: number;
  clusterToleranceMs: number;
}

export interface CueInnerSettings {
  minDurationMs: number;
  splitAllTracks: boolean;
}

export interface AnchorsInnerSettings {
  matchNumbers: boolean;
  matchProperNouns: boolean;
  requireStrictMultiTrack: boolean;
}

export interface WindowInnerSettings {
  minSectionMs: number;
  maxSectionMs: number;
}

export interface CriteriaGroupSettings {
  sentence: SentenceInnerSettings;
  pause: PauseInnerSettings;
  punctVote: PunctVoteInnerSettings;
  consensus: ConsensusInnerSettings;
  cue: CueInnerSettings;
  anchors: AnchorsInnerSettings;
  window: WindowInnerSettings;
}

export const DEFAULT_CRITERIA_SETTINGS: CriteriaGroupSettings = {
  sentence: {
    includeCommas: false,
    minWords: 1,
    splitIntraCue: false,
  },
  pause: {
    minPauseMs: 500,
    snapToleranceMs: 1200,
  },
  punctVote: {
    minTrackVotes: 2,
    clusterToleranceMs: 500,
  },
  consensus: {
    majorityRatio: 0.5,
    clusterToleranceMs: 400,
  },
  cue: {
    minDurationMs: 1200,
    splitAllTracks: false,
  },
  anchors: {
    matchNumbers: true,
    matchProperNouns: true,
    requireStrictMultiTrack: false,
  },
  window: {
    minSectionMs: 1500,
    maxSectionMs: 12000,
  },
};

export interface ParserPreset {
  id: string;
  name: string;
  desc: string;
  criteria: CriteriaId[];
}

export const PARSER_PRESETS: ParserPreset[] = [
  {
    id: "sentencesOnly",
    name: "Pure Sentences",
    desc: "Sentence ends only (. ? !)",
    criteria: ["sentence"],
  },
  {
    id: "balanced",
    name: "Context & Sentences",
    desc: "Sentence punctuation + natural speech pauses (balanced translatable units)",
    criteria: ["sentence", "pause"],
  },
  {
    id: "multilingual",
    name: "Multi-Language Consensus",
    desc: "Punctuation vote + timing consensus + sentence ends (best for parallel alignment)",
    criteria: ["sentence", "consensus", "punctVote"],
  },
  {
    id: "fineGrained",
    name: "Fine Cue Chunks",
    desc: "Authored cue boundaries + speech pauses",
    criteria: ["cue", "pause"],
  },
  {
    id: "fullContext",
    name: "All Criteria",
    desc: "Combines sentence ends, pauses, consensus, anchors, and context window limits",
    criteria: ["sentence", "pause", "consensus", "punctVote", "anchors", "window"],
  },
];

type Sec = { start: number; end: number };

export const STRATEGIES: { id: Strategy; name: string; desc: string; parallel?: boolean }[] = [
  {
    id: "sentence",
    name: "Sentence",
    desc: "Single track: merge timing-language cues until . ? ! ends a sentence.",
  },
  { id: "cue", name: "Cue", desc: "Single track: one row per timing-language cue, as authored." },
  {
    id: "window",
    name: "Window",
    desc: "Single track: merge timing-language cues into ~7s blocks.",
  },
  {
    id: "consensus",
    name: "Consensus",
    parallel: true,
    desc: "Cut where most languages start a cue at (almost) the same moment (±400ms).",
  },
  {
    id: "punctVote",
    name: "Punct vote",
    parallel: true,
    desc: "Cut where at least 2 translations end a sentence (. ? !) at the same moment.",
  },
  {
    id: "union",
    name: "Union",
    parallel: true,
    desc: "Cut at every cue start of every language (finest), merging slivers under 1.5s.",
  },
  {
    id: "intersection",
    name: "Intersection",
    parallel: true,
    desc: "Cut only where ALL languages share a cue boundary (coarsest, safest).",
  },
  {
    id: "pause",
    name: "Speech pause",
    parallel: true,
    desc: "Cut at silences >500ms in word-timed (ASR) tracks, snapped to a translation cue boundary.",
  },
  {
    id: "anchors",
    name: "Anchors",
    parallel: true,
    desc: "Cut where numbers/names (e.g. 16, Bach) appear in all languages — shared tokens anchor the alignment.",
  },
];

export const COMMON_ABBREVIATIONS = new Set([
  "mr.",
  "mrs.",
  "ms.",
  "dr.",
  "prof.",
  "sr.",
  "jr.",
  "vs.",
  "etc.",
  "eg.",
  "e.g.",
  "ie.",
  "i.e.",
  "u.s.",
  "u.k.",
  "usa.",
  "u.s.a.",
  "dept.",
  "est.",
  "approx.",
  "fig.",
  "inc.",
  "ltd.",
  "corp.",
  "co.",
  "st.",
  "ave.",
  "blvd.",
  "gen.",
  "gov.",
  "sgt.",
  "col.",
  "capt.",
  "lieut.",
  "rev.",
]);

export function isAbbreviation(word: string): boolean {
  const clean = word.toLowerCase().trim();
  if (COMMON_ABBREVIATIONS.has(clean)) return true;
  // Single letter initial with period: "A.", "B.", "J."
  if (/^[a-z]\.$/i.test(clean)) return true;
  // Multi-initial acronyms: "U.S.", "Ph.D.", "B.C."
  if (/^([a-z]\.){2,}$/i.test(clean)) return true;
  return false;
}

export const SENT_END = /[.?!…。؟]["'»)”]*$/;

export function isSentenceEnding(text: string, includeCommas = false): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Guard decimal numbers like 3.14 or 10.5
  if (/\b\d+\.\d+$/.test(trimmed)) return false;

  // Guard abbreviations if ending with period
  const matchLastWord = trimmed.match(/([A-Za-z0-9.]+)[.,?!…。؟،;:]*["'»)”]*$/);
  if (matchLastWord && matchLastWord[1]) {
    if (isAbbreviation(matchLastWord[1])) return false;
  }

  const regex = includeCommas ? /[.?!…。؟،;:,]["'»)”]*$/ : SENT_END;
  return regex.test(trimmed);
}

/** Group sorted boundary candidates into clusters within tol; return cluster centers with vote counts. */
function cluster(points: { t: number; lang: string }[], tol: number) {
  const pts = [...points].sort((a, b) => a.t - b.t);
  const out: { t: number; langs: Set<string> }[] = [];
  let cur: { ts: number[]; langs: Set<string> } | null = null;
  for (const p of pts) {
    if (cur && p.t - cur.ts[cur.ts.length - 1]! <= tol) {
      cur.ts.push(p.t);
      cur.langs.add(p.lang);
      continue;
    }
    if (cur) out.push({ t: Math.min(...cur.ts), langs: cur.langs });
    cur = { ts: [p.t], langs: new Set([p.lang]) };
  }
  if (cur) out.push({ t: Math.min(...cur.ts), langs: cur.langs });
  return out;
}

/** Turn boundary times into sections; drop cuts making sections shorter than minMs, split ones longer than maxMs. */
function fromCuts(cuts: number[], start: number, end: number, minMs = 1500, maxMs = 20000): Sec[] {
  const sorted = [...new Set(cuts)].filter((t) => t > start && t < end).sort((a, b) => a - b);
  const pts = [start];
  for (const t of sorted) if (t - pts[pts.length - 1]! >= minMs) pts.push(t);
  const secs: Sec[] = [];
  for (let i = 0; i < pts.length; i++) {
    const s = pts[i]!,
      e = pts[i + 1] ?? end;
    if (e - s > maxMs) {
      const n = Math.ceil((e - s) / maxMs);
      for (let k = 0; k < n; k++)
        secs.push({ start: s + ((e - s) * k) / n, end: s + ((e - s) * (k + 1)) / n });
    } else secs.push({ start: s, end: e });
  }
  return secs;
}

/** Word-timed tokens → start times following a silence of at least gapMs. */
function pauseTimes(j: Json3, gapMs: number): number[] {
  const out: number[] = [];
  for (const e of j.events ?? []) {
    if (!e.segs || e.segs.length < 2) continue; // only word-timed events
    const base = e.tStartMs ?? 0;
    for (let i = 1; i < e.segs.length; i++) {
      const a = base + (e.segs[i - 1]!.tOffsetMs ?? 0),
        b = base + (e.segs[i]!.tOffsetMs ?? 0);
      if (b - a >= gapMs) out.push(b);
    }
  }
  return out;
}

/** Build time sections from one or more parallel tracks. */
export function parallelSections(
  tracks: Record<string, Json3>,
  pivot: string,
  strategy: Strategy,
): Sec[] {
  const all = Object.entries(tracks).map(([lang, j]) => ({ lang, cues: parseCues(j) }));
  const pv = all.find((t) => t.lang === pivot)?.cues ?? all[0]?.cues ?? [];
  if (["cue", "sentence", "window"].includes(strategy)) return sections(pv, strategy);
  const n = all.length;
  const start = Math.min(...all.map((t) => t.cues[0]?.start ?? 0));
  const end = Math.max(...all.map((t) => t.cues[t.cues.length - 1]?.end ?? 0));
  const starts = all.flatMap((t) => t.cues.map((c) => ({ t: c.start, lang: t.lang })));
  let cuts: number[] = [];
  switch (strategy) {
    case "union":
      cuts = starts.map((p) => p.t);
      break;
    case "consensus":
      cuts = cluster(starts, 400)
        .filter((c) => c.langs.size > n / 2)
        .map((c) => c.t);
      break;
    case "intersection":
      cuts = cluster(starts, 400)
        .filter((c) => c.langs.size === n)
        .map((c) => c.t);
      break;
    case "punctVote": {
      // Sentence end at cue i → boundary at start of cue i+1.
      const ends = all.flatMap((t) =>
        t.cues.flatMap((c, i) =>
          SENT_END.test(c.text) && t.cues[i + 1] ? [{ t: t.cues[i + 1]!.start, lang: t.lang }] : [],
        ),
      );
      cuts = cluster(ends, 500)
        .filter((c) => c.langs.size >= 2)
        .map((c) => c.t);
      break;
    }
    case "pause": {
      const gaps = Object.values(tracks).flatMap((j) => pauseTimes(j, 500));
      const snaps = cluster(starts, 1).map((c) => c.t);
      // Snap each silence to the nearest cue start of any language (within 1.2s) so translations split cleanly.
      cuts = gaps.flatMap((g) => {
        let best = -1,
          d = 1200;
        for (const s of snaps)
          if (Math.abs(s - g) < d) {
            d = Math.abs(s - g);
            best = s;
          }
        return best >= 0 ? [best] : [];
      });
      break;
    }
    case "anchors": {
      // Tokens (digits, capitalised Latin names) present in every track; cut at the cue start in the pivot where they occur.
      const anchorRe = /\b(\d+|[A-Z][a-z]{2,})\b/g;
      const sets = all.map(
        (t) =>
          new Set(
            t.cues.flatMap((c) => [...c.text.matchAll(anchorRe)].map((m) => m[1]!.toLowerCase())),
          ),
      );
      const eng = all.find((t) => t.lang === "en")?.cues ?? [];
      const shared = [...(sets[0] ?? [])].filter(
        (w) =>
          sets.every((s) => s.has(w)) ||
          (eng.length && sets.filter((s) => s.has(w)).length >= n - 1),
      );
      cuts = pv.flatMap((c) =>
        shared.some((w) => c.text.toLowerCase().includes(w)) ? [c.start] : [],
      );
      // Anchors are sparse — also keep pivot sentence ends so rows stay readable.
      cuts.push(
        ...pv.flatMap((c, i) => (SENT_END.test(c.text) && pv[i + 1] ? [pv[i + 1]!.start] : [])),
      );
      break;
    }
  }
  return fromCuts(cuts, start, end);
}

/** Build time sections from one or more parallel tracks using accumulative criteria and inner group settings. */
export function criteriaSections(
  tracks: Record<string, Json3>,
  pivot: string,
  criteria: CriteriaId[],
  groupSettings?: Partial<CriteriaGroupSettings>,
): Sec[] {
  const activeCriteria = criteria.length > 0 ? criteria : (["sentence"] as CriteriaId[]);
  const cfg: CriteriaGroupSettings = {
    sentence: { ...DEFAULT_CRITERIA_SETTINGS.sentence, ...(groupSettings?.sentence ?? {}) },
    pause: { ...DEFAULT_CRITERIA_SETTINGS.pause, ...(groupSettings?.pause ?? {}) },
    punctVote: { ...DEFAULT_CRITERIA_SETTINGS.punctVote, ...(groupSettings?.punctVote ?? {}) },
    consensus: { ...DEFAULT_CRITERIA_SETTINGS.consensus, ...(groupSettings?.consensus ?? {}) },
    cue: { ...DEFAULT_CRITERIA_SETTINGS.cue, ...(groupSettings?.cue ?? {}) },
    anchors: { ...DEFAULT_CRITERIA_SETTINGS.anchors, ...(groupSettings?.anchors ?? {}) },
    window: { ...DEFAULT_CRITERIA_SETTINGS.window, ...(groupSettings?.window ?? {}) },
  };

  const all = Object.entries(tracks).map(([lang, j]) => ({ lang, cues: parseCues(j) }));
  const pv = all.find((t) => t.lang === pivot)?.cues ?? all[0]?.cues ?? [];
  if (!pv.length) return [];

  const n = all.length;
  const start = Math.min(...all.map((t) => t.cues[0]?.start ?? 0));
  const end = Math.max(...all.map((t) => t.cues[t.cues.length - 1]?.end ?? 0));
  const starts = all.flatMap((t) => t.cues.map((c) => ({ t: c.start, lang: t.lang })));

  const candidateCuts: number[] = [];

  // 1. Sentence ending punctuation in timing base track (inter-cue & intra-cue)
  if (activeCriteria.includes("sentence")) {
    const sentenceCuts: number[] = [];

    // 1a. Inter-cue sentence boundary cuts
    for (let i = 0; i < pv.length - 1; i++) {
      const c = pv[i]!;
      const words = c.text.trim().split(/\s+/).length;
      if (words >= cfg.sentence.minWords && isSentenceEnding(c.text, cfg.sentence.includeCommas)) {
        sentenceCuts.push(pv[i + 1]!.start);
      }
    }

    // 1b. Intra-cue segment punctuation cuts (detecting punctuation inside word-timed events)
    if (cfg.sentence.splitIntraCue) {
      const pivotTrack = tracks[pivot] ?? Object.values(tracks)[0];
      if (pivotTrack?.events) {
        for (const e of pivotTrack.events) {
          if (!e.segs || e.segs.length < 2) continue;
          const base = e.tStartMs ?? 0;
          let runningText = "";
          for (let s = 0; s < e.segs.length - 1; s++) {
            const segText = e.segs[s]!.utf8 ?? "";
            runningText += segText;
            const words = runningText.trim().split(/\s+/).length;
            const nextOffset = e.segs[s + 1]?.tOffsetMs;
            if (
              words >= cfg.sentence.minWords &&
              nextOffset != null &&
              nextOffset > 0 &&
              isSentenceEnding(runningText, cfg.sentence.includeCommas)
            ) {
              sentenceCuts.push(base + nextOffset);
              runningText = "";
            }
          }
        }
      }
    }

    candidateCuts.push(...sentenceCuts);
  }

  // 2. Natural speech pauses in word-timed audio
  if (activeCriteria.includes("pause")) {
    const gaps = Object.values(tracks).flatMap((j) => pauseTimes(j, cfg.pause.minPauseMs));
    const snaps = cluster(starts, 1).map((c) => c.t);
    const pauseCuts = gaps.flatMap((g) => {
      let best = -1;
      let d = cfg.pause.snapToleranceMs;
      for (const s of snaps) {
        if (Math.abs(s - g) < d) {
          d = Math.abs(s - g);
          best = s;
        }
      }
      return best >= 0 ? [best] : [];
    });
    candidateCuts.push(...pauseCuts);
  }

  // 3. Multi-track punctuation agreement (punctVote)
  if (activeCriteria.includes("punctVote")) {
    const ends = all.flatMap((t) =>
      t.cues.flatMap((c, i) =>
        SENT_END.test(c.text) && t.cues[i + 1] ? [{ t: t.cues[i + 1]!.start, lang: t.lang }] : [],
      ),
    );
    const punctVoteCuts = cluster(ends, cfg.punctVote.clusterToleranceMs)
      .filter((c) => c.langs.size >= Math.min(cfg.punctVote.minTrackVotes, n))
      .map((c) => c.t);
    candidateCuts.push(...punctVoteCuts);
  }

  // 4. Timing consensus across majority of tracks
  if (activeCriteria.includes("consensus")) {
    const minLangsNeeded = Math.max(1, Math.ceil(n * cfg.consensus.majorityRatio));
    const consensusCuts = cluster(starts, cfg.consensus.clusterToleranceMs)
      .filter((c) => c.langs.size >= minLangsNeeded)
      .map((c) => c.t);
    candidateCuts.push(...consensusCuts);
  }

  // 5. Authored cue boundaries
  if (activeCriteria.includes("cue")) {
    const cueCuts = cfg.cue.splitAllTracks ? starts.map((p) => p.t) : pv.map((c) => c.start);
    candidateCuts.push(...cueCuts);
  }

  // 6. Named entity & numeric anchors
  if (activeCriteria.includes("anchors")) {
    const regexParts: string[] = [];
    if (cfg.anchors.matchNumbers) regexParts.push("\\d+");
    if (cfg.anchors.matchProperNouns) regexParts.push("[A-Z][a-z]{2,}");
    const anchorRe = new RegExp(
      `\\b(${regexParts.length ? regexParts.join("|") : "\\d+|[A-Z][a-z]{2,}"})\\b`,
      "g",
    );
    const sets = all.map(
      (t) =>
        new Set(
          t.cues.flatMap((c) => [...c.text.matchAll(anchorRe)].map((m) => m[1]!.toLowerCase())),
        ),
    );
    const eng = all.find((t) => t.lang === "en")?.cues ?? [];
    const shared = [...(sets[0] ?? [])].filter((w) =>
      cfg.anchors.requireStrictMultiTrack
        ? sets.every((s) => s.has(w))
        : sets.every((s) => s.has(w)) ||
          (eng.length && sets.filter((s) => s.has(w)).length >= n - 1),
    );
    const anchorCuts = pv.flatMap((c) =>
      shared.some((w) => c.text.toLowerCase().includes(w)) ? [c.start] : [],
    );
    candidateCuts.push(...anchorCuts);
  }

  // If no cut candidate was produced, fallback to sentence or cue boundaries
  if (candidateCuts.length === 0) {
    candidateCuts.push(
      ...pv.flatMap((c, i) =>
        SENT_END.test(c.text) && pv[i + 1] ? [pv[i + 1]!.start] : [c.start],
      ),
    );
  }

  const minMs = cfg.window.minSectionMs;
  // When window clamp is not explicitly active, use generous maxMs to avoid slicing sentences in the middle
  const maxMs = activeCriteria.includes("window") ? cfg.window.maxSectionMs : 60000;

  return fromCuts(candidateCuts, start, end, minMs, maxMs);
}

/** Build time sections from the pivot track using a strategy. */
export function sections(pivot: Cue[], strategy: Strategy): Sec[] {
  if (strategy === "cue") return pivot.map(({ start, end }) => ({ start, end }));
  const out: Sec[] = [];
  let cur: Sec | null = null;
  for (const c of pivot) {
    if (!cur) cur = { start: c.start, end: c.end };
    else cur.end = c.end;
    const done =
      strategy === "sentence"
        ? SENT_END.test(c.text) || cur.end - cur.start > 15000
        : cur.end - cur.start >= 7000;
    if (done) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** Align every track into time sections; tokens are bucketed by timestamp. */
export function align(
  tracks: Record<string, Json3>,
  pivot: string,
  strategyOrCriteria: Strategy | CriteriaId[] = ["sentence"],
  groupSettings?: Partial<CriteriaGroupSettings>,
): Row[] {
  let secs: Sec[];
  if (Array.isArray(strategyOrCriteria)) {
    secs = criteriaSections(tracks, pivot, strategyOrCriteria, groupSettings);
  } else if (
    typeof strategyOrCriteria === "string" &&
    STRATEGIES.some((s) => s.id === strategyOrCriteria)
  ) {
    secs = parallelSections(tracks, pivot, strategyOrCriteria as Strategy);
  } else {
    secs = criteriaSections(tracks, pivot, ["sentence"], groupSettings);
  }

  const rows: Row[] = secs.map((s) => ({ ...s, texts: {} }));
  if (!rows.length) return rows;
  // Make sections contiguous so no token falls between rows.
  for (let i = 0; i < rows.length - 1; i++) rows[i]!.end = rows[i + 1]!.start;
  for (const [lang, j] of Object.entries(tracks)) {
    let r = 0;
    for (const tk of tokens(j)) {
      while (r < rows.length - 1 && tk.t >= rows[r + 1]!.start) r++;
      rows[r]!.texts[lang] = (rows[r]!.texts[lang] ?? "") + tk.text;
    }
  }
  for (const row of rows)
    for (const k of Object.keys(row.texts))
      row.texts[k] = row.texts[k]!.replace(/\s+/g, " ").trim();
  return rows;
}

export function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
