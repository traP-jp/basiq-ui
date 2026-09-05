import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqSearchField, { type BasiqSearchFieldProps } from "./BasiqSearchField.vue";

const UnsupportedIcon = defineComponent({
  name: "UnsupportedIcon",
  setup: () => () => h("svg", { "data-unsupported-icon": "" }),
});

describe("BasiqSearchField SSR", () => {
  it("renders a clearable search input with a decorative search icon", async () => {
    const html = await renderSearchField({
      "aria-label": "サイト内検索",
      clearLabel: "検索語を消去",
      defaultValue: "BasiQ UI",
      name: "query",
      placeholder: "検索",
    });

    expect(html).toMatch(/<input[^>]*aria-label="サイト内検索"/);
    expect(html).toMatch(/<input[^>]*name="query"[^>]*type="search"/);
    expect(html).toContain('placeholder="検索"');
    expect(html).toContain('value="BasiQ UI"');
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
    expect(html).toMatch(/<button[^>]*aria-label="検索語を消去"[^>]*type="button"/);
  });

  it("keeps fixed search semantics when unsupported attributes are supplied", async () => {
    const html = await renderSearchField({
      "aria-label": "固定された検索",
      clearLabel: "検索語を消去",
      clearable: false,
      defaultValue: "query",
      leadingIcon: UnsupportedIcon,
      trailingIcon: UnsupportedIcon,
      type: "text",
    });

    expect(html).toMatch(/<input[^>]*type="search"/);
    expect(html).toContain('aria-label="検索語を消去"');
    expect(html).not.toContain("data-unsupported-icon");
    expect(html.match(/data-input-affix/g)).toHaveLength(1);
  });

  it("preserves BasiqInput attribute routing", async () => {
    const html = await renderSearchField({
      "aria-label": "属性検索",
      class: "consumer-search",
      clearLabel: "検索語を消去",
      "data-testid": "search-input",
      defaultValue: "query",
      dir: "rtl",
      hidden: true,
      style: { inlineSize: "20rem" },
    });
    const rootTag = html.match(/^<span[^>]*>/)?.[0];
    const inputTag = html.match(/<input[^>]*>/)?.[0];

    expect(rootTag).toContain("consumer-search");
    expect(rootTag).toContain("inline-size:20rem");
    expect(rootTag).toContain('dir="rtl"');
    expect(rootTag).toContain("hidden");
    expect(inputTag).toContain('aria-label="属性検索"');
    expect(inputTag).toContain('data-testid="search-input"');
    expect(inputTag).toContain('dir="rtl"');
    expect(inputTag).not.toContain("consumer-search");
    expect(inputTag).not.toContain("hidden");
  });

  it("integrates with BasiqFormField", async () => {
    const Root = defineComponent({
      setup() {
        return () =>
          h(
            BasiqFormField,
            { description: "タイトルと本文を検索します", label: "検索語", required: true },
            {
              default: () =>
                h(BasiqSearchField, {
                  clearLabel: "検索語を消去",
                  name: "query",
                }),
            },
          );
      },
    });
    const html = await renderToString(createSSRApp(Root));
    const labelId = html.match(/<label[^>]*\sfor="([^"]+)"/)?.[1];
    const inputId = html.match(/<input[^>]*\sid="([^"]+)"/)?.[1];

    expect(inputId).toBeTruthy();
    expect(labelId).toBe(inputId);
    expect(html).toMatch(/<input[^>]*aria-describedby="[^"]+"/);
    expect(html).toMatch(/<input[^>]*name="query"[^>]*required[^>]*type="search"/);
  });

  it("uses the Input runtime guard for an unusable clear label", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const html = await renderSearchField({
        "aria-label": "サイト内検索",
        clearLabel: " ",
        defaultValue: "query",
      });

      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] A clearable BasiqInput requires a non-empty clearLabel for its clear button.",
      );
      expect(html).toMatch(/<button[^>]*aria-hidden="true"[^>]*disabled[^>]*tabindex="-1"/);
    } finally {
      warn.mockRestore();
    }
  });
});

async function renderSearchField(props: BasiqSearchFieldProps & Record<string, unknown>) {
  return renderToString(createSSRApp({ render: () => h(BasiqSearchField, props) }));
}
