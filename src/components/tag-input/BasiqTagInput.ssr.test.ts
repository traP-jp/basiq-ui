import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqTagInput, { type BasiqTagInputProps } from "./BasiqTagInput.vue";

describe("BasiqTagInput SSR", () => {
  it("renders BasiqTag chips and repeated-name form values", async () => {
    const html = await renderTagInput({
      defaultValue: ["Vue", "TypeScript"],
      name: "topic",
      removeLabel: (value) => `Remove ${value}`,
    });

    expect(html.match(/type="hidden"/g)).toHaveLength(2);
    expect(html.match(/name="topic"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Remove Vue"');
    expect(html).toContain('aria-label="Remove TypeScript"');
    expect(html).toContain("data-has-values");
    expect(html).not.toContain("placeholder=");
  });

  it("keeps readonly tags visible without removal buttons", async () => {
    const html = await renderTagInput({
      defaultValue: ["fixed"],
      readonly: true,
      removeLabel: (value) => `Remove ${value}`,
    });

    expect(html).toContain("fixed");
    expect(html).toContain("readonly");
    expect(html).not.toContain("<button");
  });

  it("exposes required and invalid state on the input", async () => {
    const html = await renderTagInput({
      invalid: true,
      removeLabel: (value) => `Remove ${value}`,
      required: true,
    });

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-required="true"');
  });

  it("only renders the placeholder while there are no committed tags", async () => {
    const html = await renderTagInput({
      placeholder: "Add a topic",
      removeLabel: (value) => `Remove ${value}`,
    });

    expect(html).toContain('placeholder="Add a topic"');
    expect(html).not.toContain("data-has-values");
  });
});

async function renderTagInput(props: BasiqTagInputProps) {
  const Root = defineComponent({
    setup: () => () => h(BasiqTagInput, props),
  });

  return renderToString(createSSRApp(Root));
}
