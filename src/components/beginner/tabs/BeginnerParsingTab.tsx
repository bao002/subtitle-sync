import React, { useState, useMemo } from "react";
import { Split, Scissors, Plus, Trash2, ArrowRight, Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { removeSpecialCharacters } from "../../../utils/captionParser";

export interface CustomCharRule {
  id: string;
  target: string;
  replacement: string;
}

export interface BeginnerParsingTabProps {
  splitByPunctuation: boolean;
  onSplitByPunctuationChange: (enabled: boolean) => void;
  punctuationChars: string[];
  onPunctuationCharsChange: (chars: string[]) => void;
  stripSpeakerBrackets: boolean;
  onStripSpeakerBracketsChange: (enabled: boolean) => void;
  removeChars: string[];
  onRemoveCharsChange: (chars: string[]) => void;
  sampleCues?: Array<{ text: string; start: number; duration: number }>;
  onApplyParsing?: () => void;
  onContinueToNextTab?: () => void;
}

export function cleanSubtitleText(
  text: string,
  options: {
    stripSpeakerBrackets: boolean;
    removeChars: string[];
    customRules?: CustomCharRule[];
  },
): string {
  // Use unified application stage 3 sanitization logic for 100% parity between beginner and advanced modes
  return removeSpecialCharacters(text, options);
}

export function splitTextByPunctuation(text: string, punctuationChars: string[]): string[] {
  if (!text) return [];
  if (!punctuationChars || punctuationChars.length === 0) return [text];

  // Escape special regex characters in punctuationChars
  const escaped = punctuationChars
    .map((c) => (/[.*+?^${}()|[\]\\]/.test(c) ? `\\${c}` : c))
    .join("");

  const regex = new RegExp(`([^${escaped}]+[${escaped}]+)`, "g");
  const matches = text.match(regex);
  if (!matches) return [text];

  // Collect segments and remaining trailing text
  const segments: string[] = [];
  let lastIndex = 0;
  for (const m of matches) {
    const trimmed = m.trim();
    if (trimmed) segments.push(trimmed);
    lastIndex = text.indexOf(m, lastIndex) + m.length;
  }

  const remainder = text.slice(lastIndex).trim();
  if (remainder) segments.push(remainder);

  return segments.length > 0 ? segments : [text];
}

export const BeginnerParsingTab: React.FC<BeginnerParsingTabProps> = ({
  splitByPunctuation,
  onSplitByPunctuationChange,
  punctuationChars,
  onPunctuationCharsChange,
  stripSpeakerBrackets,
  onStripSpeakerBracketsChange,
  removeChars,
  onRemoveCharsChange,
  sampleCues = [],
  onApplyParsing,
  onContinueToNextTab,
}) => {
  const [newCharInput, setNewCharInput] = useState("");
  const [newReplacementInput, setNewReplacementInput] = useState("");
  const [customRules, setCustomRules] = useState<CustomCharRule[]>([
    { id: "rule-gt", target: ">", replacement: "" },
    { id: "rule-dgt", target: ">>", replacement: "" },
  ]);
  const [expandedHelp, setExpandedHelp] = useState<Record<string, boolean>>({});

  const defaultPunctuationMarks = [
    { char: ".", label: "Period (.)" },
    { char: "!", label: "Exclamation (!)" },
    { char: "?", label: "Question (?)" },
    { char: ",", label: "Comma (,)" },
    { char: ";", label: "Semicolon (;)" },
    { char: ":", label: "Colon (:)" },
  ];

  const handleTogglePunctuation = (char: string) => {
    if (punctuationChars.includes(char)) {
      onPunctuationCharsChange(punctuationChars.filter((c) => c !== char));
    } else {
      onPunctuationCharsChange([...punctuationChars, char]);
    }
  };

  const handleAddRemoveChar = (charToAdd: string) => {
    if (!charToAdd) return;
    const trimmed = charToAdd.trim();
    if (trimmed && !removeChars.includes(trimmed)) {
      onRemoveCharsChange([...removeChars, trimmed]);
    }
    setNewCharInput("");
  };

  const handleRemoveCharFromList = (charToRemove: string) => {
    onRemoveCharsChange(removeChars.filter((c) => c !== charToRemove));
  };

  const handleAddCustomRule = () => {
    if (!newCharInput.trim()) return;
    const rule: CustomCharRule = {
      id: `rule-${Date.now()}`,
      target: newCharInput.trim(),
      replacement: newReplacementInput,
    };
    setCustomRules([...customRules, rule]);
    if (newReplacementInput === "" && !removeChars.includes(rule.target)) {
      onRemoveCharsChange([...removeChars, rule.target]);
    }
    setNewCharInput("");
    setNewReplacementInput("");
  };

  const handleRemoveCustomRule = (id: string) => {
    const found = customRules.find((r) => r.id === id);
    if (found && found.replacement === "") {
      handleRemoveCharFromList(found.target);
    }
    setCustomRules(customRules.filter((r) => r.id !== id));
  };

  const previewSource = useMemo(() => sampleCues.slice(0, 4), [sampleCues]);

  const processedPreview = useMemo(() => {
    return previewSource.map((cue) => {
      const cleaned = cleanSubtitleText(cue.text, {
        stripSpeakerBrackets,
        removeChars,
        customRules,
      });
      const sentences = splitByPunctuation
        ? splitTextByPunctuation(cleaned, punctuationChars)
        : [cleaned];
      return {
        sentences,
      };
    });
  }, [
    previewSource,
    stripSpeakerBrackets,
    removeChars,
    customRules,
    splitByPunctuation,
    punctuationChars,
  ]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-3" data-testid="beginner-parsing-tab">
      {/* Tab Header */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <Split className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-foreground">
                Step 3: Subtitle Parsing & Cleanup
              </h2>
              <button
                type="button"
                data-testid="help-btn-beginner-parsing-header"
                onClick={() => setExpandedHelp((prev) => ({ ...prev, header: !prev.header }))}
                className="w-4 h-4 rounded-full border border-muted-foreground/30 text-muted-foreground hover:text-foreground inline-flex items-center justify-center text-[10px] font-bold"
                title="More info"
                aria-label="More info about Step 3"
              >
                ?
              </button>
            </div>
            {expandedHelp.header && (
              <p
                data-testid="help-text-beginner-parsing-header"
                className="text-xs text-muted-foreground mt-1 bg-muted/20 p-2 rounded border border-border/40"
              >
                Configure sentence splitting rules and automatically remove speaker labels or arrows
                (such as &gt;).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 1. Character Removal & Renaming (Special Characters Removal & Sanitization - Stage 3) */}
      <div
        className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-3"
        data-testid="beginner-chars-removal-section"
      >
        <div className="flex items-center gap-1.5">
          <Scissors className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">
            Character Removal & Rename Rules
          </h3>
          <button
            type="button"
            data-testid="help-btn-beginner-chars-rules"
            onClick={() => setExpandedHelp((prev) => ({ ...prev, charsRules: !prev.charsRules }))}
            className="w-4 h-4 rounded-full border border-muted-foreground/30 text-muted-foreground hover:text-foreground inline-flex items-center justify-center text-[10px] font-bold"
            title="More info"
            aria-label="More info about character removal rules"
          >
            ?
          </button>
        </div>
        {expandedHelp.charsRules && (
          <p
            data-testid="help-text-beginner-chars-rules"
            className="text-[11px] text-muted-foreground bg-muted/20 p-1.5 rounded border border-border/40"
          >
            Clean unwanted artifacts, noise indicators, or speaker prefixes before subtitle
            rendering and TTS speech.
          </p>
        )}

        {/* Preset 1: Speaker Brackets & Greater-than symbols */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-foreground">
                Strip Speaker Brackets &amp; Arrows
              </span>
              <button
                type="button"
                data-testid="help-btn-beginner-strip-brackets"
                onClick={() =>
                  setExpandedHelp((prev) => ({ ...prev, stripBrackets: !prev.stripBrackets }))
                }
                className="w-4 h-4 rounded-full border border-muted-foreground/30 text-muted-foreground hover:text-foreground inline-flex items-center justify-center text-[10px] font-bold"
                title="More info"
                aria-label="More info about speaker brackets"
              >
                ?
              </button>
            </div>
            {expandedHelp.stripBrackets && (
              <p
                data-testid="help-text-beginner-strip-brackets"
                className="text-[11px] text-muted-foreground bg-muted/20 p-1.5 rounded border border-border/40"
              >
                Removes [Applause], (Music), and &gt; or &gt;&gt; speaker tags automatically.
              </p>
            )}
          </div>
          <Switch
            checked={stripSpeakerBrackets}
            onCheckedChange={onStripSpeakerBracketsChange}
            data-testid="toggle-strip-brackets"
          />
        </div>

        {/* Active Remove Characters Chips */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs text-foreground/90 font-medium">
            Characters removed from subtitles:
          </span>
          <div className="flex flex-wrap gap-1.5" data-testid="remove-chars-chips">
            {removeChars.map((char) => (
              <Badge
                key={char}
                variant="secondary"
                className="bg-background border border-border text-foreground font-mono text-xs pl-2.5 pr-1 py-1 flex items-center gap-1.5"
                data-testid={`remove-char-${char}`}
              >
                <span>&quot;{char}&quot;</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCharFromList(char)}
                  className="w-4 h-4 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={`Keep ${char}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom Rule Input */}
        <div className="space-y-2 pt-1 border-t border-border">
          <span className="text-xs text-foreground/90 font-medium">
            Add custom character removal / rename:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="text"
              value={newCharInput}
              onChange={(e) => setNewCharInput(e.target.value)}
              placeholder="Char to remove (e.g. >)"
              className="h-8 text-xs bg-background border-border text-foreground w-36"
              data-testid="input-remove-char"
            />
            <Input
              type="text"
              value={newReplacementInput}
              onChange={(e) => setNewReplacementInput(e.target.value)}
              placeholder="Replace with (leave blank to remove)"
              className="h-8 text-xs bg-background border-border text-foreground w-48"
              data-testid="input-replace-char"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustomRule}
              className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              data-testid="btn-add-char-rule"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Rule
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Sentence Splitting Toggle & Punctuation Selectors (Stage 4) */}
      <div
        className="bg-card border border-border rounded-xl p-3.5 shadow-sm space-y-3"
        data-testid="beginner-parser-section"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-foreground">
                Sentence Punctuation Splitting
              </h3>
              <button
                type="button"
                data-testid="help-btn-beginner-sentence-splitting"
                onClick={() =>
                  setExpandedHelp((prev) => ({
                    ...prev,
                    sentenceSplitting: !prev.sentenceSplitting,
                  }))
                }
                className="w-4 h-4 rounded-full border border-muted-foreground/30 text-muted-foreground hover:text-foreground inline-flex items-center justify-center text-[10px] font-bold"
                title="More info"
                aria-label="More info about sentence splitting"
              >
                ?
              </button>
            </div>
            {expandedHelp.sentenceSplitting && (
              <p
                data-testid="help-text-beginner-sentence-splitting"
                className="text-[11px] text-muted-foreground mt-1 bg-muted/20 p-1.5 rounded border border-border/40"
              >
                Default to splitting long subtitle blocks into natural sentences at punctuation
                marks.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {splitByPunctuation ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={splitByPunctuation}
              onCheckedChange={onSplitByPunctuationChange}
              data-testid="toggle-split-punctuation"
            />
          </div>
        </div>

        {splitByPunctuation && (
          <div className="pt-2 border-t border-border space-y-2">
            <span className="text-xs text-foreground/90 font-medium">
              Choose punctuation marks to split on:
            </span>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              data-testid="punctuation-checkboxes"
            >
              {defaultPunctuationMarks.map((p) => {
                const isChecked = punctuationChars.includes(p.char);
                return (
                  <label
                    key={p.char}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleTogglePunctuation(p.char)}
                    />
                    <span className="font-mono font-semibold text-primary">{p.char}</span>
                    <span>{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2" data-testid="parsing-live-preview">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Eye className="h-3.5 w-3.5" />
          Live parser output
        </div>
        {processedPreview.length > 0 ? (
          <ol className="space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
            {processedPreview.flatMap((cue, cueIndex) =>
              cue.sentences.map((sentence, sentenceIndex) => (
                <li
                  key={`${cueIndex}-${sentenceIndex}`}
                  className="text-foreground"
                  data-testid="parser-live-output-sentence"
                >
                  {sentence}
                </li>
              )),
            )}
          </ol>
        ) : (
          <p className="rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
            Load subtitles to see the parser output update here.
          </p>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="pt-2 flex items-center justify-between gap-3">
        {onApplyParsing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onApplyParsing}
            className="h-8 px-3 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/40"
            data-testid="btn-apply-parsing"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Apply Rules to Active Video
          </Button>
        ) : (
          <div />
        )}

        {onContinueToNextTab && (
          <Button
            type="button"
            size="sm"
            onClick={onContinueToNextTab}
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5"
            data-testid="btn-continue-to-player"
          >
            <span>Next: Synchronized Player</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
