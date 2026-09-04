import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqSelect, { type BasiqSelectProps } from "./BasiqSelect.vue";

describe("BasiqSelect SSR", () => {
  it("renders a labelled trigger and a native form control with the initial value", async () => {
    const Root = defineComponent({
      setup() {
        return () =>
          h(
            BasiqFormField,
            {
              description: "一つ選択してください",
              label: "通知方法",
              required: true,
            },
            {
              default: () =>
                h(BasiqSelect, {
                  defaultValue: "email",
                  items: ["email", { label: "プッシュ通知", value: "push" }],
                  name: "notification",
                }),
            },
          );
      },
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("通知方法");
    expect(html).toContain("一つ選択してください");
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain("email");
    expect(html.match(/<select/g)).toHaveLength(1);
    expect(html).toContain('name="notification"');
    expect(html).toContain('<option selected value="email">email</option>');
    expect(html).not.toContain('type="hidden"');
  });

  it("renders the empty selection without selecting the first item implicitly", async () => {
    const html = await renderSelect({
      items: ["email", "push"],
      placeholder: "選択してください",
    });

    expect(html).toContain("選択してください");
    expect(html).toContain('<option value="" selected></option>');
    expect(html).not.toContain('value="email" selected');
  });

  it("uses the current controlled value for SSR while keeping a separate reset value", async () => {
    const html = await renderSelect({
      defaultValue: "email",
      items: ["email", "push"],
      modelValue: "push",
      name: "notification",
    });

    expect(html).toContain('<option selected value="push">push</option>');
    expect(html).not.toContain('<option selected value="email">email</option>');
  });

  it("does not warn for explicitly undefined controlled props", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await renderSelect({
        items: ["email"],
        modelValue: undefined,
        open: undefined,
      });

      expect(warn).not.toHaveBeenCalledWith(
        "[BasiQ UI] BasiqSelect must not switch between controlled and uncontrolled value state.",
      );
      expect(warn).not.toHaveBeenCalledWith(
        "[BasiQ UI] BasiqSelect must not switch between controlled and uncontrolled open state.",
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("warns about invalid item definitions without throwing during SSR", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await renderSelect({
        items: [
          { label: "", value: "" },
          { disabled: true, label: "メール", value: "email" },
          { disabled: true, label: "重複", value: "email" },
        ],
        required: true,
      });

      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqSelect item values must not be empty strings. Use null for an empty selection.",
      );
      expect(warn).toHaveBeenCalledWith(
        '[BasiQ UI] BasiqSelect item values must be unique: "email".',
      );
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqSelect item labels must be non-empty strings.",
      );
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqSelect requires at least one enabled item when required is true.",
      );
    } finally {
      warn.mockRestore();
    }
  });
});

async function renderSelect(props: BasiqSelectProps) {
  const Root = defineComponent({
    setup() {
      return () => h(BasiqSelect, { "aria-label": "通知方法", ...props });
    },
  });

  return renderToString(createSSRApp(Root));
}
