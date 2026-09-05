import {
  JapaneseCalendar,
  parseDate,
  toCalendar,
  type CalendarDate,
} from "@internationalized/date";
import { describe, expect, it, vi } from "vitest";

import { formatDateInput, parseDateInput, validateDate } from "./datePickerDate";

describe("date picker date helpers", () => {
  it.each([
    ["2026/09/04", "2026-09-04"],
    ["2026/9/4", "2026-09-04"],
    ["20260904", "2026-09-04"],
    ["２０２６／０９／０４", "2026-09-04"],
  ])("parses %s", (input, expected) => {
    const result = parseDateInput(input);

    expect(result.status).toBe("valid");
    expect((result as { value: CalendarDate }).value.toString()).toBe(expected);
  });

  it("distinguishes an empty value, a malformed value, and an impossible date", () => {
    expect(parseDateInput("  ")).toEqual({ status: "empty" });
    expect(parseDateInput("2026-09-04")).toEqual({ reason: "format", status: "invalid" });
    expect(parseDateInput(" 2026/09/04 ")).toEqual({ reason: "format", status: "invalid" });
    expect(parseDateInput("2026 / 09 / 04")).toEqual({ reason: "format", status: "invalid" });
    expect(parseDateInput("2026/02/30")).toEqual({
      reason: "invalid-date",
      status: "invalid",
    });
  });

  it("accepts the supported Gregorian year range without normalizing year zero", () => {
    expect(parseDateInput("0001/01/01")).toMatchObject({ status: "valid" });
    expect(parseDateInput("9999/12/31")).toMatchObject({ status: "valid" });
    expect(parseDateInput("0000/01/01")).toEqual({
      reason: "invalid-date",
      status: "invalid",
    });
  });

  it("formats values as a Gregorian yyyy/mm/dd string", () => {
    const japaneseDate = toCalendar(parseDate("2026-09-04"), new JapaneseCalendar());

    expect(formatDateInput(japaneseDate)).toBe("2026/09/04");
    expect(formatDateInput(null)).toBe("");
  });

  it("validates ranges and date matchers in Gregorian dates", () => {
    const matcher = vi.fn<(date: CalendarDate) => boolean>((date) => date.day === 4);
    const date = parseDate("2026-09-04");

    expect(validateDate(date, { minValue: parseDate("2026-09-05") })).toBe("out-of-range");
    expect(validateDate(date, { isDateDisabled: matcher })).toBe("disabled");
    expect(matcher).toHaveBeenCalledWith(expect.objectContaining({ calendar: gregorianCalendar }));
  });

  it("distinguishes upper bounds and unavailable dates", () => {
    const date = parseDate("2026-09-04");

    expect(validateDate(date, { maxValue: parseDate("2026-09-03") })).toBe("out-of-range");
    expect(validateDate(date, { isDateUnavailable: () => true })).toBe("unavailable");
    expect(validateDate(date, {})).toBeNull();
  });
});

const gregorianCalendar = expect.objectContaining({ identifier: "gregory" });
