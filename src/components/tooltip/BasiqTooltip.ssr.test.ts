import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqTooltipContent from "./BasiqTooltipContent.vue";
import BasiqTooltipProvider from "./BasiqTooltipProvider.vue";
import BasiqTooltipRoot from "./BasiqTooltipRoot.vue";
import BasiqTooltipTrigger from "./BasiqTooltipTrigger.vue";

describe("BasiqTooltip SSR", () => {
  it("renders the trigger without accessing the document", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqTooltipProvider, null, {
          default: () =>
            h(
              BasiqTooltipRoot,
              { defaultOpen: true },
              {
                default: () => [
                  h(BasiqTooltipTrigger, null, {
                    default: () => h("button", null, "説明を表示"),
                  }),
                  h(BasiqTooltipContent, null, { default: () => "補足説明" }),
                ],
              },
            ),
        }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("説明を表示");
    expect(html).not.toContain("補足説明");
  });

  it("keeps the provider theme available to the client-side portal bridge", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqThemeProvider,
          {
            mode: "dark",
            overrides: { color: { contentDefault: "rgb(240 245 250)" } },
          },
          () =>
            h(BasiqTooltipProvider, null, {
              default: () =>
                h(BasiqTooltipRoot, null, {
                  default: () => [
                    h(BasiqTooltipTrigger, null, {
                      default: () => h("button", null, "テーマ付き"),
                    }),
                    h(BasiqTooltipContent, null, { default: () => "テーマ付きTooltip" }),
                  ],
                }),
            }),
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('data-basiq-theme="dark"');
    expect(html).toContain("--basiq-color-content-default:rgb(240 245 250)");
    expect(html).not.toContain("テーマ付きTooltip");
  });

  it("reports a clear error when the provider is missing", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqTooltipRoot, null, {
          default: () => h(BasiqTooltipTrigger, null, { default: () => h("button", null, "説明") }),
        }),
    });

    await expect(renderToString(createSSRApp(Root))).rejects.toThrow(
      "BasiqTooltipRoot must be used inside BasiqTooltipProvider",
    );
  });
});
