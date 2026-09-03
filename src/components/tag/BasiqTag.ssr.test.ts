import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqTag, { type BasiqTagProps } from "./BasiqTag.vue";

const TestIcon = defineComponent({
  name: "TestIcon",
  setup: () => () => h("svg", { viewBox: "0 0 16 16" }, [h("circle", { cx: 8, cy: 8, r: 6 })]),
});

describe("BasiqTag SSR", () => {
  it("renders display-only content as a non-interactive span", async () => {
    const html = await renderTag({ label: "フロントエンド" });

    expect(html.startsWith("<span")).toBe(true);
    expect(html).toContain("フロントエンド");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("disabled");
    expect(html).not.toContain("tabindex");
  });

  it("renders a labelled native remove button and a decorative leading icon", async () => {
    const html = await renderTag({
      icon: TestIcon,
      label: "重要",
      removable: true,
      removeLabel: "重要タグを削除",
    });

    expect(html).toContain("<svg");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).not.toContain('role="img"');
    expect(html).toContain("<button");
    expect(html).toContain('aria-label="重要タグを削除"');
    expect(html).toContain('type="button"');
  });

  it("lets the leading slot replace icon while preserving the slot content semantics", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const html = await renderTag({ icon: TestIcon, label: "重要" }, () =>
        h("span", { "aria-label": "チーム", role: "img" }, "FE"),
      );

      expect(html).toContain('aria-label="チーム"');
      expect(html).toContain('role="img"');
      expect(html).not.toContain("<svg");
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqTag received both icon and a leading slot; the leading slot takes precedence.",
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("only applies disabled semantics to a removable tag", async () => {
    const html = await renderTag({
      disabled: true,
      label: "固定タグ",
      removable: true,
      removeLabel: "固定タグを削除",
    });

    expect(html).toContain("<button");
    expect(html).toContain("disabled");
  });

  it("warns about runtime combinations that cannot provide the public contract", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      await renderTag({
        label: " ",
        removable: true,
        removeLabel: " ",
      } as unknown as BasiqTagProps);

      expect(warn).toHaveBeenCalledWith("[BasiQ UI] BasiqTag label must be a non-empty string.");
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] A removable BasiqTag requires a non-empty removeLabel for its remove button.",
      );

      warn.mockClear();
      await renderTag({ disabled: true, label: "表示のみ" } as unknown as BasiqTagProps);
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqTag disabled only applies when removable is true.",
      );
    } finally {
      warn.mockRestore();
    }
  });
});

async function renderTag(props: BasiqTagProps, leading?: () => ReturnType<typeof h>) {
  const Root = defineComponent({
    setup: () => () => h(BasiqTag, props, leading ? { leading } : undefined),
  });

  return renderToString(createSSRApp(Root));
}
