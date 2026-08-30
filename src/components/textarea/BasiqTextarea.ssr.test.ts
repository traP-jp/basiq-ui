import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqTextarea from "./BasiqTextarea.vue";

describe("BasiqTextarea SSR", () => {
  it("shares the generated FormField ID with its label", async () => {
    const Root = defineComponent({
      setup() {
        return () =>
          h(
            BasiqFormField,
            { label: "説明" },
            { default: () => h(BasiqTextarea, { defaultValue: "初期値" }) },
          );
      },
    });
    const html = await renderToString(createSSRApp(Root));
    const labelId = html.match(/<label[^>]*\sfor="([^"]+)"/)?.[1];
    const textareaId = html.match(/<textarea[^>]*\sid="([^"]+)"/)?.[1];

    expect(textareaId).toBeTruthy();
    expect(labelId).toBe(textareaId);
    expect(html).toContain(">初期値</textarea>");
    expect(html).not.toContain("default-value");
  });
});
