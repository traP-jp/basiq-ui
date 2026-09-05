import { parseDate } from "@internationalized/date";
import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqCalendar from "./BasiqCalendar.vue";

describe("BasiqCalendar SSR", () => {
  it("renders a deterministic Japanese date grid without accessing the document", async () => {
    const date = parseDate("2026-09-04");
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqCalendar, {
          defaultValue: date,
          defaultVisibleDate: date,
          today: date,
        }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('role="grid"');
    expect(html).toContain("2026年9月");
    expect(html).toContain('data-value="2026-09-04"');
    expect(html).toContain('aria-current="date"');
    expect(html).not.toContain('role="application"');
  });

  it("uses the supplied locale and week start during SSR", async () => {
    const date = parseDate("2026-09-04");
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqCalendar, {
          defaultVisibleDate: date,
          locale: "en-GB",
          today: date,
          weekStartsOn: 1,
        }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain("September 2026");
    expect(html).toContain('title="Monday"');
  });

  it("constrains an uncontrolled initial visible date to the inclusive bounds", async () => {
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqCalendar, {
          defaultVisibleDate: parseDate("2026-03-15"),
          minValue: parseDate("2026-04-10"),
          today: parseDate("2026-04-10"),
        }),
    });
    const html = await renderToString(createSSRApp(Root));

    expect(html).toContain('aria-label="日付を選択, 2026年4月"');
    expect(html).not.toContain('aria-label="日付を選択, 2026年3月"');
  });

  it("uses an explicit today value instead of the runtime local date", async () => {
    const visibleDate = parseDate("2026-09-04");
    const explicitToday = parseDate("2026-09-10");
    const Root = defineComponent({
      setup: () => () =>
        h(BasiqCalendar, {
          defaultVisibleDate: visibleDate,
          today: explicitToday,
        }),
    });
    const html = await renderToString(createSSRApp(Root));
    const explicitTodayTrigger = html.match(/<div[^>]*data-value="2026-09-10"[^>]*>/)?.[0];
    const runtimeTodayTrigger = html.match(/<div[^>]*data-value="2026-09-04"[^>]*>/)?.[0];

    expect(explicitTodayTrigger).toContain("data-today");
    expect(explicitTodayTrigger).toContain('aria-current="date"');
    expect(runtimeTodayTrigger).not.toContain("data-today");
    expect(runtimeTodayTrigger).not.toContain("aria-current");
  });
});
