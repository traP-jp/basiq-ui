import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, h } from "vue";

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
  tags: ["test"],
  args: {
    disabled: false,
    tone: "accent",
    type: "button",
    variant: "solid",
  },
  argTypes: {
    tone: { control: "select", options: tones },
    variant: { control: "select", options: variants },
  },
  render: (args) => ({
    components: { BasiqButton },
    setup: () => ({ args }),
    template: '<div class="basiq-story"><BasiqButton v-bind="args">Button</BasiqButton></div>',
  }),
} satisfies Meta<typeof BasiqButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Button" });

    await expect(button).toHaveAttribute("type", "button");
    await userEvent.tab();
    await expect(button).toHaveFocus();
  },
};

export const AllVariants: Story = {
  render: () => ({
    components: { ButtonMatrix },
    template: "<ButtonMatrix />",
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Button" })).toBeDisabled();
  },
};
