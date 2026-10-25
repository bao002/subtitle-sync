import React from "react";
import { Check } from "lucide-react";

export interface BeginnerFavoriteLanguageSelectorProps {
  catalog: Array<{ code: string; name: string }>;
  favoriteLanguages: string[];
  selectedLanguages: string[];
  onSelectionChange: (languages: string[]) => void;
}

export function BeginnerFavoriteLanguageSelector({
  catalog,
  favoriteLanguages,
  selectedLanguages,
  onSelectionChange,
}: BeginnerFavoriteLanguageSelectorProps) {
  const favoriteOptions = favoriteLanguages.map(
    (code) => catalog.find((language) => language.code === code) ?? { code, name: code },
  );

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
                onClick={() => {
                  const nextLanguages = isSelected
                    ? selectedLanguages.filter((language) => language !== code)
                    : [...selectedLanguages, code];
                  onSelectionChange(nextLanguages);
                }}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-emerald-600/50 bg-emerald-600/15 text-emerald-800 dark:text-emerald-200"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {name}
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
