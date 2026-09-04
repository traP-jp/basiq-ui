import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import type { BasiqComboboxProps } from "./BasiqCombobox.types";
import BasiqCombobox from "./BasiqCombobox.vue";

const items = [
  { label: "Alice", value: "alice" },
  { label: "Bob", value: 2 },
];

describe("BasiqCombobox SSR", () => {
  it("renders a single combobox without a form value when empty", async () => {
    const html = await renderCombobox({ items, name: "member", placeholder: "Choose" });

    expect(html).toContain('role="combobox"');
    expect(html).toContain('placeholder="Choose"');
    expect(html).not.toContain('type="hidden"');
  });

  it("renders one repeated-name form value for each multiple selection", async () => {
    const html = await renderCombobox({
      defaultValue: ["alice", 2],
      getRemoveLabel: (_item, value) => `Remove ${value}`,
      items,
      multiple: true,
      name: "member",
    });

    expect(html.match(/type="hidden"/g)).toHaveLength(2);
    expect(html.match(/name="member"/g)).toHaveLength(2);
    expect(html).toContain('value="alice"');
    expect(html).toContain('value="2"');
    expect(html).toContain('aria-label="Remove alice"');
  });

  it("exposes required and invalid state on the combobox", async () => {
    const html = await renderCombobox({ invalid: true, items, required: true });

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-required="true"');
  });
});

async function renderCombobox(props: BasiqComboboxProps) {
  const Root = defineComponent({
    setup: () => () => h(BasiqCombobox, props),
  });

  return renderToString(createSSRApp(Root));
}
