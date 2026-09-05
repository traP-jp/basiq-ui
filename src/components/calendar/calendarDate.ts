import { toCalendar, type CalendarDate } from "@internationalized/date";

export function clampCalendarDate(
  date: CalendarDate,
  minValue?: CalendarDate,
  maxValue?: CalendarDate,
) {
  if (minValue && date.compare(minValue) < 0) return toCalendar(minValue, date.calendar).copy();
  if (maxValue && date.compare(maxValue) > 0) return toCalendar(maxValue, date.calendar).copy();
  return date.copy();
}
