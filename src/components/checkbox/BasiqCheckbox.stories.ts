import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import BasiqButton from "../button/BasiqButton.vue";
import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqCheckbox from "./BasiqCheckbox.vue";

const ControlledRejectionHarness = defineComponent({
  name: "ControlledCheckboxRejectionHarness",
  components: { BasiqCheckbox },
  setup() {
    const requestedValue = ref<boolean | null>(null);

    return { requestedValue };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <BasiqCheckbox
        :model-value="false"
        @update:model-value="requestedValue = $event"
      >
        更新を拒否する
      </BasiqCheckbox>
      <output data-testid="requested-value">{{ requestedValue }}</output>
    </div>
  `,
});

const ResetHarness = defineComponent({
  name: "CheckboxResetHarness",
  components: { BasiqCheckbox },
  props: { canceled: Boolean, controlled: Boolean },
  setup() {
    const value = ref(true);

    return { value };
  },
  template: `
    <form
      class="basiq-story basiq-form-story"
      @reset="canceled && $event.preventDefault()"
    >
      <BasiqCheckbox
        v-if="controlled"
        v-model="value"
        default-value
      >
        リセット対象
      </BasiqCheckbox>
      <BasiqCheckbox v-else default-value>リセット対象</BasiqCheckbox>
      <button type="reset">リセット</button>
    </form>
  `,
});

const ExternalFormHarness = defineComponent({
  name: "ExternalCheckboxFormHarness",
  components: { BasiqButton, BasiqCheckbox },
  setup() {
    const submittedValue = ref("");

    function readForm() {
      const form = document.querySelector<HTMLFormElement>("#external-checkbox-form");
      submittedValue.value = String(new FormData(form ?? undefined).get("agreement") ?? "");
    }

    return { readForm, submittedValue };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <form id="external-checkbox-form" />
      <BasiqCheckbox
        form="external-checkbox-form"
        name="agreement"
        value="accepted"
      >
        外部フォームへ送信する
      </BasiqCheckbox>
      <BasiqButton form="external-checkbox-form" type="reset">リセット</BasiqButton>
      <BasiqButton type="button" @click="readForm">FormDataを確認</BasiqButton>
      <output data-testid="submitted-value">{{ submittedValue }}</output>
    </div>
  `,
});

const IndeterminateResetHarness = defineComponent({
  name: "IndeterminateCheckboxResetHarness",
  components: { BasiqCheckbox },
  setup() {
    const checked = ref(false);
    const indeterminate = ref(true);

    return { checked, indeterminate };
  },
  template: `
    <form class="basiq-story basiq-form-story">
      <BasiqCheckbox
        v-model="checked"
        v-model:indeterminate="indeterminate"
      >
        一部を選択済み
      </BasiqCheckbox>
      <button type="reset">リセット</button>
      <output data-testid="indeterminate-state">{{ checked }}/{{ indeterminate }}</output>
    </form>
  `,
});

const meta = {
  title: "Components/Checkbox",
  component: BasiqCheckbox,
  tags: ["test"],
  args: {
    defaultValue: false,
    disabled: false,
    indeterminate: false,
    invalid: false,
    required: false,
    value: "on",
  },
  render: (args) => ({
    components: { BasiqCheckbox },
    setup() {
      const value = ref(args.defaultValue);

      return { args, value };
    },
    template: `
      <div class="basiq-story">
        <BasiqCheckbox v-model="value" v-bind="args">
          選択する
        </BasiqCheckbox>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqCheckbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "選択する" });

    await expect(checkbox).not.toBeChecked();
    await expect(checkbox.getBoundingClientRect().width).toBe(24);
    await expect(checkbox.getBoundingClientRect().height).toBe(24);
    await userEvent.click(canvas.getByText("選択する"));
    await expect(checkbox).toBeChecked();
    checkbox.focus();
    await userEvent.keyboard(" ");
    await expect(checkbox).not.toBeChecked();
  },
};

export const Checked: Story = {
  args: { defaultValue: true },
};

export const Indeterminate: Story = {
  render: () => ({
    components: { BasiqCheckbox },
    setup() {
      const checked = ref(false);
      const indeterminate = ref(true);

      return { checked, indeterminate };
    },
    template: `
      <div class="basiq-story basiq-form-story">
        <BasiqCheckbox
          v-model="checked"
          v-model:indeterminate="indeterminate"
        >
          一部を選択済み
        </BasiqCheckbox>
        <output data-testid="state">{{ checked }}/{{ indeterminate }}</output>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "一部を選択済み" });

    await expect(checkbox).toBePartiallyChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await expect(canvas.getByTestId("state")).toHaveTextContent("true/false");
  },
};

export const CheckedAndIndeterminate: Story = {
  args: { defaultValue: true, indeterminate: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "選択する" });

    await expect(checkbox).toBeChecked();
    await expect(checkbox).toBePartiallyChecked();
    const visual = checkbox.nextElementSibling;

    await expect(visual).toBeInstanceOf(HTMLElement);
    const indicatorStyle = getComputedStyle(visual as Element, "::after");
    await expect(indicatorStyle.width).toBe("8px");
    await expect(indicatorStyle.height).toBe("2px");
    await expect(indicatorStyle.borderTopStyle).toBe("none");
    await expect(indicatorStyle.transform).toBe("none");
  },
};

export const DisabledChecked: Story = {
  args: { defaultValue: true, disabled: true },
};

export const DisabledIndeterminate: Story = {
  args: { disabled: true, indeterminate: true },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox", { name: "選択する" })).toBeDisabled();
  },
};

export const FormField: Story = {
  render: () => ({
    components: { BasiqCheckbox, BasiqFormField },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField
          description="送信前に内容を確認してください"
          error="同意が必要です"
          label="利用規約への同意"
          required
        >
          <BasiqCheckbox name="agreement" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole<HTMLInputElement>("checkbox", {
      name: "利用規約への同意",
    });
    const description = canvas.getByText("送信前に内容を確認してください");
    const error = canvas.getByText("同意が必要です");

    await expect(checkbox).toBeRequired();
    await expect(checkbox.checkValidity()).toBe(false);
    await expect(checkbox).toHaveAttribute("aria-invalid", "true");
    await expect(checkbox).toHaveAttribute("aria-describedby", `${description.id} ${error.id}`);
    await userEvent.click(canvas.getByText("利用規約への同意"));
    await expect(checkbox).toBeChecked();
    await expect(checkbox.checkValidity()).toBe(true);
  },
};

export const ControlledRejection: Story = {
  render: () => ({
    components: { ControlledRejectionHarness },
    template: "<ControlledRejectionHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "更新を拒否する" });

    await userEvent.click(checkbox);
    await expect(canvas.getByTestId("requested-value")).toHaveTextContent("true");
    await expect(checkbox).not.toBeChecked();
  },
};

export const UncontrolledFormReset: Story = {
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "リセット対象" });

    await expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(checkbox).toBeChecked();
  },
};

export const ControlledFormReset: Story = {
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness controlled />",
  }),
  play: UncontrolledFormReset.play,
};

export const CanceledFormReset: Story = {
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness canceled />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "リセット対象" });

    await userEvent.click(checkbox);
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(checkbox).not.toBeChecked();
  },
};

export const IndeterminateIsNotReset: Story = {
  render: () => ({
    components: { IndeterminateResetHarness },
    template: "<IndeterminateResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "一部を選択済み" });

    await expect(checkbox).toBePartiallyChecked();
    await userEvent.click(checkbox);
    await expect(canvas.getByTestId("indeterminate-state")).toHaveTextContent("true/false");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(canvas.getByTestId("indeterminate-state")).toHaveTextContent("false/false");
    await expect(checkbox).not.toBePartiallyChecked();
  },
};

export const ExternalForm: Story = {
  render: () => ({
    components: { ExternalFormHarness },
    template: "<ExternalFormHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "外部フォームへ送信する" });
    const output = canvas.getByTestId("submitted-value");

    await userEvent.click(canvas.getByRole("button", { name: "FormDataを確認" }));
    await expect(output).toHaveTextContent("");
    await userEvent.click(checkbox);
    await userEvent.click(canvas.getByRole("button", { name: "FormDataを確認" }));
    await expect(output).toHaveTextContent("accepted");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(checkbox).not.toBeChecked();
  },
};

export const NativeEvents: Story = {
  args: {
    onBlur: fn(),
    onChange: fn(),
    onFocus: fn(),
    onInput: fn(),
    "onUpdate:modelValue": fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "選択する" });

    await userEvent.click(checkbox);
    await userEvent.tab();
    await expect(args.onInput).toHaveBeenCalledOnce();
    await expect(args.onChange).toHaveBeenCalledOnce();
    await expect(args.onFocus).toHaveBeenCalledOnce();
    await expect(args.onBlur).toHaveBeenCalledOnce();
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith(true);
  },
};
