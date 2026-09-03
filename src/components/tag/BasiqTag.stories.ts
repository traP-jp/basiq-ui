import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { SampleTagIcon } from "../../stories/sample-icons";
import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqTag from "./BasiqTag.vue";

const meta = {
  title: "Components/Tag",
  component: BasiqTag,
  tags: ["autodocs"],
  args: {
    label: "フロントエンド",
    removable: true,
    removeLabel: "フロントエンドタグを削除",
  },
  argTypes: {
    disabled: { control: "boolean", if: { arg: "removable", truthy: true } },
    icon: { control: false },
    removeLabel: { control: "text", if: { arg: "removable", truthy: true } },
    removable: { control: "boolean" },
  },
  parameters: {
    controls: {
      disable: true,
      include: ["disabled", "label", "removable", "removeLabel"],
    },
  },
  render: (args) => ({
    components: { BasiqTag },
    setup: () => ({ args }),
    template: '<div class="basiq-story"><BasiqTag v-bind="args" /></div>',
  }),
} satisfies Meta<typeof BasiqTag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters((_source, { args }) => {
    const attributes = [`label="${escapeHtmlAttribute(String(args.label ?? ""))}"`];

    if (args.removable === true) {
      attributes.push("removable");
      attributes.push(`remove-label="${escapeHtmlAttribute(String(args.removeLabel ?? ""))}"`);

      if (args.disabled === true) attributes.push("disabled");
    }

    return `<template>\n  <BasiqTag ${attributes.join(" ")} />\n</template>`;
  }),
};

export const DisplayOnly: Story = {
  args: { removable: false, removeLabel: undefined },
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqTag label="フロントエンド" />
    </template>
  `),
};

export const DisplayOnlyInteraction: Story = {
  ...DisplayOnly,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
    await expect(canvas.getByText("フロントエンド").closest("span")).toBeInTheDocument();
  },
};

export const Removable: Story = {
  args: {
    onRemove: fn(),
    removable: true,
    removeLabel: "フロントエンドタグを削除",
  },
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    function removeTag() {
      // Remove the value from application state.
    }
    </script>

    <template>
      <BasiqTag
        label="フロントエンド"
        removable
        remove-label="フロントエンドタグを削除"
        @remove="removeTag"
      />
    </template>
  `),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const removeButton = canvas.getByRole("button", { name: "フロントエンドタグを削除" });

    await userEvent.tab();
    await expect(removeButton).toHaveFocus();
    await expect(getComputedStyle(removeButton.parentElement!).height).toBe("32px");
    await expect(getComputedStyle(removeButton).borderRadius).toBe("9999px");
    await expect(getComputedStyle(removeButton).outlineWidth).toBe("2px");
    await expect(getComputedStyle(removeButton).outlineOffset).toBe("2px");

    const tagBounds = removeButton.parentElement!.getBoundingClientRect();
    const removeBounds = removeButton.getBoundingClientRect();
    const tagEndCapCenter = tagBounds.right - tagBounds.height / 2;
    const removeCenterX = removeBounds.left + removeBounds.width / 2;

    await expect(removeCenterX).toBeCloseTo(tagEndCapCenter, 5);
    await expect(removeBounds.top + removeBounds.height / 2).toBeCloseTo(
      tagBounds.top + tagBounds.height / 2,
      5,
    );
    await userEvent.keyboard("{Enter}");
    await expect(args.onRemove).toHaveBeenCalledOnce();
    await expect(args.onRemove).toHaveBeenCalledWith(expect.any(MouseEvent));
  },
};

export const WithIcon: Story = {
  args: { icon: SampleTagIcon, removable: false, removeLabel: undefined },
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import TagIcon from "./TagIcon.vue";
    </script>

    <template>
      <BasiqTag :icon="TagIcon" label="フロントエンド" />
    </template>
  `),
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector("svg");

    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon).toHaveAttribute("focusable", "false");
    await expect(icon).not.toHaveAttribute("role");
    await expect(icon).toHaveStyle({ height: "20px", width: "20px" });
  },
};

export const WithLeading: Story = {
  args: { icon: undefined, removable: false, removeLabel: undefined },
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqTag label="フロントエンド">
        <template #leading>
          <span aria-hidden="true" class="team-mark">FE</span>
        </template>
      </BasiqTag>
    </template>
  `),
  render: (args) => ({
    components: { BasiqTag },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story">
        <BasiqTag v-bind="args">
          <template #leading>
            <span
              aria-hidden="true"
              style="display: grid; width: 20px; height: 20px; place-items: center; border-radius: 9999px; color: var(--basiq-color-content-on-accent); background: var(--basiq-color-accent-default); font-size: 0.625rem; line-height: 1"
            >FE</span>
          </template>
        </BasiqTag>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const leading = within(canvasElement).getByText("FE");

    await expect(leading).toHaveAttribute("aria-hidden", "true");
    await expect(leading.parentElement).toHaveStyle({ height: "20px", width: "20px" });
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onRemove: fn(),
    removable: true,
    removeLabel: "固定タグを削除",
  },
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqTag
        disabled
        label="固定タグ"
        removable
        remove-label="固定タグを削除"
      />
    </template>
  `),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const removeButton = canvas.getByRole("button", { name: "固定タグを削除" });

    await expect(removeButton).toBeDisabled();
    await userEvent.click(removeButton);
    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};

export const LongLabel: Story = {
  args: {
    label: "非常に長いラベルは利用側が与えた幅の中で省略されます",
    removable: true,
    removeLabel: "長いラベルのタグを削除",
  },
  parameters: createFixedVueSourceParameters(`
    <template>
      <div style="width: 14rem">
        <BasiqTag
          label="非常に長いラベルは利用側が与えた幅の中で省略されます"
          removable
          remove-label="長いラベルのタグを削除"
        />
      </div>
    </template>
  `),
  render: (args) => ({
    components: { BasiqTag },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story">
        <div style="width: 14rem"><BasiqTag v-bind="args" /></div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText(
      "非常に長いラベルは利用側が与えた幅の中で省略されます",
    );
    const tag = label.parentElement!;
    const constraint = tag.parentElement!;

    await expect(tag.getBoundingClientRect().width).toBeLessThanOrEqual(
      constraint.getBoundingClientRect().width,
    );
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    await expect(getComputedStyle(label).textOverflow).toBe("ellipsis");
  },
};

export const LightAndDark: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqThemeProvider mode="light">
        <BasiqTag label="Light" removable remove-label="Lightタグを削除" />
      </BasiqThemeProvider>
      <BasiqThemeProvider mode="dark">
        <BasiqTag label="Dark" removable remove-label="Darkタグを削除" />
      </BasiqThemeProvider>
    </template>
  `),
  render: () => ({
    components: { BasiqTag, BasiqThemeProvider },
    template: `
      <div class="basiq-theme-comparison">
        <BasiqThemeProvider mode="light">
          <div style="padding: 2rem; background: var(--basiq-color-surface-base)">
            <BasiqTag label="Light" removable remove-label="Lightタグを削除" />
          </div>
        </BasiqThemeProvider>
        <BasiqThemeProvider mode="dark">
          <div style="padding: 2rem; background: var(--basiq-color-surface-base)">
            <BasiqTag label="Dark" removable remove-label="Darkタグを削除" />
          </div>
        </BasiqThemeProvider>
      </div>
    `,
  }),
};

export const SurfacePlacement: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <div style="background: var(--basiq-color-surface-base)">
        <BasiqTag label="Base surface" removable remove-label="Baseタグを削除" />
      </div>
      <div style="background: var(--basiq-color-surface-container)">
        <BasiqTag label="Container surface" removable remove-label="Containerタグを削除" />
      </div>
      <div style="background: var(--basiq-color-surface-muted)">
        <BasiqTag label="Muted surface" removable remove-label="Mutedタグを削除" />
      </div>
    </template>
  `),
  render: () => ({
    components: { BasiqTag },
    setup: () => ({
      surfaces: [
        { label: "Base surface", token: "--basiq-color-surface-base" },
        { label: "Container surface", token: "--basiq-color-surface-container" },
        { label: "Muted surface", token: "--basiq-color-surface-muted" },
      ],
    }),
    template: `
      <div class="basiq-story basiq-selection-surfaces">
        <section
          v-for="surface in surfaces"
          :key="surface.token"
          class="basiq-selection-surface"
          :style="{ background: 'var(' + surface.token + ')' }"
        >
          <h2>{{ surface.label }}</h2>
          <BasiqTag
            :label="surface.label"
            removable
            :remove-label="surface.label + 'タグを削除'"
          />
        </section>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const surfaces = canvasElement.querySelectorAll<HTMLElement>(".basiq-selection-surface");

    await expect(surfaces).toHaveLength(3);

    for (const surface of surfaces) {
      const removeButton = within(surface).getByRole("button");
      const tag = removeButton.parentElement!;
      const surfaceStyle = getComputedStyle(surface);
      const surfaceContentWidth =
        surface.clientWidth -
        Number.parseFloat(surfaceStyle.paddingInlineStart) -
        Number.parseFloat(surfaceStyle.paddingInlineEnd);

      await expect(tag.getBoundingClientRect().width).toBeLessThan(surfaceContentWidth);
    }
  },
};

function escapeHtmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}
