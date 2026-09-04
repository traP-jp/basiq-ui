import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqPopoverContent from "./BasiqPopoverContent.vue";
import BasiqPopoverRoot from "./BasiqPopoverRoot.vue";
import BasiqPopoverTrigger from "./BasiqPopoverTrigger.vue";

describe("BasiqPopover SSR", () => {
  it("renders the trigger without accessing the document", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqPopoverRoot,
          { defaultOpen: true },
          {
            default: () => [
              h(BasiqPopoverTrigger, null, { default: () => h("button", null, "設定を開く") }),
              h(BasiqPopoverContent, null, { default: () => "Popover本文" }),
            ],
          },
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("設定を開く");
    expect(html).not.toContain("Popover本文");
  });

  it("keeps the provider theme available to the client-side portal bridge", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqThemeProvider,
          {
            mode: "dark",
            overrides: { color: { surfaceContainer: "rgb(20 30 40)" } },
          },
          () =>
            h(BasiqPopoverRoot, null, {
              default: () => [
                h(BasiqPopoverTrigger, null, { default: () => h("button", null, "開く") }),
                h(BasiqPopoverContent, null, { default: () => "テーマ付きcontent" }),
              ],
            }),
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('data-basiq-theme="dark"');
    expect(html).toContain("--basiq-color-surface-container:rgb(20 30 40)");
    expect(html).not.toContain("テーマ付きcontent");
  });
});
