import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqRadioGroup, { type BasiqRadioGroupProps } from "./BasiqRadioGroup.vue";

describe("BasiqRadioGroup SSR", () => {
  it("renders a labelled native radio group without hidden form controls", async () => {
    const Root = defineComponent({
      setup() {
        return () =>
          h(BasiqRadioGroup, {
            defaultValue: "email",
            description: "一つ選択してください",
            items: ["email", { label: "プッシュ通知", value: "push" }],
            label: "通知方法",
            name: "notification",
            required: true,
          });
      },
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html.match(/<input/g)).toHaveLength(2);
    expect(html.match(/name="notification"/g)).toHaveLength(2);
    expect(html).toContain("<fieldset");
    expect(html).toContain("<legend");
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain("通知方法");
    expect(html).toContain("一つ選択してください");
    expect(html).toContain("checked");
    expect(html).not.toContain('type="hidden"');
  });

  it("warns when a required group has no enabled item", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await renderRadioGroup({ items: [], required: true });
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqRadioGroup requires at least one enabled item when required is true.",
      );

      warn.mockClear();
      await renderRadioGroup({
        items: [{ disabled: true, label: "準備中", value: "disabled" }],
        required: true,
      });
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqRadioGroup requires at least one enabled item when required is true.",
      );

      warn.mockClear();
      await renderRadioGroup({ items: ["enabled"], required: true });
      expect(warn).not.toHaveBeenCalled();

      await renderRadioGroup({ disabled: true, items: [], required: true });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

async function renderRadioGroup(
  props: Pick<BasiqRadioGroupProps, "items"> &
    Partial<Pick<BasiqRadioGroupProps, "disabled" | "required">>,
) {
  const Root = defineComponent({
    setup() {
      return () => h(BasiqRadioGroup, { ...props, label: "通知方法" });
    },
  });

  return renderToString(createSSRApp(Root));
}
