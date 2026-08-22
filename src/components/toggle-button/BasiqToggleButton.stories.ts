import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, h, ref } from "vue";

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
  tags: ["test"],
} satisfies Meta<typeof BasiqToggleButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Uncontrolled: Story = {
  render: () => ({
    components: { BasiqToggleButton },
    template: `
      <div class="basiq-story">
        <BasiqToggleButton aria-label="通知を切り替える">N</BasiqToggleButton>
      </div>
    `,
  }),
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
  render: () => ({
    components: { ToggleHarness },
    template: "<ToggleHarness />",
  }),
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
