import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import BasiqTabs, { type BasiqTabsItem } from "./BasiqTabs.vue";
import BasiqTabsContent from "./BasiqTabsContent.vue";
import BasiqTabsList from "./BasiqTabsList.vue";
import BasiqTabsRoot from "./BasiqTabsRoot.vue";
import BasiqTabsTrigger from "./BasiqTabsTrigger.vue";

const settingsItems = [
  {
    content: "プロフィールと表示名を編集できます。",
    label: "プロフィール",
    value: "profile",
  },
  {
    content: "ログイン方法とセッションを管理できます。",
    label: "アカウント",
    value: "account",
  },
  {
    content: "通知の受け取り方を変更できます。",
    label: "通知",
    value: "notifications",
  },
] satisfies readonly BasiqTabsItem[];

const meta = {
  title: "Components/Tabs",
  component: BasiqTabs,
  subcomponents: {
    BasiqTabsContent,
    BasiqTabsList,
    BasiqTabsRoot,
    BasiqTabsTrigger,
  },
  tags: ["test"],
  args: {
    ariaLabel: "設定",
    items: settingsItems,
    "onUpdate:modelValue": fn(),
  },
} satisfies Meta<typeof BasiqTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ItemsApi: Story = {
  args: {
    ariaLabel: "設定",
    items: settingsItems,
  },
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await expect(canvas.getByRole("tablist", { name: "設定" })).toBeVisible();
    await expect(profile).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
      "プロフィールと表示名を編集できます。",
    );

    await userEvent.click(account);
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith("account");
    await expect(account).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
      "ログイン方法とセッションを管理できます。",
    );

    await userEvent.click(profile);
    profile.blur();
  },
};

export const CompoundApi: Story = {
  render: () => ({
    components: {
      BasiqTabsContent,
      BasiqTabsList,
      BasiqTabsRoot,
      BasiqTabsTrigger,
    },
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabsRoot default-value="profile">
          <BasiqTabsList aria-label="設定">
            <BasiqTabsTrigger value="profile">プロフィール</BasiqTabsTrigger>
            <BasiqTabsTrigger value="account">アカウント</BasiqTabsTrigger>
          </BasiqTabsList>

          <BasiqTabsContent value="profile">
            <h3 style="margin: 0 0 8px">プロフィール</h3>
            <p style="margin: 0">表示名やプロフィール画像を変更できます。</p>
          </BasiqTabsContent>
          <BasiqTabsContent value="account">
            <h3 style="margin: 0 0 8px">アカウント</h3>
            <p style="margin: 0">ログイン方法とセッションを管理できます。</p>
          </BasiqTabsContent>
        </BasiqTabsRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await expect(profile).toHaveAttribute("aria-controls");
    await expect(account).toHaveAttribute("aria-controls");
    await userEvent.click(account);
    await expect(account).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toHaveAccessibleName("アカウント");

    await userEvent.click(profile);
    profile.blur();
  },
};

export const Vertical: Story = {
  args: {
    ariaLabel: "設定",
    items: [
      ...settingsItems,
      {
        content: "アプリケーション全体のアクセシビリティ設定を変更できます。",
        label: "アクセシビリティとキーボード操作",
        value: "accessibility",
      },
    ],
    orientation: "vertical",
  },
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 40rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabList = canvas.getByRole("tablist", { name: "設定" });
    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await expect(tabList).toHaveAttribute("aria-orientation", "vertical");
    profile.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(account).toHaveFocus();
    await expect(account).toHaveAttribute("aria-selected", "true");

    await userEvent.click(profile);
    profile.blur();
  },
};

export const AutomaticActivation: Story = {
  args: {
    ariaLabel: "設定",
    items: [settingsItems[0], { ...settingsItems[1], disabled: true }, settingsItems[2]],
  },
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const notifications = canvas.getByRole("tab", { name: "通知" });

    profile.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(notifications).toHaveFocus();
    await expect(notifications).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}");
    await expect(profile).toHaveFocus();
    await expect(profile).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{End}");
    await expect(notifications).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(profile).toHaveFocus();

    profile.blur();
  },
};

export const ManualActivation: Story = {
  args: {
    activationMode: "manual",
    ariaLabel: "設定",
    items: settingsItems,
  },
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const account = canvas.getByRole("tab", { name: "アカウント" });

    profile.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(account).toHaveFocus();
    await expect(profile).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Enter}");
    await expect(account).toHaveAttribute("aria-selected", "true");
  },
};

const ControlledTabsHarness = defineComponent({
  name: "ControlledTabsHarness",
  components: { BasiqTabs },
  setup() {
    const selected = ref("profile");

    return { items: settingsItems, selected };
  },
  template: `
    <div class="basiq-story" style="max-width: 32rem">
      <BasiqTabs
        :items="items"
        :model-value="selected"
        aria-label="設定"
        @update:model-value="selected = $event"
      />
    </div>
  `,
});

export const Controlled: Story = {
  render: () => ({
    components: { ControlledTabsHarness },
    template: "<ControlledTabsHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await userEvent.click(account);
    await expect(account).toHaveAttribute("aria-selected", "true");
  },
};

export const ControlledUpdateRejected: Story = {
  args: {
    ariaLabel: "設定",
    items: settingsItems,
    modelValue: "profile",
  },
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await userEvent.click(account);
    await expect(profile).toHaveAttribute("aria-selected", "true");
    await expect(account).toHaveAttribute("aria-selected", "false");
  },
};

export const ControlledEmptyUpdateRejected: Story = {
  args: {
    ariaLabel: "設定",
    items: settingsItems,
    modelValue: null,
  },
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args">
          <template #trigger="{ item, selected }">
            <span :data-selected="String(selected)">{{ item.label }}</span>
          </template>
        </BasiqTabs>
      </div>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await expect(profile).toHaveAttribute("aria-selected", "false");
    await expect(account).toHaveAttribute("aria-selected", "false");
    await expect(canvas.queryByRole("tabpanel")).not.toBeInTheDocument();

    await userEvent.click(account);
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith("account");
    await expect(profile).toHaveAttribute("aria-selected", "false");
    await expect(account).toHaveAttribute("aria-selected", "false");
    await expect(account.firstElementChild).toHaveAttribute("data-selected", "false");
    await expect(canvas.queryByRole("tabpanel")).not.toBeInTheDocument();
  },
};

const ReactiveItemsTabsHarness = defineComponent({
  name: "ReactiveItemsTabsHarness",
  components: { BasiqTabs },
  setup() {
    const items = ref<BasiqTabsItem[]>(settingsItems.map((item) => ({ ...item })));

    function disableAccount() {
      items.value = items.value.map((item) =>
        item.value === "account" ? { ...item, disabled: true } : item,
      );
    }

    function removeProfile() {
      items.value = items.value.filter((item) => item.value !== "profile");
    }

    return { disableAccount, items, removeProfile };
  },
  template: `
    <div class="basiq-story" style="max-width: 32rem">
      <div style="display: flex; gap: 8px; margin-bottom: 16px">
        <button type="button" @click="disableAccount">選択中を無効化</button>
        <button type="button" @click="removeProfile">プロフィールを削除</button>
      </div>
      <BasiqTabs :items="items" default-value="account" aria-label="動的な設定" />
    </div>
  `,
});

export const ReactiveItems: Story = {
  render: () => ({
    components: { ReactiveItemsTabsHarness },
    template: "<ReactiveItemsTabsHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("tab", { name: "アカウント" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await userEvent.click(canvas.getByRole("button", { name: "選択中を無効化" }));
    await expect(canvas.getByRole("tab", { name: "プロフィール" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
      "プロフィールと表示名を編集できます。",
    );

    await userEvent.click(canvas.getByRole("button", { name: "プロフィールを削除" }));
    await expect(canvas.getByRole("tab", { name: "通知" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent(
      "通知の受け取り方を変更できます。",
    );
  },
};

export const PersistentContent: Story = {
  args: {
    ariaLabel: "設定",
    items: settingsItems.slice(0, 2),
    unmountOnHide: false,
  },
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args">
          <template #content="{ item }">
            <label>
              {{ item.label }}のメモ
              <input :aria-label="item.label + 'のメモ'" />
            </label>
          </template>
        </BasiqTabs>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "プロフィールのメモ" });

    await userEvent.type(input, "保存される内容");
    await userEvent.click(canvas.getByRole("tab", { name: "アカウント" }));
    await userEvent.click(canvas.getByRole("tab", { name: "プロフィール" }));
    await expect(canvas.getByRole("textbox", { name: "プロフィールのメモ" })).toHaveValue(
      "保存される内容",
    );
  },
};

export const HorizontalOverflow: Story = {
  args: {
    ariaLabel: "管理画面",
    items: [
      ...settingsItems,
      { content: "権限を管理します。", label: "権限管理", value: "permissions" },
      { content: "監査ログを確認します。", label: "監査ログ", value: "audit-log" },
    ],
  },
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 20rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const tabList = within(canvasElement).getByRole("tablist", { name: "管理画面" });

    await expect(tabList.scrollWidth).toBeGreaterThan(tabList.clientWidth);
  },
};

export const VerticalNarrow: Story = {
  args: {
    ariaLabel: "設定",
    items: [
      ...settingsItems,
      {
        content: "アプリケーション全体のアクセシビリティ設定を変更できます。",
        label: "アクセシビリティとキーボード操作",
        value: "accessibility",
      },
    ],
    orientation: "vertical",
  },
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story">
        <div style="width: 17.5rem; max-width: 100%">
          <BasiqTabs v-bind="args" />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabList = canvas.getByRole("tablist", { name: "設定" });
    const panel = canvas.getByRole("tabpanel");
    const root = tabList.parentElement;

    if (root === null) throw new Error("Tabs root was not rendered.");

    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    await expect(panel.getBoundingClientRect().width).toBeGreaterThanOrEqual(120);
  },
};
