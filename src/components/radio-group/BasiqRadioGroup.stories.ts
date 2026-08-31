import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import BasiqButton from "../button/BasiqButton.vue";
import BasiqRadioGroup, { type BasiqRadioGroupItemDefinition } from "./BasiqRadioGroup.vue";

const items: BasiqRadioGroupItemDefinition[] = [
  { description: "メールで更新を受け取ります", label: "メール", value: "email" },
  { description: "ブラウザへ通知します", label: "プッシュ通知", value: "push" },
  { disabled: true, label: "SMS（準備中）", value: "sms" },
];

const ControlledRejectionHarness = defineComponent({
  name: "ControlledRadioGroupRejectionHarness",
  components: { BasiqRadioGroup },
  setup() {
    const requestedValue = ref<string | null>(null);

    return { items, requestedValue };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <BasiqRadioGroup
        :items="items"
        label="更新を拒否する選択"
        model-value="email"
        @update:model-value="requestedValue = $event"
      />
      <output data-testid="requested-value">{{ requestedValue }}</output>
    </div>
  `,
});

const ResetHarness = defineComponent({
  name: "RadioGroupResetHarness",
  components: { BasiqRadioGroup },
  props: { canceled: Boolean, controlled: Boolean, emptyDefault: Boolean },
  setup() {
    const value = ref<string | null>("email");

    return { items, value };
  },
  template: `
    <form
      class="basiq-story basiq-form-story"
      @reset="canceled && $event.preventDefault()"
    >
      <BasiqRadioGroup
        v-if="controlled && !emptyDefault"
        v-model="value"
        default-value="email"
        :items="items"
        label="リセット対象"
        name="notification"
      />
      <BasiqRadioGroup
        v-else-if="!controlled"
        default-value="email"
        :items="items"
        label="リセット対象"
        name="notification"
      />
      <BasiqRadioGroup
        v-else
        v-model="value"
        :default-value="null"
        :items="items"
        label="リセット対象"
        name="notification"
      />
      <button type="reset">リセット</button>
    </form>
  `,
});

const FormDataHarness = defineComponent({
  name: "RadioGroupFormDataHarness",
  components: { BasiqButton, BasiqRadioGroup },
  props: { external: Boolean, named: Boolean },
  setup() {
    const submittedValue = ref("");

    function readForm() {
      const form = document.querySelector<HTMLFormElement>("#radio-form");
      submittedValue.value = JSON.stringify(
        Array.from(new globalThis.FormData(form ?? undefined).entries()),
      );
    }

    return { items, readForm, submittedValue };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <form id="radio-form">
        <BasiqRadioGroup
          v-if="!external"
          :items="items"
          label="通知方法"
          :name="named ? 'notification' : undefined"
        />
      </form>
      <BasiqRadioGroup
        v-if="external"
        form="radio-form"
        :items="items"
        label="通知方法"
        name="notification"
      />
      <BasiqButton form="radio-form" type="reset">リセット</BasiqButton>
      <BasiqButton type="button" @click="readForm">FormDataを確認</BasiqButton>
      <output data-testid="submitted-value">{{ submittedValue }}</output>
    </div>
  `,
});

const ReactiveItemsHarness = defineComponent({
  name: "RadioGroupReactiveItemsHarness",
  components: { BasiqRadioGroup },
  setup() {
    const currentItems = ref<BasiqRadioGroupItemDefinition[]>([
      { label: "メール", value: "email" },
      { label: "プッシュ通知", value: "push" },
    ]);
    const value = ref<string | null>("push");

    function removeSelectedItem() {
      currentItems.value = [{ label: "メール", value: "email" }];
    }

    function disableSelectedItem() {
      currentItems.value = [
        { label: "メール", value: "email" },
        { disabled: true, label: "プッシュ通知", value: "push" },
      ];
    }

    function reorderItems() {
      currentItems.value = [
        { label: "プッシュ通知", value: "push" },
        { label: "メール", value: "email" },
      ];
    }

    return {
      currentItems,
      disableSelectedItem,
      removeSelectedItem,
      reorderItems,
      value,
    };
  },
  template: `
    <form class="basiq-story basiq-form-story">
      <BasiqRadioGroup
        v-model="value"
        :items="currentItems"
        label="動的な通知方法"
        name="notification"
      />
      <button type="button" @click="removeSelectedItem">選択中の項目を削除</button>
      <button type="button" @click="disableSelectedItem">選択中の項目を無効化</button>
      <button type="button" @click="reorderItems">項目を並び替え</button>
      <output data-testid="current-value">{{ value }}</output>
    </form>
  `,
});

const meta = {
  title: "Components/RadioGroup",
  component: BasiqRadioGroup,
  tags: ["test"],
  args: {
    defaultValue: "email",
    description: "通知を受け取る方法を選択してください",
    disabled: false,
    error: undefined,
    invalid: false,
    items,
    label: "通知方法",
    orientation: "vertical",
    required: false,
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  render: (args) => ({
    components: { BasiqRadioGroup },
    setup() {
      const value = ref<string | null>(args.defaultValue ?? null);

      return { args, value };
    },
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqRadioGroup v-model="value" v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqRadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: "通知方法" });
    const email = canvas.getByRole<HTMLInputElement>("radio", { name: "メール" });
    const push = canvas.getByRole("radio", { name: "プッシュ通知" });
    const pushDescription = canvas.getByText("ブラウザへ通知します");

    await expect(group).toHaveAttribute("aria-orientation", "vertical");
    await expect(push).toHaveAttribute("aria-describedby", pushDescription.id);
    await expect(email).toBeChecked();
    await userEvent.click(push);
    await expect(push).toBeChecked();
    await expect(email).not.toBeChecked();
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("radio", { name: /メール/ });
    const push = canvas.getByRole("radio", { name: /プッシュ通知/ });
    const sms = canvas.getByRole("radio", { name: /SMS/ });

    email.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(push).toHaveFocus();
    await expect(push).toBeChecked();
    await userEvent.keyboard("{ArrowDown}");
    await expect(email).toHaveFocus();
    await expect(email).toBeChecked();
    await expect(sms).toBeDisabled();
  },
};

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
};

export const HorizontalNarrow: Story = {
  render: () => ({
    components: { BasiqRadioGroup },
    template: `
      <div class="basiq-story" style="width: 18rem">
        <BasiqRadioGroup
          default-value="all"
          :items="[
            { label: 'すべての更新を受け取る', value: 'all' },
            { label: '重要な更新だけを受け取る', value: 'important' },
            { label: '更新を受け取らない', value: 'none' },
          ]"
          label="通知範囲"
          orientation="horizontal"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: "通知範囲" });
    const options = group.querySelector(":scope > div");

    await expect(options).not.toBeNull();
    if (options === null) throw new globalThis.Error("RadioGroup options were not rendered.");
    await expect(options.scrollWidth).toBeLessThanOrEqual(options.clientWidth);
  },
};

export const CustomItemLabel: Story = {
  render: () => ({
    components: { BasiqRadioGroup },
    setup() {
      const value = ref<string | null>("email");

      return { items, value };
    },
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqRadioGroup v-model="value" :items="items" label="通知方法">
          <template #item-label="{ checked, index, item }">
            <span
              :data-checked="checked"
              :data-testid="'item-label-' + item.value"
            >
              {{ index + 1 }}. {{ item.label }}
            </span>
          </template>
        </BasiqRadioGroup>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("radio", { name: "1. メール" });
    const push = canvas.getByRole("radio", { name: "2. プッシュ通知" });
    const pushDescription = canvas.getByText("ブラウザへ通知します");

    await expect(canvas.getByTestId("item-label-email")).toHaveAttribute("data-checked", "true");
    await expect(push).toHaveAttribute("aria-describedby", pushDescription.id);
    await userEvent.click(push);
    await expect(canvas.getByTestId("item-label-email")).toHaveAttribute("data-checked", "false");
    await expect(canvas.getByTestId("item-label-push")).toHaveAttribute("data-checked", "true");
    await expect(email).not.toBeChecked();
  },
};

export const Error: Story = {
  args: { defaultValue: null, error: "通知方法を選択してください", required: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("radiogroup", { name: "通知方法" });
    const email = canvas.getByRole<HTMLInputElement>("radio", { name: "メール" });
    const error = canvas.getByText("通知方法を選択してください");

    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(group).toHaveAttribute("aria-required", "true");
    await expect(group.getAttribute("aria-describedby")).toContain(error.id);
    await expect(canvas.getByText("必須")).toBeInTheDocument();
    await expect(email.checkValidity()).toBe(false);
    await userEvent.click(email);
    await expect(email.checkValidity()).toBe(true);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const radio of canvas.getAllByRole("radio")) await expect(radio).toBeDisabled();
  },
};

export const ControlledRejection: Story = {
  render: () => ({
    components: { ControlledRejectionHarness },
    template: "<ControlledRejectionHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("radio", { name: /メール/ });
    const push = canvas.getByRole("radio", { name: /プッシュ通知/ });

    await userEvent.click(push);
    await expect(canvas.getByTestId("requested-value")).toHaveTextContent("push");
    await expect(email).toBeChecked();
    await expect(push).not.toBeChecked();
  },
};

export const UncontrolledFormReset: Story = {
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("radio", { name: /メール/ });
    const push = canvas.getByRole("radio", { name: /プッシュ通知/ });

    await userEvent.click(push);
    await expect(push).toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(email).toBeChecked();
  },
};

export const ControlledFormReset: Story = {
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness controlled />",
  }),
  play: UncontrolledFormReset.play,
};

export const ControlledEmptyFormReset: Story = {
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness controlled empty-default />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByRole("radio", { name: "メール" });
    const push = canvas.getByRole("radio", { name: "プッシュ通知" });

    await expect(email).toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(email).not.toBeChecked();
    await expect(push).not.toBeChecked();
  },
};

export const CanceledFormReset: Story = {
  render: () => ({
    components: { ResetHarness },
    template: "<ResetHarness canceled />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const push = canvas.getByRole("radio", { name: /プッシュ通知/ });

    await userEvent.click(push);
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(push).toBeChecked();
  },
};

export const NativeFormData: Story = {
  render: () => ({
    components: { FormDataHarness },
    template: "<FormDataHarness named />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const push = canvas.getByRole("radio", { name: /プッシュ通知/ });

    await userEvent.click(push);
    await userEvent.click(canvas.getByRole("button", { name: "FormDataを確認" }));
    await expect(canvas.getByTestId("submitted-value")).toHaveTextContent(
      '[["notification","push"]]',
    );
  },
};

export const ExternalForm: Story = {
  render: () => ({
    components: { FormDataHarness },
    template: "<FormDataHarness external />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const push = canvas.getByRole("radio", { name: "プッシュ通知" });

    await userEvent.click(push);
    await userEvent.click(canvas.getByRole("button", { name: "FormDataを確認" }));
    await expect(canvas.getByTestId("submitted-value")).toHaveTextContent(
      '[["notification","push"]]',
    );
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(push).not.toBeChecked();
  },
};

export const GeneratedNameIsNotSubmitted: Story = {
  render: () => ({
    components: { FormDataHarness },
    template: "<FormDataHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const push = canvas.getByRole("radio", { name: /プッシュ通知/ });

    await userEvent.click(push);
    await userEvent.click(canvas.getByRole("button", { name: "FormDataを確認" }));
    await expect(canvas.getByTestId("submitted-value")).toHaveTextContent("[]");
  },
};

export const ReactiveItems: Story = {
  render: () => ({
    components: { ReactiveItemsHarness },
    template: "<ReactiveItemsHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvasElement.querySelector("form");

    if (form === null) throw new globalThis.Error("RadioGroup form was not rendered.");

    await expect(canvas.getByRole("radio", { name: "プッシュ通知" })).toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "選択中の項目を削除" }));
    await expect(canvas.getByTestId("current-value")).toHaveTextContent("push");
    for (const radio of canvas.getAllByRole("radio")) await expect(radio).not.toBeChecked();

    await userEvent.click(canvas.getByRole("button", { name: "選択中の項目を無効化" }));
    const disabledPush = canvas.getByRole("radio", { name: "プッシュ通知" });

    await expect(disabledPush).toBeChecked();
    await expect(disabledPush).toBeDisabled();
    await expect(Array.from(new FormData(form).entries())).toEqual([]);

    await userEvent.click(canvas.getByRole("button", { name: "項目を並び替え" }));
    const reorderedRadios = canvas.getAllByRole("radio");

    await expect(reorderedRadios[0]).toHaveAccessibleName("プッシュ通知");
    await expect(reorderedRadios[0]).toBeChecked();
    await expect(Array.from(new FormData(form).entries())).toEqual([["notification", "push"]]);
  },
};
