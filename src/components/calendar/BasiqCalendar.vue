<script setup lang="ts">
import type { CalendarDate, DateValue, DayOfWeek } from "@internationalized/date";
import {
  endOfWeek,
  getLocalTimeZone,
  isSameDay,
  isSameMonth,
  isSameYear,
  parseDate,
  startOfWeek,
  today as getToday,
  toCalendar,
  toCalendarDate,
} from "@internationalized/date";
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
  MonthPickerCell,
  MonthPickerCellTrigger,
  MonthPickerHeading,
  MonthPickerNext,
  MonthPickerPrev,
  MonthPickerRoot,
  YearPickerCell,
  YearPickerCellTrigger,
  YearPickerHeading,
  YearPickerNext,
  YearPickerPrev,
  YearPickerRoot,
  useDirection,
} from "reka-ui";
import {
  computed,
  nextTick,
  ref,
  shallowRef,
  toRef,
  useAttrs,
  useId,
  watch,
  watchEffect,
} from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";
import BasiqIcon from "../icon/BasiqIcon.vue";
import BasiqCalendarChevronIcon from "./BasiqCalendarChevronIcon.vue";
import { clampCalendarDate } from "./calendarDate";
import { defaultCalendarLabels, type BasiqCalendarLabels } from "./calendarLabels";

defineOptions({ inheritAttrs: false });

export type { BasiqCalendarLabels } from "./calendarLabels";
export type BasiqCalendarDirection = "ltr" | "rtl";
type BasiqCalendarView = "day" | "month" | "year";
type VisibleDateRequestResult = "accepted" | "rejected" | "superseded";
export type BasiqWeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type BasiqDateMatcher = (date: CalendarDate) => boolean;

export interface BasiqCalendarProps {
  defaultValue?: CalendarDate | null;
  defaultVisibleDate?: CalendarDate;
  dir?: BasiqCalendarDirection;
  disabled?: boolean;
  initialFocus?: boolean;
  isDateDisabled?: BasiqDateMatcher;
  isDateUnavailable?: BasiqDateMatcher;
  labels?: Partial<BasiqCalendarLabels>;
  locale?: string;
  maxValue?: CalendarDate;
  minValue?: CalendarDate;
  modelValue?: CalendarDate | null;
  readonly?: boolean;
  /** Reference date used for today's visual and accessible states. Defaults to the local date captured when mounted. Pass explicitly during SSR and update it for long-lived views. */
  today?: CalendarDate;
  visibleDate?: CalendarDate;
  weekStartsOn?: BasiqWeekStartsOn;
}

export interface BasiqCalendarEmits {
  "update:modelValue": [value: CalendarDate | null];
  "update:visibleDate": [value: CalendarDate];
}

const props = withDefaults(defineProps<BasiqCalendarProps>(), {
  defaultValue: null,
  disabled: false,
  initialFocus: false,
  labels: undefined,
  locale: "ja-JP",
  modelValue: undefined,
  readonly: false,
  visibleDate: undefined,
  weekStartsOn: undefined,
});
const emit = defineEmits<BasiqCalendarEmits>();
const attrs = useAttrs();
const rootElement = ref<HTMLElement>();
const idPrefix = `basiq-calendar-${useId()}`;
const headingId = `${idPrefix}-heading`;
const headingInstructionId = `${idPrefix}-heading-instruction`;
const view = ref<BasiqCalendarView>("day");
const pickerRevision = ref(0);
let visibleDateRequestId = 0;
const resolvedDirection = useDirection(toRef(props, "dir"));
const runtimeToday = getToday(getLocalTimeZone());
const isValueControlled = hasInitialProp("modelValue");
const isVisibleDateControlled = hasInitialProp("visibleDate");
const initialValue = props.defaultValue ?? props.modelValue ?? null;
const internalValue = shallowRef<CalendarDate | null>(initialValue?.copy() ?? null);
const initialVisibleDate =
  props.visibleDate ??
  props.modelValue ??
  props.defaultVisibleDate ??
  props.defaultValue ??
  props.today ??
  runtimeToday;
const internalVisibleDate = shallowRef<CalendarDate>(
  clampCalendarDate(initialVisibleDate, props.minValue, props.maxValue),
);
const resolvedLabels = computed<BasiqCalendarLabels>(() => ({
  ...defaultCalendarLabels,
  ...props.labels,
}));
const currentValue = computed(() =>
  isValueControlled ? (props.modelValue ?? null) : internalValue.value,
);
const currentVisibleDate = computed(() =>
  isVisibleDateControlled ? (props.visibleDate ?? initialVisibleDate) : internalVisibleDate.value,
);
const todayValue = computed(() => props.today ?? runtimeToday);

watch(
  () => props.modelValue,
  (value) => {
    if (!isValueControlled || !value || isVisibleDateControlled) return;
    setVisibleDate(value);
  },
);

watch([() => props.minValue, () => props.maxValue], () => {
  if (isVisibleDateControlled) return;
  setVisibleDate(currentVisibleDate.value);
});

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  if ((props.modelValue !== undefined) !== isValueControlled) {
    console.warn(
      "[BasiQ UI] BasiqCalendar must not switch modelValue between controlled and uncontrolled state.",
    );
  }
  if ((props.visibleDate !== undefined) !== isVisibleDateControlled) {
    console.warn(
      "[BasiQ UI] BasiqCalendar must not switch visibleDate between controlled and uncontrolled state.",
    );
  }
  if (props.minValue && props.maxValue && props.minValue.compare(props.maxValue) > 0) {
    console.warn("[BasiQ UI] BasiqCalendar minValue must not be after maxValue.");
  }
});

function getOuterAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => key !== "class" && key !== "style" && !key.startsWith("aria-"),
    ),
  );
}

function getPickerAriaAttrs() {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith("aria-")));
}

function normalizeDate(value: DateValue) {
  return toCalendarDate(value).copy();
}

function setModelValue(value: DateValue | undefined) {
  const normalized = value ? normalizeDate(value) : null;

  if (!isValueControlled) internalValue.value = normalized;
  emit("update:modelValue", normalized);
  if (normalized) setVisibleDate(normalized);
}

function setVisibleDate(value: DateValue) {
  const normalized = clampCalendarDate(normalizeDate(value), props.minValue, props.maxValue);

  if (normalized.compare(currentVisibleDate.value) === 0) return;
  if (!isVisibleDateControlled) internalVisibleDate.value = normalized;
  emit("update:visibleDate", normalized);
}

async function requestVisibleDate(value: DateValue): Promise<VisibleDateRequestResult> {
  const requestId = ++visibleDateRequestId;
  const requested = clampCalendarDate(normalizeDate(value), props.minValue, props.maxValue);

  setVisibleDate(requested);
  if (!isVisibleDateControlled) {
    return requestId === visibleDateRequestId ? "accepted" : "superseded";
  }

  await nextTick();
  if (requestId !== visibleDateRequestId) return "superseded";
  return requested.compare(currentVisibleDate.value) === 0 ? "accepted" : "rejected";
}

async function handlePlaceholderChange(value: DateValue) {
  const focusedLabel = rootElement.value?.ownerDocument.activeElement?.getAttribute("aria-label");

  const result = await requestVisibleDate(value);
  if (result !== "rejected") return;

  pickerRevision.value += 1;
  await nextTick();
  if (!focusedLabel) return;
  Array.from(rootElement.value?.querySelectorAll<HTMLElement>("[aria-label]") ?? [])
    .find((element) => element.getAttribute("aria-label") === focusedLabel)
    ?.focus();
}

async function handleMonthSelection(value: DateValue | DateValue[] | undefined) {
  if (!value || Array.isArray(value)) return;

  const selected = normalizeDate(value);
  if ((await requestVisibleDate(selected)) !== "accepted") return;

  view.value = "day";
  await focusCurrentViewCell();
}

async function handleYearSelection(value: DateValue | DateValue[] | undefined) {
  if (!value || Array.isArray(value)) return;

  const selected = normalizeDate(value);
  if ((await requestVisibleDate(selected)) !== "accepted") return;

  view.value = "month";
  await focusCurrentViewCell();
}

async function setView(nextView: BasiqCalendarView) {
  if (props.disabled || view.value === nextView) return;
  view.value = nextView;
  await focusCurrentViewCell();
}

function resolveNavigationLabel(direction: -1 | 1) {
  if (view.value === "day") {
    return direction < 0 ? resolvedLabels.value.previousMonth : resolvedLabels.value.nextMonth;
  }
  if (view.value === "month") {
    return direction < 0 ? resolvedLabels.value.previousYear : resolvedLabels.value.nextYear;
  }
  return direction < 0 ? resolvedLabels.value.previousYears : resolvedLabels.value.nextYears;
}

function resolveFirstDayOfWeek() {
  if (props.weekStartsOn === undefined) return undefined;
  const days: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[props.weekStartsOn];
}

function parseSerializedDate(value: string) {
  return toCalendar(parseDate(value), currentVisibleDate.value.calendar);
}

function isDisabledDate(date: CalendarDate) {
  if (props.minValue && date.compare(props.minValue) < 0) return true;
  if (props.maxValue && date.compare(props.maxValue) > 0) return true;
  return props.isDateDisabled?.(date) ?? false;
}

function resolveDateMatcher(matcher?: BasiqDateMatcher) {
  if (!matcher) return undefined;
  return (value: DateValue) => matcher(normalizeDate(value));
}

function formatLongWeekday(value: DateValue) {
  return new Intl.DateTimeFormat(props.locale, {
    timeZone: "UTC",
    weekday: "long",
  }).format(normalizeDate(value).toDate("UTC"));
}

function handleRootKeydown(event: KeyboardEvent) {
  if (props.disabled) return;

  if (event.key === "Escape" && view.value !== "day") {
    event.preventDefault();
    event.stopPropagation();
    void setView(view.value === "year" ? "month" : "day");
    return;
  }

  if (view.value === "day") handleDayGridKeydown(event);
  else handlePeriodGridKeydown(event);
}

function handleDayGridKeydown(event: KeyboardEvent) {
  const trigger = (event.target as Element | null)?.closest<HTMLElement>(
    "[data-reka-calendar-cell-trigger]",
  );
  const serializedDate = trigger?.dataset.value;
  if (!trigger || !serializedDate) return;

  const date = parseSerializedDate(serializedDate);
  let candidate: CalendarDate | undefined;
  let scanDirection: -1 | 1;

  switch (event.key) {
    case "ArrowLeft":
      scanDirection = resolvedDirection.value === "rtl" ? 1 : -1;
      candidate = date.add({ days: scanDirection });
      break;
    case "ArrowRight":
      scanDirection = resolvedDirection.value === "rtl" ? -1 : 1;
      candidate = date.add({ days: scanDirection });
      break;
    case "ArrowUp":
      scanDirection = -1;
      candidate = date.subtract({ weeks: 1 });
      break;
    case "ArrowDown":
      scanDirection = 1;
      candidate = date.add({ weeks: 1 });
      break;
    case "Home":
      scanDirection = 1;
      candidate = clampCalendarDate(
        normalizeDate(startOfWeek(date, props.locale, resolveFirstDayOfWeek())),
        props.minValue,
        props.maxValue,
      );
      break;
    case "End":
      scanDirection = -1;
      candidate = clampCalendarDate(
        normalizeDate(endOfWeek(date, props.locale, resolveFirstDayOfWeek())),
        props.minValue,
        props.maxValue,
      );
      break;
    case "PageUp":
      scanDirection = -1;
      candidate = date.subtract(event.shiftKey ? { years: 1 } : { months: 1 });
      break;
    case "PageDown":
      scanDirection = 1;
      candidate = date.add(event.shiftKey ? { years: 1 } : { months: 1 });
      break;
    default:
      return;
  }

  event.preventDefault();
  event.stopPropagation();
  const focusable = findFocusableDate(candidate, scanDirection);
  if (focusable) void focusDate(focusable);
}

function handlePeriodGridKeydown(event: KeyboardEvent) {
  if (event.key !== "Home" && event.key !== "End") return;

  const trigger = (event.target as Element | null)?.closest<HTMLElement>(
    "[data-reka-month-picker-cell-trigger], [data-reka-year-picker-cell-trigger]",
  );
  const row = trigger?.closest("tr");
  if (!trigger || !row) return;
  const candidates = Array.from<HTMLElement>(
    row.querySelectorAll(
      "[data-reka-month-picker-cell-trigger]:not([data-disabled]), [data-reka-year-picker-cell-trigger]:not([data-disabled])",
    ),
  );
  const next = event.key === "Home" ? candidates[0] : candidates.at(-1);
  const serializedDate = next?.dataset.value;
  if (!next || !serializedDate) return;

  event.preventDefault();
  event.stopPropagation();
  void focusPeriodDate(parseSerializedDate(serializedDate), next, trigger);
}

async function focusPeriodDate(
  date: CalendarDate,
  nextElement: HTMLElement,
  currentElement: HTMLElement,
) {
  const result = await requestVisibleDate(date);
  if (result === "rejected") {
    currentElement.focus();
    return;
  }
  if (result === "superseded") return;

  await nextTick();
  nextElement.focus();
}

function findFocusableDate(candidate: CalendarDate, direction: -1 | 1) {
  let current = candidate;

  for (let attempts = 0; attempts < 3660; attempts += 1) {
    if (props.minValue && current.compare(props.minValue) < 0) return undefined;
    if (props.maxValue && current.compare(props.maxValue) > 0) return undefined;
    if (!isDisabledDate(current)) return current;
    current = current.add({ days: direction });
  }
  return undefined;
}

async function focusDate(date: CalendarDate) {
  if ((await requestVisibleDate(date)) !== "accepted") return;
  await nextTick();
  await nextTick();
  rootElement.value
    ?.querySelector<HTMLElement>(
      `[data-reka-calendar-cell-trigger][data-value='${date.toString()}']:not([data-outside-view])`,
    )
    ?.focus();
}

async function focusCurrentViewCell() {
  await nextTick();
  const selector =
    view.value === "day"
      ? "[data-reka-calendar-cell-trigger][tabindex='0']"
      : view.value === "month"
        ? "[data-reka-month-picker-cell-trigger][tabindex='0']"
        : "[data-reka-year-picker-cell-trigger][tabindex='0']";
  rootElement.value?.querySelector<HTMLElement>(selector)?.focus();
}
</script>

<template>
  <div
    ref="rootElement"
    v-bind="getOuterAttrs()"
    :class="[$style.root, $attrs.class]"
    :data-disabled="disabled ? '' : undefined"
    :data-readonly="readonly ? '' : undefined"
    :data-view="view"
    :dir="resolvedDirection"
    :style="$attrs.style || null"
    @keydown.capture="handleRootKeydown"
  >
    <CalendarRoot
      v-if="view === 'day'"
      v-bind="getPickerAriaAttrs()"
      :key="pickerRevision"
      v-slot="{ grid, weekDays }"
      :calendar-label="resolvedLabels.calendar"
      :class="$style.picker"
      :dir="resolvedDirection"
      :disabled="disabled"
      fixed-weeks
      :initial-focus="initialFocus"
      :is-date-disabled="resolveDateMatcher(isDateDisabled)"
      :is-date-unavailable="resolveDateMatcher(isDateUnavailable)"
      :locale="locale"
      :max-value="maxValue"
      :min-value="minValue"
      :model-value="currentValue"
      prevent-deselect
      :readonly="readonly"
      :placeholder="currentVisibleDate"
      role="group"
      :week-starts-on="weekStartsOn"
      weekday-format="short"
      @update:model-value="setModelValue"
      @update:placeholder="handlePlaceholderChange"
    >
      <header :class="$style.header">
        <CalendarPrev as-child>
          <button :aria-label="resolveNavigationLabel(-1)" :class="$style.navigation" type="button">
            <BasiqIcon :class="$style['previous-icon']" :icon="BasiqCalendarChevronIcon" />
          </button>
        </CalendarPrev>

        <button
          :aria-labelledby="`${headingId} ${headingInstructionId}`"
          :class="$style.heading"
          :disabled="disabled"
          type="button"
          @click="setView('month')"
        >
          <CalendarHeading :id="headingId" as="span" />
          <span :id="headingInstructionId" :class="$style['visually-hidden']">
            {{ resolvedLabels.chooseMonth }}
          </span>
        </button>

        <CalendarNext as-child>
          <button :aria-label="resolveNavigationLabel(1)" :class="$style.navigation" type="button">
            <BasiqIcon :class="$style['next-icon']" :icon="BasiqCalendarChevronIcon" />
          </button>
        </CalendarNext>
      </header>

      <div :class="$style['visually-hidden']" aria-atomic="true" aria-live="polite">
        <CalendarHeading as="span" />
      </div>

      <table
        v-if="grid[0]"
        :aria-disabled="disabled || undefined"
        :aria-labelledby="headingId"
        :aria-readonly="readonly || undefined"
        :class="$style['day-grid']"
        role="grid"
        tabindex="-1"
      >
        <thead>
          <tr role="row">
            <th
              v-for="(weekDay, index) in weekDays"
              :key="`${weekDay}-${index}`"
              :class="$style.weekday"
              role="columnheader"
              scope="col"
            >
              <abbr :title="formatLongWeekday(grid[0].rows[0][index])">{{ weekDay }}</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(week, weekIndex) in grid[0].rows" :key="weekIndex" role="row">
            <CalendarCell
              v-for="day in week"
              :key="day.toString()"
              :class="$style.cell"
              :date="day"
            >
              <CalendarCellTrigger
                :aria-current="isSameDay(normalizeDate(day), todayValue) ? 'date' : undefined"
                :class="$style['day-trigger']"
                :data-basiq-today="isSameDay(normalizeDate(day), todayValue) ? '' : undefined"
                :data-today="isSameDay(normalizeDate(day), todayValue) ? '' : undefined"
                :day="day"
                :month="grid[0].value"
              />
            </CalendarCell>
          </tr>
        </tbody>
      </table>
    </CalendarRoot>

    <MonthPickerRoot
      v-else-if="view === 'month'"
      v-bind="getPickerAriaAttrs()"
      :key="pickerRevision"
      v-slot="{ grid }"
      :calendar-label="resolvedLabels.chooseMonth"
      :class="$style.picker"
      :dir="resolvedDirection"
      :disabled="disabled"
      initial-focus
      :locale="locale"
      :max-value="maxValue"
      :min-value="minValue"
      :model-value="currentVisibleDate"
      prevent-deselect
      :placeholder="currentVisibleDate"
      role="group"
      @update:model-value="handleMonthSelection"
      @update:placeholder="handlePlaceholderChange"
    >
      <header :class="$style.header">
        <MonthPickerPrev as-child>
          <button :aria-label="resolveNavigationLabel(-1)" :class="$style.navigation" type="button">
            <BasiqIcon :class="$style['previous-icon']" :icon="BasiqCalendarChevronIcon" />
          </button>
        </MonthPickerPrev>

        <button
          :aria-labelledby="`${headingId} ${headingInstructionId}`"
          :class="$style.heading"
          :disabled="disabled"
          type="button"
          @click="setView('year')"
        >
          <MonthPickerHeading :id="headingId" as="span" />
          <span :id="headingInstructionId" :class="$style['visually-hidden']">
            {{ resolvedLabels.chooseYear }}
          </span>
        </button>

        <MonthPickerNext as-child>
          <button :aria-label="resolveNavigationLabel(1)" :class="$style.navigation" type="button">
            <BasiqIcon :class="$style['next-icon']" :icon="BasiqCalendarChevronIcon" />
          </button>
        </MonthPickerNext>
      </header>

      <div :class="$style['visually-hidden']" aria-atomic="true" aria-live="polite">
        <MonthPickerHeading as="span" />
      </div>

      <table
        :aria-disabled="disabled || undefined"
        :aria-labelledby="headingId"
        :class="$style['period-grid']"
        role="grid"
        tabindex="-1"
      >
        <tbody>
          <tr v-for="(row, rowIndex) in grid.rows" :key="rowIndex" role="row">
            <MonthPickerCell
              v-for="month in row"
              :key="month.toString()"
              :class="$style['period-cell']"
              :date="month"
            >
              <MonthPickerCellTrigger
                :aria-current="isSameMonth(normalizeDate(month), todayValue) ? 'date' : undefined"
                :class="$style['period-trigger']"
                :data-basiq-today="isSameMonth(normalizeDate(month), todayValue) ? '' : undefined"
                :data-today="isSameMonth(normalizeDate(month), todayValue) ? '' : undefined"
                :month="month"
              />
            </MonthPickerCell>
          </tr>
        </tbody>
      </table>
    </MonthPickerRoot>

    <YearPickerRoot
      v-else
      v-bind="getPickerAriaAttrs()"
      :key="pickerRevision"
      v-slot="{ grid }"
      :calendar-label="resolvedLabels.chooseYear"
      :class="$style.picker"
      :dir="resolvedDirection"
      :disabled="disabled"
      initial-focus
      :locale="locale"
      :max-value="maxValue"
      :min-value="minValue"
      :model-value="currentVisibleDate"
      prevent-deselect
      :placeholder="currentVisibleDate"
      role="group"
      :years-per-page="12"
      @update:model-value="handleYearSelection"
      @update:placeholder="handlePlaceholderChange"
    >
      <header :class="$style.header">
        <YearPickerPrev as-child>
          <button :aria-label="resolveNavigationLabel(-1)" :class="$style.navigation" type="button">
            <BasiqIcon :class="$style['previous-icon']" :icon="BasiqCalendarChevronIcon" />
          </button>
        </YearPickerPrev>

        <div :id="headingId" :class="$style['static-heading']">
          <YearPickerHeading as="span" />
        </div>

        <YearPickerNext as-child>
          <button :aria-label="resolveNavigationLabel(1)" :class="$style.navigation" type="button">
            <BasiqIcon :class="$style['next-icon']" :icon="BasiqCalendarChevronIcon" />
          </button>
        </YearPickerNext>
      </header>

      <div :class="$style['visually-hidden']" aria-atomic="true" aria-live="polite">
        <YearPickerHeading as="span" />
      </div>

      <table
        :aria-disabled="disabled || undefined"
        :aria-labelledby="headingId"
        :class="$style['period-grid']"
        role="grid"
        tabindex="-1"
      >
        <tbody>
          <tr v-for="(row, rowIndex) in grid.rows" :key="rowIndex" role="row">
            <YearPickerCell
              v-for="year in row"
              :key="year.toString()"
              :class="$style['period-cell']"
              :date="year"
            >
              <YearPickerCellTrigger
                :aria-current="isSameYear(normalizeDate(year), todayValue) ? 'date' : undefined"
                :class="$style['period-trigger']"
                :data-basiq-today="isSameYear(normalizeDate(year), todayValue) ? '' : undefined"
                :data-today="isSameYear(normalizeDate(year), todayValue) ? '' : undefined"
                :year="year"
              />
            </YearPickerCell>
          </tr>
        </tbody>
      </table>
    </YearPickerRoot>
  </div>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: inline-block;
  width: fit-content;
  padding: var(--basiq-space-200);
  border: var(--basiq-border-width-default) solid var(--basiq-color-border-separator);
  border-radius: var(--basiq-radius-md);
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-surface-container);
  font-family: var(--basiq-font-family-sans);
}

.picker {
  display: grid;
  gap: var(--basiq-space-200);
}

.header {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 40px;
  gap: var(--basiq-space-100);
  align-items: center;
}

.navigation,
.heading {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  min-width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--basiq-radius-sm);
  color: inherit;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.navigation {
  font-size: 24px;
}

.heading {
  padding-inline: var(--basiq-space-200);
  font-weight: 700;
}

.static-heading {
  display: grid;
  place-items: center;
  min-width: 0;
  height: 40px;
  font-weight: 700;
}

.next-icon {
  transform: rotate(180deg);
}

.root:dir(rtl) .previous-icon {
  transform: rotate(180deg);
}

.root:dir(rtl) .next-icon {
  transform: none;
}

.day-grid,
.period-grid {
  border-spacing: 0;
  border-collapse: separate;
}

.weekday {
  box-sizing: border-box;
  width: 40px;
  height: 32px;
  padding: 0;
  color: var(--basiq-color-content-subtle);
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
}

.weekday abbr {
  text-decoration: none;
}

.cell,
.period-cell {
  padding: 0;
}

.day-trigger,
.period-trigger {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: var(--basiq-radius-full);
  color: inherit;
  background: transparent;
  cursor: pointer;
  user-select: none;
}

.day-trigger {
  width: 40px;
  height: 40px;
}

.period-trigger {
  width: 68px;
  height: 48px;
  border-radius: var(--basiq-radius-sm);
}

.day-trigger[data-outside-view] {
  color: var(--basiq-color-content-subtle);
}

.day-trigger[data-disabled],
.period-trigger[data-disabled] {
  color: var(--basiq-color-content-disabled);
  cursor: not-allowed;
}

.day-trigger[data-unavailable] {
  color: var(--basiq-color-calendar-unavailable);
  text-decoration: line-through;
  cursor: not-allowed;
}

.day-trigger[data-selected],
.period-trigger[data-selected] {
  color: var(--basiq-color-calendar-cell-selected-content);
  background: var(--basiq-color-calendar-cell-selected);
  font-weight: 700;
}

.day-trigger[data-basiq-today]:not([data-selected]),
.period-trigger[data-basiq-today]:not([data-selected]) {
  box-shadow: inset 0 0 0 var(--basiq-border-width-strong) var(--basiq-color-calendar-today);
  font-weight: 700;
}

.navigation:disabled,
.heading:disabled {
  color: var(--basiq-color-content-disabled);
  cursor: not-allowed;
}

.navigation:focus-visible,
.heading:focus-visible,
.day-trigger:focus-visible,
.period-trigger:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root[data-readonly] .day-trigger {
  cursor: default;
}

.navigation:not(:disabled):hover,
.heading:not(:disabled):hover,
.day-trigger:not([data-disabled], [data-unavailable], [data-selected]):hover,
.period-trigger:not([data-disabled], [data-selected]):hover {
  background: var(--basiq-color-surface-muted);
}

.day-trigger[data-selected]:not([data-disabled], [data-unavailable]):hover,
.period-trigger[data-selected]:not([data-disabled]):hover {
  background: var(--basiq-color-calendar-cell-selected-hover);
}

.navigation:not(:disabled):active,
.heading:not(:disabled):active,
.day-trigger:not([data-disabled], [data-unavailable], [data-selected]):active,
.period-trigger:not([data-disabled], [data-selected]):active {
  background: var(--basiq-color-calendar-cell-pressed);
}

.day-trigger[data-selected]:not([data-disabled], [data-unavailable]):active,
.period-trigger[data-selected]:not([data-disabled]):active {
  background: var(--basiq-color-calendar-cell-selected-pressed);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (forced-colors: active) {
  .navigation:focus-visible,
  .heading:focus-visible,
  .day-trigger:focus-visible,
  .period-trigger:focus-visible {
    outline-color: Highlight;
  }

  .day-trigger[data-selected],
  .period-trigger[data-selected] {
    color: HighlightText;
    background: Highlight;
  }

  .day-trigger[data-disabled],
  .day-trigger[data-unavailable],
  .period-trigger[data-disabled] {
    color: GrayText;
  }

  .day-trigger[data-basiq-today]:not([data-selected]),
  .period-trigger[data-basiq-today]:not([data-selected]) {
    border: var(--basiq-border-width-strong) solid CanvasText;
    box-shadow: none;
  }
}
</style>
