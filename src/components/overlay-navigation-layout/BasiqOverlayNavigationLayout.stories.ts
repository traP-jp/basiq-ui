import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { onBeforeUnmount, onMounted, ref } from "vue";

import { createFixedVueSourceParameters } from "../../stories/storybook-parameters";

import "../../stories/navigation-layout.stories.css";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqButton from "../button/BasiqButton.vue";
import BasiqNavigationItem from "../navigation-list/BasiqNavigationItem.vue";
import BasiqNavigationList, {
  type BasiqNavigationItemDefinition,
} from "../navigation-list/BasiqNavigationList.vue";
import BasiqOverlayNavigationLayout from "./BasiqOverlayNavigationLayout.vue";

const items = [
  { current: true, href: "#overlay-overview", label: "概要" },
  { href: "#overlay-members", label: "メンバー" },
  { href: "#overlay-settings", label: "設定" },
] satisfies readonly BasiqNavigationItemDefinition[];

const manyItems = Array.from({ length: 24 }, (_, index) => ({
  current: index === 0,
  href: `#overlay-channel-${index + 1}`,
  label:
    index === 4
      ? "アクセシビリティとキーボード操作に関する非常に長い詳細設定"
      : `チャンネル ${index + 1}`,
})) satisfies readonly BasiqNavigationItemDefinition[];

const longSections = Array.from(
  { length: 32 },
  (_, index) => `Section ${index + 1}: app shell内部でスクロールする本文です。`,
);
const forceOverlayStateEvent = "basiq-storybook-force-overlay-state";

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

function closeAfterNavigation(event: MouseEvent, close: () => void) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;

  const anchor = event.currentTarget as HTMLAnchorElement | null;
  if (!anchor) return;
  if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
  close();
}

const meta = {
  title: "Layouts/OverlayNavigationLayout",
  component: BasiqOverlayNavigationLayout,
  args: {
    closeLabel: "Close navigation",
    navigationLabel: "Workspace navigation",
    openLabel: "Open navigation",
  },
  parameters: {
    layout: "fullscreen",
    controls: {
      include: [
        "open",
        "defaultOpen",
        "navigationLabel",
        "openLabel",
        "closeLabel",
        "controlOffsetBlockStart",
      ],
    },
  },
} satisfies Meta<typeof BasiqOverlayNavigationLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Uncontrolled: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import {
      BasiqButton,
      BasiqNavigationList,
      BasiqOverlayNavigationLayout,
      type BasiqNavigationItemDefinition,
    } from "basiq-ui";

    const items = [
      { current: true, href: "#overlay-overview", label: "概要" },
      { href: "#overlay-members", label: "メンバー" },
      { href: "#overlay-settings", label: "設定" },
    ] satisfies readonly BasiqNavigationItemDefinition[];
    </script>

    <template>
      <BasiqOverlayNavigationLayout
        open-label="Open navigation"
        close-label="Close navigation"
        navigation-label="Workspace navigation"
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
          <BasiqButton tone="neutral" variant="outline">Main action</BasiqButton>
        </main>
      </BasiqOverlayNavigationLayout>
    </template>
  `),
  render: (args) => ({
    components: { BasiqButton, BasiqNavigationList, BasiqOverlayNavigationLayout },
    setup: () => ({ args, items }),
    template: `
      <BasiqOverlayNavigationLayout v-bind="args" data-testid="layout">
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
          <BasiqButton tone="neutral" variant="outline">Main action</BasiqButton>
        </main>
      </BasiqOverlayNavigationLayout>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvas.getByTestId("layout");
    const opener = canvas.getByRole("button", { name: "Open navigation" });
    const main = canvas.getByRole("main", { name: "Project overview" });
    layout.setAttribute("dir", "rtl");
    const initialMainX = main.getBoundingClientRect().x;

    await expect(canvas.getAllByRole("main")).toHaveLength(1);
    await expect(opener).toHaveAttribute("aria-expanded", "false");
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
    await expect(canvas.queryByRole("dialog")).toBeNull();

    await userEvent.keyboard("{Enter}");
    const dialog = canvas.getByRole("dialog", { name: "Workspace navigation" });
    const firstLink = canvas.getByRole("link", { name: "概要" });
    const closer = canvas.getByRole("button", { name: "Close navigation" });

    await expect(opener).toHaveAttribute("aria-controls", dialog.id);
    await expect(opener).toHaveAttribute("aria-expanded", "true");
    await expect(opener.parentElement).toHaveAttribute("data-control-hidden", "true");
    await expect(getComputedStyle(opener.parentElement!).opacity).toBe("0");
    await expect(firstLink).toHaveFocus();
    await expect(closer.getBoundingClientRect().width).toBe(40);
    await expect(closer.getBoundingClientRect().height).toBe(40);
    await expect(getComputedStyle(closer).borderTopLeftRadius).toBe("0px");
    await expect(getComputedStyle(closer).borderTopRightRadius).toBe(radius);
    await expect(getPseudoClassStyle(closer, ":hover")?.background).toBe(
      "var(--basiq-color-surface-muted)",
    );
    await expect(main.getBoundingClientRect().x).toBe(initialMainX);
    await expect(layout.scrollWidth).toBe(layout.clientWidth);

    const scrim = layout.querySelector<HTMLElement>("[data-basiq-navigation-scrim]");
    await expect(scrim).not.toBeNull();
    await expect(getComputedStyle(scrim!).position).toBe("fixed");
    const scrimRect = scrim!.getBoundingClientRect();
    await expect(scrimRect.left).toBe(0);
    await expect(scrimRect.top).toBe(0);
    await expect(Math.abs(scrimRect.width - document.documentElement.clientWidth)).toBeLessThan(1);
    await expect(Math.abs(scrimRect.height - document.documentElement.clientHeight)).toBeLessThan(
      1,
    );
    await waitFor(() => expect(dialog.getBoundingClientRect().left).toBe(0));
    await expect(
      document.elementFromPoint(
        layout.getBoundingClientRect().right - 1,
        layout.getBoundingClientRect().bottom - 1,
      ),
    ).toBe(scrim);

    firstLink.focus();
    await userEvent.tab({ shift: true });
    await expect(closer).toHaveFocus();
    await userEvent.tab();
    await expect(firstLink).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await expect(opener.parentElement).toHaveAttribute("data-control-hidden", "true");
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
    await expect(opener.parentElement).not.toHaveAttribute("data-control-hidden");
    await expect(opener).toHaveFocus();

    await userEvent.click(opener);
    const appChrome = document.createElement("div");
    appChrome.style.cssText =
      "position: fixed; z-index: 100; inset: 0 0 auto auto; width: 40px; height: 40px";
    layout.append(appChrome);
    await expect(document.elementFromPoint(document.documentElement.clientWidth - 1, 1)).toBe(
      layout.querySelector("[data-basiq-navigation-scrim]"),
    );
    appChrome.remove();
    await userEvent.click(layout.querySelector<HTMLElement>("[data-basiq-navigation-scrim]")!);
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
    layout.removeAttribute("dir");
  },
};

export const CustomControlOffset: Story = {
  name: "Custom control offset",
  args: { controlOffsetBlockStart: "3rem" },
  render: (args) => ({
    components: { BasiqOverlayNavigationLayout },
    setup: () => ({ args }),
    template: `
      <BasiqOverlayNavigationLayout v-bind="args" data-testid="custom-offset-layout">
        <template #navigation>Navigation</template>
        <main class="navigation-layout-story-main">Main</main>
      </BasiqOverlayNavigationLayout>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvas.getByTestId("custom-offset-layout");
    const opener = canvas.getByRole("button", { name: "Open navigation" });

    await expect(opener.getBoundingClientRect().top - layout.getBoundingClientRect().top).toBe(48);
    await userEvent.click(opener);

    const closer = canvas.getByRole("button", { name: "Close navigation" });
    await expect(closer.getBoundingClientRect().top - layout.getBoundingClientRect().top).toBe(48);
    await expect(getComputedStyle(opener.parentElement!).opacity).toBe("0");
    await expect(getComputedStyle(closer).opacity).toBe("1");
    await waitFor(() => expect(layout).toHaveAttribute("data-moving", "true"));
    await waitFor(() => expect(layout).not.toHaveAttribute("data-moving"));
    await expect(closer).toHaveAttribute("data-suppress-hover", "true");

    window.dispatchEvent(new PointerEvent("pointermove"));
    await waitFor(() => expect(closer).not.toHaveAttribute("data-suppress-hover"));
  },
};

export const Controlled: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { ref } from "vue";
    import { BasiqButton, BasiqOverlayNavigationLayout } from "basiq-ui";

    const open = ref(false);
    </script>

    <template>
      <BasiqOverlayNavigationLayout
        v-model:open="open"
        open-label="Open navigation"
        close-label="Close navigation"
        navigation-label="Workspace navigation"
      >
        <template #navigation>Navigation</template>
        <main>
          <BasiqButton tone="neutral" variant="outline" @click="open = !open">
            External toggle
          </BasiqButton>
          <p>The parent owns the open state.</p>
        </main>
      </BasiqOverlayNavigationLayout>
    </template>
  `),
  render: (args) => ({
    components: { BasiqButton, BasiqOverlayNavigationLayout },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <BasiqOverlayNavigationLayout v-bind="args" v-model:open="open">
        <template #navigation>Navigation</template>
        <main class="navigation-layout-story-main">
          <BasiqButton tone="neutral" variant="outline" @click="open = !open">
            External toggle
          </BasiqButton>
          <p>The parent owns the open state.</p>
        </main>
      </BasiqOverlayNavigationLayout>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: "External toggle" }));
    await expect(canvas.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Close navigation" }));
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "External toggle" })).toHaveFocus();
  },
};

export const RapidStateReversal: Story = {
  name: "Motion: rapid state reversal",
  tags: ["!autodocs"],
  render: (args) => ({
    components: { BasiqOverlayNavigationLayout },
    setup() {
      const open = ref(false);

      function onForceState(event: Event) {
        if (!(event instanceof CustomEvent) || typeof event.detail !== "boolean") return;
        open.value = event.detail;
      }

      onMounted(() => window.addEventListener(forceOverlayStateEvent, onForceState));
      onBeforeUnmount(() => window.removeEventListener(forceOverlayStateEvent, onForceState));

      return { args, open };
    },
    template: `
      <BasiqOverlayNavigationLayout
        v-bind="args"
        v-model:open="open"
        style="--basiq-duration-overlay: 600ms"
      >
        <template #navigation>Navigation</template>
        <main class="navigation-layout-story-main">Main</main>
      </BasiqOverlayNavigationLayout>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    window.dispatchEvent(new CustomEvent(forceOverlayStateEvent, { detail: true }));
    const dialog = await canvas.findByRole("dialog", { name: "Workspace navigation" });
    await new Promise((resolve) => window.setTimeout(resolve, 120));

    window.dispatchEvent(new CustomEvent(forceOverlayStateEvent, { detail: false }));
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    const scrim = canvasElement.querySelector<HTMLElement>("[data-basiq-navigation-scrim]");
    const leftBeforeReopen = dialog.getBoundingClientRect().left;
    const opacityBeforeReopen = Number.parseFloat(getComputedStyle(scrim!).opacity);

    window.dispatchEvent(new CustomEvent(forceOverlayStateEvent, { detail: true }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const leftAfterReopen = dialog.getBoundingClientRect().left;
    const opacityAfterReopen = Number.parseFloat(getComputedStyle(scrim!).opacity);

    await expect(Math.abs(leftAfterReopen - leftBeforeReopen)).toBeLessThan(50);
    await expect(Math.abs(opacityAfterReopen - opacityBeforeReopen)).toBeLessThan(0.2);

    window.dispatchEvent(new CustomEvent(forceOverlayStateEvent, { detail: false }));
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
  },
};

export const CloseOnNavigation: Story = {
  name: "Close after in-app navigation",
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import {
      BasiqNavigationItem,
      BasiqNavigationList,
      BasiqOverlayNavigationLayout,
    } from "basiq-ui";

    function closeAfterNavigation(event: MouseEvent, close: () => void) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const anchor = event.currentTarget as HTMLAnchorElement | null;
      if (!anchor) return;
      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      close();
    }
    </script>

    <template>
      <BasiqOverlayNavigationLayout
        default-open
        open-label="Open navigation"
        close-label="Close navigation"
        navigation-label="Workspace navigation"
      >
        <template #navigation="{ close }">
          <div>
            <BasiqNavigationList aria-label="Project pages">
              <BasiqNavigationItem current as-child>
                <a href="#overview" @click="closeAfterNavigation($event, close)">概要</a>
              </BasiqNavigationItem>
              <BasiqNavigationItem as-child>
                <a href="#settings" @click="closeAfterNavigation($event, close)">設定</a>
              </BasiqNavigationItem>
              <BasiqNavigationItem as-child>
                <a
                  href="https://example.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  @click="closeAfterNavigation($event, close)"
                >
                  外部ドキュメント
                </a>
              </BasiqNavigationItem>
              <BasiqNavigationItem as-child>
                <a href="#export" download="project.txt" @click="closeAfterNavigation($event, close)">
                  エクスポート
                </a>
              </BasiqNavigationItem>
            </BasiqNavigationList>
          </div>
        </template>
        <main><h2>Project overview</h2></main>
      </BasiqOverlayNavigationLayout>
    </template>
  `),
  args: { defaultOpen: true },
  render: (args) => ({
    components: { BasiqNavigationItem, BasiqNavigationList, BasiqOverlayNavigationLayout },
    setup: () => ({ args, closeAfterNavigation }),
    template: `
      <BasiqOverlayNavigationLayout v-bind="args">
        <template #navigation="{ close }">
          <div class="navigation-layout-story-navigation">
            <BasiqNavigationList aria-label="Project pages">
              <BasiqNavigationItem current as-child>
                <a href="#overview" @click="closeAfterNavigation($event, close)">概要</a>
              </BasiqNavigationItem>
              <BasiqNavigationItem as-child>
                <a href="#settings" @click="closeAfterNavigation($event, close)">設定</a>
              </BasiqNavigationItem>
              <BasiqNavigationItem as-child>
                <a
                  href="https://example.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  @click="closeAfterNavigation($event, close)"
                >
                  外部ドキュメント
                </a>
              </BasiqNavigationItem>
              <BasiqNavigationItem as-child>
                <a href="#export" download="project.txt" @click="closeAfterNavigation($event, close)">
                  エクスポート
                </a>
              </BasiqNavigationItem>
            </BasiqNavigationList>
          </div>
        </template>
        <main class="navigation-layout-story-main"><h2>Project overview</h2></main>
      </BasiqOverlayNavigationLayout>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "設定" });
    const newTabLink = canvas.getByRole("link", { name: "外部ドキュメント" });
    const downloadLink = canvas.getByRole("link", { name: "エクスポート" });

    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    link.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true, view: window }),
    );
    await expect(canvas.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();

    newTabLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(newTabLink);
    await expect(canvas.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();

    downloadLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(downloadLink);
    await expect(canvas.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();

    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    await userEvent.click(link);
    await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
  },
};

export const LongMainContent: Story = {
  name: "Long main content / internal scroll",
  render: (args) => ({
    components: { BasiqOverlayNavigationLayout },
    setup: () => ({ args, longSections }),
    template: `
      <BasiqOverlayNavigationLayout v-bind="args" data-testid="long-content-layout">
        <template #navigation>Navigation</template>
        <main class="navigation-layout-story-main" aria-label="Long content">
          <h2>Long content</h2>
          <p v-for="section in longSections" :key="section">{{ section }}</p>
          <button type="button">End of content</button>
        </main>
      </BasiqOverlayNavigationLayout>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvas.getByTestId("long-content-layout");
    const main = canvas.getByRole("main", { name: "Long content" });
    const scrollContainer = main.parentElement;

    await expect(scrollContainer).not.toBeNull();
    await expect(scrollContainer!.scrollHeight).toBeGreaterThan(scrollContainer!.clientHeight);
    await expect(getComputedStyle(scrollContainer!).overflowY).toBe("auto");
    await expect(layout.scrollHeight).toBe(layout.clientHeight);

    scrollContainer!.scrollTop = scrollContainer!.scrollHeight;
    await waitFor(() => expect(scrollContainer!.scrollTop).toBeGreaterThan(0));
    const endButton = canvas.getByRole("button", { name: "End of content" });
    await expect(endButton).toBeVisible();
    await expect(endButton.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      scrollContainer!.getBoundingClientRect().bottom,
    );
  },
};

export const Dark: Story = {
  args: { defaultOpen: true },
  render: (args) => ({
    components: { BasiqNavigationList, BasiqOverlayNavigationLayout, BasiqThemeProvider },
    setup: () => ({ args, items }),
    template: `
      <BasiqThemeProvider mode="dark">
        <BasiqOverlayNavigationLayout v-bind="args">
          <template #navigation>
            <div class="navigation-layout-story-navigation">
              <h2>Dark workspace</h2>
              <BasiqNavigationList aria-label="Dark project pages" :items="items" />
            </div>
          </template>
          <main class="navigation-layout-story-main"><h2>Dark Main</h2></main>
        </BasiqOverlayNavigationLayout>
      </BasiqThemeProvider>
    `,
  }),
};

export const CustomThemeInheritance: Story = {
  name: "Nested custom theme inheritance",
  args: { defaultOpen: true },
  render: (args) => ({
    components: { BasiqNavigationList, BasiqOverlayNavigationLayout, BasiqThemeProvider },
    setup: () => ({ args, items }),
    template: `
      <BasiqThemeProvider
        mode="dark"
        :overrides="{
          color: {
            overlayScrim: 'rgb(1 2 3 / 75%)',
            surfaceContainer: 'rgb(12 34 56)',
          },
        }"
      >
        <BasiqOverlayNavigationLayout v-bind="args">
          <template #navigation>
            <div class="navigation-layout-story-navigation">
              <h2>Custom nested theme</h2>
              <BasiqNavigationList aria-label="Custom themed project pages" :items="items" />
            </div>
          </template>
          <main class="navigation-layout-story-main"><h2>Main</h2></main>
        </BasiqOverlayNavigationLayout>
      </BasiqThemeProvider>
    `,
  }),
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement).getByRole("dialog", { name: "Workspace navigation" });
    const scrim = canvasElement.querySelector<HTMLElement>("[data-basiq-navigation-scrim]");

    await expect(getComputedStyle(dialog).backgroundColor).toBe("rgb(12, 34, 56)");
    await expect(scrim).not.toBeNull();
    await expect(getComputedStyle(scrim!).backgroundColor).toBe("rgba(1, 2, 3, 0.75)");
    await expect(canvasElement.contains(dialog)).toBe(true);
  },
};

export const NarrowOverflow: Story = {
  name: "Narrow / overflow",
  args: { defaultOpen: true },
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: (args) => ({
    components: { BasiqNavigationList, BasiqOverlayNavigationLayout },
    setup: () => ({ args, manyItems }),
    template: `
      <BasiqOverlayNavigationLayout
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
      </BasiqOverlayNavigationLayout>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole("navigation", { name: "Many project pages" });
    const navigationBody = navigation.parentElement?.parentElement;

    await expect(navigationBody).not.toBeNull();
    await expect(navigationBody!.scrollHeight).toBeGreaterThan(navigationBody!.clientHeight);
    await expect(getComputedStyle(navigationBody!).overflowY).toBe("auto");
  },
};
