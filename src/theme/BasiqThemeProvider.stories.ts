import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import { defineComponent, h } from "vue";

import BasiqCard from "../components/card/BasiqCard.vue";
import BasiqThemeProvider from "./BasiqThemeProvider.vue";

const ThemeComparison = defineComponent({
  name: "ThemeComparison",
  setup() {
    return () =>
      h("div", { class: "basiq-story basiq-theme-comparison" }, [
        h(
          BasiqThemeProvider,
          { mode: "light", "data-testid": "light-theme" },
          {
            default: () => h(BasiqCard, { title: "Light" }, { default: () => "Light theme scope" }),
          },
        ),
        h(
          BasiqThemeProvider,
          { mode: "dark", "data-testid": "dark-theme" },
          {
            default: () => h(BasiqCard, { title: "Dark" }, { default: () => "Dark theme scope" }),
          },
        ),
      ]);
  },
});

const meta = {
  title: "Foundation/ThemeProvider",
  component: BasiqThemeProvider,
  tags: ["test"],
} satisfies Meta<typeof BasiqThemeProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => ({
    components: { ThemeComparison },
    template: "<ThemeComparison />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("light-theme")).toHaveAttribute("data-basiq-theme", "light");
    await expect(canvas.getByTestId("dark-theme")).toHaveAttribute("data-basiq-theme", "dark");
  },
};
