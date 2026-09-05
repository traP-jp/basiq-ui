import { parseDate } from "@internationalized/date";
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqDatePicker from "./BasiqDatePicker.vue";

describe("BasiqDatePicker SSR", () => {
  it("renders the display value and canonical form value", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(BasiqDatePicker, {
            "aria-label": "開催日",
            defaultValue: parseDate("2026-09-04"),
            name: "event-date",
            today: parseDate("2026-09-04"),
          }),
      }),
    );

    expect(html).toContain('aria-label="開催日"');
    expect(html).toContain('aria-label="開催日 日付を選択"');
    expect(html).toContain('value="2026/09/04"');
    expect(html).toContain('name="event-date"');
    expect(html).toContain('type="hidden"');
    expect(html).toContain('value="2026-09-04"');
    expect(html).not.toContain('role="dialog"');
  });

  it("renders native required and disabled semantics", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(BasiqDatePicker, {
            "aria-label": "必須の日付",
            disabled: true,
            required: true,
          }),
      }),
    );

    expect(html).toContain(" required");
    expect(html.match(/ disabled/g)).toHaveLength(2);
  });

  it("combines the FormField label with the calendar trigger action", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(BasiqFormField, { label: "開催日" }, () =>
            h(BasiqDatePicker, { today: parseDate("2026-09-04") }),
          ),
      }),
    );
    const labelId = html.match(/<label id="([^"]+-label)"/)?.[1];
    const triggerLabelId = html.match(/<span id="([^"]+-trigger-label)"/)?.[1];

    expect(labelId).toBeDefined();
    expect(triggerLabelId).toBeDefined();
    expect(html).toContain(`aria-labelledby="${labelId} ${triggerLabelId}"`);
  });
});
