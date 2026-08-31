import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import BasiqButton from "../button/BasiqButton.vue";
import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqSwitch from "./BasiqSwitch.vue";

const ControlledRejectionHarness = defineComponent({
  name: "ControlledSwitchRejectionHarness",
  components: { BasiqSwitch },
  setup() {
    const requestedValue = ref<boolean | null>(null);

    return { requestedValue };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <BasiqSwitch
        :model-value="false"
        @update:model-value="requestedValue = $event"
      >
        API成功後に切り替える
      </BasiqSwitch>
      <output data-testid="requested-value">{{ requestedValue }}</output>
    </div>
  `,
});

const ResetHarness = defineComponent({
  name: "SwitchResetHarness",
  components: { BasiqSwitch },
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
      <BasiqSwitch
        v-if="controlled"
        v-model="value"
        default-value
      >
        リセット対象
      </BasiqSwitch>
      <BasiqSwitch v-else default-value>リセット対象</BasiqSwitch>
      <button type="reset">リセット</button>
    </form>
  `,
});

const ExternalFormHarness = defineComponent({
  name: "ExternalSwitchFormHarness",
  components: { BasiqButton, BasiqSwitch },
  setup() {
    const submittedValue = ref("");

    function readForm() {
      const form = document.querySelector<HTMLFormElement>("#external-switch-form");
      submittedValue.value = String(new FormData(form ?? undefined).get("notifications") ?? "");
    }

    return { readForm, submittedValue };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <form id="external-switch-form" />
      <BasiqSwitch
        form="external-switch-form"
        name="notifications"
        value="enabled"
      >
        外部フォームへ送信する
      </BasiqSwitch>
      <BasiqButton form="external-switch-form" type="reset">リセット</BasiqButton>
      <BasiqButton type="button" @click="readForm">FormDataを確認</BasiqButton>
      <output data-testid="submitted-value">{{ submittedValue }}</output>
    </div>
  `,
});

const meta = {
  title: "Components/Switch",
  component: BasiqSwitch,
  tags: ["test"],
  args: {
    defaultValue: false,
    disabled: false,
    invalid: false,
    required: false,
    value: "on",
  },
  render: (args) => ({
    components: { BasiqSwitch },
    setup() {
      const value = ref(args.defaultValue);

      return { args, value };
    },
    template: `
      <div class="basiq-story">
        <BasiqSwitch v-model="value" v-bind="args">
          通知を有効にする
        </BasiqSwitch>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "通知を有効にする" });

    await expect(control).not.toBeChecked();
    await userEvent.click(canvas.getByText("通知を有効にする"));
    await expect(control).toBeChecked();
    control.focus();
    await userEvent.keyboard(" ");
    await expect(control).not.toBeChecked();
  },
};

export const On: Story = {
  args: { defaultValue: true },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch", { name: "通知を有効にする" })).toBeDisabled();
  },
};

export const DisabledOn: Story = {
  args: { defaultValue: true, disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "通知を有効にする" });

    await expect(control).toBeChecked();
    await expect(control).toBeDisabled();
  },
};

export const Required: Story = {
  args: { required: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole<HTMLInputElement>("switch", {
      name: "通知を有効にする",
    });

    await expect(control).toBeRequired();
    await expect(control.checkValidity()).toBe(false);
    await userEvent.click(control);
    await expect(control.checkValidity()).toBe(true);
  },
};

export const FormField: Story = {
  render: () => ({
    components: { BasiqFormField, BasiqSwitch },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField
          description="変更は即時に反映されます"
          label="通知"
        >
          <BasiqSwitch name="notifications" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "通知" });
    const description = canvas.getByText("変更は即時に反映されます");

    await expect(control).toHaveAttribute("aria-describedby", description.id);
    await userEvent.click(canvas.getByText("通知"));
    await expect(control).toBeChecked();
  },
};

export const Invalid: Story = {
  render: () => ({
    components: { BasiqFormField, BasiqSwitch },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField
          error="通知設定を確認してください"
          label="通知"
        >
          <BasiqSwitch name="notifications" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "通知" });
    const error = canvas.getByText("通知設定を確認してください");

    await expect(control).toHaveAttribute("aria-invalid", "true");
    await expect(control.getAttribute("aria-describedby")).toContain(error.id);
  },
};

export const ControlledRejection: Story = {
  render: () => ({
    components: { ControlledRejectionHarness },
    template: "<ControlledRejectionHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "API成功後に切り替える" });

    await userEvent.click(control);
    await expect(canvas.getByTestId("requested-value")).toHaveTextContent("true");
    await expect(control).not.toBeChecked();
  },
};

export const UncontrolledFormReset: Story = {
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "リセット対象" });

    await userEvent.click(control);
    await expect(control).not.toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(control).toBeChecked();
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
    const control = canvas.getByRole("switch", { name: "リセット対象" });

    await userEvent.click(control);
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(control).not.toBeChecked();
  },
};

export const ExternalForm: Story = {
  render: () => ({
    components: { ExternalFormHarness },
    template: "<ExternalFormHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "外部フォームへ送信する" });
    const output = canvas.getByTestId("submitted-value");

    await userEvent.click(canvas.getByRole("button", { name: "FormDataを確認" }));
    await expect(output).toHaveTextContent("");
    await userEvent.click(control);
    await userEvent.click(canvas.getByRole("button", { name: "FormDataを確認" }));
    await expect(output).toHaveTextContent("enabled");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(control).not.toBeChecked();
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
    const control = canvas.getByRole("switch", { name: "通知を有効にする" });

    await userEvent.click(control);
    await userEvent.tab();
    await expect(args.onInput).toHaveBeenCalledOnce();
    await expect(args.onChange).toHaveBeenCalledOnce();
    await expect(args.onFocus).toHaveBeenCalledOnce();
    await expect(args.onBlur).toHaveBeenCalledOnce();
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith(true);
  },
};
