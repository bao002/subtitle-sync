import React from "react";
import { AudioLines } from "lucide-react";

export type BeginnerTtsService = "native" | "google";

interface BeginnerTtsServiceControlProps {
  service: BeginnerTtsService;
  onServiceChange: (service: BeginnerTtsService) => void;
}

export const BeginnerTtsServiceControl: React.FC<BeginnerTtsServiceControlProps> = ({
  service,
  onServiceChange,
}) => (
  <fieldset
    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2"
    data-testid="beginner-tts-service-control"
    data-control-category="daily-usage"
  >
    <legend className="sr-only">Subtitle speech service</legend>
    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
      <AudioLines className="h-3.5 w-3.5 text-primary" />
      Speech service
    </span>
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground">
      <input
        type="radio"
        name="beginner-tts-service"
        value="native"
        data-testid="beginner-tts-service-native"
        checked={service === "native"}
        onChange={() => onServiceChange("native")}
      />
      Native device voice
    </label>
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground">
      <input
        type="radio"
        name="beginner-tts-service"
        value="google"
        data-testid="beginner-tts-service-google"
        checked={service === "google"}
        onChange={() => onServiceChange("google")}
      />
      Google TTS (primary)
    </label>
    <span className="text-[10px] text-muted-foreground">
      Google plays directly, not only as a fallback.
    </span>
  </fieldset>
);
