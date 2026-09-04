import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqPushNavigationLayout from "./BasiqPushNavigationLayout.vue";

function createLayout(props: Record<string, unknown> = {}) {
  return defineComponent({
    setup: () => () =>
      h(
        BasiqPushNavigationLayout,
        {
          closeLabel: "Close navigation",
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

describe("BasiqPushNavigationLayout SSR", () => {
  it("keeps closed navigation mounted, inert, and linked to its control", async () => {
    const html = await renderToString(createSSRApp(createLayout({ class: "consumer-layout" })));
    const id = html.match(/<div id="([^"]+)" aria-hidden="true"/)?.[1];

    expect(id).toBeTruthy();
    expect(html).toContain("consumer-layout");
    expect(html).toContain("Navigation content");
    expect(html).toContain(" inert");
    expect(html).toContain(`aria-controls="${id}"`);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Open navigation"');
    expect(html.match(/<main/g)).toHaveLength(1);
  });

  it("uses defaultOpen only for uncontrolled initial state", async () => {
    const uncontrolled = await renderToString(createSSRApp(createLayout({ defaultOpen: true })));
    const controlled = await renderToString(
      createSSRApp(createLayout({ defaultOpen: true, open: false })),
    );

    expect(uncontrolled).toContain('data-open="true"');
    expect(uncontrolled).toContain('aria-label="Close navigation"');
    expect(controlled).toContain('data-open="false"');
    expect(controlled).toContain('aria-label="Open navigation"');
  });

  it("protects internal state attributes from consumer fallthrough attributes", async () => {
    const html = await renderToString(
      createSSRApp(
        createLayout({
          defaultOpen: true,
          "data-moving": "consumer",
          "data-open": "consumer",
        }),
      ),
    );

    expect(html).toContain('data-open="true"');
    expect(html).not.toContain('data-open="consumer"');
    expect(html).not.toContain('data-moving="consumer"');
    expect(html).toContain('aria-expanded="true"');
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
          BasiqPushNavigationLayout,
          { closeLabel: "Close navigation", openLabel: "Open navigation" },
          { default: () => h("div", "Plain content"), navigation: () => h("div", "Menu") },
        ),
    });
    const html = await renderToString(createSSRApp(Component));

    expect(html).not.toMatch(/<(main|aside|nav)(?:\s|>)/);
  });
});
