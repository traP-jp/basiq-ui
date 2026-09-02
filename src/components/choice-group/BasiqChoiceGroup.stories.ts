import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, h, ref } from "vue";

import {
  addComponentAttribute,
  composeSourceTransforms,
  controlsDisabledStoryParameters,
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  fillComponentSlot,
} from "../../stories/storybook-parameters";
import BasiqChoiceGroup from "./BasiqChoiceGroup.vue";
import BasiqChoiceGroupItem from "./BasiqChoiceGroupItem.vue";

const labels = [
  { label: "アクティビティ", short: "A", value: "activity" },
  { label: "チャンネル", short: "C", value: "channel" },
  { label: "設定", short: "S", value: "settings" },
];

function createChoiceGroup(allowEmptySelection: boolean) {
  return defineComponent({
    name: allowEmptySelection ? "EmptyChoiceGroupHarness" : "ChoiceGroupHarness",
    setup() {
      return () =>
        h("div", { class: "basiq-story" }, [
          h(
            BasiqChoiceGroup,
            { allowEmptySelection, defaultValue: "activity", "aria-label": "表示内容" },
            () =>
              labels.map(({ label, short, value }) =>
                h(BasiqChoiceGroupItem, { key: value, value, "aria-label": label }, () => short),
              ),
          ),
        ]);
    },
  });
}

const ChoiceGroupHarness = createChoiceGroup(false);
const EmptyChoiceGroupHarness = createChoiceGroup(true);
const ControlledChoiceGroupHarness = defineComponent({
  name: "ControlledChoiceGroupHarness",
  components: { BasiqChoiceGroup, BasiqChoiceGroupItem },
  setup() {
    const selected = ref<string | null>("activity");

    return { selected };
  },
  template: `
    <div class="basiq-story">
      <BasiqChoiceGroup
        :model-value="selected"
        allow-empty-selection
        aria-label="表示内容"
        @update:model-value="selected = $event"
      >
        <BasiqChoiceGroupItem value="activity" aria-label="アクティビティ">
          A
        </BasiqChoiceGroupItem>
        <BasiqChoiceGroupItem value="channel" aria-label="チャンネル">
          C
        </BasiqChoiceGroupItem>
      </BasiqChoiceGroup>
    </div>
  `,
});

const meta = {
  title: "Components/ChoiceGroup",
  component: BasiqChoiceGroup,
  subcomponents: { BasiqChoiceGroupItem },
  tags: ["autodocs"],
  args: {
    allowEmptySelection: false,
    disabled: false,
    loop: true,
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
  parameters: {
    controls: {
      disable: true,
      include: ["allowEmptySelection", "disabled", "loop", "orientation"],
    },
  },
  render: (args) => ({
    components: { BasiqChoiceGroup, BasiqChoiceGroupItem },
    setup: () => ({ args, labels }),
    template: `
      <div class="basiq-story">
        <BasiqChoiceGroup
          v-bind="args"
          default-value="activity"
          aria-label="表示内容"
        >
          <BasiqChoiceGroupItem
            v-for="item in labels"
            :key="item.value"
            :value="item.value"
            :aria-label="item.label"
          >
            {{ item.short }}
          </BasiqChoiceGroupItem>
        </BasiqChoiceGroup>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqChoiceGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(
    composeSourceTransforms(
      fillComponentSlot(
        "BasiqChoiceGroup",
        `<BasiqChoiceGroupItem value="activity" aria-label="アクティビティ">A</BasiqChoiceGroupItem>
<BasiqChoiceGroupItem value="channel" aria-label="チャンネル">C</BasiqChoiceGroupItem>
<BasiqChoiceGroupItem value="settings" aria-label="設定">S</BasiqChoiceGroupItem>`,
      ),
      addComponentAttribute("BasiqChoiceGroup", "aria-label", '"表示内容"'),
    ),
  ),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
      <template>
        <BasiqChoiceGroup default-value="activity" aria-label="表示内容">
          <BasiqChoiceGroupItem value="activity" aria-label="アクティビティ">A</BasiqChoiceGroupItem>
          <BasiqChoiceGroupItem value="channel" aria-label="チャンネル">C</BasiqChoiceGroupItem>
          <BasiqChoiceGroupItem value="settings" aria-label="設定">S</BasiqChoiceGroupItem>
        </BasiqChoiceGroup>
      </template>
    `),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("button", { name: "アクティビティ" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

export const RequiredSelection: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqChoiceGroup default-value="activity" aria-label="表示内容">
    <BasiqChoiceGroupItem value="activity" aria-label="アクティビティ">A</BasiqChoiceGroupItem>
    <BasiqChoiceGroupItem value="channel" aria-label="チャンネル">C</BasiqChoiceGroupItem>
    <BasiqChoiceGroupItem value="settings" aria-label="設定">S</BasiqChoiceGroupItem>
  </BasiqChoiceGroup>
</template>
`),
  render: () => ({
    components: { ChoiceGroupHarness },
    template: "<ChoiceGroupHarness />",
  }),
};

export const RequiredSelectionInteraction: Story = {
  ...RequiredSelection,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const activity = canvas.getByRole("button", { name: "アクティビティ" });
    const channel = canvas.getByRole("button", { name: "チャンネル" });

    await expect(activity).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(activity);
    await expect(activity).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(channel);
    await expect(channel).toHaveAttribute("aria-pressed", "true");
    await expect(activity).toHaveAttribute("aria-pressed", "false");
  },
};

export const EmptySelectionAllowed: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqChoiceGroup allow-empty-selection default-value="activity" aria-label="表示内容">
    <BasiqChoiceGroupItem value="activity" aria-label="アクティビティ">A</BasiqChoiceGroupItem>
    <BasiqChoiceGroupItem value="channel" aria-label="チャンネル">C</BasiqChoiceGroupItem>
    <BasiqChoiceGroupItem value="settings" aria-label="設定">S</BasiqChoiceGroupItem>
  </BasiqChoiceGroup>
</template>
`),
  render: () => ({
    components: { EmptyChoiceGroupHarness },
    template: "<EmptyChoiceGroupHarness />",
  }),
};

export const EmptySelectionAllowedInteraction: Story = {
  ...EmptySelectionAllowed,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const activity = canvas.getByRole("button", { name: "アクティビティ" });

    await userEvent.click(activity);
    await expect(activity).toHaveAttribute("aria-pressed", "false");
  },
};

export const ControlledSelection: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { ref } from "vue";
import { BasiqChoiceGroup, BasiqChoiceGroupItem } from "basiq-ui";

const selected = ref<string | null>("activity");
</script>

<template>
  <BasiqChoiceGroup v-model="selected" allow-empty-selection aria-label="表示内容">
    <BasiqChoiceGroupItem value="activity" aria-label="アクティビティ">A</BasiqChoiceGroupItem>
    <BasiqChoiceGroupItem value="channel" aria-label="チャンネル">C</BasiqChoiceGroupItem>
  </BasiqChoiceGroup>
</template>
`),
  render: () => ({
    components: { ControlledChoiceGroupHarness },
    template: "<ControlledChoiceGroupHarness />",
  }),
};

export const ControlledSelectionInteraction: Story = {
  ...ControlledSelection,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const activity = canvas.getByRole("button", { name: "アクティビティ" });
    const channel = canvas.getByRole("button", { name: "チャンネル" });

    await expect(activity).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(activity);
    await expect(activity).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(channel);
    await expect(channel).toHaveAttribute("aria-pressed", "true");
    await expect(activity).toHaveAttribute("aria-pressed", "false");
  },
};
