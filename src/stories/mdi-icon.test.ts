import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import { createStoryMdiIcon } from "./mdi-icon";

describe("createStoryMdiIcon", () => {
  it("renders a currentColor SVG and forwards attributes to its root", async () => {
    const icon = createStoryMdiIcon("TestIcon", "M0 0h24v24H0z");
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(icon, {
            "aria-label": "Test icon",
            class: "test-icon",
            "data-testid": "test-icon",
            style: { color: "red" },
          }),
      }),
    );

    expect(html).toContain("<svg");
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain('class="test-icon"');
    expect(html).toContain('data-testid="test-icon"');
    expect(html).toContain('aria-label="Test icon"');
    expect(html).toMatch(/style="[^"]*color:red/);
  });

  it("keeps the fixed MDI drawing contract when conflicting attributes are passed", async () => {
    const icon = createStoryMdiIcon("TestIcon", "M0 0h24v24H0z");
    const html = await renderToString(
      createSSRApp({
        render: () => h(icon, { fill: "red", viewBox: "0 0 16 16" }),
      }),
    );

    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toContain('viewBox="0 0 16 16"');
    expect(html).not.toContain('fill="red"');
  });
});
