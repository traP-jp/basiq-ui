import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqProgress from "./BasiqProgress.vue";

function getProgressParts(progress: HTMLElement) {
  return {
    indicator: progress.querySelector<HTMLElement>("[data-progress-indicator]")!,
    track: progress.querySelector<HTMLElement>("[data-progress-track]")!,
  };
}

const ProgressRegressionHarness = defineComponent({
  name: "ProgressRegressionHarness",
  components: { BasiqProgress, BasiqThemeProvider },
  setup() {
    const value = ref(20);

    return { value };
  },
  template: `
    <div style="display: grid; gap: 24px; width: min(100%, 24rem)">
      <BasiqProgress aria-label="未着手" :value="0" />
      <BasiqProgress aria-label="半分完了" :value="50" />
      <BasiqProgress aria-label="完了" :value="100" />
      <div dir="rtl">
        <BasiqProgress aria-label="右から左" :value="60" />
      </div>
      <div style="width: 64px">
        <BasiqProgress aria-label="狭い表示" :value="60" />
      </div>
      <BasiqThemeProvider
        mode="light"
        :overrides="{ color: { accentDefault: '#7a3ff2', contentDisabled: '#675f73' } }"
        style="padding: 16px; background: var(--basiq-color-surface-base)"
      >
        <BasiqProgress aria-label="カスタムテーマ" :value="60" />
      </BasiqThemeProvider>
      <BasiqProgress
        aria-label="更新される進捗"
        :aria-valuetext="value + '%完了'"
        :value="value"
      />
      <button type="button" @click="value = 80">80%完了に更新</button>
    </div>
  `,
});

const meta = {
  title: "Components/Progress",
  component: BasiqProgress,
  tags: ["autodocs"],
  args: {
    ariaLabel: "処理の進捗",
    ariaValueText: "60%完了",
    value: 60,
  },
  parameters: {
    controls: {
      disable: false,
      include: ["ariaLabel", "ariaLabelledby", "ariaValueText", "max", "value"],
    },
  },
  render: (args) => ({
    components: { BasiqProgress },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="width: min(100%, 30rem)">
        <BasiqProgress v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(),
  play: async ({ canvasElement }) => {
    const progress = within(canvasElement).getByRole("progressbar", { name: "処理の進捗" });
    const { indicator } = getProgressParts(progress);

    await expect(progress).toHaveAttribute("aria-valuemin", "0");
    await expect(progress).toHaveAttribute("aria-valuemax", "100");
    await expect(progress).toHaveAttribute("aria-valuenow", "60");
    await expect(progress).toHaveAttribute("aria-valuetext", "60%完了");
    await expect(indicator.style.getPropertyValue("--basiq-progress-fill")).toBe("60%");
  },
};

export const CourseSessions: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqProgress
    aria-label="講習会の受講進捗"
    aria-valuetext="全5回中3回完了"
    :value="3"
    :max="5"
  />
</template>
`),
  args: {
    ariaLabel: "講習会の受講進捗",
    ariaValueText: "全5回中3回完了",
    max: 5,
    value: 3,
  },
};

export const SurfacePlacement: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqThemeProvider v-for="mode in ['light', 'dark']" :key="mode" :mode="mode">
    <section
      v-for="surface in ['base', 'container', 'muted']"
      :key="surface"
      :style="{ background: 'var(--basiq-color-surface-' + surface + ')' }"
    >
      <BasiqProgress :aria-label="mode + ' ' + surface + 'の進捗'" :value="60" />
    </section>
  </BasiqThemeProvider>
</template>
`),
  render: () => ({
    components: { BasiqProgress, BasiqThemeProvider },
    setup: () => ({ modes: ["light", "dark"], surfaces: ["base", "container", "muted"] }),
    template: `
      <div class="basiq-story basiq-theme-comparison">
        <BasiqThemeProvider v-for="mode in modes" :key="mode" :mode="mode">
          <div style="display: grid; gap: 8px">
            <section
              v-for="surface in surfaces"
              :key="surface"
              :data-testid="mode + '-' + surface"
              :style="{
                background: 'var(--basiq-color-surface-' + surface + ')',
                display: 'grid',
                gap: '12px',
                padding: '16px',
              }"
            >
              <span>{{ mode }} / {{ surface }}</span>
              <BasiqProgress :aria-label="mode + ' ' + surface + 'の進捗'" :value="60" />
            </section>
          </div>
        </BasiqThemeProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const mode of ["light", "dark"]) {
      for (const surface of ["base", "container", "muted"]) {
        const placement = canvas.getByTestId(`${mode}-${surface}`);
        const progress = within(placement).getByRole("progressbar");
        const { indicator, track } = getProgressParts(progress);

        await expect(progress).toBeVisible();
        await expect(track).toBeVisible();
        await expect(indicator).toBeVisible();
        await expect(getComputedStyle(track).borderColor).not.toBe(
          getComputedStyle(placement).backgroundColor,
        );
        await expect(getComputedStyle(indicator).backgroundColor).not.toBe(
          getComputedStyle(placement).backgroundColor,
        );
      }
    }
  },
};

export const RegressionMatrix: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ProgressRegressionHarness },
    template: '<div class="basiq-story"><ProgressRegressionHarness /></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const zero = getProgressParts(canvas.getByRole("progressbar", { name: "未着手" }));
    const half = getProgressParts(canvas.getByRole("progressbar", { name: "半分完了" }));
    const complete = getProgressParts(canvas.getByRole("progressbar", { name: "完了" }));
    const rtl = getProgressParts(canvas.getByRole("progressbar", { name: "右から左" }));
    const narrow = canvas.getByRole("progressbar", { name: "狭い表示" });
    const custom = getProgressParts(canvas.getByRole("progressbar", { name: "カスタムテーマ" }));
    const reactive = canvas.getByRole("progressbar", { name: "更新される進捗" });

    await expect(zero.indicator.getBoundingClientRect().width).toBe(0);
    await expect(
      Math.abs(half.indicator.getBoundingClientRect().width / half.track.clientWidth - 0.5),
    ).toBeLessThan(0.02);
    await expect(
      Math.abs(complete.indicator.getBoundingClientRect().width / complete.track.clientWidth - 1),
    ).toBeLessThan(0.02);
    await expect(
      Math.abs(
        rtl.track.getBoundingClientRect().right - rtl.indicator.getBoundingClientRect().right,
      ),
    ).toBeLessThanOrEqual(2);
    await expect(narrow.getBoundingClientRect().width).toBeLessThanOrEqual(64);
    await expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth);
    await expect(getComputedStyle(custom.indicator).backgroundColor).toBe("rgb(122, 63, 242)");
    await expect(reactive).toHaveAttribute("aria-valuenow", "20");
    await userEvent.click(canvas.getByRole("button", { name: "80%完了に更新" }));
    await expect(reactive).toHaveAttribute("aria-valuenow", "80");
    await expect(reactive).toHaveAttribute("aria-valuetext", "80%完了");
  },
};
