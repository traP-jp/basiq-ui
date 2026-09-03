import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";

import { SampleInfoIcon } from "../../stories/sample-icons";
import { createFixedVueSourceParameters } from "../../stories/storybook-parameters";
import BasiqIcon from "./BasiqIcon.vue";

const meta = {
  title: "Components/Icon",
  component: BasiqIcon,
  tags: ["autodocs"],
  args: {
    icon: SampleInfoIcon,
  },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "装飾アイコンでは`label`を省略し、単独で意味を持つ場合だけ指定します。アイコンのみのButtonでは、アイコンではなくButtonへ`aria-label`を指定します。コード例のアイコンは利用側が用意する`currentColor`対応Vueコンポーネントです。Storybookの表示例には[Material Design Icons](https://pictogrammers.com/library/mdi/)を使用していますが、`basiq-ui`のnpmパッケージと公開APIには含まれません。[使用している@mdi/jsのライセンス](./licenses/mdi-7.4.47-LICENSE.txt)",
      },
    },
  },
  render: (args) => ({
    components: { BasiqIcon },
    setup: () => ({ args }),
    template: '<div class="basiq-story"><BasiqIcon v-bind="args" /></div>',
  }),
} satisfies Meta<typeof BasiqIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import InfoIcon from "./InfoIcon.vue";
</script>

<template>
  <BasiqIcon :icon="InfoIcon" />
</template>
`),
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector("svg");

    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).toHaveAttribute("focusable", "false");
  },
};

export const DecorativeExcludedFromTabOrder: Story = {
  tags: ["regression", "!autodocs"],
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import InfoIcon from "./InfoIcon.vue";
</script>

<template>
  <BasiqIcon :icon="InfoIcon" tabindex="0" />
</template>
`),
  render: () => ({
    components: { BasiqIcon },
    setup: () => ({ SampleInfoIcon }),
    template: `
      <div class="basiq-story">
        <BasiqIcon :icon="SampleInfoIcon" data-testid="decorative-icon" tabindex="0" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const icon = canvas.getByTestId("decorative-icon");

    await expect(icon).not.toHaveAttribute("tabindex");
    await expect(getComputedStyle(icon).userSelect).toBe("none");
    await userEvent.tab();
    await expect(icon).not.toHaveFocus();
    await userEvent.click(icon);
    await expect(icon).not.toHaveFocus();
  },
};

export const Meaningful: Story = {
  args: { label: "詳細情報" },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import InfoIcon from "./InfoIcon.vue";
</script>

<template>
  <BasiqIcon :icon="InfoIcon" label="詳細情報" />
</template>
`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const icon = canvas.getByRole("img", { name: "詳細情報" });

    await expect(icon).not.toHaveAttribute("aria-hidden");
    await expect(icon).toHaveAttribute("focusable", "false");
  },
};

export const InheritsSizeAndColor: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import InfoIcon from "./InfoIcon.vue";
</script>

<template>
  <div style="color: var(--basiq-color-content-accent)">
    <BasiqIcon :icon="InfoIcon" style="font-size: 2rem" />
  </div>
</template>
`),
  render: () => ({
    components: { BasiqIcon },
    setup: () => ({ SampleInfoIcon }),
    template: `
      <div class="basiq-story" style="color: var(--basiq-color-content-accent)">
        <BasiqIcon :icon="SampleInfoIcon" style="font-size: 2rem" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector("svg");
    const path = icon?.querySelector("path");
    const parent = icon?.parentElement;

    await expect(icon?.getBoundingClientRect().width).toBe(32);
    await expect(icon?.getBoundingClientRect().height).toBe(32);
    await expect(getComputedStyle(icon!).color).toBe(getComputedStyle(parent!).color);
    await expect(getComputedStyle(path!).fill).toBe(getComputedStyle(icon!).color);
  },
};

export const InlineWithText: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import InfoIcon from "./InfoIcon.vue";
</script>

<template>
  <span>詳細 <BasiqIcon :icon="InfoIcon" /></span>
</template>
`),
  render: () => ({
    components: { BasiqIcon },
    setup: () => ({ SampleInfoIcon }),
    template: `
      <div class="basiq-story">
        <span>詳細 <BasiqIcon :icon="SampleInfoIcon" /></span>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector("svg");

    await expect(getComputedStyle(icon!).display).toBe("inline-block");
  },
};
