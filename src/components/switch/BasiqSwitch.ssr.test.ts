import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqSwitch from "./BasiqSwitch.vue";

describe("BasiqSwitch SSR", () => {
  it("renders one native checkbox with switch semantics", async () => {
    const Root = defineComponent({
      setup() {
        return () =>
          h(
            BasiqFormField,
            { description: "即時に反映されます", label: "通知" },
            { default: () => h(BasiqSwitch, { defaultValue: true, name: "notifications" }) },
          );
      },
    });
    const html = await renderToString(createSSRApp(Root));
    const labelId = html.match(/<label[^>]*\sfor="([^"]+)"/)?.[1];
    const inputId = html.match(/<input[^>]*\sid="([^"]+)"/)?.[1];

    expect(inputId).toBeTruthy();
    expect(labelId).toBe(inputId);
    expect(html.match(/<input/g)).toHaveLength(1);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('role="switch"');
    expect(html).toContain("checked");
  });

  it("uses visible slot content as a native label", async () => {
    const Root = defineComponent({
      setup() {
        return () => h(BasiqSwitch, null, { default: () => "通知を有効にする" });
      },
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html.startsWith("<label")).toBe(true);
    expect(html).toContain("通知を有効にする");
  });
});
