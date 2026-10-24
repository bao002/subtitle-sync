import React, { useState } from "react";
import { Scissors, Settings2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import {
  SimpleParserConfig,
  DEFAULT_SIMPLE_PARSER_CONFIG,
} from "@/utils/newSubtitlesParser";

export interface NewSubtitlesParserBarProps {
  config: SimpleParserConfig;
  onChange: (newConfig: SimpleParserConfig) => void;
  sentenceCount: number;
  className?: string;
}

export function NewSubtitlesParserBar({
  config,
  onChange,
  sentenceCount,
  className = "",
}: NewSubtitlesParserBarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggle = (key: keyof SimpleParserConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  const handleCustomDelimitersChange = (val: string) => {
    onChange({
      ...config,
      customDelimiters: val,
    });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_SIMPLE_PARSER_CONFIG });
  };

  return (
    <div
      data-testid="new-subtitles-parser-bar"
      className={`border-b border-border bg-card/70 px-3 py-2 text-xs transition-colors ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
            <Scissors className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-foreground">New Subtitles Parser</span>
          <span
            data-testid="parser-sentence-count-badge"
            className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
          >
            {sentenceCount} {sentenceCount === 1 ? "sentence" : "sentences"}
          </span>
          <span className="hidden sm:inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Live Dynamic Updates
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="parser-reset-defaults-btn"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="Reset parser to default splitting configuration"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            data-testid="parser-expand-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title={isExpanded ? "Collapse parser controls" : "Expand parser controls"}
          >
            <Settings2 className="h-3 w-3" />
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-2 text-muted-foreground">
          {/* Main Dot split toggle */}
          <label className="flex items-center gap-1.5 font-medium text-foreground cursor-pointer">
            <input
              type="checkbox"
              data-testid="parser-split-dot-toggle"
              checked={config.splitOnDot}
              onChange={() => handleToggle("splitOnDot")}
              className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <span>Split on dot ( . )</span>
          </label>

          {/* Question mark split toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              data-testid="parser-split-question-toggle"
              checked={config.splitOnQuestion}
              onChange={() => handleToggle("splitOnQuestion")}
              className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <span>Split on ?</span>
          </label>

          {/* Exclamation split toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              data-testid="parser-split-exclamation-toggle"
              checked={config.splitOnExclamation}
              onChange={() => handleToggle("splitOnExclamation")}
              className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <span>Split on !</span>
          </label>

          {/* Comma split toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              data-testid="parser-split-comma-toggle"
              checked={config.splitOnComma}
              onChange={() => handleToggle("splitOnComma")}
              className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <span>Split on comma ( , )</span>
          </label>

          {/* Intra-cue splitting toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              data-testid="parser-intra-cue-toggle"
              checked={config.splitIntraCue}
              onChange={() => handleToggle("splitIntraCue")}
              className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <span>Intra-cue splitting</span>
          </label>

          {/* Custom Delimiters input */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="parser-custom-delimiters-input" className="text-[11px]">
              Custom chars:
            </label>
            <input
              id="parser-custom-delimiters-input"
              data-testid="parser-custom-delimiters-input"
              type="text"
              placeholder="e.g. ; :"
              value={config.customDelimiters}
              onChange={(e) => handleCustomDelimitersChange(e.target.value)}
              className="h-6 w-20 rounded border border-input bg-background px-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </div>
  );
}
