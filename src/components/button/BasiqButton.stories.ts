import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, h } from "vue";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
  fillComponentSlot,
} from "../../stories/storybook-parameters";
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
