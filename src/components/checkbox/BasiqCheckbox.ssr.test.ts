import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqCheckbox from "./BasiqCheckbox.vue";

describe("BasiqCheckbox SSR", () => {
  it("shares the generated FormField metadata with the native checkbox", async () => {
    const Root = defineComponent({
      setup() {
        return () =>
          h(
            BasiqFormField,
            { description: "確認してください", label: "同意", required: true },
            { default: () => h(BasiqCheckbox, { defaultValue: true, name: "accepted" }) },
          );
      },
    });
    const html = await renderToString(createSSRApp(Root));
    const labelId = html.match(/<label[^>]*\sfor="([^"]+)"/)?.[1];
    const inputId = html.match(/<input[^>]*\sid="([^"]+)"/)?.[1];

    expect(inputId).toBeTruthy();
    expect(labelId).toBe(inputId);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('name="accepted"');
    expect(html).toContain("checked");
    expect(html).toContain("required");
  });

  it("uses visible slot content as a native label", async () => {
    const Root = defineComponent({
      setup() {
        return () => h(BasiqCheckbox, null, { default: () => "利用規約に同意する" });
      },
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html.startsWith("<label")).toBe(true);
    expect(html).toContain("利用規約に同意する");
    expect(html).toContain('type="checkbox"');
  });
});
