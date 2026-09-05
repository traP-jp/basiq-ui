import { defaultCalendarLabels, type BasiqCalendarLabels } from "../calendar/calendarLabels";
import type { BasiqDatePickerValidationReason } from "./datePickerDate";

export interface BasiqDatePickerLabels {
  calendar: BasiqCalendarLabels;
  trigger: string;
  validation: Record<BasiqDatePickerValidationReason, string>;
}

export const defaultDatePickerLabels: BasiqDatePickerLabels = {
  calendar: defaultCalendarLabels,
  trigger: "日付を選択",
  validation: {
    disabled: "この日付は選択できません。",
    format: "日付をyyyy/mm/dd形式で入力してください。",
    "invalid-date": "存在する日付を入力してください。",
    "out-of-range": "指定された範囲内の日付を入力してください。",
    required: "日付を入力してください。",
    unavailable: "この日付は利用できません。",
  },
};
