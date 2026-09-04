import type { Meta, StoryObj } from "@storybook/vue3-vite";

import { createFixedVueSourceParameters } from "../../stories/storybook-parameters";
import BasiqContainer from "./BasiqContainer.vue";

const meta = {
  title: "Layouts/Container",
  component: BasiqContainer,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof BasiqContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqContainer>
        <section>
          <h1>Page title</h1>
        </section>
      </BasiqContainer>
    </template>
  `),
  render: () => ({
    components: { BasiqContainer },
    template: `
      <div style="min-height: 100vh; padding-block: 48px; background: var(--basiq-color-surface-muted)">
        <BasiqContainer>
          <section style="min-height: 20rem; padding: 32px; border-radius: var(--basiq-radius-md); background: var(--basiq-color-surface-base)">
            <h1 style="margin: 0 0 12px">Page title</h1>
          </section>
        </BasiqContainer>
      </div>
    `,
  }),
};
