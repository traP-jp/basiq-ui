import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { defineComponent, nextTick, ref } from "vue";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqButton from "../button/BasiqButton.vue";
import BasiqDialog from "./BasiqDialog.vue";

const meta = {
  title: "Components/Dialog",
  component: BasiqDialog,
  tags: ["autodocs"],
  args: {
    closeLabel: "ダイアログを閉じる",
    description: "変更内容を確認して保存してください。",
    dismissible: true,
    initialFocus: "auto",
    "onUpdate:open": fn(),
    showCloseButton: true,
    title: "プロフィールを編集",
  },
  argTypes: {
    dismissible: {
      description:
        "EscapeキーとDialog外のポインター操作による受動的なdismissを許可します。閉じるボタンとslotのclose()は、この値にかかわらず利用できます。",
    },
    initialFocus: {
      control: "inline-radio",
      options: ["auto", "title"],
    },
    portalTarget: {
      control: false,
      description:
        "mount時に解決するPortal先です。mount中は変更せず、別のtargetを使う場合はDialogをremountしてください。",
    },
  },
  parameters: {
    controls: {
      disable: true,
      include: [
        "closeLabel",
        "description",
        "dismissible",
        "initialFocus",
        "showCloseButton",
        "title",
      ],
    },
  },
  render: (args) => ({
    components: { BasiqButton, BasiqDialog },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story">
        <BasiqDialog v-bind="args">
          <template #trigger>
            <BasiqButton>プロフィールを編集</BasiqButton>
          </template>

          <p style="margin: 0">表示名と自己紹介はいつでも変更できます。</p>

          <template #footer="{ close }">
            <BasiqButton tone="neutral" variant="outline" @click="close">キャンセル</BasiqButton>
            <BasiqButton @click="close">保存</BasiqButton>
          </template>
        </BasiqDialog>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqDialog
        title="プロフィールを編集"
        description="変更内容を確認して保存してください。"
        close-label="ダイアログを閉じる"
      >
        <template #trigger>
          <BasiqButton>プロフィールを編集</BasiqButton>
        </template>

        <p>表示名と自己紹介はいつでも変更できます。</p>

        <template #footer="{ close }">
          <BasiqButton tone="neutral" variant="outline" @click="close">
            キャンセル
          </BasiqButton>
          <BasiqButton @click="close">保存</BasiqButton>
        </template>
      </BasiqDialog>
    </template>
  `),
};

export const LongHeading: Story = {
  args: {
    description:
      "この変更はプロジェクトに参加しているすべてのメンバーに適用され、いつでも設定画面から変更できます。",
    title: "プロジェクトで利用する通知と公開範囲の設定を変更",
  },
  tags: ["regression"],
};

export const Interaction: Story = {
  ...Default,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("button", { name: "プロフィールを編集" });

    await userEvent.click(trigger);

    const dialog = await page.findByRole("dialog", { name: "プロフィールを編集" });
    await expect(dialog).toHaveAttribute("aria-describedby");
    await waitFor(() =>
      expect(page.getByText("変更内容を確認して保存してください。")).toBeVisible(),
    );
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(true);

    await userEvent.click(page.getByRole("button", { name: "ダイアログを閉じる" }));
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(false);
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ExternalDescription: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqButton, BasiqDialog },
    template: `
      <div class="basiq-story">
        <BasiqDialog
          aria-describedby="delete-account-description"
          title="アカウントを削除"
          close-label="閉じる"
        >
          <template #trigger><BasiqButton>アカウントを削除</BasiqButton></template>
          <p id="delete-account-description">すべてのデータが削除されます。</p>
        </BasiqDialog>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "アカウントを削除" }));
    const dialog = await within(document.body).findByRole("dialog", {
      name: "アカウントを削除",
    });

    await expect(dialog).toHaveAttribute("aria-describedby", "delete-account-description");
    await expect(dialog).toHaveAccessibleDescription("すべてのデータが削除されます。");
  },
};

const ThemeBridgeExample = defineComponent({
  components: { BasiqButton, BasiqDialog, BasiqThemeProvider },
  template: `
    <BasiqThemeProvider
      mode="dark"
      :overrides="{ color: { surfaceContainer: 'rgb(20 30 40)', overlayScrim: 'rgb(0 0 0 / 80%)' } }"
    >
      <BasiqDialog title="テーマ付きダイアログ" close-label="閉じる">
        <template #trigger><BasiqButton>開く</BasiqButton></template>
      </BasiqDialog>
    </BasiqThemeProvider>
  `,
});

export const ThemeBridge: Story = {
  tags: ["regression"],
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    const themeOverrides = {
      color: {
        overlayScrim: "rgb(0 0 0 / 80%)",
        surfaceContainer: "rgb(20 30 40)",
      },
    };
    </script>

    <template>
      <BasiqThemeProvider mode="dark" :overrides="themeOverrides">
        <BasiqDialog title="テーマ付きダイアログ" close-label="閉じる">
          <template #trigger>
            <BasiqButton>開く</BasiqButton>
          </template>
        </BasiqDialog>
      </BasiqThemeProvider>
    </template>
  `),
  render: () => ({
    components: { ThemeBridgeExample },
    template: '<div class="basiq-story"><ThemeBridgeExample /></div>',
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "開く" }));
    const dialog = await within(document.body).findByRole("dialog", {
      name: "テーマ付きダイアログ",
    });

    await expect(dialog).toHaveAttribute("data-basiq-theme", "dark");
    await expect(dialog.style.getPropertyValue("--basiq-color-surface-container")).toBe(
      "rgb(20 30 40)",
    );
  },
};

export const ExplicitPortalTarget: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqButton, BasiqDialog },
    template: `
      <div class="basiq-story">
        <div id="dialog-test-target" data-testid="dialog-target" />
        <BasiqDialog
          portal-target="#dialog-test-target"
          title="指定先のDialog"
          close-label="閉じる"
        >
          <template #trigger><BasiqButton>指定先へ開く</BasiqButton></template>
        </BasiqDialog>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "指定先へ開く" }));

    const target = canvas.getByTestId("dialog-target");
    const dialog = await within(target).findByRole("dialog", { name: "指定先のDialog" });
    await expect(dialog.parentElement).toHaveAttribute("data-basiq-overlay-layer", "dialog");
    await expect(dialog.parentElement?.parentElement).toBe(target);
  },
};

export const TitleFocusAndNonDismissible: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqButton, BasiqDialog },
    template: `
      <div class="basiq-story">
        <BasiqDialog
          title="重要な設定"
          initial-focus="title"
          :dismissible="false"
          :show-close-button="false"
        >
          <template #trigger><BasiqButton>設定を開く</BasiqButton></template>
          <template #footer="{ close }">
            <BasiqButton @click="close">完了</BasiqButton>
          </template>
        </BasiqDialog>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "設定を開く" }));
    const page = within(document.body);
    const dialog = await page.findByRole("dialog", { name: "重要な設定" });
    const title = page.getByRole("heading", { name: "重要な設定" });

    await expect(document.activeElement).toBe(title);
    await userEvent.keyboard("{Escape}");
    await expect(dialog).toHaveAttribute("data-state", "open");

    const overlay = dialog.previousElementSibling;
    await expect(overlay).toBeInstanceOf(HTMLElement);
    await userEvent.click(overlay as HTMLElement);
    await expect(dialog).toHaveAttribute("data-state", "open");

    await userEvent.click(page.getByRole("button", { name: "完了" }));
  },
};

const StackingOrderExample = defineComponent({
  components: { BasiqDialog },
  setup() {
    const firstOpen = ref(false);
    const secondOpen = ref(false);

    async function openInReverseDeclarationOrder() {
      secondOpen.value = true;
      await nextTick();
      firstOpen.value = true;
    }

    return { firstOpen, openInReverseDeclarationOrder, secondOpen };
  },
  template: `
    <button type="button" @click="openInReverseDeclarationOrder">重ねて開く</button>
    <BasiqDialog
      v-model:open="firstOpen"
      data-testid="first-dialog"
      title="先に宣言したDialog"
      :show-close-button="false"
    />
    <BasiqDialog
      v-model:open="secondOpen"
      data-testid="second-dialog"
      title="後に宣言したDialog"
      :show-close-button="false"
    />
  `,
});

export const OpenOrderStacking: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { StackingOrderExample },
    template: '<div class="basiq-story"><StackingOrderExample /></div>',
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "重ねて開く" }));

    const page = within(document.body);
    const first = await page.findByTestId("first-dialog");
    const second = await page.findByTestId("second-dialog");

    await expect(first).toHaveAccessibleName("先に宣言したDialog");
    await expect(Number(first.style.zIndex)).toBeGreaterThan(Number(second.style.zIndex));
    await expect(second).toHaveAttribute("aria-hidden", "true");

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(page.queryByRole("dialog", { name: "先に宣言したDialog" })).toBeNull(),
    );
    await expect(page.getByRole("dialog", { name: "後に宣言したDialog" })).toBeVisible();
  },
};

export const NestedDialog: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqButton, BasiqDialog },
    template: `
      <div class="basiq-story">
        <BasiqDialog data-testid="outer-dialog" title="外側のDialog">
          <template #trigger><BasiqButton>外側を開く</BasiqButton></template>
          <BasiqDialog data-testid="inner-dialog" title="内側のDialog">
            <template #trigger><BasiqButton>内側を開く</BasiqButton></template>
          </BasiqDialog>
        </BasiqDialog>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "外側を開く" }));
    const outer = await page.findByTestId("outer-dialog");
    await userEvent.click(page.getByRole("button", { name: "内側を開く" }));
    const inner = await page.findByTestId("inner-dialog");

    await expect(inner.parentElement).toBe(outer.parentElement);
    await expect(Number(inner.style.zIndex)).toBeGreaterThan(Number(outer.style.zIndex));
    await expect(outer).toHaveAttribute("aria-hidden", "true");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByTestId("inner-dialog")).toBeNull());
    await expect(page.getByRole("dialog", { name: "外側のDialog" })).toBeVisible();
  },
};

const HostLifecycleExample = defineComponent({
  components: { BasiqDialog },
  setup() {
    const mounted = ref(true);
    return { mounted };
  },
  template: `
    <button type="button" @click="mounted = false">Dialogをunmount</button>
    <BasiqDialog v-if="mounted" title="Lifecycle test" />
  `,
});

export const HostLifecycle: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { HostLifecycleExample },
    template: '<div class="basiq-story"><HostLifecycleExample /></div>',
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(document.getElementById("basiq-overlay-host")).not.toBeNull());
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Dialogをunmount" }));
    await waitFor(() => expect(document.getElementById("basiq-overlay-host")).toBeNull());
  },
};
