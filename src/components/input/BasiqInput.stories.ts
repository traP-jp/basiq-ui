import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import {
  addComponentAttribute,
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqInput from "./BasiqInput.vue";

const ControlledResetHarness = defineComponent({
  name: "ControlledInputResetHarness",
  components: { BasiqInput },
  setup() {
    const value = ref("初期値");

    return { value };
  },
  template: `
    <form class="basiq-story basiq-form-story">
      <BasiqInput
        v-model="value"
        aria-label="リセット対象"
        default-value="初期値"
        name="reset-target"
      />
      <button type="reset">リセット</button>
    </form>
  `,
});

const UncontrolledResetHarness = defineComponent({
  name: "UncontrolledInputResetHarness",
  components: { BasiqInput },
  template: `
    <form class="basiq-story basiq-form-story">
      <BasiqInput aria-label="リセット対象" default-value="初期値" />
      <button type="reset">リセット</button>
    </form>
  `,
});

const CanceledResetHarness = defineComponent({
  name: "CanceledInputResetHarness",
  components: { BasiqInput },
  template: `
    <form class="basiq-story basiq-form-story" @reset.prevent>
      <BasiqInput aria-label="キャンセル対象" default-value="初期値" />
      <button type="reset">リセット</button>
    </form>
  `,
});

const DynamicAriaHarness = defineComponent({
  name: "DynamicInputAriaHarness",
  components: { BasiqInput },
  setup() {
    const describedBy = ref("first-description");
    const invalid = ref<"false" | "grammar">("false");

    function updateAria() {
      describedBy.value = "second-description";
      invalid.value = "grammar";
    }

    return { describedBy, invalid, updateAria };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <p id="first-description">最初の説明</p>
      <p id="second-description">更新後の説明</p>
      <BasiqInput
        :aria-describedby="describedBy"
        :aria-invalid="invalid"
        aria-label="動的なARIA"
      />
      <button type="button" @click="updateAria">ARIAを更新</button>
    </div>
  `,
});

const NativeEventsHarness = defineComponent({
  name: "InputNativeEventsHarness",
  components: { BasiqInput },
  setup() {
    const blurCount = ref(0);
    const changeCount = ref(0);
    const focusCount = ref(0);
    const inputCount = ref(0);

    return { blurCount, changeCount, focusCount, inputCount };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <BasiqInput
        aria-label="イベント対象"
        @blur="blurCount += 1"
        @change="changeCount += 1"
        @focus="focusCount += 1"
        @input="inputCount += 1"
      />
      <button type="button">次の要素</button>
      <output data-testid="event-counts">
        {{ inputCount }}/{{ changeCount }}/{{ focusCount }}/{{ blurCount }}
      </output>
    </div>
  `,
});

const meta = {
  title: "Components/Input",
  component: BasiqInput,
  tags: ["autodocs"],
  args: {
    defaultValue: "",
    disabled: false,
    invalid: false,
    placeholder: "入力してください",
    readonly: false,
    required: false,
    size: "md",
    type: "text",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "tel", "url"],
    },
  },
  parameters: {
    controls: {
      disable: true,
      include: ["disabled", "invalid", "placeholder", "readonly", "required", "size", "type"],
    },
  },
  render: (args) => ({
    components: { BasiqInput },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqInput v-bind="args" aria-label="入力内容" />
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(
    addComponentAttribute("BasiqInput", "aria-label", '"入力内容"'),
  ),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-label="入力内容" placeholder="入力してください" />
    </template>
  `),
};

export const DefaultInteraction: Story = {
  ...Default,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "入力内容" });

    await userEvent.click(input);
    await userEvent.type(input, "BasiQ UI");
    await expect(input).toHaveValue("BasiQ UI");
  },
};

export const Invalid: Story = {
  args: { invalid: true },
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-label="入力内容" invalid />
    </template>
  `),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "入力内容" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-label="入力内容" disabled />
    </template>
  `),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "入力内容" })).toBeDisabled();
  },
};

export const Sizes: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-label="Small" default-value="sm / 36px" size="sm" />
      <BasiqInput aria-label="Medium" default-value="md / 40px" size="md" />
      <BasiqInput aria-label="Large" default-value="lg / 44px" size="lg" />
    </template>
  `),
  render: () => ({
    components: { BasiqInput },
    template: `
      <div class="basiq-story basiq-form-story">
        <BasiqInput aria-label="Small" default-value="sm / 36px" size="sm" />
        <BasiqInput aria-label="Medium" default-value="md / 40px" size="md" />
        <BasiqInput aria-label="Large" default-value="lg / 44px" size="lg" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("textbox", { name: "Small" })).toHaveStyle({ height: "36px" });
    await expect(canvas.getByRole("textbox", { name: "Medium" })).toHaveStyle({ height: "40px" });
    await expect(canvas.getByRole("textbox", { name: "Large" })).toHaveStyle({ height: "44px" });
    await expect(canvas.getByRole("textbox", { name: "Small" })).toHaveValue("sm / 36px");
    await expect(canvas.getByRole("textbox", { name: "Medium" })).toHaveValue("md / 40px");
    await expect(canvas.getByRole("textbox", { name: "Large" })).toHaveValue("lg / 44px");
  },
};

export const AriaInvalidReason: Story = {
  name: "ARIA invalid reason",
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-invalid="grammar" aria-label="入力内容" />
    </template>
  `),
  render: () => ({
    components: { BasiqInput },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqInput aria-invalid="grammar" aria-label="入力内容" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "入力内容" })).toHaveAttribute(
      "aria-invalid",
      "grammar",
    );
  },
};

export const ControlledFormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ControlledResetHarness },
    template: "<ControlledResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "リセット対象" });

    await userEvent.clear(input);
    await userEvent.type(input, "変更後");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(input).toHaveValue("初期値");
  },
};

export const UncontrolledFormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { UncontrolledResetHarness },
    template: "<UncontrolledResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "リセット対象" });

    await userEvent.clear(input);
    await userEvent.type(input, "変更後");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(input).toHaveValue("初期値");
  },
};

export const CanceledFormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { CanceledResetHarness },
    template: "<CanceledResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "キャンセル対象" });

    await userEvent.clear(input);
    await userEvent.type(input, "変更後");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(input).toHaveValue("変更後");
  },
};

export const DynamicAria: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { DynamicAriaHarness },
    template: "<DynamicAriaHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "動的なARIA" });

    await expect(input).toHaveAttribute("aria-describedby", "first-description");
    await expect(input).toHaveAttribute("aria-invalid", "false");
    await userEvent.click(canvas.getByRole("button", { name: "ARIAを更新" }));
    await expect(input).toHaveAttribute("aria-describedby", "second-description");
    await expect(input).toHaveAttribute("aria-invalid", "grammar");
  },
};

export const NativeEvents: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { NativeEventsHarness },
    template: "<NativeEventsHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "イベント対象" });
    const counts = canvas.getByTestId("event-counts");

    await userEvent.click(input);
    await userEvent.type(input, "A");
    await userEvent.tab();
    await expect(counts).toHaveTextContent("1/1/1/1");
  },
};
