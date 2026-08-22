import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, h, ref } from "vue";

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
  tags: ["test"],
} satisfies Meta<typeof BasiqChoiceGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RequiredSelection: Story = {
  render: () => ({
    components: { ChoiceGroupHarness },
    template: "<ChoiceGroupHarness />",
  }),
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
  render: () => ({
    components: { EmptyChoiceGroupHarness },
    template: "<EmptyChoiceGroupHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const activity = canvas.getByRole("button", { name: "アクティビティ" });

    await userEvent.click(activity);
    await expect(activity).toHaveAttribute("aria-pressed", "false");
  },
};

export const ControlledSelection: Story = {
  render: () => ({
    components: { ControlledChoiceGroupHarness },
    template: "<ControlledChoiceGroupHarness />",
  }),
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
