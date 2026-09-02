import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
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
  tags: ["autodocs"],
  args: {
    activationMode: "automatic",
    ariaLabel: "設定",
    dir: "ltr",
    items: settingsItems,
    loop: true,
    "onUpdate:modelValue": fn(),
    orientation: "horizontal",
    unmountOnHide: true,
  },
  argTypes: {
    activationMode: {
      control: "inline-radio",
      options: ["automatic", "manual"],
    },
    dir: {
      control: "inline-radio",
      options: ["ltr", "rtl"],
    },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
  parameters: {
    controls: {
      disable: true,
      include: [
        "activationMode",
        "ariaLabel",
        "dir",
        "items",
        "loop",
        "orientation",
        "unmountOnHide",
      ],
    },
  },
} satisfies Meta<typeof BasiqTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(),
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
};

export const ItemsApi: Story = {
  name: "Items API",
  args: {
    ariaLabel: "設定",
    items: settingsItems,
  },
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqTabs } from "basiq-ui";

    const items = [
      { content: "プロフィールと表示名を編集できます。", label: "プロフィール", value: "profile" },
      { content: "ログイン方法とセッションを管理できます。", label: "アカウント", value: "account" },
      { content: "通知の受け取り方を変更できます。", label: "通知", value: "notifications" },
    ];
    </script>

    <template>
      <BasiqTabs aria-label="設定" :items="items" />
    </template>
  `),
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
};

export const ItemsApiInteraction: Story = {
  ...ItemsApi,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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
  name: "Compound API",
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import {
      BasiqTabsContent,
      BasiqTabsList,
      BasiqTabsRoot,
      BasiqTabsTrigger,
    } from "basiq-ui";
    </script>

    <template>
      <BasiqTabsRoot default-value="profile">
        <BasiqTabsList aria-label="設定">
          <BasiqTabsTrigger value="profile">プロフィール</BasiqTabsTrigger>
          <BasiqTabsTrigger value="account">アカウント</BasiqTabsTrigger>
        </BasiqTabsList>

        <BasiqTabsContent value="profile">
          <h3>プロフィール</h3>
          <p>表示名やプロフィール画像を変更できます。</p>
        </BasiqTabsContent>
        <BasiqTabsContent value="account">
          <h3>アカウント</h3>
          <p>ログイン方法とセッションを管理できます。</p>
        </BasiqTabsContent>
      </BasiqTabsRoot>
    </template>
  `),
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
};

export const CompoundApiInteraction: Story = {
  ...CompoundApi,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqTabs } from "basiq-ui";

    const items = [
      { content: "プロフィールと表示名を編集できます。", label: "プロフィール", value: "profile" },
      { content: "ログイン方法とセッションを管理できます。", label: "アカウント", value: "account" },
      { content: "通知の受け取り方を変更できます。", label: "通知", value: "notifications" },
      {
        content: "アプリケーション全体のアクセシビリティ設定を変更できます。",
        label: "アクセシビリティとキーボード操作",
        value: "accessibility",
      },
    ];
    </script>

    <template>
      <BasiqTabs aria-label="設定" :items="items" orientation="vertical" />
    </template>
  `),
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 40rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
};

export const VerticalInteraction: Story = {
  ...Vertical,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqTabs } from "basiq-ui";

    const items = [
      { content: "プロフィールと表示名を編集できます。", label: "プロフィール", value: "profile" },
      { content: "ログイン方法とセッションを管理できます。", label: "アカウント", value: "account" },
    ];
    </script>

    <template>
      <BasiqTabs
        activation-mode="manual"
        aria-label="設定"
        :items="items"
      />
    </template>
  `),
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
};

export const ManualActivationInteraction: Story = {
  ...ManualActivation,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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

export const RightToLeft: Story = {
  args: {
    ariaLabel: "設定",
    defaultValue: "account",
    dir: "rtl",
    items: settingsItems,
    loop: false,
  },
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqTabs } from "basiq-ui";

    const items = [
      { content: "プロフィールと表示名を編集できます。", label: "プロフィール", value: "profile" },
      { content: "ログイン方法とセッションを管理できます。", label: "アカウント", value: "account" },
    ];
    </script>

    <template>
      <BasiqTabs
        aria-label="設定"
        default-value="account"
        dir="rtl"
        :items="items"
        :loop="false"
      />
    </template>
  `),
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args" />
      </div>
    `,
  }),
};

export const RightToLeftInteraction: Story = {
  ...RightToLeft,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabList = canvas.getByRole("tablist", { name: "設定" });
    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await expect(tabList.parentElement).toHaveAttribute("dir", "rtl");
    account.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(profile).toHaveFocus();
    await expect(profile).toHaveAttribute("aria-selected", "true");
    profile.blur();
  },
};

export const CustomTrigger: Story = {
  args: {
    ariaLabel: "設定",
    items: settingsItems,
  },
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqTabs } from "basiq-ui";

    const items = [
      { content: "プロフィールと表示名を編集できます。", label: "プロフィール", value: "profile" },
      { content: "ログイン方法とセッションを管理できます。", label: "アカウント", value: "account" },
    ];
    </script>

    <template>
      <BasiqTabs :items="items" aria-label="設定">
        <template #trigger="{ item, selected }">
          <span aria-hidden="true">{{ selected ? "●" : "○" }}</span>
          <span>{{ item.label }}</span>
        </template>
      </BasiqTabs>
    </template>
  `),
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs v-bind="args">
          <template #trigger="{ item, selected }">
            <span style="display: inline-flex; gap: 6px; align-items: center">
              <span aria-hidden="true">{{ selected ? "●" : "○" }}</span>
              <span>{{ item.label }}</span>
            </span>
          </template>
        </BasiqTabs>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("tab", { name: "プロフィール" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "アカウント" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "通知" })).toBeVisible();
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
        v-model="selected"
        :items="items"
        aria-label="設定"
      />
    </div>
  `,
});

export const Controlled: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { ref } from "vue";
    import { BasiqTabs } from "basiq-ui";

    const selected = ref("profile");
    const items = [
      { content: "プロフィールと表示名を編集できます。", label: "プロフィール", value: "profile" },
      { content: "ログイン方法とセッションを管理できます。", label: "アカウント", value: "account" },
    ];
    </script>

    <template>
      <BasiqTabs v-model="selected" :items="items" aria-label="設定" />
    </template>
  `),
  render: () => ({
    components: { ControlledTabsHarness },
    template: "<ControlledTabsHarness />",
  }),
};

export const ControlledInteraction: Story = {
  ...Controlled,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await userEvent.click(account);
    await expect(account).toHaveAttribute("aria-selected", "true");
  },
};

export const ControlledUpdateRejected: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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

export const ControlledUndefinedUpdateRejected: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: (args) => ({
    components: { BasiqTabs },
    setup: () => ({ args, settingsItems }),
    template: `
      <div class="basiq-story" style="max-width: 32rem">
        <BasiqTabs
          :items="settingsItems"
          :model-value="undefined"
          aria-label="設定"
          @update:model-value="args['onUpdate:modelValue']"
        />
      </div>
    `,
  }),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await expect(profile).toHaveAttribute("aria-selected", "true");
    await expect(account).toHaveAttribute("aria-selected", "false");

    await userEvent.click(account);
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledWith("account");
    await expect(profile).toHaveAttribute("aria-selected", "true");
    await expect(account).toHaveAttribute("aria-selected", "false");
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
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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

const InitiallyEmptyTabsHarness = defineComponent({
  name: "InitiallyEmptyTabsHarness",
  components: { BasiqTabs },
  setup() {
    const items = ref<BasiqTabsItem[]>([]);

    function loadItems() {
      items.value = settingsItems.map((item) => ({ ...item }));
    }

    return { items, loadItems };
  },
  template: `
    <div class="basiq-story" style="max-width: 32rem">
      <button type="button" style="margin-bottom: 16px" @click="loadItems">項目を読み込む</button>
      <BasiqTabs :items="items" aria-label="非同期の設定" />
    </div>
  `,
});

export const InitiallyEmptyItems: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { InitiallyEmptyTabsHarness },
    template: "<InitiallyEmptyTabsHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole("tab")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "項目を読み込む" }));

    const profile = canvas.getByRole("tab", { name: "プロフィール" });
    const account = canvas.getByRole("tab", { name: "アカウント" });

    await expect(profile).toHaveAttribute("aria-selected", "true");
    await userEvent.click(account);
    await expect(account).toHaveAttribute("aria-selected", "true");
  },
};

export const PersistentContent: Story = {
  args: {
    ariaLabel: "設定",
    items: settingsItems.slice(0, 2),
    unmountOnHide: false,
  },
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqTabs } from "basiq-ui";

    const items = [
      { label: "プロフィール", value: "profile" },
      { label: "アカウント", value: "account" },
    ];
    </script>

    <template>
      <BasiqTabs
        :items="items"
        aria-label="設定"
        :unmount-on-hide="false"
      >
        <template #content="{ item }">
          <label>
            {{ item.label }}のメモ
            <input :aria-label="item.label + 'のメモ'" />
          </label>
        </template>
      </BasiqTabs>
    </template>
  `),
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
};

export const PersistentContentInteraction: Story = {
  ...PersistentContent,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
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
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqTabs } from "basiq-ui";

    const items = [
      { content: "プロフィールを編集します。", label: "プロフィール", value: "profile" },
      { content: "アカウントを管理します。", label: "アカウント", value: "account" },
      { content: "通知を変更します。", label: "通知", value: "notifications" },
      { content: "権限を管理します。", label: "権限管理", value: "permissions" },
      { content: "監査ログを確認します。", label: "監査ログ", value: "audit-log" },
    ];
    </script>

    <template>
      <div style="max-width: 20rem">
        <BasiqTabs aria-label="管理画面" :items="items" />
      </div>
    </template>
  `),
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
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqTabs } from "basiq-ui";

    const items = [
      { content: "プロフィールと表示名を編集できます。", label: "プロフィール", value: "profile" },
      { content: "ログイン方法とセッションを管理できます。", label: "アカウント", value: "account" },
      { content: "アクセシビリティ設定を変更できます。", label: "アクセシビリティとキーボード操作", value: "accessibility" },
    ];
    </script>

    <template>
      <div style="width: 17.5rem; max-width: 100%">
        <BasiqTabs
          aria-label="設定"
          :items="items"
          orientation="vertical"
        />
      </div>
    </template>
  `),
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
