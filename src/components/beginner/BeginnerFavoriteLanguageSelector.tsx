import React from "react";
import { Check } from "lucide-react";
import { ALL_KNOWN_LANGUAGES } from "@/utils/appSettings";

export interface BeginnerFavoriteLanguageSelectorProps {
  catalog: Array<{ code: string; name: string }>;
  favoriteLanguages: string[];
  selectedLanguages: string[];
  onSelectionChange: (languages: string[]) => void;
}

/**
 * Resolves a language code to its human-readable full display name.
 * Checks the provided catalog, global catalog, and standard Intl.DisplayNames before falling back.
 */
export function getDisplayLanguageName(
  code: string,
  catalog?: Array<{ code: string; name: string }>,
): string {
  if (!code) return "";
  const normalized = code.trim().toLowerCase();

  // 1. Check provided catalog
  const catalogMatch = catalog?.find((l) => l.code.toLowerCase() === normalized);
  if (catalogMatch?.name && catalogMatch.name.trim().toLowerCase() !== normalized) {
    return catalogMatch.name;
  }

  // 2. Check complete application supported languages catalog
  const knownMatch = ALL_KNOWN_LANGUAGES.find((l) => l.code.toLowerCase() === normalized);
  if (knownMatch?.name) {
    return knownMatch.name;
  }

  // 3. Fallback to standard Intl.DisplayNames
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
      const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
      const resolved = displayNames.of(code);
      if (resolved && resolved.trim().toLowerCase() !== normalized) {
        return resolved;
      }
    }
  } catch {
    // fallback to code
  }

  return code;
}

export function BeginnerFavoriteLanguageSelector({
  catalog,
  favoriteLanguages,
  selectedLanguages,
  onSelectionChange,
}: BeginnerFavoriteLanguageSelectorProps) {
  const favoriteOptions = favoriteLanguages.map((code) => {
    const name = getDisplayLanguageName(code, catalog);
    return { code, name };
  });

  return (
    <section
      className="space-y-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3"
      aria-label="Favorite target languages"
      data-testid="beginner-favorite-language-selector"
      data-control-category="daily-usage"
    >
      <h3 className="text-xs font-semibold text-foreground">Target languages from favorites</h3>
      {favoriteOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {favoriteOptions.map(({ code, name }) => {
            const isSelected = selectedLanguages.includes(code);
            return (
              <button
                key={code}
                type="button"
                aria-pressed={isSelected}
                data-testid={`beginner-favorite-language-${code}`}
                title={name}
                aria-label={`Select ${name} as target subtitle language`}
                onClick={() => {
                  const nextLanguages = isSelected
                    ? selectedLanguages.filter((language) => language !== code)
                    : [...selectedLanguages, code];
                  onSelectionChange(nextLanguages);
                }}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
                  isSelected
                    ? "border-emerald-600/60 bg-emerald-600/15 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-600/25"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                <span className="truncate max-w-[160px]">{name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Add favorite languages in General Preferences to select target subtitles here.
        </p>
      )}
    </section>
  );
}
