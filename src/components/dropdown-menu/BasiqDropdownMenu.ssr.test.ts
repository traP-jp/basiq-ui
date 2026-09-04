import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqDropdownMenuContent from "./BasiqDropdownMenuContent.vue";
import BasiqDropdownMenuItem from "./BasiqDropdownMenuItem.vue";
import BasiqDropdownMenuRoot from "./BasiqDropdownMenuRoot.vue";
import BasiqDropdownMenuTrigger from "./BasiqDropdownMenuTrigger.vue";

describe("BasiqDropdownMenu SSR", () => {
  it("renders the trigger without accessing the document", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqDropdownMenuRoot,
          { defaultOpen: true },
          {
            default: () => [
              h(BasiqDropdownMenuTrigger, null, {
                default: () => h("button", null, "操作を開く"),
              }),
              h(BasiqDropdownMenuContent, null, {
                default: () => h(BasiqDropdownMenuItem, null, { default: () => "編集" }),
              }),
            ],
          },
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("操作を開く");
    expect(html).not.toContain("編集");
  });

  it("keeps the provider theme available to the client-side portal bridge", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqThemeProvider,
          {
            mode: "dark",
            overrides: { color: { surfaceBase: "rgb(20 30 40)" } },
          },
          () =>
            h(BasiqDropdownMenuRoot, null, {
              default: () => [
                h(BasiqDropdownMenuTrigger, null, {
                  default: () => h("button", null, "開く"),
                }),
                h(BasiqDropdownMenuContent, null, { default: () => "テーマ付きメニュー" }),
              ],
            }),
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('data-basiq-theme="dark"');
    expect(html).toContain("--basiq-color-surface-base:rgb(20 30 40)");
    expect(html).not.toContain("テーマ付きメニュー");
  });
});
