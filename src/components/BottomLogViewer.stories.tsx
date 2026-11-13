import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { BottomLogViewer } from "./BottomLogViewer";
import { logStateMachineAction, logError, logInfo } from "@/utils/logBuffer";

const meta: Meta<typeof BottomLogViewer> = {
  title: "Components/BottomLogViewer",
  component: BottomLogViewer,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Universal activity and state machine log viewer placed at the bottom of every page/stage with copy and clear controls.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BottomLogViewer>;

const LogViewerWrapper: React.FC<{ defaultExpanded?: boolean }> = ({ defaultExpanded }) => {
  React.useEffect(() => {
    logBuffer.clear();
    logStateMachineAction("INIT_STORYBOOK_SESSION", { mode: "storybook", status: "ready" });
    logInfo("Subtitles", "Subtitles stream initialized for sample video");
    logError("PlaybackEngine", "Playback paused: waiting for TTS voice synthesis");
    logInfo("Recovery", "Retrying synthesis queue after timeout");
  }, []);

  return (
    <div className="flex flex-col min-h-[300px] justify-end bg-background p-4 border border-border rounded-xl">
      <div className="flex-1 p-4 text-xs text-muted-foreground">
        Simulated page contents above bottom log element. Includes Copy Error Only and Copy Around Error actions when errors are present.
      </div>
      <BottomLogViewer defaultExpanded={defaultExpanded} />
    </div>
  );
};

export const Collapsed: Story = {
  render: () => <LogViewerWrapper defaultExpanded={false} />,
};

export const ExpandedWithRecords: Story = {
  render: () => <LogViewerWrapper defaultExpanded={true} />,
};
