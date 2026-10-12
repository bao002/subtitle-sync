import React, { useMemo, useState } from "react";
import { LayoutGrid, List, Check, Search, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type LanguageDisplayMode,
  getLanguageDisplayModeSetting,
  setLanguageDisplayModeSetting,
} from "@/utils/appSettings";

export interface LanguageBoxesSelectorProps {
  catalog: Array<{ code: string; name: string }>;
  selectedLanguages: string[];
  onSelectionChange: (next: string[]) => void;
  isAndroid?: boolean;
}

/**
 * LanguageBoxesSelector
 * Presents languages with a button toggle between touch-friendly boxes and compact list.
 * In boxes mode, buttons have large click targets (min-h-[48px]) suitable for Android.
 * Clicked / selected languages are kept strictly at the top of the list.
 */
export const LanguageBoxesSelector: React.FC<LanguageBoxesSelectorProps> = ({
  catalog,
  selectedLanguages,
  onSelectionChange,
  isAndroid = false,
}) => {
  const [displayMode, setDisplayMode] = useState<LanguageDisplayMode>(() =>
    getLanguageDisplayModeSetting(),
  );
  const [searchFilter, setSearchFilter] = useState("");

  const handleToggleMode = () => {
    const nextMode: LanguageDisplayMode = displayMode === "boxes" ? "list" : "boxes";
    setDisplayMode(nextMode);
    setLanguageDisplayModeSetting(nextMode);
  };

  // Keep clicked / selected languages strictly at the top
  const sortedCatalog = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    const filtered = query
      ? catalog.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.code.toLowerCase().includes(query),
        )
      : catalog;

    const selected = filtered.filter((l) => selectedLanguages.includes(l.code));
    const unselected = filtered.filter((l) => !selectedLanguages.includes(l.code));
    return [...selected, ...unselected];
  }, [catalog, selectedLanguages, searchFilter]);

  const toggleLanguage = (code: string) => {
    let next: string[];
    if (selectedLanguages.includes(code)) {
      next = selectedLanguages.filter((c) => c !== code);
    } else {
      next = [...selectedLanguages, code];
    }
    onSelectionChange(next);
  };

  const moveFavoriteLanguage = (code: string, direction: -1 | 1) => {
    const index = selectedLanguages.indexOf(code);
    const nextIdx = index + direction;
    if (index < 0 || nextIdx < 0 || nextIdx >= selectedLanguages.length) return;
    const next = [...selectedLanguages];
    [next[index], next[nextIdx]] = [next[nextIdx]!, next[index]!];
    onSelectionChange(next);
  };

  return (
    <div className="space-y-3" data-testid="language-boxes-selector-wrapper">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label
            htmlFor="target-language-select"
            className="text-sm font-medium text-foreground"
          >
            Favorite languages
          </label>
          <span
            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
            suppressHydrationWarning
          >
            {selectedLanguages.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            id="toggle-language-display-mode"
            data-testid="toggle-language-display-mode"
            variant="outline"
            size="sm"
            onClick={handleToggleMode}
            className="h-8 gap-1.5 text-xs"
            title={`Switch to ${displayMode === "boxes" ? "list" : "boxes"} view`}
          >
            {displayMode === "boxes" ? (
              <>
                <List className="h-3.5 w-3.5" />
                <span>Show as List</span>
              </>
            ) : (
              <>
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Show as Boxes</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selected languages fetch priority reordering bar */}
      {selectedLanguages.length > 0 && (
        <div
          data-testid="selected-languages-order-bar"
          className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <span>Fetch Priority Order</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                (determines sequential fetch order)
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {selectedLanguages.length} {selectedLanguages.length === 1 ? "track" : "tracks"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedLanguages.map((code, idx) => {
              const langMeta = catalog.find((c) => c.code === code) || { code, name: code };
              const isFirst = idx === 0;
              const isLast = idx === selectedLanguages.length - 1;
              return (
                <div
                  key={code}
                  data-testid={`selected-lang-priority-${code}`}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs shadow-xs"
                >
                  <span className="font-mono text-[10px] font-bold text-primary">
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-foreground">{langMeta.name}</span>
                  <div className="flex items-center ml-0.5">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveFavoriteLanguage(code, -1)}
                      data-testid={`move-fav-earlier-${code}`}
                      className="p-0.5 hover:text-primary disabled:opacity-20 text-muted-foreground transition"
                      title={`Move ${langMeta.name} earlier in fetch priority`}
                      aria-label={`Move ${langMeta.name} earlier`}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveFavoriteLanguage(code, 1)}
                      data-testid={`move-fav-later-${code}`}
                      className="p-0.5 hover:text-primary disabled:opacity-20 text-muted-foreground transition"
                      title={`Move ${langMeta.name} later in fetch priority`}
                      aria-label={`Move ${langMeta.name} later`}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional search filter for large catalogs */}
      {catalog.length > 8 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search language by name or code…"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Boxes view: large touch targets for Android, selected kept on top */}
      {displayMode === "boxes" ? (
        <div
          id="language-boxes-grid"
          data-testid="language-boxes-grid"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 max-h-72 overflow-y-auto p-1 rounded-md border border-border bg-muted/10"
        >
          {sortedCatalog.map((lang) => {
            const isSelected = selectedLanguages.includes(lang.code);
            const priorityIdx = selectedLanguages.indexOf(lang.code);
            return (
              <button
                key={lang.code}
                type="button"
                id={`lang-box-${lang.code}`}
                data-testid={`language-box-${lang.code}`}
                data-selected={isSelected}
                onClick={() => toggleLanguage(lang.code)}
                className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-sm font-medium transition-all min-h-[48px] select-none ${
                  isSelected
                    ? "border-primary bg-primary/15 text-primary shadow-sm ring-1 ring-primary/40 font-semibold"
                    : "border-border bg-card hover:bg-accent/40 text-foreground"
                }`}
                title={isSelected ? `Unselect ${lang.name} (Priority #${priorityIdx + 1})` : `Select ${lang.name}`}
              >
                <div className="truncate pr-1 flex items-center gap-1.5 min-w-0">
                  {isSelected && (
                    <span className="shrink-0 font-mono text-[10px] font-bold text-primary bg-primary/20 rounded px-1">
                      #{priorityIdx + 1}
                    </span>
                  )}
                  <span className="truncate text-xs sm:text-sm">{lang.name}</span>
                </div>
                {isSelected ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="shrink-0 rounded bg-muted px-1 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                    {lang.code}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Accessible native select (visible in list mode or kept available for automation and standard multi-select) */}
      <div className={displayMode === "boxes" ? "sr-only" : "block"}>
        <select
          id="target-language-select"
          data-testid="target-language-select"
          aria-label="Target languages"
          suppressHydrationWarning
          multiple
          size={isAndroid ? Math.min(catalog.length, 6) : catalog.length}
          value={selectedLanguages}
          onChange={(event) => {
            const next = Array.from(
              event.target.selectedOptions,
              (option) => option.value,
            );
            onSelectionChange(next);
          }}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        >
          {sortedCatalog.map((lang) => {
            const isSel = selectedLanguages.includes(lang.code);
            const pIdx = selectedLanguages.indexOf(lang.code);
            return (
              <option key={lang.code} value={lang.code}>
                {isSel ? `✓ [#${pIdx + 1}] ${lang.name}` : lang.name}
              </option>
            );
          })}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {isAndroid
          ? "Tap any language box to add to favorites. Selected languages stay at the top and fetch in priority order."
          : "Tap language boxes to toggle favorites. Selected languages stay at the top."}
      </p>
    </div>
  );
};
