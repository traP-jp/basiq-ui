import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
  type PlaygroundSourceContext,
} from "../../stories/storybook-parameters";
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

function createFormFieldPlaygroundSource(_source: string, { args }: PlaygroundSourceContext) {
  const attributes: string[] = [];

  for (const name of ["description", "error", "label"] as const) {
    const value = args[name];

    if (typeof value === "string") {
      attributes.push(`${name}="${escapeHtmlAttribute(value)}"`);
    }
  }

  if (typeof args.invalid === "boolean") {
    attributes.push(args.invalid ? "invalid" : ':invalid="false"');
  }

  if (args.required === true) {
    attributes.push("required");
  }

  return `<template>
  <BasiqFormField
${attributes.map((attribute) => `    ${attribute}`).join("\n")}
  >
    <BasiqInput autocomplete="username" name="username" />
  </BasiqFormField>
</template>`;
}

function escapeHtmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

const meta = {
  title: "Components/FormField",
  component: BasiqFormField,
  subcomponents: { BasiqInput },
  tags: ["autodocs"],
  args: {
    description: "公開プロフィールに表示されます",
    error: undefined,
    invalid: undefined,
    label: "ユーザー名",
    required: true,
  },
  parameters: {
    controls: {
      disable: true,
      include: ["description", "error", "invalid", "label", "required"],
    },
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

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(createFormFieldPlaygroundSource),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqFormField
        description="公開プロフィールに表示されます"
        label="ユーザー名"
        required
      >
        <BasiqInput autocomplete="username" name="username" />
      </BasiqFormField>
    </template>
  `),
};

export const DefaultInteraction: Story = {
  ...Default,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqFormField
        description="公開プロフィールに表示されます"
        error="ユーザー名を入力してください"
        label="ユーザー名"
        required
      >
        <BasiqInput autocomplete="username" name="username" />
      </BasiqFormField>
    </template>
  `),
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
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqFormField label="Default"><BasiqInput /></BasiqFormField>
      <BasiqFormField label="Required" required><BasiqInput /></BasiqFormField>
      <BasiqFormField description="補足説明" label="Description">
        <BasiqInput />
      </BasiqFormField>
      <BasiqFormField description="補足説明" label="Required + Description" required>
        <BasiqInput />
      </BasiqFormField>
      <BasiqFormField error="入力内容を確認してください" label="Error">
        <BasiqInput />
      </BasiqFormField>
      <BasiqFormField error="入力内容を確認してください" label="Required + Error" required>
        <BasiqInput />
      </BasiqFormField>
      <BasiqFormField
        description="補足説明"
        error="入力内容を確認してください"
        label="Description + Error"
      >
        <BasiqInput />
      </BasiqFormField>
      <BasiqFormField
        description="補足説明"
        error="入力内容を確認してください"
        label="Required + Description + Error"
        required
      >
        <BasiqInput />
      </BasiqFormField>
    </template>
  `),
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
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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
  parameters: createFixedVueSourceParameters(`
    <template>
      <p id="external-description">外部の説明</p>
      <BasiqFormField description="FormFieldの説明" label="説明の結合">
        <BasiqInput aria-describedby="external-description" />
      </BasiqFormField>
    </template>
  `),
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
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqFormField
        error="入力内容を確認してください"
        label="ユーザー名"
        required
      >
        <template #required>入力必須</template>
        <BasiqInput />
        <template #error="{ error }">{{ error }}（再入力してください）</template>
      </BasiqFormField>
    </template>
  `),
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
  name: "Explicit control ID",
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqFormField control-id="explicit-control" label="明示的なID">
        <BasiqInput />
      </BasiqFormField>
    </template>
  `),
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
};

export const ExplicitControlIdInteraction: Story = {
  ...ExplicitControlId,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "明示的なID" });

    await expect(input).toHaveAttribute("id", "explicit-control");
    await userEvent.click(canvas.getByText("明示的なID"));
    await expect(input).toHaveFocus();
  },
};

export const NativeControl: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
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
    </template>
  `),
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
};

export const NativeControlInteraction: Story = {
  ...NativeControl,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Native input" });

    await expect(input).toBeRequired();
    await userEvent.click(canvas.getByText("Native input"));
    await expect(input).toHaveFocus();
  },
};

export const FormSubmission: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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
