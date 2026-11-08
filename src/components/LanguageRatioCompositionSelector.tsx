import React, { useState } from "react";
import { Sliders, BookmarkCheck, Plus, Check, Trash2, X } from "lucide-react";
import {
  type LanguageRatioComposition,
  getStoredRatioCompositions,
} from "@/utils/ratioCompositionsManager";

export interface LanguageRatioCompositionSelectorProps {
  activeCompositionId: string;
  onSelectComposition: (composition: LanguageRatioComposition) => void;
  onSaveProfile?: (name: string) => void;
  onDeleteProfile?: (id: string) => void;
  compositions?: LanguageRatioComposition[];
  className?: string;
  compact?: boolean;
}

/**
 * LanguageRatioCompositionSelector
 *
 * An easy dropdown list located next/around the video player that allows users
 * to quickly switch between stored language ratio & learning goal profiles,
 * and save new profiles with a single click.
 */
export const LanguageRatioCompositionSelector: React.FC<
  LanguageRatioCompositionSelectorProps
> = ({
  activeCompositionId,
  onSelectComposition,
  onSaveProfile,
  onDeleteProfile,
  compositions: propCompositions,
  className = "",
  compact = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [profileName, setProfileName] = useState("");

  const compositions = propCompositions || getStoredRatioCompositions();
  const activeComp =
    compositions.find((c) => c.id === activeCompositionId) || compositions[0];

  const handleConfirmSave = () => {
    const trimmed = profileName.trim();
    if (!trimmed) return;
    if (onSaveProfile) {
      onSaveProfile(trimmed);
    }
    setProfileName("");
    setIsAdding(false);
  };

  return (
    <div
      data-testid="ratio-compositions-selector-container"
      id="ratio-compositions-selector-container"
      className={`inline-flex items-center flex-wrap gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/80 bg-card/85 text-xs shadow-xs backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
        <Sliders className="h-3.5 w-3.5 text-primary shrink-0" />
        {!compact && (
          <span className="font-semibold text-foreground text-[11px] hidden sm:inline">
            Learning Profile:
          </span>
        )}
      </div>

      <div className="relative inline-flex items-center">
        <select
          data-testid="ratio-compositions-dropdown"
          id="ratio-compositions-dropdown"
          aria-label="Language learning profiles and ratio compositions dropdown"
          value={activeComp?.id || ""}
          onChange={(e) => {
            const selected = compositions.find((c) => c.id === e.target.value);
            if (selected) {
              onSelectComposition(selected);
            }
          }}
          className="rounded-md border border-input bg-background/95 hover:bg-background px-2.5 py-1 pr-6 text-xs font-medium text-foreground transition-colors shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer max-w-[210px] truncate"
        >
          {compositions.map((comp) => {
            return (
              <option key={comp.id} value={comp.id}>
                {comp.name} {comp.isBuiltIn ? "(Preset)" : "(Custom Profile)"}
              </option>
            );
          })}
        </select>
      </div>

      {/* Delete custom profile button */}
      {!activeComp?.isBuiltIn && onDeleteProfile && (
        <button
          type="button"
          data-testid="delete-custom-profile-button"
          onClick={() => onDeleteProfile(activeComp.id)}
          className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors shrink-0"
          title={`Delete custom profile: ${activeComp.name}`}
          aria-label={`Delete custom profile ${activeComp.name}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      {/* Inline Save New Profile Form */}
      {onSaveProfile && (
        <>
          {isAdding ? (
            <div
              data-testid="save-profile-inline-form"
              className="inline-flex items-center gap-1 bg-background/90 px-1.5 py-0.5 rounded border border-border"
            >
              <input
                type="text"
                data-testid="save-profile-name-input"
                placeholder="Profile name..."
                value={profileName}
                autoFocus
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmSave();
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setProfileName("");
                  }
                }}
                className="h-6 w-28 px-1.5 text-[11px] rounded bg-muted/30 border-none focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                data-testid="confirm-save-profile-button"
                onClick={handleConfirmSave}
                disabled={!profileName.trim()}
                className="p-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-40"
                title="Save Profile"
                aria-label="Confirm save profile"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setProfileName("");
                }}
                className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
                title="Cancel"
                aria-label="Cancel save profile"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="open-save-profile-button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-[11px] font-medium text-secondary-foreground transition-colors shrink-0 shadow-2xs"
              title="Save current settings as new learning profile"
              aria-label="Save current learning profile"
            >
              <Plus className="h-3 w-3 text-primary" />
              <span>Save Profile</span>
            </button>
          )}
        </>
      )}

      {activeComp && !isAdding && (
        <span
          data-testid="active-ratio-composition-badge"
          className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 hidden md:inline-flex items-center gap-1"
          title={`Active profile: ${activeComp.name}`}
        >
          <BookmarkCheck className="h-2.5 w-2.5" />
          <span>Active</span>
        </span>
      )}
    </div>
  );
};
