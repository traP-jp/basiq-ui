import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqInput from "../input/BasiqInput.vue";
import BasiqFormField from "./BasiqFormField.vue";

async function renderField(controlId?: string) {
  const Root = defineComponent({
    setup() {
      return () =>
        h(
          BasiqFormField,
          { controlId, label: "ユーザー名" },
          { default: () => h(BasiqInput, { defaultValue: "初期値" }) },
        );
    },
  });

  return renderToString(createSSRApp(Root));
}

function readAssociation(html: string) {
  const labelId = html.match(/<label[^>]*\sfor="([^"]+)"/)?.[1];
  const inputId = html.match(/<input[^>]*\sid="([^"]+)"/)?.[1];

  return { inputId, labelId };
}

describe("BasiqFormField SSR", () => {
  it("generates one ID shared by the label and input", async () => {
    const html = await renderField();
    const { inputId, labelId } = readAssociation(html);

    expect(inputId).toBeTruthy();
    expect(labelId).toBe(inputId);
    expect(html).toContain('value="初期値"');
    expect(html).not.toContain("default-value");
  });

  it("uses an explicit control ID for both the label and input", async () => {
    const html = await renderField("explicit-control");

    expect(readAssociation(html)).toEqual({
      inputId: "explicit-control",
      labelId: "explicit-control",
    });
  });

  it("warns when multiple BasiQ controls register with one field", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const Root = defineComponent({
      setup() {
        return () =>
          h(
            BasiqFormField,
            { label: "重複したcontrol" },
            { default: () => [h(BasiqInput), h(BasiqInput)] },
          );
      },
    });

    try {
      await renderToString(createSSRApp(Root));
      await Promise.resolve();

      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqFormField supports one logical control. Multiple controls were registered: BasiqInput, BasiqInput. Use a group component for multiple controls.",
      );
    } finally {
      warn.mockRestore();
    }
  });
});
