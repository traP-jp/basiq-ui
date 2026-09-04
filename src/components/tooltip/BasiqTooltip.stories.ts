import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import {
  createFixedVueSourceParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqButton from "../button/BasiqButton.vue";
import BasiqDialog from "../dialog/BasiqDialog.vue";
import BasiqTooltipContent from "./BasiqTooltipContent.vue";
import BasiqTooltipProvider from "./BasiqTooltipProvider.vue";
import BasiqTooltipRoot from "./BasiqTooltipRoot.vue";
import BasiqTooltipTrigger from "./BasiqTooltipTrigger.vue";

const defaultTooltipSource = `
  <template>
    <BasiqTooltipProvider>
      <BasiqTooltipRoot>
        <BasiqTooltipTrigger>
          <BasiqButton aria-label="通知設定">通知</BasiqButton>
        </BasiqTooltipTrigger>
        <BasiqTooltipContent>通知設定を変更します</BasiqTooltipContent>
      </BasiqTooltipRoot>
    </BasiqTooltipProvider>
  </template>
`;

const meta = {
  title: "Components/Tooltip",
  component: BasiqTooltipRoot,
  tags: ["autodocs"],
  args: {
    "onUpdate:open": fn(),
  },
  parameters: {
    controls: { disable: true },
  },
  render: (args) => ({
    components: {
      BasiqButton,
      BasiqTooltipContent,
      BasiqTooltipProvider,
      BasiqTooltipRoot,
      BasiqTooltipTrigger,
    },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story">
        <BasiqTooltipProvider :delay-duration="0">
          <BasiqTooltipRoot v-bind="args">
            <BasiqTooltipTrigger>
              <BasiqButton aria-label="通知設定">通知</BasiqButton>
            </BasiqTooltipTrigger>
            <BasiqTooltipContent data-testid="notification-tooltip">
              通知設定を変更します
            </BasiqTooltipContent>
          </BasiqTooltipRoot>
        </BasiqTooltipProvider>
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqTooltipRoot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: createFixedVueSourceParameters(defaultTooltipSource),
};

export const Interaction: Story = {
  ...Default,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("button", { name: "通知設定" });

    await fireEvent.pointerMove(trigger, { pointerType: "mouse" });
    const content = await page.findByTestId("notification-tooltip");
    await expect(content).toBeVisible();
    const descriptionId = trigger.getAttribute("aria-describedby");
    await expect(descriptionId).toBeTruthy();
    const description = document.getElementById(descriptionId!);
    await expect(description).toHaveAttribute("role", "tooltip");
    await expect(description).toHaveTextContent("通知設定を変更します");
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(true);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByTestId("notification-tooltip")).toBeNull());
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(false);

    await fireEvent.focus(trigger);
    await expect(await page.findByTestId("notification-tooltip")).toBeVisible();
    await fireEvent.blur(trigger);
    await waitFor(() => expect(page.queryByTestId("notification-tooltip")).toBeNull());
  },
};

export const HoverableContent: Story = {
  ...Default,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const trigger = canvas.getByRole("button", { name: "通知設定" });

    await fireEvent.pointerMove(trigger, { pointerType: "mouse" });
    const content = await page.findByTestId("notification-tooltip");
    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    await fireEvent.pointerLeave(trigger, {
      clientX: triggerRect.left + triggerRect.width / 2,
      clientY: triggerRect.top,
      pointerType: "mouse",
    });
    await fireEvent.pointerMove(content, {
      clientX: contentRect.left + contentRect.width / 2,
      clientY: contentRect.top + contentRect.height / 2,
      pointerType: "mouse",
    });
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    await expect(content).toBeVisible();

    await fireEvent.pointerLeave(content, {
      clientX: contentRect.right,
      clientY: contentRect.top + contentRect.height / 2,
      pointerType: "mouse",
    });
    await fireEvent.pointerMove(document.body, {
      clientX: document.documentElement.clientWidth - 1,
      clientY: document.documentElement.clientHeight - 1,
      pointerType: "mouse",
    });
    await waitFor(() => expect(page.queryByTestId("notification-tooltip")).toBeNull());
  },
};

const ControlledExample = defineComponent({
  components: {
    BasiqButton,
    BasiqTooltipContent,
    BasiqTooltipProvider,
    BasiqTooltipRoot,
    BasiqTooltipTrigger,
  },
  setup() {
    const open = ref(false);
    return { open };
  },
  template: `
    <p>状態: {{ open ? "open" : "closed" }}</p>
    <BasiqTooltipProvider :delay-duration="0">
      <BasiqTooltipRoot v-model:open="open">
        <BasiqTooltipTrigger><BasiqButton>制御対象</BasiqButton></BasiqTooltipTrigger>
        <BasiqTooltipContent>制御されたTooltip</BasiqTooltipContent>
      </BasiqTooltipRoot>
    </BasiqTooltipProvider>
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
      <BasiqTooltipProvider>
        <BasiqTooltipRoot v-model:open="open">
          <BasiqTooltipTrigger>
            <BasiqButton>制御対象</BasiqButton>
          </BasiqTooltipTrigger>
          <BasiqTooltipContent>制御されたTooltip</BasiqTooltipContent>
        </BasiqTooltipRoot>
      </BasiqTooltipProvider>
    </template>
  `),
  render: () => ({
    components: { ControlledExample },
    template: '<div class="basiq-story"><ControlledExample /></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "制御対象" });
    await expect(canvas.getByText("状態: closed")).toBeVisible();
    await fireEvent.focus(trigger);
    await waitFor(() => expect(canvas.getByText("状態: open")).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.getByText("状態: closed")).toBeVisible());
  },
};

export const DisabledRoot: Story = {
  tags: ["regression"],
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqTooltipProvider>
        <BasiqTooltipRoot disabled>
          <BasiqTooltipTrigger>
            <BasiqButton>Tooltipを無効化</BasiqButton>
          </BasiqTooltipTrigger>
          <BasiqTooltipContent>このTooltipは表示されません</BasiqTooltipContent>
        </BasiqTooltipRoot>
      </BasiqTooltipProvider>
    </template>
  `),
  render: () => ({
    components: {
      BasiqButton,
      BasiqTooltipContent,
      BasiqTooltipProvider,
      BasiqTooltipRoot,
      BasiqTooltipTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqTooltipProvider :delay-duration="0">
          <BasiqTooltipRoot disabled>
            <BasiqTooltipTrigger>
              <BasiqButton>Tooltipを無効化</BasiqButton>
            </BasiqTooltipTrigger>
            <BasiqTooltipContent data-testid="disabled-root-tooltip">
              このTooltipは表示されません
            </BasiqTooltipContent>
          </BasiqTooltipRoot>
        </BasiqTooltipProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const page = within(document.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Tooltipを無効化" });

    await fireEvent.pointerMove(trigger, { pointerType: "mouse" });
    await expect(page.queryByTestId("disabled-root-tooltip")).toBeNull();
    await expect(trigger).not.toHaveAttribute("aria-describedby");

    await fireEvent.focus(trigger);
    await expect(page.queryByTestId("disabled-root-tooltip")).toBeNull();
    await expect(trigger).not.toHaveAttribute("aria-describedby");
  },
};

export const DisabledControl: Story = {
  tags: ["regression"],
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqTooltipProvider>
        <BasiqTooltipRoot>
          <BasiqTooltipTrigger>
            <span aria-label="削除できない理由" tabindex="0">
              <BasiqButton disabled>削除</BasiqButton>
            </span>
          </BasiqTooltipTrigger>
          <BasiqTooltipContent>権限がないため削除できません</BasiqTooltipContent>
        </BasiqTooltipRoot>
      </BasiqTooltipProvider>
    </template>
  `),
  render: () => ({
    components: {
      BasiqButton,
      BasiqTooltipContent,
      BasiqTooltipProvider,
      BasiqTooltipRoot,
      BasiqTooltipTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqTooltipProvider :delay-duration="0">
          <BasiqTooltipRoot>
            <BasiqTooltipTrigger>
              <span aria-label="削除できない理由" tabindex="0">
                <BasiqButton disabled>削除</BasiqButton>
              </span>
            </BasiqTooltipTrigger>
            <BasiqTooltipContent data-testid="disabled-tooltip">
              権限がないため削除できません
            </BasiqTooltipContent>
          </BasiqTooltipRoot>
        </BasiqTooltipProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByLabelText("削除できない理由");
    await fireEvent.focus(trigger);
    const tooltip = await within(document.body).findByTestId("disabled-tooltip");
    await expect(tooltip).toHaveTextContent("権限がないため削除できません");
  },
};

export const ThemeAndDialog: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: {
      BasiqButton,
      BasiqDialog,
      BasiqThemeProvider,
      BasiqTooltipContent,
      BasiqTooltipProvider,
      BasiqTooltipRoot,
      BasiqTooltipTrigger,
    },
    template: `
      <div class="basiq-story">
        <BasiqThemeProvider
          mode="dark"
          :overrides="{ color: { contentDefault: 'rgb(240 245 250)' } }"
        >
          <BasiqTooltipProvider :delay-duration="0">
            <BasiqDialog title="設定">
              <template #trigger><BasiqButton>Dialogを開く</BasiqButton></template>
              <BasiqTooltipRoot>
                <BasiqTooltipTrigger><BasiqButton>詳細</BasiqButton></BasiqTooltipTrigger>
                <BasiqTooltipContent data-testid="dialog-tooltip">
                  設定の詳細です
                </BasiqTooltipContent>
              </BasiqTooltipRoot>
            </BasiqDialog>
          </BasiqTooltipProvider>
        </BasiqThemeProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const page = within(document.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Dialogを開く" }));
    const trigger = page.getByRole("button", { name: "詳細" });
    await fireEvent.focus(trigger);
    const tooltip = await page.findByTestId("dialog-tooltip");
    await expect(tooltip).toHaveTextContent("設定の詳細です");
    const dialog = page.getByRole("dialog", { name: "設定" });

    await expect(tooltip).toHaveAttribute("data-basiq-theme", "dark");
    await expect(tooltip.style.getPropertyValue("--basiq-color-content-default")).toBe(
      "rgb(240 245 250)",
    );
    await expect(tooltip.parentElement?.parentElement).toBe(dialog.parentElement);
    await expect(Number(tooltip.style.zIndex)).toBeGreaterThan(Number(dialog.style.zIndex));
  },
};
