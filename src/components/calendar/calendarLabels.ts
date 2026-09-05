export interface BasiqCalendarLabels {
  calendar: string;
  chooseMonth: string;
  chooseYear: string;
  nextMonth: string;
  nextYear: string;
  nextYears: string;
  previousMonth: string;
  previousYear: string;
  previousYears: string;
}

export const defaultCalendarLabels: BasiqCalendarLabels = {
  calendar: "日付を選択",
  chooseMonth: "月を選択",
  chooseYear: "年を選択",
  nextMonth: "次の月",
  nextYear: "次の年",
  nextYears: "次の12年間",
  previousMonth: "前の月",
  previousYear: "前の年",
  previousYears: "前の12年間",
};
