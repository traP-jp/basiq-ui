import { JapaneseCalendar, parseDate, toCalendar } from "@internationalized/date";
import { describe, expect, it } from "vitest";

import { clampCalendarDate } from "./calendarDate";

describe("calendar date helpers", () => {
  it("clamps dates to inclusive bounds", () => {
    const minValue = parseDate("2026-04-10");
    const maxValue = parseDate("2026-06-20");

    expect(clampCalendarDate(parseDate("2026-04-01"), minValue, maxValue).toString()).toBe(
      "2026-04-10",
    );
    expect(clampCalendarDate(parseDate("2026-07-01"), minValue, maxValue).toString()).toBe(
      "2026-06-20",
    );
    expect(clampCalendarDate(parseDate("2026-05-01"), minValue, maxValue).toString()).toBe(
      "2026-05-01",
    );
  });

  it("preserves the input calendar system when clamping to bounds", () => {
    const date = toCalendar(parseDate("2026-04-01"), new JapaneseCalendar());
    const result = clampCalendarDate(date, parseDate("2026-04-10"));

    expect(result.toString()).toBe("2026-04-10");
    expect(result.calendar.identifier).toBe("japanese");
  });
});
