import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";

import BasiqCard from "./BasiqCard.vue";

const meta = {
  title: "Components/Card",
  component: BasiqCard,
  tags: ["test"],
  args: {
    description: "補足説明を簡潔に表示します。",
    title: "Card title",
  },
  render: (args) => ({
    components: { BasiqCard },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story">
        <BasiqCard v-bind="args" class="basiq-story-card">
          任意の内容をまとめるための本文です。
          <template #footer>Footer content</template>
        </BasiqCard>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HeaderBodyFooter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Card title")).toBeVisible();
    await expect(canvas.getByText("任意の内容をまとめるための本文です。")).toBeVisible();
    await expect(canvas.getByText("Footer content")).toBeVisible();
  },
};

export const BodyOnly: Story = {
  args: { description: undefined, title: undefined },
};

export const CustomHeader: Story = {
  render: () => ({
    components: { BasiqCard },
    template: `
      <div class="basiq-story">
        <BasiqCard class="basiq-story-card" title="Ignored title">
          <template #header><strong>Custom header</strong></template>
          Body content
        </BasiqCard>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Custom header")).toBeVisible();
    await expect(canvas.queryByText("Ignored title")).not.toBeInTheDocument();
  },
};
