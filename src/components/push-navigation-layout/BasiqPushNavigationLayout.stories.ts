import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";
import { computed, nextTick, ref } from "vue";

import { createFixedVueSourceParameters } from "../../stories/storybook-parameters";

import "../../stories/navigation-layout.stories.css";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqButton from "../button/BasiqButton.vue";
import BasiqNavigationList, {
  type BasiqNavigationItemDefinition,
} from "../navigation-list/BasiqNavigationList.vue";
import BasiqPushNavigationLayout from "./BasiqPushNavigationLayout.vue";

const items = [
  { current: true, href: "#push-overview", label: "概要" },
  { href: "#push-members", label: "メンバー" },
  { href: "#push-settings", label: "設定" },
] satisfies readonly BasiqNavigationItemDefinition[];

const manyItems = Array.from({ length: 24 }, (_, index) => ({
  current: index === 0,
  href: `#push-channel-${index + 1}`,
  label:
    index === 4
      ? "アクセシビリティとキーボード操作に関する非常に長い詳細設定"
      : `チャンネル ${index + 1}`,
})) satisfies readonly BasiqNavigationItemDefinition[];

function getPseudoClassStyle(element: HTMLElement, pseudoClass: string) {
  const rootClass = element.classList.item(0);
  if (!rootClass) return undefined;
  const selector = `.${CSS.escape(rootClass)}${pseudoClass}`;

  for (const styleSheet of document.styleSheets) {
    for (const rule of styleSheet.cssRules) {
      if (rule instanceof CSSStyleRule && rule.selectorText === selector) return rule.style;
    }
  }
  return undefined;
}

const meta = {
  title: "Layouts/PushNavigationLayout",
  component: BasiqPushNavigationLayout,
  tags: ["autodocs"],
  args: {
    closeLabel: "Close navigation",
    openLabel: "Open navigation",
  },
  parameters: {
    controls: {
      include: ["open", "defaultOpen", "openLabel", "closeLabel", "controlOffsetBlockStart"],
    },
  },
} satisfies Meta<typeof BasiqPushNavigationLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Uncontrolled: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import {
      BasiqButton,
      BasiqNavigationList,
      BasiqPushNavigationLayout,
      type BasiqNavigationItemDefinition,
    } from "basiq-ui";

    const items = [
      { current: true, href: "#push-overview", label: "概要" },
      { href: "#push-members", label: "メンバー" },
      { href: "#push-settings", label: "設定" },
    ] satisfies readonly BasiqNavigationItemDefinition[];
    </script>

    <template>
      <BasiqPushNavigationLayout
        open-label="Open navigation"
        close-label="Close navigation"
      >
        <template #navigation="{ close }">
          <div>
            <h2>Workspace</h2>
            <BasiqNavigationList aria-label="Project pages" :items="items" />
            <BasiqButton tone="neutral" variant="outline" @click="close">
              Close from slot
            </BasiqButton>
          </div>
        </template>

        <main aria-label="Project overview">
          <h2>Project overview</h2>
        </main>
      </BasiqPushNavigationLayout>
    </template>
  `),
  render: () => ({
    components: { BasiqButton, BasiqNavigationList, BasiqPushNavigationLayout },
    setup: () => ({ items }),
    template: `
      <div class="navigation-layout-story-canvas">
        <div class="navigation-layout-story-frame">
          <BasiqPushNavigationLayout
            open-label="Open navigation"
            close-label="Close navigation"
            data-testid="layout"
          >
            <template #navigation="{ close }">
              <div class="navigation-layout-story-navigation">
                <h2>Workspace</h2>
                <BasiqNavigationList aria-label="Project pages" :items="items" />
                <BasiqButton tone="neutral" variant="outline" @click="close">
                  Close from slot
                </BasiqButton>
              </div>
            </template>
            <main class="navigation-layout-story-main" aria-label="Project overview">
              <h2>Project overview</h2>
            </main>
          </BasiqPushNavigationLayout>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvas.getByTestId("layout");
    const navigation = layout.querySelector<HTMLElement>('nav[aria-label="Project pages"]');
    const opener = canvas.getByRole("button", { name: "Open navigation" });
    const main = canvas.getByRole("main");
    const frame = canvasElement.querySelector<HTMLElement>(".navigation-layout-story-frame");
    const mainContent = canvas.getByRole("main", { name: "Project overview" });
    layout.setAttribute("dir", "rtl");
    const initialMainX = main.getBoundingClientRect().x;

    await expect(navigation).not.toBeNull();
    await expect(frame).not.toBeNull();
    await expect(frame!.getBoundingClientRect().x).toBe(24);
    await expect(frame!.getBoundingClientRect().y).toBe(24);
    await expect(getComputedStyle(mainContent).paddingLeft).toBe("16px");
    await expect(main.parentElement?.getBoundingClientRect().height).toBe(
      layout.getBoundingClientRect().height,
    );
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(opener).toHaveAttribute(
      "aria-controls",
      navigation?.parentElement?.parentElement?.id,
    );
    await expect(opener.getBoundingClientRect().width).toBe(40);
    await expect(opener.getBoundingClientRect().height).toBe(40);
    await expect(opener.getBoundingClientRect().left).toBe(layout.getBoundingClientRect().left);
    await expect(opener.getBoundingClientRect().top - layout.getBoundingClientRect().top).toBe(16);
    await expect(opener.querySelector("svg")?.getBoundingClientRect().width).toBe(24);
    const radius = getComputedStyle(opener).getPropertyValue("--basiq-radius-sm").trim();
    await expect(getComputedStyle(opener).borderTopLeftRadius).toBe("0px");
    await expect(getComputedStyle(opener).borderBottomLeftRadius).toBe("0px");
    await expect(getComputedStyle(opener).borderTopRightRadius).toBe(radius);
    await expect(getComputedStyle(opener).borderBottomRightRadius).toBe(radius);
    await expect(getPseudoClassStyle(opener, ":hover")?.background).toBe(
      "var(--basiq-color-surface-muted)",
    );
    await expect(getPseudoClassStyle(opener, ":active")?.background).toBe(
      "var(--basiq-color-border-separator)",
    );
    await userEvent.tab();
    await expect(opener).toHaveFocus();
    await expect(opener.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(opener).outlineOffset).toBe("-4px");
    await expect(navigation?.closest("[inert]")).not.toBeNull();

    await userEvent.click(opener);
    const closer = canvas.getByRole("button", { name: "Close navigation" });
    await expect(closer).toBe(opener);
    await expect(closer).toHaveAttribute("aria-expanded", "true");
    await expect(getComputedStyle(closer).borderTopLeftRadius).toBe("0px");
    await expect(getComputedStyle(closer).borderTopRightRadius).toBe(radius);
    await waitFor(() => expect(main.getBoundingClientRect().x).toBeGreaterThan(initialMainX));
    await expect(getComputedStyle(layout).overflowX).toBe("hidden");

    const firstLink = canvas.getByRole("link", { name: "概要" });
    firstLink.focus();
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByRole("button", { name: "Open navigation" })).toHaveFocus();
    await expect(navigation?.closest("[inert]")).not.toBeNull();

    await userEvent.click(opener);
    await userEvent.click(canvas.getByRole("button", { name: "Close from slot" }));
    await expect(canvas.getByRole("button", { name: "Open navigation" })).toHaveFocus();
    layout.removeAttribute("dir");
  },
};

export const CustomControlOffset: Story = {
  name: "Custom control offset",
  args: { controlOffsetBlockStart: "3rem" },
  render: (args) => ({
    components: { BasiqPushNavigationLayout },
    setup: () => ({ args }),
    template: `
      <div class="navigation-layout-story-canvas">
        <div class="navigation-layout-story-frame">
          <BasiqPushNavigationLayout v-bind="args" data-testid="custom-offset-layout">
            <template #navigation>Navigation</template>
            <main class="navigation-layout-story-main">Main</main>
          </BasiqPushNavigationLayout>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvas.getByTestId("custom-offset-layout");
    const opener = canvas.getByRole("button", { name: "Open navigation" });

    await expect(opener.getBoundingClientRect().top - layout.getBoundingClientRect().top).toBe(48);
    await userEvent.click(opener);

    const closer = canvas.getByRole("button", { name: "Close navigation" });
    await expect(closer).toBe(opener);
    await expect(closer.getBoundingClientRect().top - layout.getBoundingClientRect().top).toBe(48);
    await waitFor(() => expect(layout).toHaveAttribute("data-moving", "true"));
    await waitFor(() => expect(layout).not.toHaveAttribute("data-moving"));
    await expect(closer).toHaveAttribute("data-suppress-hover", "true");

    window.dispatchEvent(new PointerEvent("pointerdown"));
    await waitFor(() => expect(closer).not.toHaveAttribute("data-suppress-hover"));
  },
};

export const Controlled: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { ref } from "vue";
    import {
      BasiqButton,
      BasiqNavigationList,
      BasiqPushNavigationLayout,
      type BasiqNavigationItemDefinition,
    } from "basiq-ui";

    const open = ref(false);
    const items = [
      { current: true, href: "#push-overview", label: "概要" },
      { href: "#push-members", label: "メンバー" },
      { href: "#push-settings", label: "設定" },
    ] satisfies readonly BasiqNavigationItemDefinition[];
    </script>

    <template>
      <BasiqPushNavigationLayout
        v-model:open="open"
        open-label="Open navigation"
        close-label="Close navigation"
      >
        <template #navigation>
          <div>
            <BasiqNavigationList aria-label="Controlled project pages" :items="items" />
          </div>
        </template>

        <main>
          <div>
            <BasiqButton tone="neutral" variant="outline" @click="open = !open">
              External toggle
            </BasiqButton>
          </div>
          <p>The parent owns the open state.</p>
        </main>
      </BasiqPushNavigationLayout>
    </template>
  `),
  render: () => ({
    components: { BasiqButton, BasiqNavigationList, BasiqPushNavigationLayout },
    setup() {
      const open = ref(false);
      return { items, open };
    },
    template: `
      <div class="navigation-layout-story-canvas">
        <div class="navigation-layout-story-frame">
          <BasiqPushNavigationLayout
            v-model:open="open"
            open-label="Open navigation"
            close-label="Close navigation"
          >
            <template #navigation>
              <div class="navigation-layout-story-navigation">
                <BasiqNavigationList aria-label="Controlled project pages" :items="items" />
              </div>
            </template>
            <main class="navigation-layout-story-main">
              <div class="navigation-layout-story-controls">
                <BasiqButton tone="neutral" variant="outline" @click="open = !open">
                  External toggle
                </BasiqButton>
              </div>
              <p>The parent owns the open state.</p>
            </main>
          </BasiqPushNavigationLayout>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "External toggle" }));
    await expect(canvas.getByRole("button", { name: "Close navigation" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Close navigation" }));
    await expect(canvas.getByRole("button", { name: "Open navigation" })).toBeVisible();

    const externalToggle = canvas.getByRole("button", { name: "External toggle" });
    await userEvent.click(externalToggle);
    canvas.getByRole("link", { name: "概要" }).focus();
    externalToggle.click();
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Open navigation" })).toHaveFocus(),
    );
  },
};

export const ModeSwitchWarning: Story = {
  name: "Development warning: state mode switch",
  tags: ["!autodocs"],
  render: (args) => ({
    components: { BasiqPushNavigationLayout },
    setup() {
      const stateProps = ref<Record<string, boolean | undefined>>({});
      const layoutProps = computed(() => ({ ...args, ...stateProps.value }));
      return { layoutProps, stateProps };
    },
    template: `
      <div>
        <button type="button" @click="stateProps = { open: undefined }">Add controlled prop</button>
        <BasiqPushNavigationLayout v-bind="layoutProps">
          <template #navigation>Navigation</template>
          Main
        </BasiqPushNavigationLayout>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const warn = spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      await userEvent.click(
        within(canvasElement).getByRole("button", { name: "Add controlled prop" }),
      );
      await waitFor(() =>
        expect(warn).toHaveBeenCalledWith(
          "[BasiQ UI] BasiqPushNavigationLayout must not switch between controlled and uncontrolled state.",
        ),
      );
    } finally {
      warn.mockRestore();
    }
  },
};

export const UnmountOnNavigation: Story = {
  name: "Focus: unmount on navigation",
  tags: ["!autodocs"],
  render: (args) => ({
    components: { BasiqButton, BasiqPushNavigationLayout },
    setup() {
      const routed = ref(false);
      const destination = ref<HTMLElement>();
      const layoutProps = { ...args, defaultOpen: true };

      function navigate(close: () => void) {
        close();
        routed.value = true;
        void nextTick(() => destination.value?.focus());
      }

      return { destination, layoutProps, navigate, routed };
    },
    template: `
      <BasiqPushNavigationLayout v-if="!routed" v-bind="layoutProps">
        <template #navigation="{ close }">
          <BasiqButton tone="neutral" variant="outline" @click="navigate(close)">
            Navigate and unmount
          </BasiqButton>
        </template>
        <main>Main content</main>
      </BasiqPushNavigationLayout>
      <main v-else>
        <h1 ref="destination" tabindex="-1">Destination</h1>
      </main>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "Navigate and unmount" }));
    await waitFor(() => expect(canvas.getByRole("heading", { name: "Destination" })).toHaveFocus());
  },
};

export const NarrowDarkOverflow: Story = {
  name: "Narrow / dark / overflow",
  args: { defaultOpen: true },
  render: (args) => ({
    components: {
      BasiqNavigationList,
      BasiqPushNavigationLayout,
      BasiqThemeProvider,
    },
    setup: () => ({ args, manyItems }),
    template: `
      <BasiqThemeProvider mode="dark" class="navigation-layout-story-grid">
        <div class="navigation-layout-story-frame navigation-layout-story-narrow-frame">
          <BasiqPushNavigationLayout
            v-bind="args"
            style="--basiq-navigation-layout-width: 14rem"
          >
            <template #navigation>
              <div class="navigation-layout-story-navigation">
                <h2>Very long workspace name that wraps</h2>
                <BasiqNavigationList aria-label="Many project pages" :items="manyItems" />
              </div>
            </template>
            <main class="navigation-layout-story-main"><h2>Narrow Main</h2></main>
          </BasiqPushNavigationLayout>
        </div>
      </BasiqThemeProvider>
    `,
  }),
};
