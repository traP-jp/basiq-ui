import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { defineComponent, ref, type PropType } from "vue";

import { createFixedVueSourceParameters } from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqButton from "../button/BasiqButton.vue";
import BasiqDialog from "../dialog/BasiqDialog.vue";
import { acquireOverlayOrder } from "../overlay/overlayHost";
import BasiqToastProvider from "./BasiqToastProvider.vue";
import BasiqToastSurface from "./BasiqToastSurface.vue";
import { useToast } from "./toastContext";
import type { BasiqToastId, BasiqToastPriority, BasiqToastRecord, BasiqToastTone } from "./types";

const tones: BasiqToastTone[] = ["neutral", "info", "success", "warning", "error"];

function getToastRegion(name = "通知 (F8)", hidden = false) {
  return within(document.body).getByRole("region", { hidden, name });
}

const statusColorPreviewRecords: readonly BasiqToastRecord[] = [
  {
    id: "preview-neutral",
    priority: "background",
    title: "同期しました",
    tone: "neutral",
  },
  {
    id: "preview-info",
    title: "新しいお知らせがあります",
    description: "内容を確認して、必要に応じて操作してください。",
    priority: "background",
    tone: "info",
  },
  {
    id: "preview-success",
    priority: "foreground",
    title: "変更を保存しました",
    tone: "success",
  },
  {
    id: "preview-warning",
    priority: "background",
    title: "有効期限が近づいています",
    tone: "warning",
  },
  {
    id: "preview-error",
    priority: "foreground",
    title: "アップロードに失敗しました",
    tone: "error",
  },
];

const StatusColorComparisonGallery = defineComponent({
  name: "StatusColorComparisonGallery",
  components: { BasiqToastSurface },
  setup: () => ({ statusColorPreviewRecords }),
  template: `
    <div class="basiq-story basiq-toast-status-color-comparison">
      <section
        v-for="mode in ['light', 'dark']"
        :key="mode"
        :data-basiq-theme="mode"
        class="basiq-toast-status-color-comparison-panel"
      >
        <h2>{{ mode }}</h2>
        <div class="basiq-toast-status-color-comparison-stack">
          <BasiqToastSurface
            v-for="toast in statusColorPreviewRecords"
            :key="toast.id"
            :dismissible="false"
            :toast="toast"
          />
        </div>
      </section>
    </div>
  `,
});

const ToastControls = defineComponent({
  name: "ToastControls",
  components: { BasiqButton },
  props: {
    description: String,
    priority: { default: "foreground", type: String as PropType<BasiqToastPriority> },
    title: { required: true, type: String },
    tone: { default: "neutral", type: String as PropType<BasiqToastTone> },
  },
  setup(props) {
    const toast = useToast();
    const lastId = ref<BasiqToastId>();

    function add() {
      lastId.value = toast.add({
        title: props.title,
        priority: props.priority,
        tone: props.tone,
        ...(props.description === undefined ? {} : { description: props.description }),
      });
    }

    function dismiss() {
      if (lastId.value) toast.dismiss(lastId.value);
    }

    return { add, dismiss };
  },
  template: `
    <div class="basiq-story basiq-story-stack">
      <BasiqButton @click="add">通知を表示</BasiqButton>
      <BasiqButton tone="neutral" @click="dismiss">最後の通知を閉じる</BasiqButton>
    </div>
  `,
});

const ToneControls = defineComponent({
  name: "ToneControls",
  components: { BasiqButton },
  setup() {
    const toast = useToast();
    return {
      add(tone: BasiqToastTone) {
        toast.add({ title: `${tone} の通知`, tone });
      },
      tones,
    };
  },
  template: `
    <div class="basiq-story basiq-story-stack">
      <BasiqButton v-for="tone in tones" :key="tone" tone="neutral" @click="add(tone)">
        {{ tone }}
      </BasiqButton>
    </div>
  `,
});

const PriorityControls = defineComponent({
  name: "PriorityControls",
  components: { BasiqButton },
  setup() {
    const toast = useToast();
    return {
      add(priority: BasiqToastPriority) {
        toast.add({
          priority,
          title: priority === "foreground" ? "変更を保存しました" : "同期が完了しました",
          tone: priority === "foreground" ? "success" : "info",
        });
      },
    };
  },
  template: `
    <div class="basiq-story basiq-story-stack">
      <BasiqButton @click="add('foreground')">操作結果を通知</BasiqButton>
      <BasiqButton tone="neutral" @click="add('background')">
        バックグラウンド更新を通知
      </BasiqButton>
    </div>
  `,
});

const StackingControls = defineComponent({
  name: "StackingControls",
  components: { BasiqButton },
  setup() {
    const toast = useToast();
    const next = ref(1);
    return {
      add() {
        toast.add({ title: `通知 ${next.value++}`, tone: "info" });
      },
    };
  },
  template: `
    <div class="basiq-story">
      <BasiqButton @click="add">通知を追加</BasiqButton>
    </div>
  `,
});

const DialogToastControls = defineComponent({
  name: "DialogToastControls",
  components: { BasiqButton, BasiqDialog },
  setup() {
    const toast = useToast();
    return {
      notify() {
        toast.add({
          description: "Dialogを閉じずに処理を続けられます。",
          title: "Dialog内の変更を保存しました",
          tone: "success",
        });
      },
    };
  },
  template: `
    <div class="basiq-story">
      <BasiqDialog title="通知設定" close-label="ダイアログを閉じる">
        <template #trigger><BasiqButton>Dialogを開く</BasiqButton></template>
        <p style="margin: 0">DialogとToastの重なり順を確認します。</p>
        <template #footer>
          <BasiqButton @click="notify">通知を表示</BasiqButton>
        </template>
      </BasiqDialog>
    </div>
  `,
});

const ThemeBridgeExample = defineComponent({
  name: "ThemeBridgeExample",
  components: { BasiqThemeProvider, BasiqToastProvider, ToastControls },
  template: `
    <BasiqThemeProvider
      mode="dark"
      :overrides="{ color: { surfaceContainer: 'rgb(20 30 40)' } }"
    >
      <BasiqToastProvider>
        <ToastControls title="テーマ付き通知" />
      </BasiqToastProvider>
    </BasiqThemeProvider>
  `,
});

const ExplicitPortalTargetExample = defineComponent({
  name: "ExplicitPortalTargetExample",
  components: { BasiqToastProvider, ToastControls },
  template: `
    <div class="basiq-story">
      <div id="toast-test-target" data-testid="toast-target" />
      <BasiqToastProvider portal-target="#toast-test-target">
        <ToastControls title="指定先の通知" />
      </BasiqToastProvider>
    </div>
  `,
});

const HostLifecycleExample = defineComponent({
  name: "HostLifecycleExample",
  components: { BasiqButton, BasiqToastProvider, ToastControls },
  setup() {
    const mounted = ref(true);
    return { mounted };
  },
  template: `
    <div class="basiq-story">
      <BasiqButton @click="mounted = false">Toast Providerをunmount</BasiqButton>
      <BasiqToastProvider v-if="mounted">
        <ToastControls title="unmount前の通知" />
      </BasiqToastProvider>
    </div>
  `,
});

const meta = {
  title: "Components/Toast",
  component: BasiqToastProvider,
  tags: ["autodocs"],
  args: {
    closeLabel: "通知を閉じる",
    label: "通知",
  },
  argTypes: {
    portalTarget: {
      control: false,
      description:
        "mount時に解決するPortal先です。mount中は変更せず、別のtargetを使う場合はProviderをremountしてください。",
    },
  },
  parameters: {
    controls: { include: ["closeLabel", "label"] },
    docs: {
      description: {
        component: `
Toastは、アプリのルート付近に配置した1つの \`BasiqToastProvider\` で管理します。異なる画面やボタンから追加したToastも、同じProviderの子孫であれば右下の共通領域に重ならず積み上がります。

\`useToast()\` はProvider自身と同じコンポーネントではなく、その子孫コンポーネントで呼び出してください。同じdocument内にProviderを複数配置すると、それぞれが独立した表示領域を同じ位置に作るため、Toast同士が重なる可能性があります。

Toastは、処理結果やバックグラウンド更新を短く伝える、応答不要の通知に使用します。判断が必要な内容はDialog、入力エラーはFormField、消えると困る情報は画面本体や通知履歴へ表示してください。色やアイコンだけに頼らず、title自体に「保存しました」「失敗しました」のような結果を記述します。

ユーザー操作の結果には \`priority: "foreground"\`、バックグラウンド処理には \`priority: "background"\` を指定します。priorityは読み上げ順、toneは見た目だけを制御します。
        `.trim(),
      },
    },
  },
  render: (args) => ({
    components: { BasiqToastProvider, ToastControls },
    setup: () => ({ args }),
    template: `
      <BasiqToastProvider v-bind="args">
        <ToastControls
          title="保存しました"
          description="変更内容を保存しました。"
          tone="success"
        />
      </BasiqToastProvider>
    `,
  }),
} satisfies Meta<typeof BasiqToastProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "まずApp.vueなどのルート付近にProviderを1つ配置します。通知を表示する処理は、子孫コンポーネントからuseToast()で呼び出します。",
      },
      source: {
        code: `<script setup lang="ts">
import { BasiqToastProvider } from "basiq-ui";
import AppContent from "./AppContent.vue";
</script>

<template>
  <BasiqToastProvider label="通知" close-label="通知を閉じる">
    <AppContent />
  </BasiqToastProvider>
</template>`,
        language: "html",
      },
    },
  },
};

export const UseToast: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: "BasiqToastProviderの子孫コンポーネントから通知を追加・終了する例です。",
      },
      source: {
        code: `<script setup lang="ts">
import { BasiqButton, useToast } from "basiq-ui";

const toast = useToast();
let lastToastId: string | undefined;

function save() {
  lastToastId = toast.add({
    title: "保存しました",
    description: "変更内容を保存しました。",
    priority: "foreground",
    tone: "success",
  });
}

function dismissLast() {
  if (lastToastId) toast.dismiss(lastToastId);
}
</script>

<template>
  <div>
    <BasiqButton @click="save">保存</BasiqButton>
    <BasiqButton tone="neutral" @click="dismissLast">
      最後の通知を閉じる
    </BasiqButton>
  </div>
</template>`,
        language: "html",
      },
    },
  },
};

export const Tones: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqButton, type BasiqToastTone, useToast } from "basiq-ui";

    const toast = useToast();
    const tones: BasiqToastTone[] = ["neutral", "info", "success", "warning", "error"];

    function showToast(tone: BasiqToastTone) {
      toast.add({ title: \`\${tone} の通知\`, tone });
    }
    </script>

    <template>
      <div>
        <BasiqButton
          v-for="tone in tones"
          :key="tone"
          tone="neutral"
          @click="showToast(tone)"
        >
          {{ tone }}
        </BasiqButton>
      </div>
    </template>
  `),
  render: (args) => ({
    components: { BasiqToastProvider, ToneControls },
    setup: () => ({ args }),
    template: '<BasiqToastProvider v-bind="args"><ToneControls /></BasiqToastProvider>',
  }),
};

export const Priorities: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqButton, type BasiqToastPriority, useToast } from "basiq-ui";

    const toast = useToast();

    function showToast(priority: BasiqToastPriority) {
      toast.add({
        priority,
        title: priority === "foreground" ? "変更を保存しました" : "同期が完了しました",
        tone: priority === "foreground" ? "success" : "info",
      });
    }
    </script>

    <template>
      <div>
        <BasiqButton @click="showToast('foreground')">操作結果を通知</BasiqButton>
        <BasiqButton tone="neutral" @click="showToast('background')">
          バックグラウンド更新を通知
        </BasiqButton>
      </div>
    </template>
  `),
  render: (args) => ({
    components: { BasiqToastProvider, PriorityControls },
    setup: () => ({ args }),
    template: '<BasiqToastProvider v-bind="args"><PriorityControls /></BasiqToastProvider>',
  }),
};

export const LongContent: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqButton, useToast } from "basiq-ui";

    const toast = useToast();

    function notifySaved() {
      toast.add({
        title: "非常に長いファイル名を含むデータを保存しました",
        description:
          "project-2026-09-03-very-long-unbroken-filename-with-metadata.json の変更内容を保存しました。",
        priority: "foreground",
        tone: "success",
      });
    }
    </script>

    <template>
      <BasiqButton @click="notifySaved">通知を表示</BasiqButton>
    </template>
  `),
  render: (args) => ({
    components: { BasiqToastProvider, ToastControls },
    setup: () => ({ args }),
    template: `
      <BasiqToastProvider v-bind="args">
        <ToastControls
          title="非常に長いファイル名を含むデータを保存しました"
          description="project-2026-09-03-very-long-unbroken-filename-with-metadata.json の変更内容を保存しました。"
          tone="success"
        />
      </BasiqToastProvider>
    `,
  }),
};

export const StatusColorComparison: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      canvas: { sourceState: "none" },
      description: {
        story:
          "ステータスカラーとLight／Darkテーマでの見え方を確認する、操作を伴わない表示資料です。",
      },
    },
  },
  render: () => ({
    components: { StatusColorComparisonGallery },
    template: "<StatusColorComparisonGallery />",
  }),
};

export const DefaultInteraction: Story = {
  tags: ["regression", "!autodocs"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "通知を表示" });
    const entryMovementStarted = new Promise<Animation>((resolve, reject) => {
      let frame = 0;
      const findMovement = () => {
        const surface = document.querySelector<HTMLElement>("[data-basiq-toast-surface]");
        const movement = surface?.getAnimations().find((animation) => {
          const effect = animation.effect;
          return (
            effect instanceof KeyframeEffect &&
            effect
              .getKeyframes()
              .some((keyframe) => String(keyframe.transform).startsWith("translateY"))
          );
        });
        if (movement) {
          resolve(movement);
          return;
        }

        frame += 1;
        if (frame < 60) requestAnimationFrame(findMovement);
        else reject(new Error("The new Toast did not start moving."));
      };
      requestAnimationFrame(findMovement);
    });
    const maximumOverflow = new Promise<number>((resolve) => {
      const observer = new MutationObserver(() => {
        const item = document.querySelector<HTMLElement>("[data-basiq-toast-id]");
        const viewport = item?.closest<HTMLElement>("ol");
        if (!viewport) return;

        observer.disconnect();
        let frame = 0;
        let maximum = 0;
        const sample = () => {
          maximum = Math.max(maximum, viewport.scrollHeight - viewport.clientHeight);
          frame += 1;
          if (frame < 12) requestAnimationFrame(sample);
          else resolve(maximum);
        };
        sample();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    await userEvent.click(trigger);
    await expect(trigger).toHaveFocus();

    const region = getToastRegion();
    const item = within(region).getByRole("listitem");
    await expect(item).toHaveTextContent("保存しました");
    await expect(item).toHaveTextContent("変更内容を保存しました。");
    const surface = item.querySelector<HTMLElement>("[data-basiq-toast-surface]")!;
    const close = within(item).getByRole("button", { name: "通知を閉じる" });
    await expect(close).toHaveAttribute("type", "button");
    await expect(within(item).queryByRole("img")).not.toBeInTheDocument();
    await expect(item.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    await waitFor(async () => {
      const announcement = within(document.body).getByRole("alert");
      await expect(announcement).not.toHaveAttribute("aria-hidden");
      await expect(announcement.closest('[aria-hidden="true"]')).toBeNull();
      await expect(announcement).toHaveTextContent("通知 保存しました 変更内容を保存しました。");
    });
    const entryMovement = await entryMovementStarted;
    const entryKeyframes = (entryMovement.effect as KeyframeEffect).getKeyframes();
    await expect(String(entryKeyframes[0]?.transform)).toContain("100%");
    await entryMovement.finished;
    await expect(getComputedStyle(surface).transform).toBe("none");
    await expect(getComputedStyle(item).overflow).toBe("clip");
    await expect(maximumOverflow).resolves.toBe(0);

    await userEvent.click(close);
    await expect(within(region).queryByRole("listitem")).not.toBeInTheDocument();
  },
};

export const BackgroundPriorityInteraction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { BasiqToastProvider, ToastControls },
    template: `
      <BasiqToastProvider>
        <ToastControls
          title="同期しました"
          description="最新の状態へ更新しました。"
          priority="background"
          tone="info"
        />
      </BasiqToastProvider>
    `,
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "通知を表示" }));
    const status = within(document.body).getByRole("status");

    await waitFor(() =>
      expect(status).toHaveTextContent("通知 同期しました 最新の状態へ更新しました。"),
    );
    await expect(status).not.toHaveAttribute("aria-hidden");

    const region = getToastRegion();
    await userEvent.click(within(region).getByRole("button", { name: "通知を閉じる" }));
  },
};

export const StackingInteraction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: { controls: { disable: true } },
  render: (args) => ({
    components: { BasiqToastProvider, StackingControls },
    setup: () => ({ args }),
    template: '<BasiqToastProvider v-bind="args"><StackingControls /></BasiqToastProvider>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole("button", { name: "通知を追加" });

    await userEvent.click(add);
    const region = getToastRegion();
    const viewport = region.querySelector<HTMLElement>("ol")!;
    const first = within(region).getByRole("listitem");
    const firstTop = first.getBoundingClientRect().top;
    const movementStarted = new Promise<Animation>((resolve, reject) => {
      let frame = 0;
      const findMovement = () => {
        const movement = first
          .getAnimations()
          .find((animation) => animation.id === "basiq-toast-stack-move");
        if (movement) {
          resolve(movement);
          return;
        }

        frame += 1;
        if (frame < 30) requestAnimationFrame(findMovement);
        else reject(new Error("The existing Toast did not start moving."));
      };
      requestAnimationFrame(findMovement);
    });
    const maximumOverflow = new Promise<number>((resolve) => {
      const observer = new MutationObserver(() => {
        if (viewport.querySelectorAll("[data-basiq-toast-id]").length < 2) return;

        observer.disconnect();
        let frame = 0;
        let maximum = 0;
        const sample = () => {
          maximum = Math.max(maximum, viewport.scrollHeight - viewport.clientHeight);
          frame += 1;
          if (frame < 12) requestAnimationFrame(sample);
          else resolve(maximum);
        };
        sample();
      });
      observer.observe(viewport, { childList: true, subtree: true });
    });

    await userEvent.click(add);
    const movement = await movementStarted;
    const movementKeyframes = (movement.effect as KeyframeEffect).getKeyframes();
    await expect(String(movementKeyframes[0]?.transform)).toMatch(/^translateY\([1-9]/);
    await movement.finished;
    await expect(first.getBoundingClientRect().top).toBeLessThan(firstTop);
    await expect(maximumOverflow).resolves.toBe(0);

    await userEvent.click(add);
    await userEvent.click(add);

    const items = within(region).getAllByRole("listitem");
    const activeMovements = items.flatMap((item) =>
      item
        .getAnimations()
        .filter((animation) => animation.id === "basiq-toast-stack-move")
        .map((animation) => animation.finished),
    );
    await Promise.all(activeMovements);
    await expect(items).toHaveLength(3);
    await expect(items[0]).toHaveTextContent("通知 2");
    await expect(items[2]).toHaveTextContent("通知 4");
    await expect(items[2].getBoundingClientRect().bottom).toBeGreaterThan(
      items[0].getBoundingClientRect().bottom,
    );
    await expect(items[2].getBoundingClientRect().bottom).toBeGreaterThan(window.innerHeight - 32);

    for (const close of within(region).getAllByRole("button", { name: "通知を閉じる" })) {
      await userEvent.click(close);
    }
  },
};

export const ConstrainedHeightInteraction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { BasiqToastProvider, ToastControls },
    template: `
      <BasiqToastProvider>
        <ToastControls
          title="非常に長いファイル名を含むデータを保存しました"
          description="project-2026-09-03-very-long-unbroken-filename-with-metadata.json の変更内容を保存しました。"
          tone="success"
        />
      </BasiqToastProvider>
    `,
  }),
  play: async ({ canvasElement }) => {
    const region = getToastRegion();
    const viewport = region.querySelector<HTMLElement>("ol")!;
    viewport.style.maxHeight = "200px";
    const add = within(canvasElement).getByRole("button", { name: "通知を表示" });

    await userEvent.click(add);
    await userEvent.click(add);
    await userEvent.click(add);

    const items = within(region).getAllByRole("listitem");
    const newest = items.at(-1)!;
    await waitFor(() => expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight));
    await expect(newest.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      viewport.getBoundingClientRect().bottom + 1,
    );

    for (const close of within(region).getAllByRole("button", { name: "通知を閉じる" })) {
      await userEvent.click(close);
    }
  },
};

export const KeyboardInteraction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: { controls: { disable: true } },
  render: (args) => ({
    components: { BasiqToastProvider, StackingControls },
    setup: () => ({ args }),
    template: '<BasiqToastProvider v-bind="args"><StackingControls /></BasiqToastProvider>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole("button", { name: "通知を追加" });
    await userEvent.click(add);
    await userEvent.click(add);

    const region = getToastRegion();
    await expect(region.querySelectorAll('[aria-hidden="true"][tabindex="0"]')).toHaveLength(0);
    await userEvent.keyboard("{Escape}");
    await expect(within(region).getAllByRole("listitem")).toHaveLength(2);

    await userEvent.keyboard("{F8}");
    const viewport = region.querySelector("ol");
    await expect(viewport).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(within(region).getAllByRole("listitem")).toHaveLength(2);

    await userEvent.tab();
    const items = within(region).getAllByRole("listitem");
    await expect(items[1]).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(async () => {
      const remainingItems = within(region).getAllByRole("listitem");
      await expect(remainingItems).toHaveLength(1);
      await expect(remainingItems[0]).toHaveTextContent("通知 1");
      await expect(remainingItems[0]).toHaveFocus();
    });

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(region).queryByRole("listitem")).toBeNull());
    await expect(add).toHaveFocus();
  },
};

export const AutoDismissInteraction: Story = {
  tags: ["regression", "!autodocs"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "通知を表示" }));

    const region = getToastRegion();
    await new Promise((resolve) => setTimeout(resolve, 5200));
    await expect(within(region).queryByRole("listitem")).not.toBeInTheDocument();
  },
};

export const PauseOnHoverInteraction: Story = {
  tags: ["regression", "!autodocs"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "通知を表示" }));

    const region = getToastRegion();
    const item = within(region).getByRole("listitem");
    await userEvent.hover(item);
    await new Promise((resolve) => setTimeout(resolve, 5200));
    await expect(item).toBeInTheDocument();
    await userEvent.unhover(item);
    await userEvent.click(within(item).getByRole("button", { name: "通知を閉じる" }));
  },
};

export const PauseResetInteraction: Story = {
  tags: ["regression", "!autodocs"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole("button", { name: "通知を表示" });
    const dismiss = canvas.getByRole("button", { name: "最後の通知を閉じる" });
    await userEvent.click(add);

    const region = getToastRegion();
    await userEvent.hover(within(region).getByRole("listitem"));
    dismiss.click();
    await waitFor(() => expect(within(region).queryByRole("listitem")).toBeNull());
    add.click();

    await new Promise((resolve) => setTimeout(resolve, 5200));
    await expect(within(region).queryByRole("listitem")).not.toBeInTheDocument();
  },
};

export const DialogAndToastInteraction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { BasiqToastProvider, DialogToastControls },
    template: "<BasiqToastProvider><DialogToastControls /></BasiqToastProvider>",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(document.body);
    const dialogLayer = document.querySelector<HTMLElement>('[data-basiq-overlay-layer="dialog"]')!;
    for (let index = 0; index < 600; index += 1) acquireOverlayOrder(dialogLayer);

    await userEvent.click(canvas.getByRole("button", { name: "Dialogを開く" }));

    await page.findByRole("dialog", { name: "通知設定" });
    await userEvent.click(page.getByRole("button", { name: "通知を表示" }));

    const region = getToastRegion("通知 (F8)", true);
    const viewport = region.querySelector("ol")!;
    const item = within(region).getByRole("listitem", { hidden: true });
    const announcement = page.getByRole("alert");
    await expect(item).toHaveTextContent("Dialog内の変更を保存しました");
    await expect(announcement).toHaveTextContent("Dialog内の変更を保存しました");
    await expect(announcement.closest('[aria-hidden="true"]')).toBeNull();
    await expect(region.closest('[aria-hidden="true"]')).not.toBeNull();
    await expect(region.closest("[inert]")).not.toBeNull();
    const toastLayer = viewport.closest<HTMLElement>('[data-basiq-overlay-layer="toast"]')!;
    await expect(Number(getComputedStyle(toastLayer).zIndex)).toBeGreaterThan(
      Number(getComputedStyle(dialogLayer).zIndex),
    );
    const dialogFocus = document.activeElement;
    await userEvent.keyboard("{F8}");
    await expect(dialogFocus).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog", { name: "通知設定" })).toBeNull());
    await expect(item).toBeInTheDocument();
    await expect(region.closest('[aria-hidden="true"]')).toBeNull();
    await userEvent.click(within(item).getByRole("button", { name: "通知を閉じる" }));
  },
};

export const ThemeBridgeInteraction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { ThemeBridgeExample },
    template: '<div class="basiq-story"><ThemeBridgeExample /></div>',
  }),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "通知を表示" }));
    const region = getToastRegion();
    const viewport = region.querySelector("ol")!;
    const item = within(region).getByRole("listitem");

    await expect(viewport).toHaveAttribute("data-basiq-theme", "dark");
    await expect(viewport.style.getPropertyValue("--basiq-color-surface-container")).toBe(
      "rgb(20 30 40)",
    );
    await userEvent.click(within(item).getByRole("button", { name: "通知を閉じる" }));
  },
};

export const ExplicitPortalTargetInteraction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { ExplicitPortalTargetExample },
    template: "<ExplicitPortalTargetExample />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "通知を表示" }));

    const target = canvas.getByTestId("toast-target");
    const region = within(target).getByRole("region", { name: "通知 (F8)" });
    const item = within(region).getByRole("listitem");
    await expect(item).toHaveTextContent("指定先の通知");
    await userEvent.click(within(item).getByRole("button", { name: "通知を閉じる" }));
  },
};

export const HostLifecycleInteraction: Story = {
  tags: ["regression", "!autodocs"],
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { HostLifecycleExample },
    template: "<HostLifecycleExample />",
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(document.getElementById("basiq-overlay-host")).not.toBeNull());
    await userEvent.click(within(canvasElement).getByRole("button", { name: "通知を表示" }));
    await expect(within(getToastRegion()).getByRole("listitem")).toHaveTextContent(
      "unmount前の通知",
    );
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Toast Providerをunmount" }),
    );
    await waitFor(() => expect(document.getElementById("basiq-overlay-host")).toBeNull());
  },
};
