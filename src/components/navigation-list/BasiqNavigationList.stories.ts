import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, h } from "vue";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqNavigationItem from "./BasiqNavigationItem.vue";
import BasiqNavigationList, { type BasiqNavigationItemDefinition } from "./BasiqNavigationList.vue";

const projectItems = [
  { current: true, href: "/overview", label: "概要" },
  { href: "/members", label: "メンバー" },
  { href: "/settings", label: "設定" },
] satisfies readonly BasiqNavigationItemDefinition[];

const manyItems = Array.from({ length: 18 }, (_, index) => ({
  current: index === 0,
  href: `/channels/${index + 1}`,
  label: `チャンネル ${index + 1}`,
})) satisfies readonly BasiqNavigationItemDefinition[];

const LocalRouterLink = defineComponent({
  name: "LocalRouterLink",
  inheritAttrs: false,
  props: {
    to: { type: String, required: true },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h("a", { ...attrs, "data-local-router-link": "", href: props.to }, slots.default?.());
  },
});

const meta = {
  title: "Components/NavigationList",
  component: BasiqNavigationList,
  subcomponents: { BasiqNavigationItem },
  tags: ["autodocs"],
  args: {
    ariaLabel: "Project pages",
    items: projectItems,
  },
  parameters: {
    controls: {
      disable: true,
      include: ["ariaLabel", "ariaLabelledby", "items"],
    },
  },
  render: (args) => ({
    components: { BasiqNavigationList },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="width: min(100%, 22rem); background: var(--basiq-color-surface-container)">
        <BasiqNavigationList v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqNavigationList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(),
};

export const NativeItems: Story = {
  name: "Native items",
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqNavigationList, type BasiqNavigationItemDefinition } from "basiq-ui";

    const items = [
      { current: true, href: "/overview", label: "概要" },
      { href: "/members", label: "メンバー" },
      { href: "/settings", label: "設定" },
    ] satisfies readonly BasiqNavigationItemDefinition[];
    </script>

    <template>
      <BasiqNavigationList aria-label="Project pages" :items="items" />
    </template>
  `),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole("link", { name: "概要" });
    const members = canvas.getByRole("link", { name: "メンバー" });

    await expect(canvas.getByRole("navigation", { name: "Project pages" })).toBeVisible();
    await expect(overview).toHaveAttribute("href", "/overview");
    await expect(overview).toHaveAttribute("aria-current", "page");
    await expect(members).not.toHaveAttribute("aria-current");

    overview.focus();
    await userEvent.tab();
    await expect(members).toHaveFocus();
    members.blur();
  },
};

export const CompoundCustomLink: Story = {
  name: "Compound / custom link",
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqNavigationItem, BasiqNavigationList } from "basiq-ui";
    import LocalRouterLink from "./LocalRouterLink.vue";
    </script>

    <template>
      <BasiqNavigationList aria-label="Project pages">
        <BasiqNavigationItem current as-child>
          <LocalRouterLink to="/overview">概要</LocalRouterLink>
        </BasiqNavigationItem>
        <BasiqNavigationItem as-child>
          <LocalRouterLink to="/settings">設定</LocalRouterLink>
        </BasiqNavigationItem>
      </BasiqNavigationList>
    </template>
  `),
  render: () => ({
    components: { BasiqNavigationItem, BasiqNavigationList, LocalRouterLink },
    template: `
      <div class="basiq-story" style="width: min(100%, 22rem); background: var(--basiq-color-surface-container)">
        <BasiqNavigationList aria-label="Project pages">
          <BasiqNavigationItem current as-child>
            <LocalRouterLink to="/overview">概要</LocalRouterLink>
          </BasiqNavigationItem>
          <BasiqNavigationItem as-child>
            <LocalRouterLink to="/settings">設定</LocalRouterLink>
          </BasiqNavigationItem>
        </BasiqNavigationList>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole("link", { name: "概要" });

    await expect(overview).toHaveAttribute("data-local-router-link");
    await expect(overview).toHaveAttribute("href", "/overview");
    await expect(overview).toHaveAttribute("aria-current", "page");
    await expect(canvasElement.querySelectorAll("a a")).toHaveLength(0);
  },
};

export const LightAndDark: Story = {
  name: "Light / Dark",
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import {
      BasiqNavigationList,
      BasiqThemeProvider,
      type BasiqNavigationItemDefinition,
    } from "basiq-ui";

    const items = [
      { current: true, href: "/overview", label: "概要" },
      { href: "/members", label: "メンバー" },
    ] satisfies readonly BasiqNavigationItemDefinition[];
    </script>

    <template>
      <BasiqThemeProvider mode="light">
        <BasiqNavigationList aria-label="Light project pages" :items="items" />
      </BasiqThemeProvider>
      <BasiqThemeProvider mode="dark">
        <BasiqNavigationList aria-label="Dark project pages" :items="items" />
      </BasiqThemeProvider>
    </template>
  `),
  render: () => ({
    components: { BasiqNavigationList, BasiqThemeProvider },
    setup: () => ({ items: projectItems }),
    template: `
      <div class="basiq-story basiq-theme-comparison">
        <BasiqThemeProvider mode="light" style="padding: 24px; background: var(--basiq-color-surface-container)">
          <BasiqNavigationList aria-label="Light project pages" :items="items" />
        </BasiqThemeProvider>
        <BasiqThemeProvider mode="dark" style="padding: 24px; background: var(--basiq-color-surface-container)">
          <BasiqNavigationList aria-label="Dark project pages" :items="items" />
        </BasiqThemeProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("navigation", { name: "Light project pages" })).toBeVisible();
    await expect(canvas.getByRole("navigation", { name: "Dark project pages" })).toBeVisible();
  },
};

export const LongLabel: Story = {
  name: "Long label",
  args: {
    items: [
      {
        current: true,
        href: "/accessibility",
        label: "アクセシビリティとキーボード操作に関する詳細設定",
      },
      { href: "/notifications", label: "通知" },
    ],
  },
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqNavigationList, type BasiqNavigationItemDefinition } from "basiq-ui";

    const items = [
      {
        current: true,
        href: "/accessibility",
        label: "アクセシビリティとキーボード操作に関する詳細設定",
      },
      { href: "/notifications", label: "通知" },
    ] satisfies readonly BasiqNavigationItemDefinition[];
    </script>

    <template>
      <BasiqNavigationList aria-label="Settings pages" :items="items" />
    </template>
  `),
  render: (args) => ({
    components: { BasiqNavigationList },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="width: 14rem; background: var(--basiq-color-surface-container)">
        <BasiqNavigationList v-bind="args" aria-label="Settings pages" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", {
      name: "アクセシビリティとキーボード操作に関する詳細設定",
    });

    await expect(link.clientHeight).toBeGreaterThan(40);
    await expect(link.scrollWidth).toBeLessThanOrEqual(link.clientWidth);
  },
};

export const ManyItems: Story = {
  name: "Many items / overflow",
  args: { items: manyItems },
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { BasiqNavigationList, type BasiqNavigationItemDefinition } from "basiq-ui";

    const items = Array.from({ length: 18 }, (_, index) => ({
      current: index === 0,
      href: \`/channels/\${index + 1}\`,
      label: \`チャンネル \${index + 1}\`,
    })) satisfies readonly BasiqNavigationItemDefinition[];
    </script>

    <template>
      <aside style="max-height: 18rem; overflow: auto">
        <BasiqNavigationList aria-label="Channels" :items="items" />
      </aside>
    </template>
  `),
  render: (args) => ({
    components: { BasiqNavigationList },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="width: min(100%, 22rem)">
        <aside data-testid="scroll-region" style="max-height: 18rem; padding: 16px; overflow: auto; background: var(--basiq-color-surface-container)">
          <BasiqNavigationList v-bind="args" aria-label="Channels" />
        </aside>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByTestId("scroll-region");
    const lastLink = canvas.getByRole("link", { name: "チャンネル 18" });

    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
    lastLink.scrollIntoView({ block: "nearest" });
    await expect(lastLink).toBeVisible();
  },
};
