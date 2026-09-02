import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import { defineComponent, h } from "vue";

import BasiqCard from "../components/card/BasiqCard.vue";
import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  fillComponentSlot,
} from "../stories/storybook-parameters";
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
  tags: ["autodocs"],
  args: {
    mode: "system",
  },
  argTypes: {
    mode: {
      control: "inline-radio",
      options: ["system", "light", "dark"],
    },
  },
  parameters: {
    controls: {
      disable: true,
      include: ["mode"],
    },
  },
  render: (args) => ({
    components: { BasiqCard, BasiqThemeProvider },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story">
        <BasiqThemeProvider v-bind="args">
          <BasiqCard class="basiq-story-card" title="Theme scope">
            選択したテーマがこの領域に適用されます。
          </BasiqCard>
        </BasiqThemeProvider>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqThemeProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(
    fillComponentSlot(
      "BasiqThemeProvider",
      `<BasiqCard title="Theme scope">
  選択したテーマがこの領域に適用されます。
</BasiqCard>`,
    ),
  ),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
      <template>
        <BasiqThemeProvider mode="system">
          <BasiqCard title="Theme scope">
            選択したテーマがこの領域に適用されます。
          </BasiqCard>
        </BasiqThemeProvider>
      </template>
    `),
};

export const Comparison: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqThemeProvider mode="light">
        <BasiqCard title="Light">Light theme scope</BasiqCard>
      </BasiqThemeProvider>

      <BasiqThemeProvider mode="dark">
        <BasiqCard title="Dark">Dark theme scope</BasiqCard>
      </BasiqThemeProvider>
    </template>
  `),
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
