import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqTextarea from "./BasiqTextarea.vue";

const ControlledResetHarness = defineComponent({
  name: "ControlledTextareaResetHarness",
  components: { BasiqTextarea },
  setup() {
    const value = ref("初期値");

    return { value };
  },
  template: `
    <form class="basiq-story basiq-form-story">
      <BasiqTextarea
        v-model="value"
        aria-label="リセット対象"
        default-value="初期値"
      />
      <button type="reset">リセット</button>
    </form>
  `,
});

const UncontrolledResetHarness = defineComponent({
  name: "UncontrolledTextareaResetHarness",
  components: { BasiqTextarea },
  template: `
    <form class="basiq-story basiq-form-story">
      <BasiqTextarea aria-label="リセット対象" default-value="初期値" />
      <button type="reset">リセット</button>
    </form>
  `,
});

const FormSubmissionHarness = defineComponent({
  name: "TextareaFormSubmissionHarness",
  components: { BasiqTextarea },
  setup() {
    const submittedValue = ref("");

    function submit(event: Event) {
      const form = event.currentTarget as HTMLFormElement;
      submittedValue.value = String(new FormData(form).get("description") ?? "");
    }

    return { submit, submittedValue };
  },
  template: `
    <form class="basiq-story basiq-form-story" @submit.prevent="submit">
      <BasiqTextarea
        aria-label="説明"
        default-value="送信する説明"
        name="description"
      />
      <button type="submit">送信</button>
      <output data-testid="submitted-value">{{ submittedValue }}</output>
    </form>
  `,
});

const ExternalFormHarness = defineComponent({
  name: "TextareaExternalFormHarness",
  components: { BasiqTextarea },
  setup() {
    const formId = ref("first-form");

    return { formId };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <output>関連付け先: {{ formId }}</output>
      <BasiqTextarea
        :form="formId"
        aria-label="外部フォームの入力"
        default-value="初期値"
      />
      <button type="button" @click="formId = 'second-form'">
        2番目のフォームへ変更
      </button>
      <form id="first-form">
        <button type="reset">1番目をリセット</button>
      </form>
      <form id="second-form">
        <button type="reset">2番目をリセット</button>
      </form>
    </div>
  `,
});

const NativeEventsHarness = defineComponent({
  name: "TextareaNativeEventsHarness",
  components: { BasiqTextarea },
  setup() {
    const blurCount = ref(0);
    const changeCount = ref(0);
    const focusCount = ref(0);
    const inputCount = ref(0);

    return { blurCount, changeCount, focusCount, inputCount };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <BasiqTextarea
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
  title: "Components/Textarea",
  component: BasiqTextarea,
  tags: ["test"],
  args: {
    defaultValue: "",
    disabled: false,
    invalid: false,
    placeholder: "入力してください",
    readonly: false,
    required: false,
    resize: "vertical",
    rows: 3,
    size: "md",
  },
  argTypes: {
    resize: {
      control: "select",
      options: ["none", "vertical"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
  render: (args) => ({
    components: { BasiqTextarea },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqTextarea v-bind="args" aria-label="入力内容" />
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqTextarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "入力内容" });

    await userEvent.click(textarea);
    await userEvent.type(textarea, "BasiQ UI{enter}Textarea");
    await expect(textarea).toHaveValue("BasiQ UI\nTextarea");
  },
};

export const WithFormField: Story = {
  render: () => ({
    components: { BasiqFormField, BasiqTextarea },
    setup() {
      const value = ref("");

      return { value };
    },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField
          description="100文字以内で入力してください"
          label="説明"
          required
        >
          <BasiqTextarea v-model="value" maxlength="100" name="description" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const description = canvas.getByText("100文字以内で入力してください");
    const textarea = canvas.getByRole("textbox", { name: "説明" });

    await expect(textarea).toBeRequired();
    await expect(textarea).toHaveAttribute("aria-describedby", description.id);
    await userEvent.click(canvas.getByText("説明"));
    await expect(textarea).toHaveFocus();
  },
};

export const Invalid: Story = {
  args: { invalid: true },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("textbox", { name: "入力内容" })).toBeDisabled();
  },
};

export const Sizes: Story = {
  render: () => ({
    components: { BasiqTextarea },
    template: `
      <div class="basiq-story basiq-form-story" style="max-width: 24rem">
        <BasiqTextarea aria-label="Small" default-value="sm" size="sm" />
        <BasiqTextarea aria-label="Medium" default-value="md" size="md" />
        <BasiqTextarea aria-label="Large" default-value="lg" size="lg" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const small = canvas.getByRole("textbox", { name: "Small" });
    const medium = canvas.getByRole("textbox", { name: "Medium" });
    const large = canvas.getByRole("textbox", { name: "Large" });

    await expect(small.getBoundingClientRect().height).toBeLessThan(
      medium.getBoundingClientRect().height,
    );
    await expect(medium.getBoundingClientRect().height).toBeLessThan(
      large.getBoundingClientRect().height,
    );
  },
};

export const ResizeDisabled: Story = {
  args: { resize: "none" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "入力内容" });

    await expect(textarea).toHaveStyle({ resize: "none" });
  },
};

export const ControlledFormReset: Story = {
  render: () => ({
    components: { ControlledResetHarness },
    template: "<ControlledResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "リセット対象" });

    await userEvent.clear(textarea);
    await userEvent.type(textarea, "変更後");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(textarea).toHaveValue("初期値");
  },
};

export const UncontrolledFormReset: Story = {
  render: () => ({
    components: { UncontrolledResetHarness },
    template: "<UncontrolledResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "リセット対象" });

    await userEvent.clear(textarea);
    await userEvent.type(textarea, "変更後");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(textarea).toHaveValue("初期値");
  },
};

export const FormSubmission: Story = {
  render: () => ({
    components: { FormSubmissionHarness },
    template: "<FormSubmissionHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "送信" }));
    await expect(canvas.getByTestId("submitted-value")).toHaveTextContent("送信する説明");
  },
};

export const ExternalForm: Story = {
  render: () => ({
    components: { ExternalFormHarness },
    template: "<ExternalFormHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "外部フォームの入力" });

    await userEvent.clear(textarea);
    await userEvent.type(textarea, "変更後");
    await userEvent.click(canvas.getByRole("button", { name: "1番目をリセット" }));
    await expect(textarea).toHaveValue("初期値");

    await userEvent.clear(textarea);
    await userEvent.type(textarea, "再変更後");
    await userEvent.click(canvas.getByRole("button", { name: "2番目のフォームへ変更" }));
    await expect(textarea).toHaveAttribute("form", "second-form");
    await userEvent.click(canvas.getByRole("button", { name: "1番目をリセット" }));
    await expect(textarea).toHaveValue("再変更後");
    await userEvent.click(canvas.getByRole("button", { name: "2番目をリセット" }));
    await expect(textarea).toHaveValue("初期値");
  },
};

export const NativeEvents: Story = {
  render: () => ({
    components: { NativeEventsHarness },
    template: "<NativeEventsHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "イベント対象" });
    const counts = canvas.getByTestId("event-counts");

    await userEvent.click(textarea);
    await userEvent.type(textarea, "A");
    await userEvent.tab();
    await expect(counts).toHaveTextContent("1/1/1/1");
  },
};
