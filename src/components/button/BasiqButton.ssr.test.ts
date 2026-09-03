import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqButton, { type BasiqButtonProps } from "./BasiqButton.vue";

const SampleIcon = defineComponent({
  setup: () => () => h("svg", { "data-icon": "", viewBox: "0 0 24 24" }),
});

async function renderButton(props: BasiqButtonProps & Record<string, unknown>, label?: string) {
  return renderToString(
    createSSRApp({
      render: () => h(BasiqButton, props, label ? { default: () => label } : undefined),
    }),
  );
}

describe("BasiqButton icons SSR", () => {
  it("renders a decorative leading icon before visible text", async () => {
    const html = await renderButton({ icon: SampleIcon }, "作成");

    expect(html.indexOf("data-icon")).toBeLessThan(html.indexOf("作成"));
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
  });

  it("renders a trailing icon after visible text", async () => {
    const html = await renderButton({ icon: SampleIcon, iconPlacement: "trailing" }, "次へ");

    expect(html.indexOf("data-icon")).toBeGreaterThan(html.indexOf("次へ"));
  });

  it("keeps the accessible name on an icon-only native button", async () => {
    const html = await renderButton(
      { "aria-label": "閉じる", icon: SampleIcon, iconPlacement: "only" },
      "表示しないテキスト",
    );

    expect(html).toContain('aria-label="閉じる"');
    expect(html).toMatch(/\sdata-icon-only(?:="")?[\s>]/);
    expect(html).toContain("data-icon");
    expect(html).not.toContain("表示しないテキスト");
  });

  it("falls back to a regular text button when only placement has no icon", async () => {
    const html = await renderButton({ iconPlacement: "only" }, "設定");

    expect(html).toContain("設定");
    expect(html).not.toContain("data-icon-only");
  });

  it("treats a runtime null icon as absent", async () => {
    const html = await renderButton({ icon: null as never, iconPlacement: "only" }, "設定");

    expect(html).toContain("設定");
    expect(html).not.toContain("data-icon-only");
  });

  it("preserves text-only buttons and native attributes", async () => {
    const html = await renderButton(
      { disabled: true, form: "example-form", name: "action", type: "submit" },
      "保存",
    );

    expect(html).toContain('type="submit"');
    expect(html).toContain('form="example-form"');
    expect(html).toContain('name="action"');
    expect(html).toContain("disabled");
    expect(html).toContain("保存");
    expect(html).not.toContain("data-icon-only");
  });
});
