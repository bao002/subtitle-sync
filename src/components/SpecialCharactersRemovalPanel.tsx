import React, { useState, useMemo } from "react";
import { Scissors, Plus, Trash2, Eye, Sparkles, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { removeSpecialCharacters } from "../utils/captionParser";

export interface CustomCharRule {
  id: string;
  target: string;
  replacement: string;
}

export interface SpecialCharactersRemovalPanelProps {
  stripSpeakerBrackets: boolean;
  onStripSpeakerBracketsChange: (enabled: boolean) => void;
  removeChars: string[];
  onRemoveCharsChange: (chars: string[]) => void;
  sampleCues?: Array<{ text: string; start: number; duration: number }>;
  onResetDefaults?: () => void;
}

export const SpecialCharactersRemovalPanel: React.FC<SpecialCharactersRemovalPanelProps> = ({
  stripSpeakerBrackets,
  onStripSpeakerBracketsChange,
  removeChars,
  onRemoveCharsChange,
  sampleCues = [],
  onResetDefaults,
}) => {
  const [newCharInput, setNewCharInput] = useState("");
  const [newReplacementInput, setNewReplacementInput] = useState("");
  const [customRules, setCustomRules] = useState<CustomCharRule[]>([
    { id: "rule-gt", target: ">", replacement: "" },
    { id: "rule-dgt", target: ">>", replacement: "" },
  ]);
  const [expandedHelp, setExpandedHelp] = useState<Record<string, boolean>>({});

  const handleRemoveCharFromList = (charToRemove: string) => {
    onRemoveCharsChange(removeChars.filter((c) => c !== charToRemove));
  };

  const handleAddCustomRule = () => {
    if (!newCharInput.trim()) return;
    const trimmedTarget = newCharInput.trim();
    const rule: CustomCharRule = {
      id: `rule-${Date.now()}`,
      target: trimmedTarget,
      replacement: newReplacementInput,
    };
    setCustomRules((prev) => [...prev, rule]);
    if (newReplacementInput === "" && !removeChars.includes(trimmedTarget)) {
      onRemoveCharsChange([...removeChars, trimmedTarget]);
    }
    setNewCharInput("");
    setNewReplacementInput("");
  };

  const handleRemoveCustomRule = (id: string) => {
    const found = customRules.find((r) => r.id === id);
    if (found && found.replacement === "") {
      handleRemoveCharFromList(found.target);
    }
    setCustomRules((prev) => prev.filter((r) => r.id !== id));
  };

  const previewSource = sampleCues.slice(0, 3);

  const processedPreview = useMemo(() => {
    return previewSource.map((cue) => {
      const cleaned = removeSpecialCharacters(cue.text, {
        stripSpeakerBrackets,
        removeChars,
        customRules,
      });
      return {
        raw: cue.text,
        cleaned,
        hasChanged: cleaned !== cue.text,
      };
    });
  }, [previewSource, stripSpeakerBrackets, removeChars, customRules]);

  return (
    <div
      className="space-y-4"
      data-testid="special-characters-removal-panel"
      aria-label="Special characters removal panel"
    >
      {/* Header Description & Stage Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-foreground">
              Stage 3: Special Characters Removal & Sanitization
            </span>
            <button
              type="button"
              data-testid="help-btn-advanced-chars-stage"
              onClick={() => setExpandedHelp((prev) => ({ ...prev, stage: !prev.stage }))}
              className="w-4 h-4 rounded-full border border-emerald-400/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 inline-flex items-center justify-center text-[10px] font-bold"
              title="More info"
              aria-label="More info about Stage 3"
            >
              ?
            </button>
          </div>
          {expandedHelp.stage && (
            <p
              data-testid="help-text-advanced-chars-stage"
              className="text-[11px] text-muted-foreground bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20"
            >
              Strips noise indicators, bracketed speaker labels, and arrow prefixes BEFORE
              translation and parser splitting.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onResetDefaults && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetDefaults}
              className="h-7 text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-foreground"
              data-testid="btn-reset-chars-defaults"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reset Defaults
            </Button>
          )}
        </div>
      </div>

      {/* Preset 1: Speaker Brackets & Greater-than arrows */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card hover:bg-muted/20 transition-colors">
        <div className="space-y-0.5 pr-2">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="advanced-strip-speaker-brackets"
              className="text-xs font-semibold text-foreground cursor-pointer"
            >
              Strip Speaker Brackets &amp; Noise Cues
            </label>
            <button
              type="button"
              data-testid="help-btn-advanced-strip-brackets"
              onClick={() =>
                setExpandedHelp((prev) => ({
                  ...prev,
                  stripBrackets: !prev.stripBrackets,
                }))
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
              data-testid="help-text-advanced-strip-brackets"
              className="text-[11px] text-muted-foreground bg-muted/20 p-1.5 rounded border border-border/40"
            >
              Automatically strips <code>[Music]</code>, <code>[Applause]</code>,{" "}
              <code>(cheers)</code>, and speaker prefixes like <code>[Host]:</code>.
            </p>
          )}
        </div>
        <Switch
          id="advanced-strip-speaker-brackets"
          data-testid="advanced-toggle-strip-brackets"
          checked={stripSpeakerBrackets}
          onCheckedChange={onStripSpeakerBracketsChange}
        />
      </div>

      {/* Active Removed Characters Chips */}
      <div className="space-y-2 p-3 rounded-lg border border-border/70 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Target Symbols &amp; Markers to Strip:
          </span>
          <span className="text-[11px] text-muted-foreground">
            {removeChars.length} symbol{removeChars.length === 1 ? "" : "s"} active
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5" data-testid="advanced-remove-chars-chips">
          {removeChars.map((char) => (
            <Badge
              key={char}
              variant="secondary"
              className="bg-background border border-border text-foreground font-mono text-xs pl-2.5 pr-1 py-1 flex items-center gap-1.5"
              data-testid={`advanced-remove-char-${char}`}
            >
              <span>&quot;{char}&quot;</span>
              <button
                type="button"
                onClick={() => handleRemoveCharFromList(char)}
                className="w-4 h-4 rounded hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors"
                aria-label={`Keep ${char}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {removeChars.length === 0 && (
            <span className="text-xs text-muted-foreground italic">
              No character rules specified (raw text retained).
            </span>
          )}
        </div>
      </div>

      {/* Custom Character Removal / Replacement Rules */}
      <div className="space-y-2.5 p-3 rounded-lg border border-border/70 bg-card">
        <span className="text-xs font-semibold text-foreground">
          Add Custom Removal or Replacement Rule:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="text"
            value={newCharInput}
            onChange={(e) => setNewCharInput(e.target.value)}
            placeholder="Char / symbol (e.g. >>)"
            className="h-8 text-xs bg-background border-border text-foreground w-40"
            data-testid="advanced-input-remove-char"
          />
          <Input
            type="text"
            value={newReplacementInput}
            onChange={(e) => setNewReplacementInput(e.target.value)}
            placeholder="Replace with (blank to strip)"
            className="h-8 text-xs bg-background border-border text-foreground flex-1 min-w-[180px]"
            data-testid="advanced-input-replace-char"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustomRule}
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            data-testid="advanced-btn-add-char-rule"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Live Preview Card */}
      <div className="space-y-2 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-foreground">Sanitization Live Preview</span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
          >
            Stage 3 (Pre-Translation)
          </Badge>
        </div>

        <div className="space-y-1.5" data-testid="advanced-chars-removal-preview">
          {processedPreview.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Load subtitles to see the sanitization preview.
            </p>
          ) : (
            processedPreview.map((item, idx) => (
              <div
                key={idx}
                className="bg-background border border-border/80 rounded-md p-2 space-y-1 text-xs"
              >
                {item.hasChanged && (
                  <div className="text-muted-foreground/70 line-through text-[11px] font-mono">
                    {item.raw}
                  </div>
                )}
                <div className="text-foreground font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{item.cleaned}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
