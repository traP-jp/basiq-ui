import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import BasiqButton from "../button/BasiqButton.vue";
import BasiqInput from "../input/BasiqInput.vue";
import BasiqFormField from "./BasiqFormField.vue";

const FormSubmissionHarness = defineComponent({
  name: "FormSubmissionHarness",
  components: { BasiqButton, BasiqFormField, BasiqInput },
  setup() {
    const submittedValue = ref("");
    const username = ref("");

    function submit(event: Event) {
      const form = event.currentTarget as HTMLFormElement;
      submittedValue.value = String(new FormData(form).get("username") ?? "");
    }

    return { submit, submittedValue, username };
  },
  template: `
    <form class="basiq-story basiq-form-story" @submit.prevent="submit">
      <BasiqFormField label="ユーザー名" required>
        <BasiqInput v-model="username" name="username" />
      </BasiqFormField>
      <BasiqButton type="submit">送信</BasiqButton>
      <output data-testid="submitted-value">{{ submittedValue }}</output>
    </form>
  `,
});

const meta = {
  title: "Components/FormField",
  component: BasiqFormField,
  subcomponents: { BasiqInput },
  tags: ["test"],
  args: {
    description: "公開プロフィールに表示されます",
    error: undefined,
    invalid: undefined,
    label: "ユーザー名",
    required: true,
  },
  render: (args) => ({
    components: { BasiqFormField, BasiqInput },
    setup() {
      const value = ref("");

      return { args, value };
    },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField v-bind="args">
          <BasiqInput v-model="value" autocomplete="username" name="username" />
        </BasiqFormField>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqFormField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const description = canvas.getByText("公開プロフィールに表示されます");
    const input = canvas.getByRole("textbox", { name: "ユーザー名" });

    await expect(canvas.getByText("必須")).toBeInTheDocument();
    await expect(input).toBeRequired();
    await expect(input).toHaveAttribute("aria-describedby", description.id);
    await userEvent.click(canvas.getByText("ユーザー名"));
    await expect(input).toHaveFocus();
  },
};

export const Error: Story = {
  args: { error: "ユーザー名を入力してください", invalid: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const description = canvas.getByText("公開プロフィールに表示されます");
    const error = canvas.getByText("ユーザー名を入力してください");
    const input = canvas.getByRole("textbox", { name: "ユーザー名" });

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute("aria-describedby", `${description.id} ${error.id}`);
    await expect(error).not.toHaveAttribute("aria-live");
    await expect(error).not.toHaveAttribute("role");
  },
};

export const Configurations: Story = {
  render: () => ({
    components: { BasiqFormField, BasiqInput },
    setup() {
      const configurations = [
        { label: "Default" },
        { label: "Required", required: true },
        { description: "補足説明", label: "Description" },
        { description: "補足説明", label: "Required + Description", required: true },
        { error: "入力内容を確認してください", label: "Error" },
        { error: "入力内容を確認してください", label: "Required + Error", required: true },
        {
          description: "補足説明",
          error: "入力内容を確認してください",
          label: "Description + Error",
        },
        {
          description: "補足説明",
          error: "入力内容を確認してください",
          label: "Required + Description + Error",
          required: true,
        },
      ];

      return { configurations };
    },
    template: `
      <div class="basiq-story basiq-form-configurations">
        <BasiqFormField
          v-for="configuration in configurations"
          :key="configuration.label"
          v-bind="configuration"
        >
          <BasiqInput />
        </BasiqFormField>
      </div>
    `,
  }),
};

export const EmptyError: Story = {
  args: { error: "", required: false },
  render: (args) => ({
    components: { BasiqFormField, BasiqInput },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField v-bind="args">
          <BasiqInput />
          <template #error>表示されないerror slot</template>
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "ユーザー名" });

    await expect(canvas.queryByText("表示されないerror slot")).not.toBeInTheDocument();
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(input).toHaveAttribute(
      "aria-describedby",
      canvas.getByText("公開プロフィールに表示されます").id,
    );
  },
};

export const ExistingDescription: Story = {
  render: () => ({
    components: { BasiqFormField, BasiqInput },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <p id="external-description">外部の説明</p>
        <BasiqFormField description="FormFieldの説明" label="説明の結合">
          <BasiqInput aria-describedby="external-description" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const description = canvas.getByText("FormFieldの説明");
    const input = canvas.getByRole("textbox", { name: "説明の結合" });

    await expect(input).toHaveAttribute(
      "aria-describedby",
      `external-description ${description.id}`,
    );
  },
};

export const CustomRequiredAndError: Story = {
  args: { error: "入力内容を確認してください" },
  render: (args) => ({
    components: { BasiqFormField, BasiqInput },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField v-bind="args">
          <template #required>入力必須</template>
          <BasiqInput :invalid="false" :required="false" />
          <template #error="{ error }">{{ error }}（再入力してください）</template>
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "ユーザー名" });

    await expect(canvas.getByText("入力必須")).toBeInTheDocument();
    await expect(
      canvas.getByText("入力内容を確認してください（再入力してください）"),
    ).toBeInTheDocument();
    await expect(input).toBeRequired();
    await expect(input).toHaveAttribute("aria-invalid", "true");
  },
};

export const ExplicitControlId: Story = {
  render: () => ({
    components: { BasiqFormField, BasiqInput },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField control-id="explicit-control" label="明示的なID">
          <BasiqInput />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "明示的なID" });

    await expect(input).toHaveAttribute("id", "explicit-control");
    await userEvent.click(canvas.getByText("明示的なID"));
    await expect(input).toHaveFocus();
  },
};

export const NativeControl: Story = {
  render: () => ({
    components: { BasiqFormField },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField
          v-slot="{ describedBy, id, invalid, required }"
          description="BasiQ UI以外のcontrolも明示的に接続できます"
          label="Native input"
          required
        >
          <input
            :id="id"
            :aria-describedby="describedBy"
            :aria-invalid="invalid || undefined"
            :required="required"
          />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Native input" });

    await expect(input).toBeRequired();
    await userEvent.click(canvas.getByText("Native input"));
    await expect(input).toHaveFocus();
  },
};

export const FormSubmission: Story = {
  render: () => ({
    components: { FormSubmissionHarness },
    template: "<FormSubmissionHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "ユーザー名" });

    await userEvent.type(input, "y-aki");
    await userEvent.click(canvas.getByRole("button", { name: "送信" }));
    await expect(canvas.getByTestId("submitted-value")).toHaveTextContent("y-aki");
  },
};
