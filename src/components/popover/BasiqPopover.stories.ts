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
import BasiqDialog from "../dialog/BasiqDialog.vue";
import BasiqInput from "../input/BasiqInput.vue";
import BasiqToastProvider from "../toast/BasiqToastProvider.vue";
import { useToast } from "../toast/toastContext";
import BasiqPopoverClose from "./BasiqPopoverClose.vue";
import BasiqPopoverContent from "./BasiqPopoverContent.vue";
import BasiqPopoverRoot from "./BasiqPopoverRoot.vue";
import BasiqPopoverTrigger from "./BasiqPopoverTrigger.vue";

const defaultPopoverSource = `
  <template>
    <BasiqPopoverRoot>
      <BasiqPopoverTrigger>
        <BasiqButton>プロフィールを編集</BasiqButton>
      </BasiqPopoverTrigger>

      <BasiqPopoverContent align="start" arrow style="width: 20rem">
        <form style="display: grid; gap: 12px" @submit.prevent>
          <label style="display: grid; gap: 4px">
            <span>表示名</span>
            <BasiqInput default-value="traP member" name="display-name" />
          </label>
          <div style="display: flex; justify-content: flex-end; gap: 8px">
            <BasiqPopoverClose>
              <BasiqButton tone="neutral" variant="outline">キャンセル</BasiqButton>
            </BasiqPopoverClose>
            <BasiqPopoverClose>
              <BasiqButton>保存</BasiqButton>
            </BasiqPopoverClose>
          </div>
        </form>
      </BasiqPopoverContent>
    </BasiqPopoverRoot>
  </template>
`;

const meta = {
  title: "Components/Popover",
  component: BasiqPopoverRoot,
  tags: ["autodocs"],
  args: {
    dismissible: true,
    modal: false,
    "onUpdate:open": fn(),
  },
  argTypes: {
    dismissible: {
      description:
        "EscapeキーとPopover外の操作による受動的なdismissを許可します。Trigger、Close、slotのclose()はこの値にかかわらず利用できます。",
    },
    modal: {
      description:
        "Popover外のpointer、focus、scroll、screen reader操作を隔離します。visual scrimは表示しません。",
    },
  },
  parameters: {
    controls: {
      disable: true,
      include: ["dismissible", "modal"],
    },
  },
  render: (args) => ({
    components: {
      BasiqButton,
      BasiqInput,
      BasiqPopoverClose,
      BasiqPopoverContent,
      BasiqPopoverRoot,
      BasiqPopoverTrigger,
    },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story">
        <BasiqPopoverRoot v-bind="args">
          <BasiqPopoverTrigger>
            <BasiqButton>プロフィールを編集</BasiqButton>
          </BasiqPopoverTrigger>

          <BasiqPopoverContent align="start" arrow style="width: 20rem">
            <form style="display: grid; gap: 12px" @submit.prevent>
              <label style="display: grid; gap: 4px">
                <span>表示名</span>
                <BasiqInput default-value="traP member" name="display-name" />
              </label>
              <div style="display: flex; justify-content: flex-end; gap: 8px">
                <BasiqPopoverClose>
                  <BasiqButton tone="neutral" variant="outline">キャンセル</BasiqButton>
                </BasiqPopoverClose>
                <BasiqPopoverClose>
                  <BasiqButton>保存</BasiqButton>
                </BasiqPopoverClose>
              </div>
            </form>
          </BasiqPopoverContent>
        </BasiqPopoverRoot>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqPopoverRoot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters((_source, { args }) => {
    const rootAttributes = [
      args.dismissible === false ? ':dismissible="false"' : "",
      args.modal === true ? "modal" : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (!rootAttributes) return defaultPopoverSource;
    return defaultPopoverSource.replace(
      "<BasiqPopoverRoot>",
      `<BasiqPopoverRoot ${rootAttributes}>`,
    );
  }),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(defaultPopoverSource),
};

export const Interaction: Story = {
  ...Default,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("button", { name: "プロフィールを編集" });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);

    const popover = await page.findByRole("dialog", { name: "プロフィールを編集" });
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await expect(trigger).toHaveAttribute("aria-controls", popover.id);
    await expect(popover.style.width).toBe("20rem");
    await expect(page.getByRole("textbox", { name: "表示名" })).toHaveFocus();
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(true);

    await userEvent.click(canvasElement);
    await waitFor(() =>
      expect(page.queryByRole("dialog", { name: "プロフィールを編集" })).toBeNull(),
    );

    await userEvent.click(trigger);
    await page.findByRole("dialog", { name: "プロフィールを編集" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(page.queryByRole("dialog", { name: "プロフィールを編集" })).toBeNull(),
    );
    await expect(trigger).toHaveFocus();
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(false);
  },
};

const ControlledExample = defineComponent({
  components: {
    BasiqButton,
    BasiqPopoverClose,
    BasiqPopoverContent,
    BasiqPopoverRoot,
    BasiqPopoverTrigger,
  },
  setup() {
    const open = ref(false);
    return { open };
  },
  template: `
    <p>状態: {{ open ? "open" : "closed" }}</p>
    <BasiqPopoverRoot v-model:open="open">
      <BasiqPopoverTrigger><BasiqButton>制御して開く</BasiqButton></BasiqPopoverTrigger>
      <BasiqPopoverContent>
        <p style="margin: 0 0 12px">親componentがopen状態を所有します。</p>
        <BasiqPopoverClose><BasiqButton>閉じる</BasiqButton></BasiqPopoverClose>
      </BasiqPopoverContent>
    </BasiqPopoverRoot>
  `,
});

export const Controlled: Story = {
  tags: ["regression"],
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { ref } from "vue";

    const open = ref(false);
    </script>

    <template>
      <BasiqPopoverRoot v-model:open="open">
        <BasiqPopoverTrigger>
          <BasiqButton>制御して開く</BasiqButton>
        </BasiqPopoverTrigger>
        <BasiqPopoverContent>
          <BasiqPopoverClose>
            <BasiqButton>閉じる</BasiqButton>
          </BasiqPopoverClose>
        </BasiqPopoverContent>
      </BasiqPopoverRoot>
    </template>
  `),
  render: () => ({
    components: { ControlledExample },
    template: '<div class="basiq-story"><ControlledExample /></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("状態: closed")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "制御して開く" }));
    await expect(canvas.getByText("状態: open")).toBeVisible();
    await userEvent.click(within(document.body).getByRole("button", { name: "閉じる" }));
    await expect(canvas.getByText("状態: closed")).toBeVisible();
  },
};

export const TriggerWidth: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqPopoverContent,
      BasiqPopoverRoot,
      BasiqPopoverTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqPopoverRoot>
          <BasiqPopoverTrigger>
            <BasiqButton style="width: 24rem">Triggerと同じ幅</BasiqButton>
          </BasiqPopoverTrigger>
          <BasiqPopoverContent width="trigger">同じ幅のcontent</BasiqPopoverContent>
        </BasiqPopoverRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Triggerと同じ幅" });
    await userEvent.click(trigger);
    const popover = await within(document.body).findByRole("dialog", {
      name: "Triggerと同じ幅",
    });

    await expect(
      Math.abs(popover.getBoundingClientRect().width - trigger.getBoundingClientRect().width),
    ).toBeLessThanOrEqual(8);
  },
};

export const NonDismissible: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqPopoverClose,
      BasiqPopoverContent,
      BasiqPopoverRoot,
      BasiqPopoverTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqButton tone="neutral" variant="outline">Popoverの外側</BasiqButton>
        <BasiqPopoverRoot :dismissible="false">
          <BasiqPopoverTrigger><BasiqButton>閉じないPopover</BasiqButton></BasiqPopoverTrigger>
          <BasiqPopoverContent>
            <BasiqPopoverClose><BasiqButton>明示的に閉じる</BasiqButton></BasiqPopoverClose>
          </BasiqPopoverContent>
        </BasiqPopoverRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("button", { name: "閉じないPopover" });
    await userEvent.click(trigger);
    const popover = await page.findByRole("dialog", { name: "閉じないPopover" });

    await userEvent.click(canvas.getByRole("button", { name: "Popoverの外側" }));
    await expect(popover).toHaveAttribute("data-state", "open");
    await userEvent.keyboard("{Escape}");
    await expect(popover).toHaveAttribute("data-state", "open");

    await userEvent.click(page.getByRole("button", { name: "明示的に閉じる" }));
    await waitFor(() => expect(popover).toHaveAttribute("data-state", "closed"));
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

export const CollisionFlip: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqPopoverContent,
      BasiqPopoverRoot,
      BasiqPopoverTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqPopoverRoot>
          <BasiqPopoverTrigger>
            <BasiqButton style="position: fixed; right: 8px; bottom: 8px">
              画面端で開く
            </BasiqButton>
          </BasiqPopoverTrigger>
          <BasiqPopoverContent side="bottom" align="end" arrow>
            viewport内に収まるよう上側へ反転します。
          </BasiqPopoverContent>
        </BasiqPopoverRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "画面端で開く" }));
    const popover = await within(document.body).findByRole("dialog", { name: "画面端で開く" });
    await waitFor(() => expect(popover).toHaveAttribute("data-side", "top"));
    await expect(popover).toHaveAttribute("data-align", "end");
    await expect(getComputedStyle(popover).overflow).toBe("visible");
    const arrow = popover.querySelector("svg");
    await expect(arrow).not.toBeNull();
    await expect(arrow!.getBoundingClientRect().bottom).toBeGreaterThan(
      popover.getBoundingClientRect().bottom,
    );
  },
};

export const LongContent: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqPopoverContent,
      BasiqPopoverRoot,
      BasiqPopoverTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqPopoverRoot>
          <BasiqPopoverTrigger><BasiqButton>長文を表示</BasiqButton></BasiqPopoverTrigger>
          <BasiqPopoverContent style="width: 16rem; height: 8rem">
            <div style="display: grid; gap: 8px">
              <p style="margin: 0">スクロール可能な長文の1段落目です。</p>
              <p style="margin: 0">キーボードでも本文へ到達できます。</p>
              <p style="margin: 0">表示領域を超えた内容も確認できます。</p>
              <p style="margin: 0">内容量の変化にも追従します。</p>
              <p style="margin: 0">これが最後の段落です。</p>
            </div>
          </BasiqPopoverContent>
        </BasiqPopoverRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "長文を表示" }));
    const page = within(document.body);
    const popover = await page.findByRole("dialog", { name: "長文を表示" });
    const viewport = popover.firstElementChild as HTMLElement;

    await waitFor(() => expect(viewport).toHaveAttribute("tabindex", "0"));
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    if (document.activeElement !== viewport) await userEvent.tab();
    await expect(viewport).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog", { name: "長文を表示" })).toBeNull());
  },
};

export const ThemeBridge: Story = {
  tags: ["regression"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqPopoverContent,
      BasiqPopoverRoot,
      BasiqPopoverTrigger,
      BasiqThemeProvider,
    },
    template: `
      <div class="basiq-story">
        <BasiqThemeProvider
          mode="dark"
          :overrides="{ color: { surfaceContainer: 'rgb(20 30 40)' } }"
        >
          <BasiqPopoverRoot>
            <BasiqPopoverTrigger><BasiqButton>テーマ付きPopover</BasiqButton></BasiqPopoverTrigger>
            <BasiqPopoverContent>Portal先にもテーマを引き継ぎます。</BasiqPopoverContent>
          </BasiqPopoverRoot>
        </BasiqThemeProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "テーマ付きPopover" }));
    const popover = await within(document.body).findByRole("dialog", {
      name: "テーマ付きPopover",
    });
    await expect(popover).toHaveAttribute("data-basiq-theme", "dark");
    await expect(popover.style.getPropertyValue("--basiq-color-surface-container")).toBe(
      "rgb(20 30 40)",
    );
  },
};

export const ExplicitPortalTarget: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqPopoverContent,
      BasiqPopoverRoot,
      BasiqPopoverTrigger,
    },
    template: `
      <div class="basiq-story">
        <div id="popover-test-target" data-testid="popover-target" />
        <BasiqPopoverRoot>
          <BasiqPopoverTrigger><BasiqButton>指定先へ開く</BasiqButton></BasiqPopoverTrigger>
          <BasiqPopoverContent portal-target="#popover-test-target">
            指定したtarget内のcontent
          </BasiqPopoverContent>
        </BasiqPopoverRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "指定先へ開く" }));
    const target = canvas.getByTestId("popover-target");
    const popover = await within(target).findByRole("dialog", { name: "指定先へ開く" });
    const layer = popover.closest('[data-basiq-overlay-layer="dialog"]');
    await expect(layer?.parentElement).toBe(target);
  },
};

const ModalPopoverToastExample = defineComponent({
  components: {
    BasiqButton,
    BasiqPopoverClose,
    BasiqPopoverContent,
    BasiqPopoverRoot,
    BasiqPopoverTrigger,
  },
  setup() {
    const toast = useToast();
    return {
      showToast: () => toast.add({ title: "Popoverからの通知" }),
    };
  },
  template: `
    <BasiqPopoverRoot modal>
      <BasiqPopoverTrigger><BasiqButton>Modal Popoverを開く</BasiqButton></BasiqPopoverTrigger>
      <BasiqPopoverContent>
        <BasiqButton @click="showToast">通知を表示</BasiqButton>
        <BasiqPopoverClose><BasiqButton>閉じる</BasiqButton></BasiqPopoverClose>
      </BasiqPopoverContent>
    </BasiqPopoverRoot>
  `,
});

export const ModalAndToastInteraction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqToastProvider, ModalPopoverToastExample },
    template: `
      <BasiqToastProvider>
        <div class="basiq-story"><ModalPopoverToastExample /></div>
      </BasiqToastProvider>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const appRoot = canvasElement.closest("[data-v-app]");
    await userEvent.click(canvas.getByRole("button", { name: "Modal Popoverを開く" }));
    await userEvent.click(page.getByRole("button", { name: "通知を表示" }));

    const region = page.getByRole("region", { hidden: true, name: "通知 (F8)" });
    await expect(region.closest('[aria-hidden="true"]')).not.toBeNull();
    await expect(region.closest("[inert]")).not.toBeNull();

    await userEvent.click(page.getByRole("button", { name: "閉じる" }));
    await waitFor(() => {
      expect(region.closest('[aria-hidden="true"]')).toBeNull();
      expect(appRoot).not.toHaveAttribute("aria-hidden");
    });
    await expect(region.closest("[inert]")).toBeNull();
    await userEvent.click(page.getByRole("button", { hidden: true, name: "通知を閉じる" }));
  },
};

export const ModalAndNonDismissible: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqPopoverClose,
      BasiqPopoverContent,
      BasiqPopoverRoot,
      BasiqPopoverTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqButton tone="neutral" variant="outline">背景の操作</BasiqButton>
        <BasiqPopoverRoot modal :dismissible="false">
          <BasiqPopoverTrigger><BasiqButton>重要な設定</BasiqButton></BasiqPopoverTrigger>
          <BasiqPopoverContent>
            <p style="margin: 0 0 12px">明示的な操作で閉じます。</p>
            <BasiqButton tone="neutral" variant="outline">補助操作</BasiqButton>
            <BasiqPopoverClose><BasiqButton>完了</BasiqButton></BasiqPopoverClose>
          </BasiqPopoverContent>
        </BasiqPopoverRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "重要な設定" });
    const appRoot = canvasElement.closest("[data-v-app]");
    await userEvent.click(trigger);
    const page = within(document.body);
    const popover = await page.findByRole("dialog", { name: "重要な設定" });
    const auxiliaryAction = page.getByRole("button", { name: "補助操作" });
    const closeButton = page.getByRole("button", { name: "完了" });

    await expect(appRoot).toHaveAttribute("aria-hidden", "true");
    await expect(document.body.style.pointerEvents).toBe("none");
    await expect(document.body.style.overflow).toBe("hidden");
    await expect(auxiliaryAction).toHaveFocus();
    await userEvent.tab();
    await expect(closeButton).toHaveFocus();
    await userEvent.tab();
    await expect(auxiliaryAction).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await expect(popover).toHaveAttribute("data-state", "open");
    await userEvent.click(closeButton);
    await waitFor(() => expect(popover).toHaveAttribute("data-state", "closed"));
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(
      () => {
        expect(appRoot).not.toHaveAttribute("aria-hidden");
        expect(document.body.style.pointerEvents).toBe("");
        expect(document.body.style.overflow).toBe("");
        expect(trigger).toHaveFocus();
      },
      { timeout: 2_000 },
    );
  },
};

export const InsideDialog: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqDialog,
      BasiqPopoverContent,
      BasiqPopoverRoot,
      BasiqPopoverTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqDialog data-testid="outer-dialog" title="外側のDialog">
          <template #trigger><BasiqButton>Dialogを開く</BasiqButton></template>
          <BasiqPopoverRoot>
            <BasiqPopoverTrigger><BasiqButton>内側のPopover</BasiqButton></BasiqPopoverTrigger>
            <BasiqPopoverContent data-testid="inner-popover">Popover content</BasiqPopoverContent>
          </BasiqPopoverRoot>
        </BasiqDialog>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "Dialogを開く" }));
    const dialog = await page.findByTestId("outer-dialog");
    const innerTrigger = page.getByRole("button", { name: "内側のPopover" });
    await userEvent.click(innerTrigger);
    const popover = await page.findByTestId("inner-popover");

    await expect(popover.parentElement?.parentElement).toBe(dialog.parentElement);
    await expect(Number(popover.style.zIndex)).toBeGreaterThan(Number(dialog.style.zIndex));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(popover).toHaveAttribute("data-state", "closed"));
    await expect(dialog).toHaveAttribute("data-state", "open");
    await expect(page.getByRole("dialog", { name: "外側のDialog" })).toBeVisible();
    await waitFor(() => expect(innerTrigger).toHaveFocus());
  },
};

const OpenOrderExample = defineComponent({
  components: { BasiqPopoverContent, BasiqPopoverRoot },
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
    <BasiqPopoverRoot v-model:open="firstOpen">
      <BasiqPopoverContent aria-label="先に宣言したPopover" data-testid="first-popover">
        First
      </BasiqPopoverContent>
    </BasiqPopoverRoot>
    <BasiqPopoverRoot v-model:open="secondOpen">
      <BasiqPopoverContent aria-label="後に宣言したPopover" data-testid="second-popover">
        Second
      </BasiqPopoverContent>
    </BasiqPopoverRoot>
  `,
});

export const OpenOrderStacking: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { OpenOrderExample },
    template: '<div class="basiq-story"><OpenOrderExample /></div>',
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "重ねて開く" }));
    const page = within(document.body);
    const first = await page.findByTestId("first-popover");
    const second = await page.findByTestId("second-popover");
    await expect(Number(first.style.zIndex)).toBeGreaterThan(Number(second.style.zIndex));
  },
};
