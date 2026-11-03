import type { Meta, StoryObj } from "@storybook/react";
import { SettingsBackupModal } from "./SettingsBackupModal";

const meta: Meta<typeof SettingsBackupModal> = {
  title: "Components/SettingsBackupModal",
  component: SettingsBackupModal,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SettingsBackupModal>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log("Close modal"),
    onSettingsImported: () => console.log("Settings imported"),
  },
};
