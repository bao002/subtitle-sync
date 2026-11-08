import React, { useState } from "react";
import { Sliders, BookmarkCheck, Plus, Check, Trash2, X, Edit2, RotateCw } from "lucide-react";
import {
  type LanguageRatioComposition,
  getStoredRatioCompositions,
} from "@/utils/ratioCompositionsManager";

export interface LanguageRatioCompositionSelectorProps {
  activeCompositionId: string;
  onSelectComposition: (composition: LanguageRatioComposition) => void;
  onSaveProfile?: (name: string) => void;
  onUpdateProfile?: (id: string, updates: Partial<LanguageRatioComposition>) => void;
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
 * save new profiles, update existing profiles, rename them, and delete them.
 */
export const LanguageRatioCompositionSelector: React.FC<
  LanguageRatioCompositionSelectorProps
> = ({
  activeCompositionId,
  onSelectComposition,
  onSaveProfile,
  onUpdateProfile,
  onDeleteProfile,
  compositions: propCompositions,
  className = "",
  compact = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

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

  const handleConfirmEditName = () => {
    const trimmed = editedName.trim();
    if (!trimmed || !activeComp) return;
    if (onUpdateProfile) {
      onUpdateProfile(activeComp.id, { name: trimmed });
    }
    setIsEditingName(false);
    setEditedName("");
  };

  const handleUpdateCurrentProfile = () => {
    if (!activeComp || activeComp.isBuiltIn || !onUpdateProfile) return;
    onUpdateProfile(activeComp.id, {});
  };

  return (
    <div
      data-testid="ratio-compositions-selector-container"
      id="ratio-compositions-selector-container"
      className={`inline-flex flex-col gap-1 p-2 rounded-lg border border-border/80 bg-card/85 text-xs shadow-xs backdrop-blur-xs ${className}`}
    >
      {/* Profile Name Set On Top */}
      <div
        data-testid="profile-name-top-bar"
        className="flex items-center justify-between gap-1.5 border-b border-border/40 pb-1 w-full"
      >
        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
          <Sliders className="h-3 w-3 text-primary shrink-0" />
          <span
            data-testid="profile-name-top-label"
            className="font-semibold text-foreground text-[10px] uppercase tracking-wider"
          >
            Profile:
          </span>
          <span
            data-testid="active-profile-name-text"
            className="font-bold text-xs text-primary truncate max-w-[180px]"
            title={activeComp?.name}
          >
            {activeComp?.name || "Standard (Even)"}
          </span>
        </div>
        <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-primary/10 text-primary shrink-0">
          {activeComp?.isBuiltIn ? "Preset" : "Custom"}
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-1.5">
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

      {/* Update & Rename controls for custom profiles */}
      {!activeComp?.isBuiltIn && onUpdateProfile && !isEditingName && (
        <>
          <button
            type="button"
            data-testid="update-active-profile-button"
            onClick={handleUpdateCurrentProfile}
            className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors shrink-0"
            title={`Update profile "${activeComp.name}" with current settings & speech rates`}
            aria-label={`Update profile ${activeComp.name} with current settings`}
          >
            <RotateCw className="h-3 w-3" />
          </button>
          <button
            type="button"
            data-testid="edit-profile-name-button"
            onClick={() => {
              setEditedName(activeComp.name);
              setIsEditingName(true);
            }}
            className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors shrink-0"
            title={`Rename profile "${activeComp.name}"`}
            aria-label={`Rename profile ${activeComp.name}`}
          >
            <Edit2 className="h-3 w-3" />
          </button>
        </>
      )}

      {/* Inline Rename Form */}
      {isEditingName && (
        <div
          data-testid="edit-profile-name-form"
          className="inline-flex items-center gap-1 bg-background/90 px-1.5 py-0.5 rounded border border-border"
        >
          <input
            type="text"
            data-testid="edit-profile-name-input"
            value={editedName}
            autoFocus
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirmEditName();
              if (e.key === "Escape") {
                setIsEditingName(false);
                setEditedName("");
              }
            }}
            className="h-6 w-28 px-1.5 text-[11px] rounded bg-muted/30 border-none focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            data-testid="confirm-edit-profile-button"
            onClick={handleConfirmEditName}
            disabled={!editedName.trim()}
            className="p-1 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-40"
            title="Confirm Rename"
            aria-label="Confirm rename profile"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditingName(false);
              setEditedName("");
            }}
            className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
            title="Cancel"
            aria-label="Cancel rename profile"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Delete custom profile button */}
      {!activeComp?.isBuiltIn && onDeleteProfile && !isEditingName && (
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
    </div>
  );
};
