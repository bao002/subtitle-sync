import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  VideoPlaybackPrecedenceBar,
  type VideoPlaybackPrecedenceBarProps,
} from "./VideoPlaybackPrecedenceBar";

const meta: Meta<typeof VideoPlaybackPrecedenceBar> = {
  title: "Components/VideoPlaybackPrecedenceBar",
  component: VideoPlaybackPrecedenceBar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof VideoPlaybackPrecedenceBar>;

const InteractivePrecedenceDemo: React.FC = () => {
  const [position, setPosition] = useState<number>(1);
  const sampleRecords = ["English", "Hebrew", "Spanish", "Russian"];

  return (
    <div className="space-y-4 max-w-2xl border border-border rounded-xl p-4 bg-card">
      <h3 className="text-sm font-semibold text-foreground">
        Interactive Pointed Table Records Demo
      </h3>
      <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="p-2 text-left">Order</th>
            <th className="p-2 text-left">Record / Language</th>
            <th className="p-2 text-right">Quick Action</th>
          </tr>
        </thead>
        <tbody>
          {position === 0 && (
            <VideoPlaybackPrecedenceBar
              currentPosition={position}
              totalRecords={sampleRecords.length}
              onMoveUp={() => setPosition((p) => Math.max(0, p - 1))}
              onMoveDown={() => setPosition((p) => Math.min(sampleRecords.length, p + 1))}
              onPlaceAtTop={() => setPosition(0)}
              onPlaceAtBottom={() => setPosition(sampleRecords.length)}
              asTableRow
              colSpan={3}
            />
          )}
          {sampleRecords.map((name, idx) => (
            <React.Fragment key={name}>
              <tr className="border-b border-border/40 hover:bg-muted/20">
                <td className="p-2 font-mono">{idx + 1}</td>
                <td className="p-2 font-medium">{name}</td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    onClick={() => setPosition(idx)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Place Video Above
                  </button>
                </td>
              </tr>
              {position === idx + 1 && (
                <VideoPlaybackPrecedenceBar
                  currentPosition={position}
                  totalRecords={sampleRecords.length}
                  onMoveUp={() => setPosition((p) => Math.max(0, p - 1))}
                  onMoveDown={() => setPosition((p) => Math.min(sampleRecords.length, p + 1))}
                  onPlaceAtTop={() => setPosition(0)}
                  onPlaceAtBottom={() => setPosition(sampleRecords.length)}
                  asTableRow
                  colSpan={3}
                />
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractivePrecedenceDemo />,
};

export const VideoFirst: Story = {
  args: {
    currentPosition: 0,
    totalRecords: 4,
    asTableRow: false,
    onMoveUp: () => {},
    onMoveDown: () => {},
    onPlaceAtTop: () => {},
    onPlaceAtBottom: () => {},
  },
};

export const VideoInBetween: Story = {
  args: {
    currentPosition: 2,
    totalRecords: 4,
    asTableRow: false,
    onMoveUp: () => {},
    onMoveDown: () => {},
    onPlaceAtTop: () => {},
    onPlaceAtBottom: () => {},
  },
};

export const VideoLast: Story = {
  args: {
    currentPosition: 4,
    totalRecords: 4,
    asTableRow: false,
    onMoveUp: () => {},
    onMoveDown: () => {},
    onPlaceAtTop: () => {},
    onPlaceAtBottom: () => {},
  },
};
