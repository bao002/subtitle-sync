import React from "react";
import { Filter, Sliders, CheckCircle2, Minus, Plus, Languages, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export interface LearningGoalsFiltersPanelProps {
  maxWords: number;
  onMaxWordsChange: (val: number) => void;
  skipIncompleteSentences: boolean;
  onSkipIncompleteSentencesChange: (val: boolean) => void;
  /** Per-language max words allowed for translation: { [langCode]: maxWords } */
  languageMaxWords?: Record<string, number>;
  /** Callback when max words allowed for a specific language is updated */
  onLanguageMaxWordsChange?: (langCode: string, val: number | undefined) => void;
  /** Available or approved learning languages */
  learningLanguages?: Array<{ code: string; name: string }>;
  minWords?: number;
  maxWordsLimit?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Shared Learning Goals Subtitle Row Filters Panel
 * Used with 100% parity across both Advanced Mode (Stage 2 Learning Goals) and Beginner Mode.
 * Allows user to:
 * 1. Limit max words per subtitle row via a responsive slider (skipping rows exceeding word count).
 * 2. Set per-language max words allowed for translation (skipping translation for languages exceeding limit).
 * 3. Toggle skipping incomplete sentences (records not ending with ',', '.', '?', '!').
 */
export const LearningGoalsFiltersPanel: React.FC<LearningGoalsFiltersPanelProps> = ({
  maxWords,
  onMaxWordsChange,
  skipIncompleteSentences,
  onSkipIncompleteSentencesChange,
  languageMaxWords = {},
  onLanguageMaxWordsChange,
  learningLanguages = [],
  minWords = 1,
  maxWordsLimit = 50,
  compact = false,
  className = "",
}) => {
  const safeMaxWords = Math.max(
    minWords,
    Math.min(maxWordsLimit, typeof maxWords === "number" && !isNaN(maxWords) ? maxWords : 10),
  );

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    onMaxWordsChange(Math.max(minWords, safeMaxWords - 1));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    onMaxWordsChange(Math.min(maxWordsLimit, safeMaxWords + 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onMaxWordsChange(Math.max(minWords, Math.min(maxWordsLimit, val)));
    }
  };

  return (
    <div
      id="learning-goals-filters-panel"
      data-testid="learning-goals-filters-panel"
      className={`rounded-lg border border-border bg-card/60 p-3 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary shrink-0" />
          <h4 className="font-semibold text-xs text-foreground">
            Learning Goals: Subtitle Row Filters
          </h4>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Row Criteria
        </span>
      </div>

      {/* 1. Max Words Per Subtitle Row Slider */}
      <div
        id="learning-goals-max-words-section"
        data-testid="learning-goals-max-words-section"
        className="space-y-2 bg-background/70 p-2.5 rounded-md border border-border/70"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sliders className="h-3.5 w-3.5 text-primary shrink-0" />
            <label
              htmlFor="learning-goals-max-words-input"
              data-testid="learning-goals-max-words-label"
              className="text-xs font-medium text-foreground cursor-pointer select-none"
            >
              Max Words Per Subtitle Row:
            </label>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              data-testid="learning-goals-decrement-btn"
              onClick={handleDecrement}
              disabled={safeMaxWords <= minWords}
              aria-label="Decrease max words"
              className="flex h-6 w-5 items-center justify-center rounded border border-input text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <input
              id="learning-goals-max-words-input"
              data-testid="learning-goals-max-words-input"
              type="number"
              min={minWords}
              max={maxWordsLimit}
              value={safeMaxWords}
              onChange={handleInputChange}
              aria-label="Max words per subtitle row"
              className="h-6 w-10 text-center font-mono text-xs font-semibold rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              data-testid="learning-goals-increment-btn"
              onClick={handleIncrement}
              disabled={safeMaxWords >= maxWordsLimit}
              aria-label="Increase max words"
              className="flex h-6 w-5 items-center justify-center rounded border border-input text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
            <span
              data-testid="learning-goals-max-words-value"
              className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 ml-1"
            >
              {safeMaxWords} words
            </span>
          </div>
        </div>

        <div className="pt-1 px-1">
          <Slider
            data-testid="learning-goals-max-words-slider"
            min={minWords}
            max={maxWordsLimit}
            step={1}
            value={[safeMaxWords]}
            onValueChange={([val]) => {
              if (typeof val === "number") {
                onMaxWordsChange(val);
              }
            }}
            className="w-full cursor-pointer py-1"
            aria-label="Max words per row slider"
          />
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Limits row length by skipping any subtitle record containing more than{" "}
          <strong className="text-foreground font-mono">{safeMaxWords}</strong> words.
        </p>
      </div>

      {/* 2. Per-Language Max Words Allowed for Translation */}
      {learningLanguages.length > 0 && onLanguageMaxWordsChange && (
        <div
          id="learning-goals-per-language-max-words-section"
          data-testid="learning-goals-per-language-max-words-section"
          className="space-y-2 bg-background/70 p-2.5 rounded-md border border-border/70"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Languages className="h-3.5 w-3.5 text-primary shrink-0" />
              <span
                data-testid="learning-goals-per-language-label"
                className="text-xs font-semibold text-foreground select-none"
              >
                Per-Language Max Words for Translation:
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              Overrides default ({safeMaxWords})
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {learningLanguages.map((lang) => {
              const customVal = languageMaxWords[lang.code];
              const hasOverride = typeof customVal === "number" && customVal > 0;
              const effectiveVal = hasOverride ? customVal : safeMaxWords;

              return (
                <div
                  key={lang.code}
                  data-testid={`learning-goals-lang-max-words-${lang.code}`}
                  className="flex flex-wrap items-center justify-between gap-2 p-1.5 px-2 rounded-md bg-card/60 border border-border/60 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-foreground">{lang.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({lang.code})
                    </span>
                    {hasOverride ? (
                      <span className="text-[9px] font-mono bg-primary/15 text-primary px-1.5 py-0.2 rounded font-semibold">
                        Custom: {effectiveVal}w
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-muted-foreground/80 px-1">
                        Default ({safeMaxWords}w)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      data-testid={`learning-goals-lang-decrement-${lang.code}`}
                      onClick={() => {
                        const nextVal = Math.max(minWords, effectiveVal - 1);
                        onLanguageMaxWordsChange(lang.code, nextVal);
                      }}
                      disabled={effectiveVal <= minWords}
                      aria-label={`Decrease max words for ${lang.name}`}
                      className="flex h-5 w-5 items-center justify-center rounded border border-input text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <input
                      data-testid={`learning-goals-lang-max-words-input-${lang.code}`}
                      type="number"
                      min={minWords}
                      max={maxWordsLimit}
                      value={effectiveVal}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        if (!isNaN(parsed)) {
                          onLanguageMaxWordsChange(
                            lang.code,
                            Math.max(minWords, Math.min(maxWordsLimit, parsed)),
                          );
                        }
                      }}
                      aria-label={`Max words for ${lang.name}`}
                      className="h-5 w-9 text-center font-mono text-xs font-semibold rounded border border-input bg-background text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      data-testid={`learning-goals-lang-increment-${lang.code}`}
                      onClick={() => {
                        const nextVal = Math.min(maxWordsLimit, effectiveVal + 1);
                        onLanguageMaxWordsChange(lang.code, nextVal);
                      }}
                      disabled={effectiveVal >= maxWordsLimit}
                      aria-label={`Increase max words for ${lang.name}`}
                      className="flex h-5 w-5 items-center justify-center rounded border border-input text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>

                    {hasOverride && (
                      <button
                        type="button"
                        data-testid={`learning-goals-lang-reset-${lang.code}`}
                        onClick={() => onLanguageMaxWordsChange(lang.code, undefined)}
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 px-1 py-0.5 rounded border border-border/40 hover:bg-muted/40 ml-1"
                        title={`Reset ${lang.name} to default limit`}
                      >
                        <RotateCcw className="h-2.5 w-2.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
            Sentences exceeding a language's word limit are excluded from translation and narration for that language.
          </p>
        </div>
      )}

      {/* 3. Complete Sentence Filter Control */}
      <div
        id="learning-goals-complete-sentence-section"
        data-testid="learning-goals-complete-sentence-section"
        className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-background/70 border border-border/70"
      >
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <label
              htmlFor="learning-goals-skip-incomplete-switch"
              data-testid="learning-goals-skip-incomplete-label"
              className="text-xs font-medium text-foreground cursor-pointer select-none"
            >
              Complete Sentences Only
            </label>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-bold border border-border">
              Ends with , . ? !
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Skip any record that does not end with terminal punctuation (
            <code className="text-primary font-mono text-[10px]">,</code>,{" "}
            <code className="text-primary font-mono text-[10px]">.</code>,{" "}
            <code className="text-primary font-mono text-[10px]">?</code>,{" "}
            <code className="text-primary font-mono text-[10px]">!</code>).
          </p>
        </div>

        <Switch
          id="learning-goals-skip-incomplete-switch"
          data-testid="learning-goals-skip-incomplete-switch"
          checked={skipIncompleteSentences}
          onCheckedChange={onSkipIncompleteSentencesChange}
          aria-label="Skip incomplete sentences"
          className="shrink-0"
        />
      </div>
    </div>
  );
};
