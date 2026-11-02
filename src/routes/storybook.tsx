import { createFileRoute } from "@tanstack/react-router";
import { StorybookWorkbench } from "@/storybook/StorybookWorkbench";

export const Route = createFileRoute("/storybook")({
  component: StorybookWorkbench,
});
