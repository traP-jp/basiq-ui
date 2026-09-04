import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import { SampleInfoIcon, SampleTagIcon } from "../../stories/sample-icons";
import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
  type PlaygroundSourceContext,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqButton from "../button/BasiqButton.vue";
import BasiqDialog from "../dialog/BasiqDialog.vue";
import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqSelect, { type BasiqSelectItemDefinition } from "./BasiqSelect.vue";

const items: BasiqSelectItemDefinition[] = [
  {
    description: "メールで更新を受け取ります",
    icon: SampleInfoIcon,
    label: "メール",
    value: "email",
  },
  {
    description: "ブラウザへ通知します",
    icon: SampleTagIcon,
    label: "プッシュ通知",
    value: "push",
  },
  { disabled: true, label: "SMS（準備中）", value: "sms" },
  { label: "Slack", value: "slack" },
];

const TabNavigationHarness = defineComponent({
  name: "SelectTabNavigationHarness",
  components: { BasiqFormField, BasiqSelect },
  setup() {
    return { items };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <button type="button">前の操作</button>
      <BasiqFormField label="通知方法">
        <BasiqSelect default-value="email" :items="items" />
      </BasiqFormField>
      <button type="button">次の操作</button>
    </div>
  `,
});

const DisabledFieldsetTabNavigationHarness = defineComponent({
  name: "SelectDisabledFieldsetTabNavigationHarness",
  components: { BasiqFormField, BasiqSelect },
  setup() {
    return { items };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <button type="button">前の有効な操作</button>
      <fieldset disabled>
        <button type="button">前の無効な操作</button>
      </fieldset>
      <BasiqFormField label="通知方法">
        <BasiqSelect default-value="email" :items="items" />
      </BasiqFormField>
      <fieldset disabled>
        <button type="button">次の無効な操作</button>
      </fieldset>
      <button type="button">次の有効な操作</button>
    </div>
  `,
});

const ChangeEventHarness = defineComponent({
  name: "SelectChangeEventHarness",
  components: { BasiqFormField, BasiqSelect },
  setup() {
    const events = ref<string[]>([]);

    function handleComponentChange(event: Event) {
      events.value.push(`component:${(event.currentTarget as Element | null)?.tagName ?? "null"}`);
    }

    return { events, handleComponentChange, items };
  },
  template: `
    <form class="basiq-story basiq-form-story" @change="events.push('form')">
      <BasiqFormField label="通知方法">
        <BasiqSelect
          :items="items"
          name="notification"
          @change="handleComponentChange"
        />
      </BasiqFormField>
      <output data-testid="change-events">{{ events.join(',') }}</output>
    </form>
  `,
});

const ResetHarness = defineComponent({
  name: "SelectResetHarness",
  components: { BasiqFormField, BasiqSelect },
  props: { canceled: Boolean, controlled: Boolean },
  setup() {
    const value = ref<string | null>("email");

    return { items, value };
  },
  template: `
    <form class="basiq-story basiq-form-story" @reset="canceled && $event.preventDefault()">
      <BasiqFormField label="通知方法">
        <BasiqSelect
          v-if="controlled"
          v-model="value"
          default-value="email"
          :items="items"
          name="notification"
        />
        <BasiqSelect
          v-else
          default-value="email"
          :items="items"
          name="notification"
        />
      </BasiqFormField>
      <button type="reset">リセット</button>
    </form>
  `,
});

const FormDataHarness = defineComponent({
  name: "SelectFormDataHarness",
  components: { BasiqButton, BasiqFormField, BasiqSelect },
  props: { external: Boolean },
  setup() {
    const submittedValue = ref("");

    function readForm() {
      const form = document.querySelector<HTMLFormElement>("#select-form");
      submittedValue.value = JSON.stringify(
        Array.from(new globalThis.FormData(form ?? undefined).entries()),
      );
    }

    return { items, readForm, submittedValue };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <form id="select-form">
        <BasiqFormField v-if="!external" label="通知方法">
          <BasiqSelect :items="items" name="notification" placeholder="選択してください" />
        </BasiqFormField>
      </form>
      <BasiqFormField v-if="external" label="通知方法">
        <BasiqSelect
          form="select-form"
          :items="items"
          name="notification"
          placeholder="選択してください"
        />
      </BasiqFormField>
      <BasiqButton form="select-form" type="reset">リセット</BasiqButton>
      <BasiqButton type="button" @click="readForm">FormDataを確認</BasiqButton>
      <output data-testid="submitted-value">{{ submittedValue }}</output>
    </div>
  `,
});

const ControlledRejectionHarness = defineComponent({
  name: "ControlledSelectRejectionHarness",
  components: { BasiqFormField, BasiqSelect },
  setup() {
    const requestedValue = ref<string | null>(null);

    return { items, requestedValue };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <BasiqFormField label="通知方法">
        <BasiqSelect
          :items="items"
          model-value="email"
          @update:model-value="requestedValue = $event"
        />
      </BasiqFormField>
      <output data-testid="requested-value">{{ requestedValue }}</output>
    </div>
  `,
});

const ControlledOpenHarness = defineComponent({
  name: "ControlledSelectOpenHarness",
  components: { BasiqFormField, BasiqSelect },
  setup() {
    const open = ref(false);

    return { items, open };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <BasiqFormField label="通知方法">
        <BasiqSelect v-model:open="open" :items="items" />
      </BasiqFormField>
      <output data-testid="open-state">{{ open }}</output>
    </div>
  `,
});

function createSelectPlaygroundSource(_source: string, { args }: PlaygroundSourceContext) {
  const attributes = [
    typeof args.placeholder === "string"
      ? `placeholder="${escapeSourceAttribute(args.placeholder)}"`
      : "",
    args.disabled === true ? "disabled" : "",
    args.invalid === true ? "invalid" : "",
    args.required === true ? "required" : "",
    typeof args.size === "string" ? `size="${args.size}"` : "",
  ].filter(Boolean);

  return `<script setup lang="ts">
import { ref } from "vue";
import { BasiqFormField, BasiqSelect } from "basiq-ui";

const value = ref<string | null>(${JSON.stringify(args.defaultValue ?? null)});
const items = ${JSON.stringify(args.items ?? [], null, 2)};
</script>

<template>
  <BasiqFormField label="通知方法">
    <BasiqSelect
      v-model="value"
      :items="items"
${attributes.map((attribute) => `      ${attribute}`).join("\n")}
    />
  </BasiqFormField>
</template>`;
}

function escapeSourceAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

async function chooseOption(canvasElement: HTMLElement, optionName: string) {
  const canvas = within(canvasElement);
  const page = within(document.body);

  await userEvent.click(canvas.getByRole("combobox"));
  await userEvent.click(await page.findByRole("option", { name: new RegExp(optionName) }));
  await waitForSelectToClose();
}

async function waitForSelectToClose() {
  const page = within(document.body);

  await waitFor(() => expect(page.queryByRole("listbox")).not.toBeInTheDocument());
}

const meta = {
  title: "Components/Select",
  component: BasiqSelect,
  tags: ["autodocs"],
  args: {
    defaultValue: null,
    disabled: false,
    invalid: false,
    items,
    placeholder: "選択してください",
    required: false,
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  parameters: {
    controls: {
      disable: true,
      include: ["defaultValue", "disabled", "invalid", "items", "placeholder", "required", "size"],
    },
  },
  render: (args) => ({
    components: { BasiqFormField, BasiqSelect },
    setup() {
      const value = ref<string | null>(args.defaultValue ?? null);

      return { args, value };
    },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField
          description="通知を受け取る方法を選択してください"
          label="通知方法"
          :required="args.required"
        >
          <BasiqSelect v-model="value" v-bind="args" />
        </BasiqFormField>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(createSelectPlaygroundSource),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { ref } from "vue";
    import { BasiqFormField, BasiqSelect } from "basiq-ui";

    const value = ref<string | null>(null);
    const items = [
      { description: "メールで更新を受け取ります", label: "メール", value: "email" },
      { description: "ブラウザへ通知します", label: "プッシュ通知", value: "push" },
      { disabled: true, label: "SMS（準備中）", value: "sms" },
    ];
    </script>

    <template>
      <BasiqFormField label="通知方法">
        <BasiqSelect v-model="value" :items="items" placeholder="選択してください" />
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
    const page = within(document.body);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await expect(trigger).toHaveTextContent("選択してください");
    await userEvent.click(trigger);

    const email = await page.findByRole("option", { name: /メール/ });
    const push = page.getByRole("option", { name: /プッシュ通知/ });
    const sms = page.getByRole("option", { name: /SMS/ });

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(sms).toHaveAttribute("data-disabled");
    await userEvent.click(push);
    await waitForSelectToClose();
    await expect(trigger).toHaveTextContent("プッシュ通知");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    await expect(await page.findByRole("option", { name: /プッシュ通知/ })).toHaveAttribute(
      "data-state",
      "checked",
    );
    await userEvent.keyboard("{ArrowUp}{Enter}");
    await waitForSelectToClose();
    await expect(trigger).toHaveTextContent("メール");
    await expect(email).not.toBeInTheDocument();
  },
};

export const TypeaheadAndDisabledItem: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await userEvent.click(trigger);
    await page.findByRole("option", { name: /メール/ });
    await userEvent.keyboard("プ");
    await expect(page.getByRole("option", { name: /プッシュ通知/ })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitForSelectToClose();
    await expect(trigger).toHaveTextContent("プッシュ通知");

    await userEvent.click(trigger);
    await userEvent.keyboard("S");
    await expect(page.getByRole("option", { name: "Slack" })).toHaveFocus();
    await expect(page.getByRole("option", { name: /SMS/ })).not.toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitForSelectToClose();
    await expect(trigger).toHaveFocus();
  },
};

export const ClosedTypeahead: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    trigger.focus();
    await userEvent.keyboard("プ");
    await expect(trigger).toHaveTextContent("プッシュ通知");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.keyboard("S");
    await expect(trigger).toHaveTextContent("Slack");
  },
};

export const TabNavigation: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { TabNavigationHarness },
    template: "<TabNavigationHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });
    const previous = canvas.getByRole("button", { name: "前の操作" });
    const next = canvas.getByRole("button", { name: "次の操作" });

    await userEvent.click(trigger);
    await page.findByRole("option", { name: /メール/ });
    await userEvent.keyboard("{ArrowDown}{Tab}");
    await waitForSelectToClose();
    await expect(trigger).toHaveTextContent("プッシュ通知");
    await expect(next).toHaveFocus();

    await userEvent.click(trigger);
    await page.findByRole("option", { name: /プッシュ通知/ });
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await waitForSelectToClose();
    await expect(previous).toHaveFocus();
  },
};

export const TabNavigationSkipsDisabledFieldsets: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { DisabledFieldsetTabNavigationHarness },
    template: "<DisabledFieldsetTabNavigationHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });
    const previous = canvas.getByRole("button", { name: "前の有効な操作" });
    const next = canvas.getByRole("button", { name: "次の有効な操作" });

    await userEvent.click(trigger);
    await page.findByRole("option", { name: /メール/ });
    await userEvent.keyboard("{ArrowDown}{Tab}");
    await waitForSelectToClose();
    await expect(next).toHaveFocus();

    await userEvent.click(trigger);
    await page.findByRole("option", { name: /プッシュ通知/ });
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await waitForSelectToClose();
    await expect(previous).toHaveFocus();
  },
};

export const CustomItemAndValue: Story = {
  parameters: createFixedVueSourceParameters(`
    <BasiqSelect v-model="value" :items="items">
      <template #value="{ item, placeholder }">
        {{ item ? \`選択中: \${item.label}\` : placeholder }}
      </template>
      <template #item="{ item, selected }">
        <strong>{{ item.label }}</strong>
        <span>{{ selected ? "選択中" : item.description }}</span>
      </template>
    </BasiqSelect>
  `),
  render: () => ({
    components: { BasiqFormField, BasiqSelect },
    setup() {
      const value = ref<string | null>("email");

      return { items, value };
    },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField label="通知方法">
          <BasiqSelect v-model="value" :items="items" placeholder="選択してください">
            <template #value="{ item, placeholder }">
              {{ item ? '選択中: ' + item.label : placeholder }}
            </template>
            <template #item="{ item, selected }">
              <span :data-testid="'custom-item-' + item.value">
                <strong>{{ item.label }}</strong>
                — {{ selected ? '選択中' : item.description }}
              </span>
            </template>
          </BasiqSelect>
        </BasiqFormField>
      </div>
    `,
  }),
};

export const CustomItemInteraction: Story = {
  ...CustomItemAndValue,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await expect(trigger).toHaveTextContent("選択中: メール");
    await userEvent.click(trigger);
    await expect(page.getByTestId("custom-item-email")).toHaveTextContent("選択中");
    await userEvent.click(page.getByRole("option", { name: /プッシュ通知/ }));
    await waitForSelectToClose();
    await expect(trigger).toHaveTextContent("選択中: プッシュ通知");
  },
};

export const Sizes: Story = {
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqFormField, BasiqSelect },
    setup() {
      return { items };
    },
    template: `
      <div class="basiq-story" style="display: grid; gap: 1rem; max-width: 24rem">
        <BasiqFormField v-for="size in ['sm', 'md', 'lg']" :key="size" :label="size">
          <BasiqSelect default-value="email" :items="items" :size="size" />
        </BasiqFormField>
      </div>
    `,
  }),
};

export const ManagedAriaAttributes: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqFormField, BasiqSelect },
    setup() {
      return { items };
    },
    template: `
      <BasiqFormField label="通知方法" required>
        <BasiqSelect
          aria-autocomplete="list"
          aria-controls="incorrect-content"
          aria-expanded="true"
          aria-required="false"
          data-state="open"
          :items="items"
          required
          role="button"
        />
      </BasiqFormField>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await expect(trigger).toHaveAttribute("aria-autocomplete", "none");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-required", "true");
    await expect(trigger).toHaveAttribute("data-state", "closed");
    await expect(trigger.getAttribute("aria-controls")).not.toBe("incorrect-content");
  },
};

export const RightToLeft: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqFormField, BasiqSelect },
    setup() {
      return { items };
    },
    template: `
      <div dir="rtl" style="max-width: 24rem">
        <BasiqFormField label="通知方法">
          <BasiqSelect :items="items" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await waitFor(() => expect(trigger).toHaveAttribute("dir", "rtl"));
    await userEvent.click(trigger);
    const listbox = await page.findByRole("listbox");
    await expect(getComputedStyle(listbox).direction).toBe("rtl");
    await userEvent.keyboard("{Escape}");
    await waitForSelectToClose();
  },
};

export const RequiredValidation: Story = {
  args: { required: true },
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqFormField, BasiqSelect },
    setup() {
      return { items };
    },
    template: `
      <form class="basiq-story" style="max-width: 24rem">
        <BasiqFormField label="通知方法" required>
          <BasiqSelect :items="items" name="notification" placeholder="選択してください" />
        </BasiqFormField>
        <button type="submit">送信</button>
      </form>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });
    const submit = canvas.getByRole("button", { name: "送信" });
    const form = canvasElement.querySelector("form");

    if (form === null) throw new globalThis.Error("Select form was not rendered.");
    submit.focus();
    await expect(form.checkValidity()).toBe(false);
    await expect(submit).toHaveFocus();
    await userEvent.click(submit);
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    const invalidBorderColor = getComputedStyle(trigger).borderColor;
    await userEvent.hover(trigger);
    await expect(getComputedStyle(trigger).borderColor).toBe(invalidBorderColor);
    await userEvent.unhover(trigger);

    await chooseOption(canvasElement, "メール");
    await expect(form.checkValidity()).toBe(true);
    await expect(trigger).not.toHaveAttribute("aria-invalid", "true");
  },
};

export const UncontrolledFormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await chooseOption(canvasElement, "プッシュ通知");
    await expect(trigger).toHaveTextContent("プッシュ通知");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await waitFor(() => expect(trigger).toHaveTextContent("メール"));
  },
};

export const ControlledFormReset: Story = {
  ...UncontrolledFormReset,
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness controlled />",
  }),
};

export const CanceledFormReset: Story = {
  ...UncontrolledFormReset,
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness canceled />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await chooseOption(canvasElement, "プッシュ通知");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await waitFor(() => expect(trigger).toHaveTextContent("プッシュ通知"));
  },
};

export const NativeFormData: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { FormDataHarness },
    template: "<FormDataHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await chooseOption(canvasElement, "プッシュ通知");
    await userEvent.click(canvas.getByRole("button", { name: "FormDataを確認" }));
    await expect(canvas.getByTestId("submitted-value")).toHaveTextContent(
      '[["notification","push"]]',
    );
  },
};

export const ExternalForm: Story = {
  ...NativeFormData,
  render: () => ({
    components: { FormDataHarness },
    template: "<FormDataHarness external />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await chooseOption(canvasElement, "プッシュ通知");
    await userEvent.click(canvas.getByRole("button", { name: "FormDataを確認" }));
    await expect(canvas.getByTestId("submitted-value")).toHaveTextContent(
      '[["notification","push"]]',
    );
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await waitFor(() => expect(trigger).toHaveTextContent("選択してください"));
  },
};

export const ReplacedExternalFormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqFormField, BasiqSelect },
    setup() {
      return { items };
    },
    template: `
      <div class="basiq-story basiq-form-story">
        <form id="replaceable-select-form" />
        <BasiqFormField label="通知方法">
          <BasiqSelect
            default-value="email"
            form="replaceable-select-form"
            :items="items"
            name="notification"
          />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await chooseOption(canvasElement, "プッシュ通知");
    const oldForm = canvasElement.querySelector<HTMLFormElement>("#replaceable-select-form");
    if (oldForm === null) throw new globalThis.Error("External form was not rendered.");

    const replacementForm = document.createElement("form");
    replacementForm.id = oldForm.id;
    oldForm.replaceWith(replacementForm);
    replacementForm.reset();
    await waitFor(() => expect(trigger).toHaveTextContent("メール"));
  },
};

export const ChangeEventContract: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ChangeEventHarness },
    template: "<ChangeEventHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await chooseOption(canvasElement, "メール");
    await expect(canvas.getByTestId("change-events")).toHaveTextContent("component:SELECT,form");
  },
};

export const ControlledRejection: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ControlledRejectionHarness },
    template: "<ControlledRejectionHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await chooseOption(canvasElement, "プッシュ通知");
    await expect(canvas.getByTestId("requested-value")).toHaveTextContent("push");
    await expect(trigger).toHaveTextContent("メール");
  },
};

export const ControlledOpen: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ControlledOpenHarness },
    template: "<ControlledOpenHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("combobox", { name: "通知方法" });

    await expect(canvas.getByTestId("open-state")).toHaveTextContent("false");
    await userEvent.click(trigger);
    const listbox = await page.findByRole("listbox");
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(canvas.getByTestId("open-state")).toHaveTextContent("true");
    await userEvent.keyboard("{Escape}");
    await waitForSelectToClose();
    await expect(canvas.getByTestId("open-state")).toHaveTextContent("false");
  },
};

export const ExplicitPortalTarget: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqFormField, BasiqSelect },
    setup() {
      return { items };
    },
    template: `
      <div class="basiq-story">
        <div
          id="select-test-target"
          data-testid="select-target"
          style="position: relative; min-height: 1px"
        />
        <BasiqFormField label="通知方法">
          <BasiqSelect portal-target="#select-test-target" :items="items" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "通知方法" }));

    const target = canvas.getByTestId("select-target");
    const listbox = await within(target).findByRole("listbox");
    const layer = listbox.closest<HTMLElement>('[data-basiq-overlay-layer="dialog"]');
    await expect(layer?.parentElement).toBe(target);
    await userEvent.keyboard("{Escape}");
    await waitForSelectToClose();
  },
};

export const ThemeBridge: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqFormField, BasiqSelect, BasiqThemeProvider },
    setup() {
      return { items };
    },
    template: `
      <BasiqThemeProvider
        mode="dark"
        :overrides="{ color: { surfaceBase: 'rgb(20 30 40)' } }"
      >
        <BasiqFormField label="通知方法">
          <BasiqSelect :items="items" />
        </BasiqFormField>
      </BasiqThemeProvider>
    `,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "通知方法" }));
    const listbox = await within(document.body).findByRole("listbox");

    await expect(listbox).toHaveAttribute("data-basiq-theme", "dark");
    await expect(listbox.style.getPropertyValue("--basiq-color-surface-base")).toBe(
      "rgb(20 30 40)",
    );
    await userEvent.keyboard("{Escape}");
    await waitForSelectToClose();
  },
};

export const NestedInDialog: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqButton, BasiqDialog, BasiqFormField, BasiqSelect },
    setup() {
      return { items };
    },
    template: `
      <BasiqDialog data-testid="select-dialog" title="通知設定">
        <template #trigger><BasiqButton>通知設定を開く</BasiqButton></template>
        <BasiqFormField label="通知方法">
          <BasiqSelect :items="items" />
        </BasiqFormField>
      </BasiqDialog>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "通知設定を開く" }));
    const dialog = await page.findByTestId("select-dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await userEvent.click(page.getByRole("combobox", { name: "通知方法" }));
    const listbox = await page.findByRole("listbox");

    await expect(listbox.parentElement?.parentElement).toBe(dialog.parentElement);
    await expect(Number(listbox.style.zIndex)).toBeGreaterThan(Number(dialog.style.zIndex));
    await userEvent.keyboard("{ArrowDown}{Tab}");
    await waitForSelectToClose();
    await expect(within(dialog).getByRole("button", { name: "Close dialog" })).toHaveFocus();
    await expect(page.getByRole("dialog", { name: "通知設定" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog", { name: "通知設定" })).toBeNull());
  },
};

export const LongListViewport: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqFormField, BasiqSelect },
    setup() {
      const longItems = Array.from({ length: 50 }, (_, index) => ({
        label: `選択肢 ${index + 1}`,
        value: String(index + 1),
      }));

      return { longItems };
    },
    template: `
      <div style="width: 18rem; max-height: 12rem">
        <BasiqFormField label="長い選択肢">
          <BasiqSelect :items="longItems" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "長い選択肢" }));
    const page = within(document.body);
    const listbox = await page.findByRole("listbox");
    const viewport = listbox.querySelector<HTMLElement>("[data-reka-select-viewport]");

    if (viewport === null) throw new globalThis.Error("Select viewport was not rendered.");
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    await expect(listbox.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth);
    await userEvent.keyboard("{End}{Enter}");
    await waitForSelectToClose();
    await expect(within(canvasElement).getByRole("combobox")).toHaveTextContent("選択肢 50");
  },
};

export const OpenPopupAccessibility: Story = {
  tags: ["regression", "!autodocs"],
  parameters: {
    ...controlsDisabledStoryParameters,
    a11y: { context: "#basiq-overlay-host", test: "error" },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "通知方法" }));
    const page = within(document.body);

    const listbox = await page.findByRole("listbox");
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(page.getAllByRole("option")).toHaveLength(items.length);
  },
};
