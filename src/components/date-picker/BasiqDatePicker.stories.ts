import { parseDate, type CalendarDate } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import {
  createFixedVueSourceParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqDatePicker from "./BasiqDatePicker.vue";

const fixedToday = parseDate("2026-09-04");
const validationChange = fn();

const ControlledHarness = defineComponent({
  name: "ControlledDatePickerHarness",
  components: { BasiqDatePicker },
  setup() {
    const value = ref<CalendarDate | null>(fixedToday);
    return { value };
  },
  template: `
    <div class="basiq-story" style="max-width: 24rem">
      <BasiqDatePicker
        v-model="value"
        aria-label="開催日"
        portal-target="#date-picker-test-portal"
        :today="value ?? undefined"
      />
      <output data-testid="value">{{ value?.toString() ?? "null" }}</output>
      <div id="date-picker-test-portal"></div>
    </div>
  `,
});

const RejectingHarness = defineComponent({
  name: "RejectingDatePickerHarness",
  components: { BasiqDatePicker },
  setup: () => ({ fixedToday }),
  template: `
    <div class="basiq-story" style="max-width: 24rem">
      <BasiqDatePicker
        aria-label="変更を拒否する日付"
        :model-value="fixedToday"
        :today="fixedToday"
        @update:model-value="() => {}"
      />
    </div>
  `,
});

const RejectingFormHarness = defineComponent({
  name: "RejectingFormDatePickerHarness",
  components: { BasiqDatePicker },
  setup() {
    const submittedValue = ref("not submitted");

    function handleSubmit(event: SubmitEvent) {
      submittedValue.value = String(
        new FormData(event.currentTarget as HTMLFormElement).get("date"),
      );
    }

    return { fixedToday, handleSubmit, submittedValue };
  },
  template: `
    <form class="basiq-story" style="max-width: 24rem" @submit.prevent="handleSubmit">
      <BasiqDatePicker
        aria-label="変更を拒否する送信日"
        :model-value="fixedToday"
        name="date"
        @update:model-value="() => {}"
      />
      <button type="submit">送信</button>
      <output data-testid="submitted-value">{{ submittedValue }}</output>
    </form>
  `,
});

const EquivalentValueRerenderHarness = defineComponent({
  name: "EquivalentValueRerenderDatePickerHarness",
  components: { BasiqDatePicker },
  setup() {
    const revision = ref(0);
    return { parseDate, revision };
  },
  template: `
    <div :data-revision="revision" class="basiq-story" style="max-width: 24rem">
      <BasiqDatePicker
        aria-label="再生成される日付"
        :model-value="parseDate('2026-09-04')"
        @validation-change="revision += 1"
      />
    </div>
  `,
});

const ResetHarness = defineComponent({
  name: "ResetDatePickerHarness",
  components: { BasiqDatePicker },
  setup: () => ({ fixedToday }),
  template: `
    <form class="basiq-story" style="max-width: 24rem">
      <BasiqDatePicker
        aria-label="リセット対象の日付"
        :default-value="fixedToday"
        name="event-date"
        :today="fixedToday"
      />
      <button type="reset">リセット</button>
    </form>
  `,
});

const FormSubmitHarness = defineComponent({
  name: "FormSubmitDatePickerHarness",
  components: { BasiqDatePicker },
  setup() {
    const submittedValue = ref("not submitted");
    const submittedAction = ref("not submitted");

    function handleSubmit(event: SubmitEvent) {
      const data = new FormData(event.currentTarget as HTMLFormElement, event.submitter);
      submittedValue.value = String(data.get("date"));
      submittedAction.value = String(data.get("action"));
    }

    return { handleSubmit, submittedAction, submittedValue };
  },
  template: `
    <form class="basiq-story" style="max-width: 24rem" @submit.prevent="handleSubmit">
      <BasiqDatePicker aria-label="送信する日付" name="date" />
      <button name="action" type="submit" value="save">送信</button>
      <button formnovalidate name="action" type="submit" value="draft">下書き保存</button>
      <output data-testid="submitted-value">{{ submittedValue }}</output>
      <output data-testid="submitted-action">{{ submittedAction }}</output>
    </form>
  `,
});

const ControlledResetHarness = defineComponent({
  name: "ControlledResetDatePickerHarness",
  components: { BasiqDatePicker },
  props: { reject: Boolean },
  setup(props) {
    const value = ref<CalendarDate | null>(fixedToday);

    function updateValue(nextValue: CalendarDate | null) {
      if (!props.reject) value.value = nextValue;
    }

    return { updateValue, value };
  },
  template: `
    <form class="basiq-story" style="max-width: 24rem">
      <BasiqDatePicker
        aria-label="controlledリセット対象"
        :default-value="null"
        name="date"
        :model-value="value"
        @update:model-value="updateValue"
      />
      <button type="reset">リセット</button>
      <output data-testid="value">{{ value?.toString() ?? "null" }}</output>
    </form>
  `,
});

const DynamicRequiredHarness = defineComponent({
  name: "DynamicRequiredDatePickerHarness",
  components: { BasiqDatePicker },
  setup() {
    const required = ref(true);
    return { required };
  },
  template: `
    <div class="basiq-story" style="max-width: 24rem">
      <BasiqDatePicker aria-label="動的な必須日付" :required="required" />
      <button type="button" @click="required = false">任意にする</button>
    </div>
  `,
});

const ExternalFormHarness = defineComponent({
  name: "ExternalFormDatePickerHarness",
  components: { BasiqDatePicker },
  setup() {
    const submittedValue = ref("not submitted");

    function handleSubmit(event: SubmitEvent) {
      submittedValue.value = String(
        new FormData(event.currentTarget as HTMLFormElement).get("date"),
      );
    }

    return { handleSubmit, submittedValue };
  },
  template: `
    <div class="basiq-story" style="max-width: 24rem">
      <form id="external-date-picker-form" @submit.prevent="handleSubmit">
        <button type="submit">外部フォームを送信</button>
        <button type="reset">外部フォームをリセット</button>
      </form>
      <BasiqDatePicker
        aria-label="外部フォームの日付"
        :default-value="fixedToday"
        form="external-date-picker-form"
        name="date"
      />
      <output data-testid="submitted-value">{{ submittedValue }}</output>
    </div>
  `,
  data: () => ({ fixedToday }),
});

const DynamicDisabledHarness = defineComponent({
  name: "DynamicDisabledDatePickerHarness",
  components: { BasiqDatePicker },
  setup() {
    const disabled = ref(false);
    return { disabled, fixedToday };
  },
  template: `
    <div class="basiq-story" style="max-width: 24rem">
      <BasiqDatePicker
        aria-label="動的に無効化する日付"
        :disabled="disabled"
        portal-target="#dynamic-disabled-date-picker-portal"
        :today="fixedToday"
      />
      <button type="button" @click="disabled = true">無効にする</button>
      <div id="dynamic-disabled-date-picker-portal"></div>
    </div>
  `,
});

const meta = {
  title: "Components/DatePicker",
  component: BasiqDatePicker,
  tags: ["autodocs"],
  args: {
    defaultValue: fixedToday,
    today: fixedToday,
  },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "A Gregorian date input with a calendar popover. It accepts `yyyy/mm/dd`, `yyyy/m/d`, and `yyyymmdd`, normalizes committed text to `yyyy/mm/dd`, and submits `YYYY-MM-DD` when `name` is set. When `today` is omitted, the local date is captured when the calendar mounts; pass it explicitly during SSR and update it for long-lived views.",
      },
    },
  },
  render: (args) => ({
    components: { BasiqDatePicker, BasiqFormField },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField label="開催日" description="日付を入力するか、カレンダーから選択します。">
          <BasiqDatePicker v-bind="args" />
        </BasiqFormField>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqDatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "event-date",
  },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqDatePicker, BasiqFormField } from "basiq-ui";
</script>

<template>
  <BasiqFormField
    label="開催日"
    description="日付を入力するか、カレンダーから選択します。"
  >
    <BasiqDatePicker :default-value="parseDate('2026-09-04')" name="event-date" />
  </BasiqFormField>
</template>
`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "開催日" });

    await expect(input).toHaveValue("2026/09/04");
    await expect(input).toHaveAccessibleDescription("日付を入力するか、カレンダーから選択します。");
    await expect(
      canvasElement.querySelector<HTMLInputElement>("input[type='hidden']"),
    ).toHaveAttribute("name", "event-date");
    await expect(canvas.getByRole("button", { name: "開催日 日付を選択" })).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
  },
};

export const DirectInput: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ControlledHarness },
    template: "<ControlledHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "開催日" });

    await userEvent.clear(input);
    await userEvent.type(input, "２０２６／９／５");
    await userEvent.tab();

    await waitFor(() => expect(input).toHaveValue("2026/09/05"));
    await expect(canvas.getByTestId("value")).toHaveTextContent("2026-09-05");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "2026/09/06");
    await userEvent.keyboard("{Escape}");
    await expect(input).toHaveValue("2026/09/05");
    await expect(canvas.getByTestId("value")).toHaveTextContent("2026-09-05");
  },
};

export const InputMethodComposition: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ControlledHarness },
    template: "<ControlledHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "開催日" });

    await userEvent.clear(input);
    input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    await userEvent.type(input, "20260905");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("20260905");
    await expect(canvas.getByTestId("value")).toHaveTextContent("2026-09-04");

    input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(input).toHaveValue("2026/09/05"));
    await expect(canvas.getByTestId("value")).toHaveTextContent("2026-09-05");
  },
};

export const CalendarSelection: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ControlledHarness },
    template: "<ControlledHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "開催日" });

    await userEvent.click(canvas.getByRole("button", { name: "開催日 日付を選択" }));
    const dialog = await canvas.findByRole("dialog", { name: "開催日 日付を選択" });
    const nextDay = dialog.querySelector<HTMLElement>("[data-value='2026-09-05']");
    await userEvent.click(nextDay!);

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(input).toHaveValue("2026/09/05");
    await expect(input).toHaveFocus();
    await expect(canvas.getByTestId("value")).toHaveTextContent("2026-09-05");
  },
};

export const InvalidInput: Story = {
  tags: ["regression", "!autodocs"],
  args: {
    defaultValue: fixedToday,
    name: "event-date",
  },
  parameters: controlsDisabledStoryParameters,
  render: (args) => ({
    components: { BasiqDatePicker },
    setup: () => ({ args, validationChange }),
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqDatePicker
          v-bind="args"
          aria-label="不正な日付"
          @validation-change="validationChange"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    validationChange.mockClear();
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "不正な日付" });

    await userEvent.clear(input);
    await userEvent.type(input, "2026/02/30");
    await userEvent.tab();

    await expect(input).toHaveValue("2026/02/30");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("存在する日付を入力してください。");
    await expect(canvas.getByText("存在する日付を入力してください。")).toBeVisible();
    await expect(validationChange).toHaveBeenLastCalledWith({
      reason: "invalid-date",
      status: "invalid",
    });
    await expect(canvasElement.querySelector<HTMLInputElement>("input[type='hidden']")).toHaveValue(
      "",
    );

    await userEvent.clear(input);
    await expect(validationChange).toHaveBeenLastCalledWith({ reason: null, status: "pending" });
    await expect(canvas.queryByText("存在する日付を入力してください。")).not.toBeInTheDocument();
  },
};

export const ControlledRejection: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { RejectingHarness },
    template: "<RejectingHarness />",
  }),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole<HTMLInputElement>("textbox", {
      name: "変更を拒否する日付",
    });

    await userEvent.clear(input);
    await userEvent.type(input, "2026/09/05");
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveValue("2026/09/04"));
  },
};

export const ControlledFormSubmissionRejection: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { RejectingFormHarness },
    template: "<RejectingFormHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", {
      name: "変更を拒否する送信日",
    });
    const form = canvasElement.querySelector("form")!;
    const hiddenInput = canvasElement.querySelector<HTMLInputElement>("input[type='hidden']")!;

    await userEvent.clear(input);
    await userEvent.type(input, "2026/09/05");
    await expect(hiddenInput).toHaveValue("");
    form.requestSubmit();

    await waitFor(() => expect(input).toHaveValue("2026/09/04"));
    await expect(canvas.getByTestId("submitted-value")).toHaveTextContent("not submitted");
    await expect(hiddenInput).toHaveValue("2026-09-04");
  },
};

export const EquivalentControlledValueRerender: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { EquivalentValueRerenderHarness },
    template: "<EquivalentValueRerenderHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "再生成される日付" });

    await userEvent.clear(input);
    await userEvent.type(input, "2026/09/05");

    await expect(input).toHaveValue("2026/09/05");
    await expect(canvasElement.querySelector("[data-revision='1']")).toBeInTheDocument();
  },
};

export const FormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "リセット対象の日付" });

    await userEvent.clear(input);
    await userEvent.type(input, "20260905");
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveValue("2026/09/05"));
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await waitFor(() => expect(input).toHaveValue("2026/09/04"));
    await expect(canvasElement.querySelector<HTMLInputElement>("input[type='hidden']")).toHaveValue(
      "2026-09-04",
    );
  },
};

export const CanceledFormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqDatePicker },
    setup: () => ({ fixedToday }),
    template: `
      <form class="basiq-story" style="max-width: 24rem" @reset.prevent>
        <BasiqDatePicker
          aria-label="リセットを取り消す日付"
          :default-value="fixedToday"
          name="date"
        />
        <button type="reset">リセットを取り消す</button>
      </form>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", {
      name: "リセットを取り消す日付",
    });

    await userEvent.clear(input);
    await userEvent.type(input, "2026/09/05");
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveValue("2026/09/05"));
    await userEvent.click(canvas.getByRole("button", { name: "リセットを取り消す" }));
    await expect(input).toHaveValue("2026/09/05");
  },
};

export const ExternalForm: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ExternalFormHarness },
    template: "<ExternalFormHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "外部フォームの日付" });

    await userEvent.clear(input);
    await userEvent.type(input, "20260905");
    await userEvent.click(canvas.getByRole("button", { name: "外部フォームを送信" }));
    await waitFor(() =>
      expect(canvas.getByTestId("submitted-value")).toHaveTextContent("2026-09-05"),
    );
    await userEvent.click(canvas.getByRole("button", { name: "外部フォームをリセット" }));
    await waitFor(() => expect(input).toHaveValue("2026/09/04"));
  },
};

export const FormSubmission: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { FormSubmitHarness },
    template: "<FormSubmitHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "送信する日付" });

    await userEvent.type(input, "20260905");
    await userEvent.keyboard("{Enter}");

    await waitFor(() =>
      expect(canvas.getByTestId("submitted-value")).toHaveTextContent("2026-09-05"),
    );
    await expect(canvas.getByTestId("submitted-action")).toHaveTextContent("save");
    await waitFor(() => expect(input).toHaveValue("2026/09/05"));
  },
};

export const ProgrammaticFormSubmissionWhileEditing: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { FormSubmitHarness },
    template: "<FormSubmitHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "送信する日付" });
    const form = canvasElement.querySelector("form")!;

    await userEvent.type(input, "20260905");
    form.requestSubmit();

    await waitFor(() =>
      expect(canvas.getByTestId("submitted-value")).toHaveTextContent("2026-09-05"),
    );
    await expect(canvas.getByTestId("submitted-action")).toHaveTextContent("null");
    await expect(input).toHaveFocus();
  },
};

export const ProgrammaticInvalidSubmissionWhileEditing: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { FormSubmitHarness },
    template: "<FormSubmitHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "送信する日付" });
    const form = canvasElement.querySelector("form")!;

    await userEvent.type(input, "2026/02/30");
    form.requestSubmit();

    await expect(canvas.getByTestId("submitted-value")).toHaveTextContent("not submitted");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("存在する日付を入力してください。");
  },
};

export const FormNoValidateSubmission: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { FormSubmitHarness },
    template: "<FormSubmitHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "送信する日付" });

    await userEvent.type(input, "2026/02/30");
    await userEvent.click(canvas.getByRole("button", { name: "下書き保存" }));

    await waitFor(() => expect(canvas.getByTestId("submitted-value")).toHaveTextContent(/^$/));
    await expect(canvas.getByTestId("submitted-action")).toHaveTextContent("draft");
  },
};

export const EmptyFormValue: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqDatePicker },
    template: `
      <form class="basiq-story" style="max-width: 24rem">
        <BasiqDatePicker aria-label="空の日付" name="date" />
      </form>
    `,
  }),
  play: async ({ canvasElement }) => {
    const hiddenInput = canvasElement.querySelector<HTMLInputElement>("input[type='hidden']")!;
    const data = new FormData(hiddenInput.form!);

    await expect(hiddenInput).toBeEnabled();
    await expect(hiddenInput).toHaveValue("");
    await expect(data.get("date")).toBe("");
  },
};

export const ControlledResetToExplicitNull: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ControlledResetHarness },
    template: "<ControlledResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "controlledリセット対象" });

    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await waitFor(() => expect(input).toHaveValue(""));
    await expect(canvas.getByTestId("value")).toHaveTextContent("null");
  },
};

export const ControlledResetRejection: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ControlledResetHarness },
    template: "<ControlledResetHarness reject />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "controlledリセット対象" });

    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await waitFor(() => expect(input).toHaveValue("2026/09/04"));
    await expect(canvas.getByTestId("value")).toHaveTextContent("2026-09-04");
  },
};

export const DynamicRequired: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { DynamicRequiredHarness },
    template: "<DynamicRequiredHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", { name: "動的な必須日付" });

    expect(input.checkValidity()).toBe(false);
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    await userEvent.click(canvas.getByRole("button", { name: "任意にする" }));
    await waitFor(() => expect(input.checkValidity()).toBe(true));
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
  },
};

export const Required: Story = {
  args: {
    defaultValue: null,
    required: true,
  },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqDatePicker, BasiqFormField } from "basiq-ui";
</script>

<template>
  <BasiqFormField
    label="開催日"
    description="日付を入力するか、カレンダーから選択します。"
  >
    <BasiqDatePicker :today="parseDate('2026-09-04')" required />
  </BasiqFormField>
</template>
`),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole<HTMLInputElement>("textbox", { name: "開催日" });

    await expect(input).toBeRequired();
    await expect(input.checkValidity()).toBe(false);
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    await expect(input).toHaveAccessibleDescription(/日付を入力してください。/);
  },
};

export const RightToLeft: Story = {
  args: {
    dir: "rtl",
  },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqDatePicker } from "basiq-ui";
</script>

<template>
  <BasiqDatePicker
    :default-value="parseDate('2026-09-04')"
    :today="parseDate('2026-09-04')"
    aria-label="開催日"
    dir="rtl"
  />
</template>
`),
  render: (args) => ({
    components: { BasiqDatePicker },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqDatePicker v-bind="args" aria-label="開催日" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "開催日" });

    await expect(input.parentElement).toHaveAttribute("dir", "rtl");
    await expect(input).toHaveAttribute("dir", "ltr");
    await userEvent.click(canvas.getByRole("button", { name: "開催日 日付を選択" }));
    const dialog = await waitFor(() => {
      const element = canvasElement.ownerDocument.querySelector<HTMLElement>(
        "#basiq-overlay-host [role='dialog']",
      );
      expect(element).toHaveAccessibleName("開催日 日付を選択");
      return element!;
    });
    await expect(dialog.closest("[data-basiq-overlay-host]")).toBeInTheDocument();
    await expect(dialog).toHaveAttribute("dir", "rtl");
  },
};

export const ContextualTriggerLabels: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqDatePicker, BasiqFormField },
    template: `
      <div class="basiq-story" style="display: grid; gap: 1rem; max-width: 24rem">
        <BasiqFormField label="開始日"><BasiqDatePicker /></BasiqFormField>
        <BasiqFormField label="終了日"><BasiqDatePicker /></BasiqFormField>
        <span id="billing-date-label">請求日</span>
        <BasiqDatePicker aria-labelledby="billing-date-label" />
        <BasiqDatePicker aria-label="公開日" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("button", { name: "開始日 日付を選択" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "終了日 日付を選択" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "請求日 日付を選択" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "公開日 日付を選択" })).toBeInTheDocument();
  },
};

export const ScrollablePopover: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "開催日 日付を選択" }));
    const dialog = await waitFor(() => {
      const element = canvasElement.ownerDocument.querySelector<HTMLElement>(
        "#basiq-overlay-host [role='dialog']",
      );
      expect(element).toHaveAccessibleName("日付を選択");
      return element!;
    });
    const viewport = dialog.firstElementChild as HTMLElement;

    dialog.style.maxHeight = "12rem";
    dialog.style.maxWidth = "14rem";

    await waitFor(() => expect(viewport).toHaveAttribute("tabindex", "0"));
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);

    viewport.scrollTo({ left: viewport.scrollWidth, top: viewport.scrollHeight });
    await expect(viewport.scrollTop).toBeGreaterThan(0);
    await expect(viewport.scrollLeft).toBeGreaterThan(0);
  },
};

export const CustomLabels: Story = {
  tags: ["regression", "!autodocs"],
  args: {
    labels: {
      calendar: {
        calendar: "Choose a date",
        nextMonth: "Next month",
        previousMonth: "Previous month",
      },
      trigger: "Choose a date",
    },
    locale: "en-US",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "開催日 Choose a date" }));
    const dialog = await waitFor(() => {
      const element = canvasElement.ownerDocument.querySelector<HTMLElement>(
        "#basiq-overlay-host [role='dialog']",
      );
      expect(element).toHaveAccessibleName("Choose a date");
      return element!;
    });
    const calendar = within(dialog);
    await expect(calendar.getByRole("group", { name: /Choose a date/ })).toBeInTheDocument();
    await expect(calendar.getByRole("button", { name: "Next month" })).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqDatePicker, BasiqFormField } from "basiq-ui";
</script>

<template>
  <BasiqFormField
    label="開催日"
    description="日付を入力するか、カレンダーから選択します。"
  >
    <BasiqDatePicker :default-value="parseDate('2026-09-04')" disabled />
  </BasiqFormField>
</template>
`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "開催日" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "開催日 日付を選択" })).toBeDisabled();
  },
};

export const DisabledWhileOpen: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { DynamicDisabledHarness },
    template: "<DynamicDisabledHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole<HTMLInputElement>("textbox", {
      name: "動的に無効化する日付",
    });

    await userEvent.click(canvas.getByRole("button", { name: "動的に無効化する日付 日付を選択" }));
    const dialog = await canvas.findByRole("dialog", {
      name: "動的に無効化する日付 日付を選択",
    });
    await userEvent.click(canvas.getByRole("button", { name: "無効にする" }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(input).toBeDisabled();
  },
};

export const Readonly: Story = {
  args: {
    readonly: true,
  },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqDatePicker, BasiqFormField } from "basiq-ui";
</script>

<template>
  <BasiqFormField
    label="開催日"
    description="日付を入力するか、カレンダーから選択します。"
  >
    <BasiqDatePicker :default-value="parseDate('2026-09-04')" readonly />
  </BasiqFormField>
</template>
`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "開催日" })).toHaveAttribute("readonly");
    await expect(canvas.getByRole("button", { name: "開催日 日付を選択" })).toBeEnabled();
  },
};
