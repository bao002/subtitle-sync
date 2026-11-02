import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  FloatingDraggablePauseButton,
  type FloatingDraggablePauseButtonProps,
} from "./FloatingDraggablePauseButton";

const meta: Meta<typeof FloatingDraggablePauseButton> = {
  title: "Components/FloatingDraggablePauseButton",
  component: FloatingDraggablePauseButton,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Single-icon draggable floating button supporting toggle pause/scroll with expandable popup control dock.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FloatingDraggablePauseButton>;

const InteractiveFloatingWrapper: React.FC<Partial<FloatingDraggablePauseButtonProps>> = (props) => {
  const [isSetupPaused, setIsSetupPaused] = useState(props.isSetupPaused ?? false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(props.isAutoScrollEnabled ?? true);

  return (
    <div className="relative w-full h-[360px] bg-muted/20 border border-dashed border-border rounded-xl p-4 overflow-hidden">
      <div className="text-xs text-muted-foreground">
        Drag or click the floating button anywhere inside this canvas.
      </div>
      <FloatingDraggablePauseButton
        isSetupPaused={isSetupPaused}
        onToggleSetupPause={() => setIsSetupPaused((p) => !p)}
        isAutoScrollEnabled={isAutoScrollEnabled}
        onToggleAutoScroll={() => setIsAutoScrollEnabled((s) => !s)}
        {...props}
      />
    </div>
  );
};

export const NormalActiveState: Story = {
  render: () => <InteractiveFloatingWrapper isSetupPaused={false} isAutoScrollEnabled={true} />,
};

export const SetupPausedState: Story = {
  render: () => <InteractiveFloatingWrapper isSetupPaused={true} isAutoScrollEnabled={false} />,
};
