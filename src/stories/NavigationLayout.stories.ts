import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { onBeforeUnmount, onMounted, ref } from "vue";

import BasiqContainer from "../components/container/BasiqContainer.vue";
import BasiqNavigationList, {
  type BasiqNavigationItemDefinition,
} from "../components/navigation-list/BasiqNavigationList.vue";
import BasiqPushNavigationLayout from "../components/push-navigation-layout/BasiqPushNavigationLayout.vue";
import BasiqSidebarLayout from "../components/sidebar-layout/BasiqSidebarLayout.vue";
import { createFixedVueSourceParameters } from "./storybook-parameters";

const desktopMediaQuery = "(min-width: 48rem)";
const forceLayoutEvent = "basiq-storybook-force-responsive-layout";
const items = [
  { current: true, href: "#responsive-overview", label: "概要" },
  { href: "#responsive-members", label: "メンバー" },
  { href: "#responsive-settings", label: "設定" },
] satisfies readonly BasiqNavigationItemDefinition[];

const meta = {
  title: "Examples/Responsive navigation",
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Responsive: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { onBeforeUnmount, onMounted, ref } from "vue";
    import {
      BasiqContainer,
      BasiqNavigationList,
      BasiqPushNavigationLayout,
      BasiqSidebarLayout,
      type BasiqNavigationItemDefinition,
    } from "basiq-ui";

    const desktopMediaQuery = "(min-width: 48rem)";
    const isDesktop = ref(false);
    const mobileNavigationOpen = ref(false);
    const items = [
      { current: true, href: "#responsive-overview", label: "概要" },
      { href: "#responsive-members", label: "メンバー" },
      { href: "#responsive-settings", label: "設定" },
    ] satisfies readonly BasiqNavigationItemDefinition[];

    let mediaQuery: MediaQueryList | undefined;

    function syncLayout(matches: boolean) {
      if (matches) mobileNavigationOpen.value = false;
      isDesktop.value = matches;
    }

    function onMediaQueryChange(event: MediaQueryListEvent) {
      syncLayout(event.matches);
    }

    function closeAfterNavigation(event: MouseEvent, close: () => void) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download"))
        return;
      close();
    }

    onMounted(() => {
      mediaQuery = window.matchMedia(desktopMediaQuery);
      syncLayout(mediaQuery.matches);
      mediaQuery.addEventListener("change", onMediaQueryChange);
    });

    onBeforeUnmount(() => mediaQuery?.removeEventListener("change", onMediaQueryChange));
    </script>

    <template>
      <BasiqSidebarLayout v-if="isDesktop" style="min-height: 100dvh">
        <template #sidebar>
          <aside
            aria-label="Workspace"
            style="box-sizing: border-box; height: 100%; padding: 24px"
          >
            <strong>BasiQ Workspace</strong>
            <BasiqNavigationList
              aria-label="Project pages"
              :items="items"
              style="margin-top: 20px"
            />
          </aside>
        </template>

        <main style="padding-block: 48px">
          <BasiqContainer>
            <h1>概要</h1>
          </BasiqContainer>
        </main>
      </BasiqSidebarLayout>

      <BasiqPushNavigationLayout
        v-else
        v-model:open="mobileNavigationOpen"
        open-label="Open navigation"
        close-label="Close navigation"
        style="min-height: 100dvh"
      >
        <template #navigation="{ close }">
          <div style="padding: 16px" @click="closeAfterNavigation($event, close)">
            <strong>BasiQ Workspace</strong>
            <BasiqNavigationList
              aria-label="Project pages"
              :items="items"
              style="margin-top: 20px"
            />
          </div>
        </template>

        <main style="padding-block: 32px">
          <BasiqContainer>
            <h1>概要</h1>
          </BasiqContainer>
        </main>
      </BasiqPushNavigationLayout>
    </template>
  `),
  render: () => ({
    components: {
      BasiqContainer,
      BasiqNavigationList,
      BasiqPushNavigationLayout,
      BasiqSidebarLayout,
    },
    setup() {
      const isDesktop = ref(false);
      const mobileNavigationOpen = ref(false);
      let mediaQuery: MediaQueryList | undefined;

      function syncLayout(matches: boolean) {
        if (matches) mobileNavigationOpen.value = false;
        isDesktop.value = matches;
      }

      function onMediaQueryChange(event: MediaQueryListEvent) {
        syncLayout(event.matches);
      }

      function onForceLayout(event: Event) {
        if (!(event instanceof CustomEvent) || typeof event.detail !== "boolean") return;
        syncLayout(event.detail);
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

        const target = event.target;
        if (!(target instanceof Element)) return;
        const anchor = target.closest<HTMLAnchorElement>("a[href]");
        if (
          !anchor ||
          (anchor.target && anchor.target !== "_self") ||
          anchor.hasAttribute("download")
        )
          return;
        close();
      }

      onMounted(() => {
        mediaQuery = window.matchMedia(desktopMediaQuery);
        syncLayout(mediaQuery.matches);
        mediaQuery.addEventListener("change", onMediaQueryChange);
        window.addEventListener(forceLayoutEvent, onForceLayout);
      });

      onBeforeUnmount(() => {
        mediaQuery?.removeEventListener("change", onMediaQueryChange);
        window.removeEventListener(forceLayoutEvent, onForceLayout);
      });

      return { closeAfterNavigation, isDesktop, items, mobileNavigationOpen };
    },
    template: `
      <BasiqSidebarLayout
        v-if="isDesktop"
        data-layout-mode="desktop"
        style="min-height: 100dvh"
      >
        <template #sidebar>
          <aside
            aria-label="Workspace"
            style="box-sizing: border-box; height: 100%; padding: 24px"
          >
            <strong>BasiQ Workspace</strong>
            <BasiqNavigationList
              aria-label="Project pages"
              :items="items"
              style="margin-top: 20px"
            />
          </aside>
        </template>

        <main style="padding-block: 48px">
          <BasiqContainer>
            <h1 style="margin: 0">概要</h1>
          </BasiqContainer>
        </main>
      </BasiqSidebarLayout>

      <BasiqPushNavigationLayout
        v-else
        v-model:open="mobileNavigationOpen"
        data-layout-mode="mobile"
        open-label="Open navigation"
        close-label="Close navigation"
        style="min-height: 100dvh"
      >
        <template #navigation="{ close }">
          <div style="padding: 16px" @click="closeAfterNavigation($event, close)">
            <strong>BasiQ Workspace</strong>
            <BasiqNavigationList
              aria-label="Project pages"
              :items="items"
              style="margin-top: 20px"
            />
          </div>
        </template>

        <main style="padding-block: 32px">
          <BasiqContainer>
            <h1 style="margin: 0">概要</h1>
          </BasiqContainer>
        </main>
      </BasiqPushNavigationLayout>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    window.dispatchEvent(new CustomEvent(forceLayoutEvent, { detail: false }));
    const opener = await canvas.findByRole("button", { name: "Open navigation" });
    const mobileLayout = canvasElement.querySelector<HTMLElement>('[data-layout-mode="mobile"]');
    await expect(canvas.queryByRole("complementary", { name: "Workspace" })).toBeNull();
    await expect(mobileLayout).not.toBeNull();
    await expect(mobileLayout!.getBoundingClientRect().height).toBe(window.innerHeight);

    await userEvent.click(opener);
    const mobileNavigation = canvas.getByRole("navigation", { name: "Project pages" });
    await expect(mobileNavigation).toBeVisible();
    await expect(mobileLayout!.firstElementChild?.getBoundingClientRect().height).toBe(
      mobileLayout!.getBoundingClientRect().height,
    );
    await expect(canvas.getByRole("button", { name: "Close navigation" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(document.body.style.pointerEvents).toBe("");

    window.dispatchEvent(new CustomEvent(forceLayoutEvent, { detail: true }));
    await waitFor(() =>
      expect(canvas.getByRole("complementary", { name: "Workspace" })).toBeVisible(),
    );
    const desktopLayout = canvasElement.querySelector<HTMLElement>('[data-layout-mode="desktop"]');
    const desktopSidebar = canvas.getByRole("complementary", { name: "Workspace" });
    await expect(desktopLayout).not.toBeNull();
    await expect(desktopSidebar.getBoundingClientRect().height).toBe(
      desktopLayout!.getBoundingClientRect().height,
    );
    await expect(canvas.queryByRole("button", { name: "Open navigation" })).toBeNull();
    await waitFor(() => expect(document.body.style.pointerEvents).toBe(""));

    window.dispatchEvent(new CustomEvent(forceLayoutEvent, { detail: false }));
    const reopenedMobileTrigger = await canvas.findByRole("button", { name: "Open navigation" });
    await expect(reopenedMobileTrigger).toHaveAttribute("aria-expanded", "false");

    await expect(canvas.getAllByRole("main")).toHaveLength(1);
    await expect(canvas.queryAllByRole("navigation", { name: "Project pages" })).toHaveLength(0);

    window.dispatchEvent(
      new CustomEvent(forceLayoutEvent, {
        detail: window.matchMedia(desktopMediaQuery).matches,
      }),
    );
  },
};
