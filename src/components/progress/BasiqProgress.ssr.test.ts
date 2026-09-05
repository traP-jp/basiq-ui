import { describe, expect, it, vi } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqProgress, { type BasiqProgressProps } from "./BasiqProgress.vue";

async function renderProgress(props: BasiqProgressProps & Record<string, unknown>) {
  return renderToString(createSSRApp({ render: () => h(BasiqProgress, props) }));
}

describe("BasiqProgress SSR", () => {
  it("renders one named progressbar with determinate values", async () => {
    const html = await renderProgress({
      ariaLabel: "講習会の受講進捗",
      ariaValueText: "全5回中3回完了",
      max: 5,
      value: 3,
    });

    expect(html.match(/role="progressbar"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="講習会の受講進捗"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="5"');
    expect(html).toContain('aria-valuenow="3"');
    expect(html).toContain('aria-valuetext="全5回中3回完了"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("--basiq-progress-fill:60%");
    expect(html.match(/data-progress-indicator/g)).toHaveLength(1);
  });

  it("uses 100 as the default max", async () => {
    const html = await renderProgress({ ariaLabel: "アップロード進捗", value: 25 });

    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuenow="25"');
    expect(html).toContain("--basiq-progress-fill:25%");
  });

  it("supports naming the progressbar with visible content elsewhere", async () => {
    const html = await renderProgress({
      ariaLabelledby: "course-progress-heading",
      max: 5,
      value: 3,
    });

    expect(html).toContain('aria-labelledby="course-progress-heading"');
    expect(html).not.toContain("aria-label=");
  });

  it("accepts standard ARIA attribute spellings", async () => {
    const html = await renderProgress({
      "aria-labelledby": "course-progress-heading",
      "aria-valuetext": "全5回中3回完了",
      max: 5,
      value: 3,
    });

    expect(html).toContain('aria-labelledby="course-progress-heading"');
    expect(html).toContain('aria-valuetext="全5回中3回完了"');
  });

  it("renders decimal values as a continuous ratio", async () => {
    const html = await renderProgress({
      ariaLabel: "処理進捗",
      max: 5,
      value: 2.5,
    });

    expect(html).toContain('aria-valuenow="2.5"');
    expect(html).toContain("--basiq-progress-fill:50%");
  });

  it("clamps an out-of-range value and warns", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const html = await renderProgress({ ariaLabel: "処理進捗", max: 5, value: 8 });

      expect(html).toContain('aria-valuenow="5"');
      expect(html).toContain("--basiq-progress-fill:100%");
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqProgress value must be between 0 and max. It is clamped.",
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("omits a supplied value text when numeric values are normalized", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      const html = await renderProgress({
        ariaLabel: "処理進捗",
        ariaValueText: "5件中8件完了",
        max: 5,
        value: 8,
      });

      expect(html).toContain('aria-valuenow="5"');
      expect(html).not.toContain("aria-valuetext");
      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqProgress omits ariaValueText when value or max is normalized to avoid inconsistent progress semantics.",
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("warns when an accessible name is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      await renderProgress({ value: 25 });

      expect(warn).toHaveBeenCalledWith(
        "[BasiQ UI] BasiqProgress requires an accessible name. Pass ariaLabel or ariaLabelledby.",
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("forwards root attributes without allowing conflicting progressbar semantics", async () => {
    const html = await renderProgress({
      ariaLabel: "処理進捗",
      "aria-hidden": "true",
      "aria-valuemax": 20,
      "aria-valuemin": 10,
      "aria-valuenow": 15,
      class: "custom-progress",
      "data-testid": "progress",
      id: "upload-progress",
      max: 5,
      role: "button",
      style: "margin: 1rem",
      tabindex: 0,
      value: 3,
    });

    expect(html).toContain('id="upload-progress"');
    expect(html).toContain('data-testid="progress"');
    expect(html).toContain("custom-progress");
    expect(html).toContain("margin:1rem");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="5"');
    expect(html).toContain('aria-valuenow="3"');
    expect(html).not.toContain('role="button"');
    expect(html).not.toContain("tabindex");
  });
});
