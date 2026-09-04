import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqContainer from "../container/BasiqContainer.vue";
import BasiqSidebarLayout from "./BasiqSidebarLayout.vue";

describe("layout SSR", () => {
  it("renders container content and forwards root attributes", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqContainer,
          {
            "aria-label": "Document content",
            class: "consumer-container",
            style: { "--basiq-layout-container-max-width": "64rem" },
          },
          () => "Container content",
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("consumer-container");
    expect(html).toContain('aria-label="Document content"');
    expect(html).toContain("--basiq-layout-container-max-width:64rem");
    expect(html).toContain("Container content");
  });

  it("leaves sidebar and main semantics to slot content", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqSidebarLayout,
          { class: "consumer-layout", "data-layout": "workspace" },
          {
            default: () => h("main", "Main content"),
            sidebar: () => h("nav", { "aria-label": "Project" }, "Sidebar content"),
          },
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("consumer-layout");
    expect(html).toContain('data-layout="workspace"');
    expect(html).toContain('<nav aria-label="Project">Sidebar content</nav>');
    expect(html).toContain("<main>Main content</main>");
    expect(html).not.toContain("<aside");
  });
});
