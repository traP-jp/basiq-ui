import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import BasiqCheckbox from "../checkbox/BasiqCheckbox.vue";
import BasiqRadioGroup from "../radio-group/BasiqRadioGroup.vue";
import BasiqSwitch from "../switch/BasiqSwitch.vue";

const SelectionControls = defineComponent({
  name: "SelectionControlsSurfaceExample",
  components: { BasiqCheckbox, BasiqRadioGroup, BasiqSwitch },
  props: { surface: { default: "base", type: String } },
  template: `
    <section
      class="basiq-selection-surface"
      :style="{ background: 'var(--basiq-color-surface-' + surface + ')' }"
    >
      <h2>surface/{{ surface }}</h2>
      <BasiqCheckbox default-value>更新を受け取る</BasiqCheckbox>
      <BasiqSwitch>通知を有効にする</BasiqSwitch>
      <BasiqRadioGroup
        default-value="email"
        :items="['email', 'push']"
        label="通知方法"
      />
    </section>
  `,
});

const DynamicAttributesExample = defineComponent({
  name: "SelectionControlsDynamicAttributesExample",
  components: { BasiqCheckbox, BasiqRadioGroup, BasiqSwitch },
  setup() {
    const invalid = ref(false);
    const revision = ref("before");

    function updateAttributes() {
      invalid.value = true;
      revision.value = "after";
    }

    return { invalid, revision, updateAttributes };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <BasiqCheckbox
        :aria-invalid="invalid"
        :aria-label="'Checkbox ' + revision"
        :data-revision="revision"
      />
      <BasiqSwitch
        :aria-invalid="invalid"
        :aria-label="'Switch ' + revision"
        :data-revision="revision"
      />
      <BasiqRadioGroup
        :aria-invalid="invalid"
        :aria-label="'RadioGroup ' + revision"
        :data-revision="revision"
        :items="['email', 'push']"
      />
      <button type="button" @click="updateAttributes">属性を更新</button>
    </div>
  `,
});

const meta = {
  title: "Examples/Selection controls on surfaces",
  component: SelectionControls,
  tags: ["test"],
} satisfies Meta<typeof SelectionControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllSurfaces: Story = {
  render: () => ({
    components: { SelectionControls },
    template: `
      <div class="basiq-story basiq-selection-surfaces">
        <SelectionControls surface="base" />
        <SelectionControls surface="container" />
        <SelectionControls surface="muted" />
      </div>
    `,
  }),
};

export const DynamicAttributes: Story = {
  render: () => ({
    components: { DynamicAttributesExample },
    template: "<DynamicAttributesExample />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("checkbox", { name: "Checkbox before" })).toHaveAttribute(
      "data-revision",
      "before",
    );
    await expect(canvas.getByRole("switch", { name: "Switch before" })).toHaveAttribute(
      "data-revision",
      "before",
    );
    await expect(canvas.getByRole("radiogroup", { name: "RadioGroup before" })).toHaveAttribute(
      "data-revision",
      "before",
    );

    await userEvent.click(canvas.getByRole("button", { name: "属性を更新" }));

    for (const control of [
      canvas.getByRole("checkbox", { name: "Checkbox after" }),
      canvas.getByRole("switch", { name: "Switch after" }),
      canvas.getByRole("radiogroup", { name: "RadioGroup after" }),
    ]) {
      await expect(control).toHaveAttribute("aria-invalid", "true");
      await expect(control).toHaveAttribute("data-revision", "after");
    }
  },
};
