import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import {
  createFixedVueSourceParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqButton from "../button/BasiqButton.vue";
import BasiqDialog from "../dialog/BasiqDialog.vue";
import BasiqDropdownMenuContent from "./BasiqDropdownMenuContent.vue";
import BasiqDropdownMenuGroup from "./BasiqDropdownMenuGroup.vue";
import BasiqDropdownMenuItem from "./BasiqDropdownMenuItem.vue";
import BasiqDropdownMenuLabel from "./BasiqDropdownMenuLabel.vue";
import BasiqDropdownMenuRoot from "./BasiqDropdownMenuRoot.vue";
import BasiqDropdownMenuSeparator from "./BasiqDropdownMenuSeparator.vue";
import BasiqDropdownMenuTrigger from "./BasiqDropdownMenuTrigger.vue";

const onArchive = fn();
const onDelete = fn();
const onEdit = fn();

const defaultDropdownMenuSource = `
  <template>
    <BasiqDropdownMenuRoot>
      <BasiqDropdownMenuTrigger>
        <BasiqButton aria-label="投稿の操作">操作</BasiqButton>
      </BasiqDropdownMenuTrigger>

      <BasiqDropdownMenuContent>
        <BasiqDropdownMenuGroup>
          <BasiqDropdownMenuLabel>投稿</BasiqDropdownMenuLabel>
          <BasiqDropdownMenuItem>編集</BasiqDropdownMenuItem>
          <BasiqDropdownMenuItem disabled>複製（準備中）</BasiqDropdownMenuItem>
          <BasiqDropdownMenuItem>アーカイブ</BasiqDropdownMenuItem>
        </BasiqDropdownMenuGroup>
        <BasiqDropdownMenuSeparator />
        <BasiqDropdownMenuItem tone="danger">削除</BasiqDropdownMenuItem>
      </BasiqDropdownMenuContent>
    </BasiqDropdownMenuRoot>
  </template>
`;

const meta = {
  title: "Components/DropdownMenu",
  component: BasiqDropdownMenuRoot,
  tags: ["autodocs"],
  args: {
    modal: false,
    "onUpdate:open": fn(),
  },
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    components: {
      BasiqButton,
      BasiqDropdownMenuContent,
      BasiqDropdownMenuGroup,
      BasiqDropdownMenuItem,
      BasiqDropdownMenuLabel,
      BasiqDropdownMenuRoot,
      BasiqDropdownMenuSeparator,
      BasiqDropdownMenuTrigger,
    },
    setup: () => ({ args, onArchive, onDelete, onEdit }),
    template: `
      <div class="basiq-story">
        <BasiqDropdownMenuRoot v-bind="args">
          <BasiqDropdownMenuTrigger>
            <BasiqButton aria-label="投稿の操作">操作</BasiqButton>
          </BasiqDropdownMenuTrigger>

          <BasiqDropdownMenuContent>
            <BasiqDropdownMenuGroup>
              <BasiqDropdownMenuLabel>投稿</BasiqDropdownMenuLabel>
              <BasiqDropdownMenuItem text-value="Edit" @select="onEdit">
                編集
              </BasiqDropdownMenuItem>
              <BasiqDropdownMenuItem disabled text-value="Duplicate">
                複製（準備中）
              </BasiqDropdownMenuItem>
              <BasiqDropdownMenuItem text-value="Archive" @select="onArchive">
                アーカイブ
              </BasiqDropdownMenuItem>
            </BasiqDropdownMenuGroup>
            <BasiqDropdownMenuSeparator />
            <BasiqDropdownMenuItem tone="danger" @select="onDelete">
              削除
            </BasiqDropdownMenuItem>
          </BasiqDropdownMenuContent>
        </BasiqDropdownMenuRoot>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqDropdownMenuRoot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: createFixedVueSourceParameters(defaultDropdownMenuSource),
};

export const Interaction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("button", { name: "投稿の操作" });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);

    const menu = await page.findByRole("menu");
    const disabledItem = page.getByRole("menuitem", { name: "複製（準備中）" });
    const archiveItem = page.getByRole("menuitem", { name: "アーカイブ" });
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-controls", menu.id);
    await expect(menu).toHaveFocus();
    await expect(disabledItem).toHaveAttribute("aria-disabled", "true");
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(true);

    await userEvent.keyboard("a");
    await expect(archiveItem).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(onArchive).toHaveBeenCalledOnce();
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());

    await userEvent.keyboard("{ArrowDown}");
    await page.findByRole("menu");
    await expect(page.getByRole("menuitem", { name: "編集" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(page.getByRole("menuitem", { name: "アーカイブ" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(false);
  },
};

const ControlledExample = defineComponent({
  components: {
    BasiqButton,
    BasiqDropdownMenuContent,
    BasiqDropdownMenuItem,
    BasiqDropdownMenuRoot,
    BasiqDropdownMenuTrigger,
  },
  setup() {
    const open = ref(false);
    return { open };
  },
  template: `
    <p>状態: {{ open ? "open" : "closed" }}</p>
    <BasiqDropdownMenuRoot v-model:open="open">
      <BasiqDropdownMenuTrigger><BasiqButton>制御対象</BasiqButton></BasiqDropdownMenuTrigger>
      <BasiqDropdownMenuContent>
        <BasiqDropdownMenuItem>選択して閉じる</BasiqDropdownMenuItem>
      </BasiqDropdownMenuContent>
    </BasiqDropdownMenuRoot>
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
      <p>状態: {{ open ? "open" : "closed" }}</p>
      <BasiqDropdownMenuRoot v-model:open="open">
        <BasiqDropdownMenuTrigger>
          <BasiqButton>制御対象</BasiqButton>
        </BasiqDropdownMenuTrigger>
        <BasiqDropdownMenuContent>
          <BasiqDropdownMenuItem>選択して閉じる</BasiqDropdownMenuItem>
        </BasiqDropdownMenuContent>
      </BasiqDropdownMenuRoot>
    </template>
  `),
  render: () => ({
    components: { ControlledExample },
    template: '<div class="basiq-story"><ControlledExample /></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("状態: closed")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "制御対象" }));
    await waitFor(() => expect(canvas.getByText("状態: open")).toBeVisible());
    await userEvent.click(within(document.body).getByRole("menuitem", { name: "選択して閉じる" }));
    await waitFor(() => expect(canvas.getByText("状態: closed")).toBeVisible());
  },
};

export const Modal: Story = {
  tags: ["regression"],
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqDropdownMenuRoot modal>
        <BasiqDropdownMenuTrigger>
          <BasiqButton>モーダルメニュー</BasiqButton>
        </BasiqDropdownMenuTrigger>
        <BasiqDropdownMenuContent>
          <BasiqDropdownMenuItem>設定を開く</BasiqDropdownMenuItem>
        </BasiqDropdownMenuContent>
      </BasiqDropdownMenuRoot>
    </template>
  `),
  render: () => ({
    components: {
      BasiqButton,
      BasiqDropdownMenuContent,
      BasiqDropdownMenuItem,
      BasiqDropdownMenuRoot,
      BasiqDropdownMenuTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqDropdownMenuRoot modal>
          <BasiqDropdownMenuTrigger>
            <BasiqButton>モーダルメニュー</BasiqButton>
          </BasiqDropdownMenuTrigger>
          <BasiqDropdownMenuContent>
            <BasiqDropdownMenuItem>設定を開く</BasiqDropdownMenuItem>
          </BasiqDropdownMenuContent>
        </BasiqDropdownMenuRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("button", { name: "モーダルメニュー" });
    const appRoot = canvasElement.closest("[data-v-app]");

    await userEvent.click(trigger);
    const menu = await page.findByRole("menu");
    await expect(menu).toHaveAttribute("data-state", "open");
    await expect(appRoot).toHaveAttribute("aria-hidden", "true");
    await expect(document.body.style.pointerEvents).toBe("none");
    await expect(document.body.style.overflow).toBe("hidden");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull());
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

export const TriggerWidth: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqDropdownMenuContent,
      BasiqDropdownMenuItem,
      BasiqDropdownMenuRoot,
      BasiqDropdownMenuTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqDropdownMenuRoot>
          <BasiqDropdownMenuTrigger>
            <BasiqButton style="width: 24rem">Triggerと同じ幅</BasiqButton>
          </BasiqDropdownMenuTrigger>
          <BasiqDropdownMenuContent width="trigger">
            <BasiqDropdownMenuItem>同じ幅の項目</BasiqDropdownMenuItem>
          </BasiqDropdownMenuContent>
        </BasiqDropdownMenuRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Triggerと同じ幅" });
    await userEvent.click(trigger);
    const menu = await within(document.body).findByRole("menu");

    await expect(
      Math.abs(menu.getBoundingClientRect().width - trigger.getBoundingClientRect().width),
    ).toBeLessThanOrEqual(8);
  },
};

export const PreventClose: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqDropdownMenuContent,
      BasiqDropdownMenuItem,
      BasiqDropdownMenuRoot,
      BasiqDropdownMenuTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqDropdownMenuRoot>
          <BasiqDropdownMenuTrigger><BasiqButton>開いたまま操作</BasiqButton></BasiqDropdownMenuTrigger>
          <BasiqDropdownMenuContent>
            <BasiqDropdownMenuItem @select.prevent>閉じない項目</BasiqDropdownMenuItem>
          </BasiqDropdownMenuContent>
        </BasiqDropdownMenuRoot>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const page = within(document.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "開いたまま操作" }));
    await userEvent.click(await page.findByRole("menuitem", { name: "閉じない項目" }));
    await expect(page.getByRole("menu")).toHaveAttribute("data-state", "open");
  },
};

export const ThemeAndDialog: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqDialog,
      BasiqDropdownMenuContent,
      BasiqDropdownMenuItem,
      BasiqDropdownMenuRoot,
      BasiqDropdownMenuTrigger,
      BasiqThemeProvider,
    },
    template: `
      <div class="basiq-story">
        <BasiqThemeProvider
          mode="dark"
          :overrides="{ color: { contentDefault: 'rgb(240 245 250)' } }"
        >
          <BasiqDialog title="設定">
            <template #trigger><BasiqButton>Dialogを開く</BasiqButton></template>
            <BasiqDropdownMenuRoot>
              <BasiqDropdownMenuTrigger><BasiqButton>その他</BasiqButton></BasiqDropdownMenuTrigger>
              <BasiqDropdownMenuContent>
                <BasiqDropdownMenuItem>詳細を表示</BasiqDropdownMenuItem>
              </BasiqDropdownMenuContent>
            </BasiqDropdownMenuRoot>
          </BasiqDialog>
        </BasiqThemeProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const page = within(document.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Dialogを開く" }));
    await userEvent.click(page.getByRole("button", { name: "その他" }));
    const menu = await page.findByRole("menu");
    const dialog = page.getByRole("dialog", { name: "設定" });

    await expect(menu).toHaveAttribute("data-basiq-theme", "dark");
    await expect(menu.style.getPropertyValue("--basiq-color-content-default")).toBe(
      "rgb(240 245 250)",
    );
    await expect(menu.parentElement?.parentElement).toBe(dialog.parentElement);
    await expect(Number(menu.style.zIndex)).toBeGreaterThan(Number(dialog.style.zIndex));
  },
};
