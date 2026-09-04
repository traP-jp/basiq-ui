import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqDialog from "./BasiqDialog.vue";

describe("BasiqDialog SSR", () => {
  it("renders the trigger without accessing the document", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqDialog,
          { defaultOpen: true, title: "設定" },
          {
            default: () => "ダイアログ本文",
            trigger: () => h("button", null, "設定を開く"),
          },
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("設定を開く");
    expect(html).not.toContain("ダイアログ本文");
  });

  it("keeps the provider theme available to the client-side portal bridge", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqThemeProvider,
          {
            mode: "dark",
            overrides: { color: { overlayScrim: "rgb(0 0 0 / 80%)" } },
          },
          () => h(BasiqDialog, { title: "テーマ" }, { trigger: () => h("button", null, "開く") }),
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('data-basiq-theme="dark"');
    expect(html).toContain("--basiq-color-overlay-scrim:rgb(0 0 0 / 80%)");
  });
});
