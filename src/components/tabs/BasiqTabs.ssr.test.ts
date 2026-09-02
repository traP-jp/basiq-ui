import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqTabs, { type BasiqTabsItem, type BasiqTabsItemSlotProps } from "./BasiqTabs.vue";
import BasiqTabsContent from "./BasiqTabsContent.vue";
import BasiqTabsList from "./BasiqTabsList.vue";
import BasiqTabsRoot from "./BasiqTabsRoot.vue";
import BasiqTabsTrigger from "./BasiqTabsTrigger.vue";

const items = [
  { content: "プロフィール本文", label: "プロフィール", value: "profile" },
  { content: "アカウント本文", label: "アカウント", value: "account" },
] satisfies readonly BasiqTabsItem[];

describe("BasiqTabs SSR", () => {
  it("selects the first enabled item when no initial value is provided", async () => {
    const Root = defineComponent({
      setup: () => () => h(BasiqTabs, { ariaLabel: "設定", items }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("プロフィール本文");
    expect(html).not.toContain("アカウント本文");
  });

  it("skips disabled items when choosing an initial value", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqTabs, {
          ariaLabel: "設定",
          items: [{ ...items[0], disabled: true }, items[1]],
        }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("アカウント本文");
    expect(html).not.toContain("プロフィール本文");
  });

  it("honors a controlled value without replacing it", async () => {
    const emit = vi.fn<(value: string) => void>();
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqTabs, {
          ariaLabel: "設定",
          items,
          modelValue: "account",
          "onUpdate:modelValue": emit,
        }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("アカウント本文");
    expect(html).not.toContain("プロフィール本文");
    expect(emit).not.toHaveBeenCalled();
  });

  it("falls back to the first enabled item for an invalid controlled value", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const Root = defineComponent({
        setup: () => () => h(BasiqTabs, { ariaLabel: "設定", items, modelValue: "missing" }),
      });
      const html = await renderToString(createSSRApp(Root));

      expect(html).toContain('aria-selected="true"');
      expect(html).toContain("プロフィール本文");
      expect(html).not.toContain("アカウント本文");
      expect(warn).toHaveBeenCalledWith(
        '[BasiQ UI] BasiqTabs modelValue must match an enabled item: "missing". The first enabled item is displayed instead.',
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("falls back to the first enabled item for an invalid default value", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const Root = defineComponent({
        setup: () => () => h(BasiqTabs, { ariaLabel: "設定", defaultValue: "missing", items }),
      });
      const html = await renderToString(createSSRApp(Root));

      expect(html).toContain("プロフィール本文");
      expect(html).not.toContain("アカウント本文");
      expect(warn).toHaveBeenCalledWith(
        '[BasiQ UI] BasiqTabs defaultValue must match an enabled item: "missing". The first enabled item is displayed instead.',
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("supports naming the tab list with a visible heading", async () => {
    const Root = defineComponent({
      setup: () => () => [
        h("h2", { id: "settings-heading" }, "設定"),
        h(BasiqTabs, {
          ariaLabelledby: "settings-heading",
          items,
        }),
      ],
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-labelledby="settings-heading"');
  });

  it("uses each item label as the accessible name of a custom trigger", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(
          BasiqTabs,
          { ariaLabel: "設定", items },
          {
            trigger: ({ item }: BasiqTabsItemSlotProps) =>
              h("span", { "aria-hidden": "true" }, item.value.slice(0, 1)),
          },
        ),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('aria-label="プロフィール"');
    expect(html).toContain('aria-label="アカウント"');
  });

  it("forwards the text direction to Reka UI", async () => {
    const Root = defineComponent({
      setup: () => () => h(BasiqTabs, { ariaLabel: "設定", dir: "rtl", items }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('dir="rtl"');
  });

  it("keeps inactive content in the HTML when unmountOnHide is false", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqTabs, {
          ariaLabel: "設定",
          defaultValue: "profile",
          items,
          unmountOnHide: false,
        }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("プロフィール本文");
    expect(html).toContain("アカウント本文");
    expect(html).toContain("hidden");
  });

  it("renders the compound API with the same tab semantics", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqTabsRoot, { defaultValue: "profile" }, () => [
          h(BasiqTabsList, { "aria-label": "設定" }, () => [
            h(BasiqTabsTrigger, { value: "profile" }, () => "プロフィール"),
            h(BasiqTabsTrigger, { value: "account" }, () => "アカウント"),
          ]),
          h(BasiqTabsContent, { value: "profile" }, () => "プロフィール本文"),
          h(BasiqTabsContent, { value: "account" }, () => "アカウント本文"),
        ]),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-label="設定"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("プロフィール本文");
  });

  it("warns when the compound tab list has no accessible name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const Root = defineComponent({
        setup: () => () =>
          h(BasiqTabsRoot, { defaultValue: "profile" }, () => [
            h(BasiqTabsList, null, () => [
              h(BasiqTabsTrigger, { value: "profile" }, () => "プロフィール"),
            ]),
            h(BasiqTabsContent, { value: "profile" }, () => "プロフィール本文"),
          ]),
      });

      await renderToString(createSSRApp(Root));
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqTabsList requires an accessible name. Pass ariaLabel or ariaLabelledby.",
      );
    } finally {
      warn.mockRestore();
    }
  });
});
