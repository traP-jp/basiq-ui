import {
  GregorianCalendar,
  parseDate,
  toCalendar,
  type CalendarDate,
} from "@internationalized/date";

export type BasiqDatePickerValidationReason =
  | "disabled"
  | "format"
  | "invalid-date"
  | "out-of-range"
  | "required"
  | "unavailable";

export type BasiqDatePickerParseResult =
  | { status: "empty" }
  | { reason: "format" | "invalid-date"; status: "invalid" }
  | { status: "valid"; value: CalendarDate };

interface ValidateDateOptions {
  isDateDisabled?: (date: CalendarDate) => boolean;
  isDateUnavailable?: (date: CalendarDate) => boolean;
  maxValue?: CalendarDate;
  minValue?: CalendarDate;
}

const gregorianCalendar = new GregorianCalendar();

export function toGregorianDate(value: CalendarDate) {
  return toCalendar(value, gregorianCalendar);
}

export function formatDateInput(value: CalendarDate | null | undefined) {
  if (!value) return "";

  const date = toGregorianDate(value);
  return `${String(date.year).padStart(4, "0")}/${String(date.month).padStart(2, "0")}/${String(date.day).padStart(2, "0")}`;
}

export function parseDateInput(input: string): BasiqDatePickerParseResult {
  const normalized = input.normalize("NFKC");
  if (normalized.trim() === "") return { status: "empty" };
  if (normalized !== normalized.trim()) return { reason: "format", status: "invalid" };

  const separated = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(normalized);
  const compact = /^(\d{4})(\d{2})(\d{2})$/.exec(normalized);
  const parts = separated ?? compact;
  if (!parts) return { reason: "format", status: "invalid" };

  const [, year, month, day] = parts;
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  if (numericYear < 1 || numericYear > 9999) {
    return { reason: "invalid-date", status: "invalid" };
  }
  const serialized = `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;

  try {
    const value = parseDate(serialized);
    if (
      value.year !== numericYear ||
      value.month !== numericMonth ||
      value.day !== numericDay ||
      value.toString() !== serialized
    ) {
      return { reason: "invalid-date", status: "invalid" };
    }

    return { status: "valid", value };
  } catch {
    return { reason: "invalid-date", status: "invalid" };
  }
}

export function validateDate(
  value: CalendarDate,
  { isDateDisabled, isDateUnavailable, maxValue, minValue }: ValidateDateOptions,
): BasiqDatePickerValidationReason | null {
  const date = toGregorianDate(value);
  if (minValue && date.compare(toGregorianDate(minValue)) < 0) return "out-of-range";
  if (maxValue && date.compare(toGregorianDate(maxValue)) > 0) return "out-of-range";
  if (isDateDisabled?.(date)) return "disabled";
  if (isDateUnavailable?.(date)) return "unavailable";
  return null;
}
