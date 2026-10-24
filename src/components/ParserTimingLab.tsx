import React, { useState, useMemo } from "react";
import {
  CriteriaId,
  CriteriaGroupSettings,
  Json3,
  criteriaSections,
  isAbbreviation,
  isSentenceEnding,
} from "../lib/subtitles";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import {
  GraduationCap,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Zap,
  BarChart2,
  Layers,
  HelpCircle,
} from "lucide-react";

export interface ParserTimingLabProps {
  tracks: Record<string, Json3> | null;
  baseLanguage: string;
  selectedCriteria: CriteriaId[];
  criteriaSettings: CriteriaGroupSettings;
  onApplyCriteria: (criteria: CriteriaId[]) => void;
  onUpdateGroupSettings?: (
    group: keyof CriteriaGroupSettings,
    settings: Partial<CriteriaGroupSettings[keyof CriteriaGroupSettings]>,
  ) => void;
}

// Built-in educational sample transcript for experimentation when video captions lack word timing
const SAMPLE_DEMO_TRACKS: Record<string, Json3> = {
  en: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 8000,
        segs: [
          { utf8: "Welcome to Dr. Smith's lecture ", tOffsetMs: 0 },
          { utf8: "on artificial intelligence ", tOffsetMs: 2200 },
          { utf8: "and speech recognition. ", tOffsetMs: 4400 },
          { utf8: "Today we explore version 3.14 ", tOffsetMs: 6200 },
        ],
      },
      {
        tStartMs: 8200,
        dDurationMs: 12000,
        segs: [
          { utf8: "of the model which runs fast ", tOffsetMs: 0 },
          { utf8: "without any pause at all ", tOffsetMs: 3100 },
          { utf8: "for twelve full seconds ", tOffsetMs: 6200 },
          { utf8: "until taking a deep breath here. ", tOffsetMs: 9500 },
        ],
      },
      {
        tStartMs: 21000,
        dDurationMs: 7000,
        segs: [
          { utf8: "Now notice how punctuation alone ", tOffsetMs: 0 },
          { utf8: "cannot tell when someone paused. ", tOffsetMs: 3200 },
        ],
      },
    ],
  },
  es: {
    events: [
      {
        tStartMs: 0,
        dDurationMs: 8000,
        segs: [
          { utf8: "Bienvenidos a la conferencia del Dr. Smith sobre IA y voz.", tOffsetMs: 0 },
        ],
      },
      {
        tStartMs: 8200,
        dDurationMs: 12000,
        segs: [
          { utf8: "del modelo que corre rápido durante doce segundos enteros.", tOffsetMs: 0 },
        ],
      },
      {
        tStartMs: 21000,
        dDurationMs: 7000,
        segs: [{ utf8: "Ahora note cómo la puntuación sola no detecta pausas.", tOffsetMs: 0 }],
      },
    ],
  },
};

export function ParserTimingLab({
  tracks,
  baseLanguage,
  selectedCriteria,
  criteriaSettings,
  onApplyCriteria,
}: ParserTimingLabProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"metrics" | "experiments" | "preview">("metrics");
  const [selectedExperiment, setSelectedExperiment] = useState<number>(0);

  // Use real video tracks if available, otherwise fallback to educational demo
  const activeTracks = useMemo(() => {
    if (tracks && Object.keys(tracks).length > 0 && tracks[baseLanguage]) {
      return tracks;
    }
    return SAMPLE_DEMO_TRACKS;
  }, [tracks, baseLanguage]);

  const activeLang = useMemo(() => {
    if (tracks && Object.keys(tracks).length > 0 && tracks[baseLanguage]) {
      return baseLanguage;
    }
    return "en";
  }, [tracks, baseLanguage]);

  // 1. Calculate Pure Punctuation baseline (only sentence punctuation)
  const punctuationBaselineSections = useMemo(() => {
    return criteriaSections(activeTracks, activeLang, ["sentence"], {
      sentence: { includeCommas: false, minWords: 1, splitIntraCue: true },
    });
  }, [activeTracks, activeLang]);

  // 2. Calculate Active Criteria sections (incorporating user's timing settings)
  const activeSections = useMemo(() => {
    return criteriaSections(activeTracks, activeLang, selectedCriteria, criteriaSettings);
  }, [activeTracks, activeLang, selectedCriteria, criteriaSettings]);

  // 3. Compute metrics
  const baselineCount = punctuationBaselineSections.length;
  const activeCount = activeSections.length;

  const baselineAvgDuration = useMemo(() => {
    if (baselineCount === 0) return 0;
    const totalMs = punctuationBaselineSections.reduce((acc, s) => acc + (s.end - s.start), 0);
    return Math.round((totalMs / baselineCount / 1000) * 10) / 10;
  }, [punctuationBaselineSections, baselineCount]);

  const activeAvgDuration = useMemo(() => {
    if (activeCount === 0) return 0;
    const totalMs = activeSections.reduce((acc, s) => acc + (s.end - s.start), 0);
    return Math.round((totalMs / activeCount / 1000) * 10) / 10;
  }, [activeSections, activeCount]);

  const baselineRunOns = useMemo(() => {
    return punctuationBaselineSections.filter((s) => s.end - s.start > 12000).length;
  }, [punctuationBaselineSections]);

  const activeRunOns = useMemo(() => {
    return activeSections.filter((s) => s.end - s.start > 12000).length;
  }, [activeSections]);

  const isTimingAssisted =
    selectedCriteria.includes("pause") ||
    selectedCriteria.includes("consensus") ||
    selectedCriteria.includes("window");

  // Educational experiments catalog
  const EXPERIMENTS = [
    {
      id: "baseline",
      title: "Experiment 1: Pure Punctuation Baseline",
      criteria: ["sentence"] as CriteriaId[],
      tag: "Baseline (Syntax Only)",
      color: "border-amber-500/30 bg-amber-500/5",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      description:
        "Splits exclusively on punctuation marks (. ? !). Fails when speakers do not pause for punctuation or when ASR captions omit periods.",
      benefit: "Simple, but vulnerable to 15s+ run-on blocks and unpunctuated streams.",
    },
    {
      id: "pause",
      title: "Experiment 2: Add Speech Silence Pauses",
      criteria: ["sentence", "pause"] as CriteriaId[],
      tag: "Timing Assisted",
      color: "border-blue-500/30 bg-blue-500/5",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      description:
        "Measures acoustic silence gaps (Δt ≥ 500ms) between word tokens. Automatically cuts when the speaker pauses to breathe, even without punctuation.",
      benefit: "Eliminates monologue run-ons and produces natural, spoken sentence blocks.",
    },
    {
      id: "consensus",
      title: "Experiment 3: Multi-Track Alignment Consensus",
      criteria: ["sentence", "consensus", "punctVote"] as CriteriaId[],
      tag: "Multi-Track Sync",
      color: "border-purple-500/30 bg-purple-500/5",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      description:
        "Clusters cue start timestamps across all parallel translation tracks (±400ms). Snaps boundaries where the majority of languages agree.",
      benefit:
        "Prevents translation drift caused by varying sentence structures (e.g. German verb placement).",
    },
    {
      id: "window",
      title: "Experiment 4: Balanced Context Windows",
      criteria: ["sentence", "pause", "window"] as CriteriaId[],
      tag: "Optimal Clamping",
      color: "border-emerald-500/30 bg-emerald-500/5",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      description:
        "Clamps sentences to ergonomic 1.5s–12s reading bounds. Merges sub-second slivers and splits unwieldy sentences cleanly.",
      benefit: "Guarantees subtitles never overflow viewport or cause TTS audio desynchronization.",
    },
  ];

  return (
    <div
      data-testid="parser-timing-lab"
      className="rounded-xl border border-primary/20 bg-card p-4 shadow-xs space-y-4"
    >
      {/* Header & Educational Guide Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              Timing & Punctuation Splitting Lab
            </h3>
            <Badge
              variant={isTimingAssisted ? "default" : "secondary"}
              className="text-[10px] h-4.5 px-2 font-normal"
            >
              {isTimingAssisted ? "Timing Assisted Active" : "Pure Punctuation Active"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare pure punctuation vs timing-assisted sentence splitting and discover how acoustic
            math fixes subtitle alignment.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="open-timing-guide-button"
          onClick={() => setIsGuideOpen(true)}
          className="h-8 text-xs font-medium gap-1.5 shrink-0 border-primary/30 text-primary hover:bg-primary/5"
        >
          <GraduationCap className="h-4 w-4" />
          <span>Learn How Timing Works</span>
        </Button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("metrics")}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
            activeTab === "metrics"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <BarChart2 className="h-3 w-3 inline mr-1" />
          Live Metrics Comparison
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("experiments")}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
            activeTab === "experiments"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Zap className="h-3 w-3 inline mr-1" />
          Interactive Experiments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
            activeTab === "preview"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Layers className="h-3 w-3 inline mr-1" />
          Side-by-Side Preview
        </button>
      </div>

      {/* Tab 1: Live Metrics Comparison */}
      {activeTab === "metrics" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Metric 1: Section Count */}
            <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
              <span className="text-[10px] text-muted-foreground font-medium block">
                Total Sentence Sections
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-foreground">{activeCount}</span>
                <span className="text-xs text-muted-foreground">(vs {baselineCount} baseline)</span>
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                {activeCount > baselineCount
                  ? `+${activeCount - baselineCount} more natural units`
                  : "Identical to pure punctuation"}
              </span>
            </div>

            {/* Metric 2: Average Duration */}
            <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
              <span className="text-[10px] text-muted-foreground font-medium block">
                Average Duration
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-foreground">{activeAvgDuration}s</span>
                <span className="text-xs text-muted-foreground">(vs {baselineAvgDuration}s)</span>
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                {activeAvgDuration <= 8 ? "Optimal reading pace" : "Long reading chunks"}
              </span>
            </div>

            {/* Metric 3: Run-Ons Prevented */}
            <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
              <span className="text-[10px] text-muted-foreground font-medium block">
                Run-Ons (&gt;12s) Prevented
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.max(0, baselineRunOns - activeRunOns)}
                </span>
                <span className="text-xs text-muted-foreground">({activeRunOns} remaining)</span>
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                {activeRunOns === 0
                  ? "All run-on monologues fixed"
                  : `${activeRunOns} long segments left`}
              </span>
            </div>

            {/* Metric 4: Timing Assistance Status */}
            <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
              <span className="text-[10px] text-muted-foreground font-medium block">
                Timing Status
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {isTimingAssisted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Punctuation Only
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                {isTimingAssisted ? "Acoustic signals engaged" : "Relying strictly on text"}
              </span>
            </div>
          </div>

          {/* Educational Callout */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 text-xs text-foreground/90 flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                How does timing math help?
              </span>{" "}
              In speech, human beings pause to take a breath (silence &gt; 500ms). When YouTube
              captions lack periods (like auto-generated captions), acoustic silence calculation
              guarantees that sentences are cut at natural verbal pauses instead of running on
              indefinitely.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Experiments */}
      {activeTab === "experiments" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Click any experiment below to immediately configure the parser criteria and observe its
            effect:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EXPERIMENTS.map((exp, idx) => {
              const isActive =
                exp.criteria.length === selectedCriteria.length &&
                exp.criteria.every((c) => selectedCriteria.includes(c));

              return (
                <div
                  key={exp.id}
                  data-testid={`experiment-card-${exp.id}`}
                  className={`rounded-lg border p-3 transition-all cursor-pointer ${
                    isActive
                      ? "ring-2 ring-primary border-transparent shadow-xs"
                      : "border-border/70 hover:border-border hover:bg-muted/30"
                  } ${exp.color}`}
                  onClick={() => {
                    setSelectedExperiment(idx);
                    onApplyCriteria(exp.criteria);
                  }}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-xs font-semibold text-foreground">{exp.title}</span>
                    <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${exp.badgeColor}`}>
                      {exp.tag}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">
                    {exp.description}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                    <span className="text-[10px] font-medium text-primary">
                      {isActive ? "✓ Currently Active" : "Click to apply"}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className="h-6 text-[10px] px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExperiment(idx);
                        onApplyCriteria(exp.criteria);
                      }}
                    >
                      {isActive ? "Active" : "Apply"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Side-by-Side Preview */}
      {activeTab === "preview" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Left: Pure Punctuation Baseline */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Pure Punctuation Splitting
                </span>
                <Badge variant="outline" className="text-[10px] h-4">
                  {punctuationBaselineSections.length} sections
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cuts only at literal punctuation marks. Notice long monologues and awkward
                abbreviation breaks:
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {punctuationBaselineSections.slice(0, 4).map((sec, i) => {
                  const durationSec = Math.round((sec.end - sec.start) / 100) / 10;
                  const isRunOn = durationSec > 10;
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded border text-[11px] ${
                        isRunOn
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-border/60 bg-background/50"
                      }`}
                    >
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Section {i + 1}</span>
                        <span className={isRunOn ? "text-amber-600 font-bold" : ""}>
                          {durationSec}s {isRunOn ? "(Run-on!)" : ""}
                        </span>
                      </div>
                      <span className="text-foreground">
                        [{Math.floor(sec.start / 1000)}s - {Math.floor(sec.end / 1000)}s]
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Timing-Assisted Active */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Timing-Assisted Splitting
                </span>
                <Badge variant="default" className="text-[10px] h-4">
                  {activeSections.length} sections
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Incorporates speech pauses, cluster consensus, and duration clamping:
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {activeSections.slice(0, 4).map((sec, i) => {
                  const durationSec = Math.round((sec.end - sec.start) / 100) / 10;
                  return (
                    <div
                      key={i}
                      className="p-2 rounded border border-primary/20 bg-background/60 text-[11px]"
                    >
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span className="text-primary font-medium">Balanced Section {i + 1}</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {durationSec}s (Balanced)
                        </span>
                      </div>
                      <span className="text-foreground">
                        [{Math.floor(sec.start / 1000)}s - {Math.floor(sec.end / 1000)}s]
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educational Guide Modal: "Learn How Timing Eliminates Splitting Issues" */}
      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent
          data-testid="timing-guide-modal"
          className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto"
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-4 w-4" />
              </span>
              <DialogTitle className="text-base font-bold">
                How Timing Eliminates Subtitle Splitting Issues
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              A deep-dive tutorial explaining why pure punctuation splitting fails on YouTube
              captions and how acoustic timing calculations create readable, synchronized sentences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Concept 1: The Screen Cue vs Sentence Dilemma */}
            <div className="rounded-lg border border-border/80 p-3 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-foreground">
                  1. The Screen Cue vs. Sentence Dilemma
                </h4>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Video subtitles are authored for <strong>screen display</strong> (maximum 35
                characters on screen for 2–3 seconds),{" "}
                <strong>not for grammatical sentence structure</strong>. A single spoken sentence is
                often fragmented across 3 or 4 visual cues. Conversely, auto-generated (ASR)
                subtitles stream continuously with no punctuation for minutes.
              </p>
            </div>

            {/* Concept 2: Speech Silence Pause Math */}
            <div className="rounded-lg border border-border/80 p-3 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold text-foreground">
                  2. Acoustic Silence Detection (Δt ≥ 500ms)
                </h4>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                In word-timed captions, each word segment contains a millisecond offset
                (`tOffsetMs`). The parser computes the silent gap between successive words:
              </p>
              <div className="rounded bg-background p-2 font-mono text-[11px] text-primary border border-border/60">
                Δt = (tStartMs + tOffsetMs[i]) - (tStartMs + tOffsetMs[i-1])
              </div>
              <p className="text-muted-foreground leading-relaxed">
                When <strong>Δt ≥ 500ms</strong>, the speaker paused to inhale or concluded an idea.
                Even if YouTube forgot the period, acoustic silence cleanly splits the thought.
              </p>
            </div>

            {/* Concept 3: Guarding Abbreviations */}
            <div className="rounded-lg border border-border/80 p-3 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h4 className="font-semibold text-foreground">
                  3. Guarding Abbreviations & Numbers
                </h4>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Naive regex parsers break sentences on titles like <code>Dr. Smith</code>, Latin
                abbreviations like <code>e.g.</code> or <code>i.e.</code>, and decimals like{" "}
                <code>3.14</code>. Our parser includes an abbreviation guard that ensures words like
                "Dr." or "U.S." never trigger false sentence cuts.
              </p>
            </div>

            {/* Concept 4: Multi-Track Alignment Consensus */}
            <div className="rounded-lg border border-border/80 p-3 space-y-1.5 bg-muted/20">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-500" />
                <h4 className="font-semibold text-foreground">
                  4. Solving Translation Drift with Consensus
                </h4>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Different languages order words differently (e.g. German puts verbs at the end of
                clauses). By clustering cue starts across all parallel tracks within a{" "}
                <strong>±400ms</strong> window, the parser cuts where the majority of translations
                agree, keeping parallel rows synchronized.
              </p>
            </div>

            {/* Action footer */}
            <div className="flex justify-end pt-2 border-t border-border/60">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsGuideOpen(false)}
                className="h-8 text-xs px-4"
              >
                Got It, Let's Experiment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
