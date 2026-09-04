import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqOverlayNavigationLayout from "./BasiqOverlayNavigationLayout.vue";

function createLayout(props: Record<string, unknown> = {}) {
  return defineComponent({
    setup: () => () =>
      h(
        BasiqOverlayNavigationLayout,
        {
          closeLabel: "Close navigation",
          navigationLabel: "Workspace navigation",
          openLabel: "Open navigation",
          ...props,
        },
        {
          default: () => h("main", "Main content"),
          navigation: ({ open }: { open: boolean }) =>
            h("nav", { "aria-label": "Project", "data-open": open }, "Navigation content"),
        },
      ),
  });
}

describe("BasiqOverlayNavigationLayout SSR", () => {
  it("omits the closed modal content and renders the linked trigger", async () => {
    const html = await renderToString(createSSRApp(createLayout({ class: "consumer-layout" })));

    expect(html).toContain("consumer-layout");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Open navigation"');
    expect(html).toContain("Main content");
    expect(html).not.toContain("Navigation content");
    expect(html.match(/<main/g)).toHaveLength(1);
  });

  it("renders an initially open named dialog without a portal", async () => {
    const html = await renderToString(createSSRApp(createLayout({ defaultOpen: true })));
    const contentId = html.match(/aria-controls="([^"]+)"/)?.[1];

    expect(contentId).toBeTruthy();
    expect(html).toContain(`id="${contentId}"`);
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Navigation content");
    expect(html).toContain("Workspace navigation");
    expect(html.match(/<main/g)).toHaveLength(1);
  });

  it("serializes a custom logical control offset on the layout root", async () => {
    const html = await renderToString(
      createSSRApp(createLayout({ controlOffsetBlockStart: "calc(2rem + 4px)" })),
    );

    expect(html).toContain("--basiq-navigation-layout-control-offset-block-start:calc(2rem + 4px)");
  });

  it("does not create landmarks when consumers provide plain content", async () => {
    const Component = defineComponent({
      setup: () => () =>
        h(
          BasiqOverlayNavigationLayout,
          {
            closeLabel: "Close navigation",
            navigationLabel: "Workspace navigation",
            openLabel: "Open navigation",
          },
          { default: () => h("div", "Plain content"), navigation: () => h("div", "Menu") },
        ),
    });
    const html = await renderToString(createSSRApp(Component));

    expect(html).not.toMatch(/<(main|aside|nav)(?:\s|>)/);
  });
});
