import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, h } from "vue";

import { SampleAddIcon, SampleArrowRightIcon, SampleCloseIcon } from "../../stories/sample-icons";
import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
  fillComponentSlot,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqButton, { type BasiqButtonTone, type BasiqButtonVariant } from "./BasiqButton.vue";

const tones: BasiqButtonTone[] = ["accent", "neutral", "danger"];
const variants: BasiqButtonVariant[] = ["solid", "outline"];

const ButtonMatrix = defineComponent({
  name: "ButtonMatrix",
  setup() {
    return () =>
      h(
        "div",
        { class: "basiq-story basiq-story-grid" },
        tones.flatMap((tone) =>
          variants.map((variant) =>
            h(
              BasiqButton,
              { key: `${tone}-${variant}`, tone, variant },
              () => `${tone} ${variant}`,
            ),
          ),
        ),
      );
  },
});

const IconButtonMatrix = defineComponent({
  name: "IconButtonMatrix",
  setup() {
    return () =>
      h(
        "div",
        { class: "basiq-story-grid" },
        tones.flatMap((tone) =>
          variants.map((variant) =>
            h(
              BasiqButton,
              { icon: SampleAddIcon, key: `${tone}-${variant}`, tone, variant },
              () => `${tone} ${variant}`,
            ),
          ),
        ),
      );
  },
});

const IconThemeComparison = defineComponent({
  name: "IconThemeComparison",
  setup() {
    const renderTheme = (mode: "light" | "dark") =>
      h(
        BasiqThemeProvider,
        { mode },
        {
          default: () =>
            h(BasiqButton, { icon: SampleAddIcon }, () => (mode === "light" ? "Light" : "Dark")),
        },
      );

    return () =>
      h("div", { class: "basiq-story basiq-theme-comparison" }, [
        renderTheme("light"),
        renderTheme("dark"),
      ]);
  },
});

const meta = {
  title: "Components/Button",
  component: BasiqButton,
  tags: ["autodocs"],
  args: {
    disabled: false,
    tone: "accent",
    type: "button",
    variant: "solid",
  },
  argTypes: {
    icon: { table: { disable: true } },
    iconPlacement: { control: "select", options: ["leading", "trailing", "only"] },
    tone: { control: "select", options: tones },
    type: { control: "inline-radio", options: ["button", "submit", "reset"] },
    variant: { control: "select", options: variants },
  },
  parameters: {
    controls: {
      disable: true,
      include: ["disabled", "tone", "type", "variant"],
    },
  },
  render: (args) => ({
    components: { BasiqButton },
    setup: () => ({ args }),
    template: '<div class="basiq-story"><BasiqButton v-bind="args">Button</BasiqButton></div>',
  }),
} satisfies Meta<typeof BasiqButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(fillComponentSlot("BasiqButton", "Button")),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqButton>Button</BasiqButton>
</template>
`),
};

export const DefaultInteraction: Story = {
  ...Default,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Button" });

    await expect(button).toHaveAttribute("type", "button");
    await userEvent.tab();
    await expect(button).toHaveFocus();
  },
};

export const AllVariants: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqButton tone="accent" variant="solid">Accent solid</BasiqButton>
  <BasiqButton tone="accent" variant="outline">Accent outline</BasiqButton>
  <BasiqButton tone="neutral" variant="solid">Neutral solid</BasiqButton>
  <BasiqButton tone="neutral" variant="outline">Neutral outline</BasiqButton>
  <BasiqButton tone="danger" variant="solid">Danger solid</BasiqButton>
  <BasiqButton tone="danger" variant="outline">Danger outline</BasiqButton>
</template>
`),

  render: () => ({
    components: { ButtonMatrix },
    template: "<ButtonMatrix />",
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqButton disabled>Button</BasiqButton>
</template>
`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Button" })).toBeDisabled();
  },
};

export const LeadingAndTrailingIcons: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import AddIcon from "./AddIcon.vue";
import ArrowRightIcon from "./ArrowRightIcon.vue";
</script>

<template>
  <BasiqButton :icon="AddIcon" icon-placement="leading">作成</BasiqButton>
  <BasiqButton :icon="ArrowRightIcon" icon-placement="trailing">次へ</BasiqButton>
</template>
`),
  render: () => ({
    components: { BasiqButton },
    setup: () => ({ SampleAddIcon, SampleArrowRightIcon }),
    template: `
      <div class="basiq-story basiq-story-stack">
        <BasiqButton :icon="SampleAddIcon" icon-placement="leading">作成</BasiqButton>
        <BasiqButton :icon="SampleArrowRightIcon" icon-placement="trailing">次へ</BasiqButton>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const createButton = canvas.getByRole("button", { name: "作成" });
    const nextButton = canvas.getByRole("button", { name: "次へ" });
    const createIcon = createButton.querySelector("svg");
    const nextIcon = nextButton.querySelector("svg");

    await expect(createIcon).toHaveAttribute("aria-hidden", "true");
    await expect(nextIcon).toHaveAttribute("aria-hidden", "true");
    await expect(createIcon?.getBoundingClientRect().width).toBe(20);
    await expect(createIcon?.getBoundingClientRect().height).toBe(20);
    await expect(nextIcon?.getBoundingClientRect().width).toBe(20);
    await expect(nextIcon?.getBoundingClientRect().height).toBe(20);
  },
};

export const IconOnly: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import CloseIcon from "./CloseIcon.vue";
</script>

<template>
  <BasiqButton :icon="CloseIcon" icon-placement="only" aria-label="閉じる" />
</template>
`),
  render: () => ({
    components: { BasiqButton },
    setup: () => ({ SampleCloseIcon }),
    template: `
      <div class="basiq-story">
        <div style="display: flex; width: 24px">
          <BasiqButton :icon="SampleCloseIcon" icon-placement="only" aria-label="閉じる" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "閉じる" });
    const bounds = button.getBoundingClientRect();
    const icon = button.querySelector("svg");

    await expect(bounds.width).toBe(40);
    await expect(bounds.height).toBe(40);
    await expect(icon?.getBoundingClientRect().width).toBe(24);
    await expect(icon?.getBoundingClientRect().height).toBe(24);
    await expect(icon).toHaveAttribute("focusable", "false");
  },
};

export const IconVariants: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import AddIcon from "./AddIcon.vue";
</script>

<template>
  <BasiqButton :icon="AddIcon" tone="accent" variant="solid">Accent solid</BasiqButton>
  <BasiqButton :icon="AddIcon" tone="accent" variant="outline">Accent outline</BasiqButton>
  <BasiqButton :icon="AddIcon" tone="neutral" variant="solid">Neutral solid</BasiqButton>
  <BasiqButton :icon="AddIcon" tone="neutral" variant="outline">Neutral outline</BasiqButton>
  <BasiqButton :icon="AddIcon" tone="danger" variant="solid">Danger solid</BasiqButton>
  <BasiqButton :icon="AddIcon" tone="danger" variant="outline">Danger outline</BasiqButton>
</template>
`),
  render: () => ({
    components: { IconButtonMatrix },
    template: '<div class="basiq-story"><IconButtonMatrix /></div>',
  }),
};

export const IconThemes: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import AddIcon from "./AddIcon.vue";
</script>

<template>
  <BasiqThemeProvider mode="light">
    <BasiqButton :icon="AddIcon">Light</BasiqButton>
  </BasiqThemeProvider>
  <BasiqThemeProvider mode="dark">
    <BasiqButton :icon="AddIcon">Dark</BasiqButton>
  </BasiqThemeProvider>
</template>
`),
  render: () => ({
    components: { IconThemeComparison },
    template: "<IconThemeComparison />",
  }),
};
