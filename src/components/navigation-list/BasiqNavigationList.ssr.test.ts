import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqNavigationItem from "./BasiqNavigationItem.vue";
import BasiqNavigationList, { type BasiqNavigationItemDefinition } from "./BasiqNavigationList.vue";

const items = [
  { current: true, href: "/overview", label: "概要" },
  { href: "/members", label: "メンバー" },
] satisfies readonly BasiqNavigationItemDefinition[];

const LocalRouterLink = defineComponent({
  name: "LocalRouterLink",
  inheritAttrs: false,
  props: {
    to: { type: String, required: true },
  },
  setup(props, { attrs, slots }) {
    return () =>
      h("a", { ...attrs, "data-local-router-link": "", href: props.to }, slots.default?.());
  },
});

describe("BasiqNavigationList SSR", () => {
  it("renders native page links and forwards root attributes", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqNavigationList, {
          "aria-label": "Project pages",
          class: "consumer-navigation",
          items,
          style: { width: "18rem" },
        }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("<nav");
    expect(html).toContain("<ul");
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Project pages"');
    expect(html).toContain("consumer-navigation");
    expect(html).toContain('style="width:18rem;"');
    expect(html).toContain('href="/overview"');
    expect(html).toContain('href="/members"');
    expect(html).toContain('aria-current="page"');
  });

  it("supports a visible label through aria-labelledby", async () => {
    const Root = defineComponent({
      setup: () => () => [
        h("h2", { id: "project-pages-heading" }, "Project pages"),
        h(BasiqNavigationList, { ariaLabelledby: "project-pages-heading", items }),
      ],
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('aria-labelledby="project-pages-heading"');
  });

  it("composes a custom router-style link through asChild", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqNavigationList, { "aria-label": "Project pages" }, () => [
          h(BasiqNavigationItem, { asChild: true, current: true }, () =>
            h(LocalRouterLink, { to: "/settings" }, () => "設定"),
          ),
        ]),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html.match(/<a/g)).toHaveLength(1);
    expect(html).toContain("data-local-router-link");
    expect(html).toContain('href="/settings"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("設定");
  });

  it("renders long labels without changing their accessible text", async () => {
    const longLabel = "アクセシビリティとキーボード操作に関する詳細設定";
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqNavigationList, {
          "aria-label": "Settings pages",
          items: [{ href: "/accessibility", label: longLabel }],
        }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain(longLabel);
  });
});
