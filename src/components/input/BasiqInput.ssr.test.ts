import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqInput, { type BasiqInputProps } from "./BasiqInput.vue";

const TestIcon = defineComponent({
  name: "TestIcon",
  setup: () => () => h("svg", { viewBox: "0 0 16 16" }, h("circle", { cx: 8, cy: 8, r: 6 })),
});

describe("BasiqInput SSR", () => {
  it("keeps a phrasing root when rendered in inline content", async () => {
    const Root = defineComponent({
      setup() {
        return () => h("p", null, ["前", h(BasiqInput, { "aria-label": "文中入力" }), "後"]);
      },
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toMatch(/^<p>前<span[^>]*>/);
    expect(html).toContain("<input");
    expect(html).toMatch(/<\/span>後<\/p>$/);
  });

  it("routes visual attributes to the surface and native attributes to the input", async () => {
    const html = await renderInput({
      "aria-label": "検索語",
      "aria-hidden": "true",
      autofocus: true,
      class: "consumer-input",
      "data-testid": "native-input",
      defaultValue: "BasiQ UI",
      dir: "rtl",
      hidden: true,
      id: "query",
      inert: true,
      lang: "ar",
      style: { inlineSize: "20rem" },
      tabindex: 2,
      translate: "no",
    });
    const rootTag = html.match(/^<span[^>]*>/)?.[0];
    const inputTag = html.match(/<input[^>]*>/)?.[0];

    expect(html.startsWith("<span")).toBe(true);
    expect(rootTag).toContain("consumer-input");
    expect(rootTag).toContain('aria-hidden="true"');
    expect(rootTag).toContain("inline-size:20rem");
    expect(rootTag).toContain('dir="rtl"');
    expect(rootTag).toContain("hidden");
    expect(rootTag).toContain("inert");
    expect(rootTag).toContain('lang="ar"');
    expect(rootTag).toContain('translate="no"');
    expect(inputTag).toContain('id="query"');
    expect(inputTag).toContain('aria-label="検索語"');
    expect(inputTag).not.toContain('aria-hidden="true"');
    expect(inputTag).toContain("autofocus");
    expect(inputTag).toContain('data-testid="native-input"');
    expect(inputTag).toContain('tabindex="2"');
    expect(inputTag).toContain('value="BasiQ UI"');
    expect(inputTag).not.toContain("consumer-input");
    expect(inputTag).toContain('dir="rtl"');
    expect(inputTag).not.toContain("hidden");
    expect(inputTag).not.toContain("inert");
    expect(inputTag).not.toContain('lang="ar"');
    expect(inputTag).not.toContain('translate="no"');
  });

  it("keeps FormField metadata on the native input", async () => {
    const Root = defineComponent({
      setup() {
        return () =>
          h(
            BasiqFormField,
            { description: "公開名を入力してください", label: "表示名", required: true },
            { default: () => h(BasiqInput, { name: "display-name" }) },
          );
      },
    });
    const html = await renderToString(createSSRApp(Root));
    const labelId = html.match(/<label[^>]*\sfor="([^"]+)"/)?.[1];
    const inputId = html.match(/<input[^>]*\sid="([^"]+)"/)?.[1];

    expect(inputId).toBeTruthy();
    expect(labelId).toBe(inputId);
    expect(html).toMatch(/<input[^>]*aria-describedby="[^"]+"/);
    expect(html).toMatch(/<input[^>]*name="display-name"[^>]*required/);
  });

  it("makes an aria-hidden composite input inert", async () => {
    const html = await renderInput({
      "aria-hidden": "true",
      clearLabel: "入力を消去",
      clearable: true,
      defaultValue: "内容",
    });
    const rootTag = html.match(/^<span[^>]*>/)?.[0];
    const inputTag = html.match(/<input[^>]*>/)?.[0];

    expect(rootTag).toContain('aria-hidden="true"');
    expect(rootTag).toContain("inert");
    expect(inputTag).not.toContain('aria-hidden="true"');
  });

  it("preserves the hidden-until-found state on the surface", async () => {
    const html = await renderInput({ hidden: "until-found" });
    const rootTag = html.match(/^<span[^>]*>/)?.[0];
    const inputTag = html.match(/<input[^>]*>/)?.[0];

    expect(rootTag).toContain('hidden="until-found"');
    expect(inputTag).not.toContain("hidden");
  });

  it("renders prop icons as decorative and lets slots take precedence", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const html = await renderInput(
        {
          clearLabel: "金額を消去",
          clearable: true,
          defaultValue: "100",
          leadingIcon: TestIcon,
          trailingIcon: TestIcon,
        },
        {
          leading: () => h("span", { "aria-label": "通貨" }, "¥"),
          trailing: () => h("span", { "aria-label": "単位" }, "円"),
        },
      );

      expect(html).toContain('aria-label="通貨"');
      expect(html).toContain('aria-label="単位"');
      expect(html).not.toContain("<circle");
      expect(html.indexOf('aria-label="単位"')).toBeLessThan(html.indexOf("<button"));
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqInput received both leadingIcon and a leading slot; the leading slot takes precedence.",
      );
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqInput received both trailingIcon and a trailing slot; the trailing slot takes precedence.",
      );
    } finally {
      warn.mockRestore();
    }

    const iconHtml = await renderInput({ leadingIcon: TestIcon });
    expect(iconHtml).toContain("<svg");
    expect(iconHtml).toContain('aria-hidden="true"');
    expect(iconHtml).toContain('focusable="false"');
  });

  it("reserves a clear affordance while exposing it only for editable non-empty values", async () => {
    const visible = await renderInput({
      clearLabel: "入力を消去",
      clearable: true,
      defaultValue: "内容",
      type: "search",
    });
    const empty = await renderInput({ clearLabel: "入力を消去", clearable: true });
    const readonly = await renderInput({
      clearLabel: "入力を消去",
      clearable: true,
      defaultValue: "内容",
      readonly: true,
    });
    const disabled = await renderInput({
      clearLabel: "入力を消去",
      clearable: true,
      defaultValue: "内容",
      disabled: true,
    });

    expect(visible).toMatch(/<button[^>]*aria-label="入力を消去"[^>]*type="button"/);
    expect(visible).toMatch(/^<span[^>]*data-clearable/);
    expect(visible).not.toMatch(/<button[^>]*(?:data-hidden|disabled|tabindex)/);
    expect(empty).toMatch(
      /<button[^>]*aria-hidden="true"[^>]*aria-label="入力を消去"[^>]*data-hidden[^>]*disabled[^>]*tabindex="-1"/,
    );
    expect(readonly).toMatch(/<button[^>]*data-hidden[^>]*disabled[^>]*tabindex="-1"/);
    expect(disabled).toMatch(/<button[^>]*data-hidden[^>]*disabled[^>]*tabindex="-1"/);
  });

  it("warns when a clearable input has no usable clear label", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const html = await renderInput({ clearLabel: " ", clearable: true, defaultValue: "内容" });

      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] A clearable BasiqInput requires a non-empty clearLabel for its clear button.",
      );
      expect(html).toMatch(
        /<button[^>]*aria-hidden="true"[^>]*data-hidden[^>]*disabled[^>]*tabindex="-1"/,
      );
    } finally {
      warn.mockRestore();
    }
  });
});

async function renderInput(
  props: BasiqInputProps & Record<string, unknown>,
  slots?: Record<string, () => unknown>,
) {
  const Root = defineComponent({
    setup() {
      return () => h(BasiqInput, props, slots);
    },
  });

  return renderToString(createSSRApp(Root));
}
