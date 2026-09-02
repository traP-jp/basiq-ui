import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, h, ref } from "vue";

import {
  addComponentAttribute,
  composeSourceTransforms,
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
  fillComponentSlot,
} from "../../stories/storybook-parameters";
import BasiqToggleButton from "./BasiqToggleButton.vue";

const ToggleHarness = defineComponent({
  name: "ToggleHarness",
  setup() {
    const enabled = ref(false);

    return () =>
      h("div", { class: "basiq-story" }, [
        h(
          BasiqToggleButton,
          {
            "aria-label": "通知を切り替える",
            modelValue: enabled.value,
            "onUpdate:modelValue": (value: boolean) => {
              enabled.value = value;
            },
          },
          () => "N",
        ),
      ]);
  },
});

const meta = {
  title: "Components/ToggleButton",
  component: BasiqToggleButton,
  tags: ["autodocs"],
  args: {
    disabled: false,
  },
  parameters: {
    controls: {
      disable: true,
      include: ["disabled"],
    },
  },
  render: (args) => ({
    components: { BasiqToggleButton },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story">
        <BasiqToggleButton v-bind="args" aria-label="通知を切り替える">N</BasiqToggleButton>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqToggleButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(
    composeSourceTransforms(
      fillComponentSlot("BasiqToggleButton", "N"),
      addComponentAttribute("BasiqToggleButton", "aria-label", '"通知を切り替える"'),
    ),
  ),
};

export const Uncontrolled: Story = {
  parameters: createFixedVueSourceParameters(`
      <template>
        <BasiqToggleButton aria-label="通知を切り替える">N</BasiqToggleButton>
      </template>
    `),
};

export const UncontrolledInteraction: Story = {
  ...Uncontrolled,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "通知を切り替える" });

    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  },
};

export const Controlled: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { ref } from "vue";
import { BasiqToggleButton } from "basiq-ui";

const enabled = ref(false);
</script>

<template>
  <BasiqToggleButton v-model="enabled" aria-label="通知を切り替える">
    N
  </BasiqToggleButton>
</template>
`),
  render: () => ({
    components: { ToggleHarness },
    template: "<ToggleHarness />",
  }),
};

export const ControlledInteraction: Story = {
  ...Controlled,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "通知を切り替える" });

    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  },
};

export const DisabledOn: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqToggleButton :default-value="true" aria-label="変更できない通知" disabled>
    N
  </BasiqToggleButton>
</template>
`),
  render: () => ({
    components: { BasiqToggleButton },
    template: `
      <div class="basiq-story">
        <BasiqToggleButton aria-label="変更できない通知" :default-value="true" disabled>N</BasiqToggleButton>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "変更できない通知" });

    await expect(toggle).toBeDisabled();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  },
};
