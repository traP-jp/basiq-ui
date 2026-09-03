import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqIcon, { type BasiqIconProps } from "./BasiqIcon.vue";

const SvgIcon = defineComponent({
  setup: () => () => h("svg", { viewBox: "0 0 24 24" }, h("path", { d: "M0 0" })),
});

const HtmlIcon = defineComponent({
  setup: () => () => h("span", { "data-html-icon": "" }, "+"),
});

async function renderIcon(props: BasiqIconProps & Record<string, unknown>) {
  return renderToString(createSSRApp({ render: () => h(BasiqIcon, props) }));
}

describe("BasiqIcon SSR", () => {
  it("makes decorative icon components hidden and excludes them from the tab order", async () => {
    const html = await renderIcon({ icon: SvgIcon });

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).not.toContain("tabindex");
    expect(html).not.toContain("role=");
  });

  it("gives meaningful standalone icons an image role and label", async () => {
    const html = await renderIcon({ icon: SvgIcon, label: "  情報  " });

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="情報"');
    expect(html).not.toContain("aria-hidden");
  });

  it("treats a whitespace-only label as decorative", async () => {
    const html = await renderIcon({ icon: SvgIcon, label: "   " });

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("aria-label");
    expect(html).not.toContain("role=");
  });

  it("forwards safe attributes to non-SVG Vue components", async () => {
    const html = await renderIcon({ icon: HtmlIcon, id: "custom-icon", tabindex: 0 });

    expect(html).toMatch(/\sdata-html-icon(?:="")?[\s>]/);
    expect(html).toContain('id="custom-icon"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("tabindex");
    expect(html).not.toContain('tabindex="0"');
  });
});
