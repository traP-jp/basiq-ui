import { JapaneseCalendar, parseDate, toCalendar } from "@internationalized/date";
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ConfigProvider } from "reka-ui";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { defineComponent, h, shallowRef } from "vue";

import {
  createFixedVueSourceParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqCalendar from "./BasiqCalendar.vue";

const fixedToday = parseDate("2026-09-04");

const ControlledCalendar = defineComponent({
  name: "ControlledCalendar",
  setup() {
    const value = shallowRef(parseDate("2026-09-04"));

    return () =>
      h("div", { class: "basiq-story" }, [
        h(BasiqCalendar, {
          modelValue: value.value,
          today: fixedToday,
          "onUpdate:modelValue": (nextValue) => {
            value.value = nextValue ?? value.value;
          },
        }),
        h("output", { "data-testid": "value" }, value.value.toString()),
      ]);
  },
});

const RejectingCalendar = defineComponent({
  name: "RejectingCalendar",
  setup: () => () =>
    h("div", { class: "basiq-story" }, [
      h(BasiqCalendar, {
        modelValue: fixedToday,
        today: fixedToday,
        "onUpdate:modelValue": () => {},
      }),
    ]),
});

const RejectingVisibleDateCalendar = defineComponent({
  name: "RejectingVisibleDateCalendar",
  setup: () => () =>
    h("div", { class: "basiq-story" }, [
      h(BasiqCalendar, {
        defaultValue: fixedToday,
        today: fixedToday,
        visibleDate: fixedToday,
        "onUpdate:visibleDate": () => {},
      }),
    ]),
});

const JapaneseCalendarHarness = defineComponent({
  name: "JapaneseCalendarHarness",
  setup() {
    const value = shallowRef(toCalendar(fixedToday, new JapaneseCalendar()));

    return () =>
      h("div", { class: "basiq-story" }, [
        h(BasiqCalendar, {
          today: value.value,
          visibleDate: value.value,
          "onUpdate:visibleDate": (nextValue) => {
            value.value = nextValue;
          },
        }),
        h("output", { "data-testid": "calendar-system" }, value.value.calendar.identifier),
      ]);
  },
});

const ProviderRtlCalendar = defineComponent({
  name: "ProviderRtlCalendar",
  setup: () => () =>
    h(ConfigProvider, { dir: "rtl" }, () =>
      h("div", { class: "basiq-story" }, [
        h(BasiqCalendar, {
          defaultValue: fixedToday,
          today: fixedToday,
        }),
      ]),
    ),
});

const meta = {
  title: "Components/Calendar",
  component: BasiqCalendar,
  tags: ["autodocs"],
  args: {
    defaultValue: fixedToday,
    today: fixedToday,
  },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          "`locale` controls date formatting. Accessible UI messages remain Japanese by default and can be translated with `labels`. When `today` is omitted, the local date is captured when the calendar mounts; pass it explicitly during SSR and update it for long-lived views.",
      },
    },
  },
  render: (args) => ({
    components: { BasiqCalendar },
    setup: () => ({ args }),
    template: `<div class="basiq-story"><BasiqCalendar v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof BasiqCalendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqCalendar } from "basiq-ui";
</script>

<template>
  <BasiqCalendar :default-value="parseDate('2026-09-04')" />
</template>
`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("group", { name: /日付を選択, 2026年9月/ })).toBeInTheDocument();
    await expect(canvas.getByRole("grid", { name: "2026年9月" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /月を選択/ })).toHaveTextContent("2026年9月");
    await expect(canvasElement.querySelector("[data-value='2026-09-04']")).toHaveAttribute(
      "data-selected",
    );

    const selected = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-04']")!;
    const unselected = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-05']")!;
    const selectedRestColor = getComputedStyle(selected).color;

    await userEvent.hover(selected);
    const selectedHoverStyle = getComputedStyle(selected);
    const selectedHoverBackground = selectedHoverStyle.backgroundColor;
    await expect(selectedHoverStyle.color).toBe(selectedRestColor);

    await userEvent.unhover(selected);
    await userEvent.hover(unselected);
    await expect(getComputedStyle(unselected).backgroundColor).not.toBe(selectedHoverBackground);
    await userEvent.unhover(unselected);
  },
};

export const Controlled: Story = {
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate, type CalendarDate } from "@internationalized/date";
import { ref } from "vue";
import { BasiqCalendar } from "basiq-ui";

const value = ref<CalendarDate | null>(parseDate("2026-09-04"));
</script>

<template>
  <BasiqCalendar v-model="value" />
</template>
`),
  render: () => ({
    components: { ControlledCalendar },
    template: "<ControlledCalendar />",
  }),
  play: async ({ canvasElement }) => {
    const nextDay = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-05']");

    await userEvent.click(nextDay!);
    await expect(within(canvasElement).getByTestId("value")).toHaveTextContent("2026-09-05");
    await expect(nextDay).toHaveAttribute("data-selected");
  },
};

export const ControlledRejection: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { RejectingCalendar },
    template: "<RejectingCalendar />",
  }),
  play: async ({ canvasElement }) => {
    const selected = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-04']");
    const rejected = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-05']");

    await userEvent.click(rejected!);
    await expect(selected).toHaveAttribute("data-selected");
    await expect(rejected).not.toHaveAttribute("data-selected");
  },
};

export const ControlledVisibleDateRejection: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { RejectingVisibleDateCalendar },
    template: "<RejectingVisibleDateCalendar />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nextMonth = canvas.getByRole("button", { name: "次の月" });
    await userEvent.click(nextMonth);
    await expect(canvas.getByRole("button", { name: /月を選択/ })).toHaveTextContent("2026年9月");
    await expect(canvas.getByRole("button", { name: "次の月" })).toHaveFocus();

    const currentDay = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-04']");
    currentDay?.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(currentDay).toHaveFocus();

    await userEvent.click(canvas.getByRole("button", { name: /月を選択/ }));
    const currentMonth = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-01']");
    await expect(currentMonth).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(currentMonth).toHaveFocus();

    await userEvent.click(currentMonth!);
    const rapidNextMonth = canvas.getByRole("button", { name: "次の月" });
    rapidNextMonth.click();
    rapidNextMonth.click();
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: /月を選択/ })).toHaveTextContent("2026年9月"),
    );
  },
};

export const MonthAndYearNavigation: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: /月を選択/ }));
    await expect(
      canvasElement.querySelector("[data-reka-month-picker-cell-trigger]"),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("grid", { name: "2026年" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /年を選択/ }));
    await expect(
      canvasElement.querySelector("[data-reka-year-picker-cell-trigger]"),
    ).toBeInTheDocument();

    const year = canvasElement.querySelector<HTMLElement>("[data-value='2027-01-01']");
    await userEvent.click(year!);
    await expect(
      canvasElement.querySelector("[data-reka-month-picker-cell-trigger]"),
    ).toBeInTheDocument();

    const december = canvasElement.querySelector<HTMLElement>("[data-value='2027-12-01']");
    await userEvent.click(december!);
    await expect(canvas.getByRole("button", { name: /月を選択/ })).toHaveTextContent("2027年12月");
  },
};

export const LargeYearNavigation: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: /月を選択/ }));
    await userEvent.click(canvas.getByRole("button", { name: /年を選択/ }));
    await expect(canvasElement.querySelector("[data-value='2020-01-01']")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "次の12年間" }));
    await expect(canvasElement.querySelector("[data-value='2032-01-01']")).toBeInTheDocument();
    await expect(canvasElement.querySelector("[data-value='2020-01-01']")).not.toBeInTheDocument();
  },
};

export const KeyboardNavigation: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const initial = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-04']");

    initial?.focus();
    await userEvent.keyboard("{Home}");
    await expect(canvasElement.querySelector("[data-value='2026-08-30']")).toHaveFocus();
    await userEvent.keyboard("{PageDown}");
    await expect(canvasElement.querySelector("[data-value='2026-09-30']")).toHaveFocus();
    await userEvent.keyboard("{Shift>}{PageDown}{/Shift}");
    await expect(canvasElement.querySelector("[data-value='2027-09-30']")).toHaveFocus();
  },
};

export const KeyboardNavigationWithinBounds: Story = {
  tags: ["regression", "!autodocs"],
  args: {
    maxValue: parseDate("2026-09-04"),
    minValue: parseDate("2026-09-02"),
  },
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const middle = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-03']")!;

    middle.focus();
    await userEvent.keyboard("{Home}");
    await expect(canvasElement.querySelector("[data-value='2026-09-02']")).toHaveFocus();

    middle.focus();
    await userEvent.keyboard("{End}");
    await expect(canvasElement.querySelector("[data-value='2026-09-04']")).toHaveFocus();
  },
};

export const ForwardedAriaAttributes: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqCalendar },
    setup: () => ({ fixedToday }),
    template: `
      <div class="basiq-story">
        <p id="calendar-description">予約可能な日付を選択してください。</p>
        <BasiqCalendar
          aria-label="予約日"
          aria-describedby="calendar-description"
          :default-value="fixedToday"
          :today="fixedToday"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    let calendar = canvas.getByRole("group", { name: "予約日" });

    await expect(calendar).toHaveAccessibleDescription("予約可能な日付を選択してください。");
    await expect(calendar.parentElement).not.toHaveAttribute("aria-label");
    await expect(calendar.parentElement).not.toHaveAttribute("aria-describedby");

    await userEvent.click(canvas.getByRole("button", { name: /月を選択/ }));
    calendar = canvas.getByRole("group", { name: "予約日" });
    await expect(calendar).toHaveAccessibleDescription("予約可能な日付を選択してください。");

    await userEvent.click(canvas.getByRole("button", { name: /年を選択/ }));
    calendar = canvas.getByRole("group", { name: "予約日" });
    await expect(calendar).toHaveAccessibleDescription("予約可能な日付を選択してください。");
  },
};

export const Restrictions: Story = {
  args: {
    defaultValue: parseDate("2026-09-10"),
    isDateDisabled: (date) => date.day === 14,
    isDateUnavailable: (date) => date.day === 18,
    maxValue: parseDate("2026-10-20"),
    minValue: parseDate("2026-09-10"),
  },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqCalendar } from "basiq-ui";
</script>

<template>
  <BasiqCalendar
    :default-value="parseDate('2026-09-10')"
    :min-value="parseDate('2026-09-10')"
    :max-value="parseDate('2026-10-20')"
    :is-date-disabled="date => date.day === 14"
    :is-date-unavailable="date => date.day === 18"
  />
</template>
`),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("[data-value='2026-09-09']")).toHaveAttribute(
      "data-disabled",
    );
    await expect(canvasElement.querySelector("[data-value='2026-09-14']")).toHaveAttribute(
      "data-disabled",
    );
    await expect(canvasElement.querySelector("[data-value='2026-09-18']")).toHaveAttribute(
      "data-unavailable",
    );

    const unavailable = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-18']");
    await userEvent.click(unavailable!);
    await expect(canvasElement.querySelector("[data-value='2026-09-10']")).toHaveAttribute(
      "data-selected",
    );

    const beforeDisabled = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-13']");
    beforeDisabled?.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvasElement.querySelector("[data-value='2026-09-15']")).toHaveFocus();
  },
};

export const LocaleAndWeekStart: Story = {
  args: {
    locale: "ja-JP",
    weekStartsOn: 1,
  },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqCalendar } from "basiq-ui";
</script>

<template>
  <BasiqCalendar
    :default-value="parseDate('2026-09-04')"
    locale="ja-JP"
    :week-starts-on="1"
  />
</template>
`),
  play: async ({ canvasElement }) => {
    const headers = within(canvasElement).getAllByRole("columnheader");
    await expect(headers[0]).toHaveTextContent("月");
    await expect(headers[0].querySelector("abbr")).toHaveAttribute("title", "月曜日");
  },
};

export const Readonly: Story = {
  args: { readonly: true },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqCalendar } from "basiq-ui";
</script>

<template>
  <BasiqCalendar :default-value="parseDate('2026-09-04')" readonly />
</template>
`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("grid", { name: "2026年9月" })).toHaveAttribute(
      "aria-readonly",
      "true",
    );

    await userEvent.click(canvasElement.querySelector<HTMLElement>("[data-value='2026-09-05']")!);
    await expect(canvasElement.querySelector("[data-value='2026-09-04']")).toHaveAttribute(
      "data-selected",
    );

    await userEvent.click(canvas.getByRole("button", { name: "次の月" }));
    await expect(canvas.getByRole("button", { name: /月を選択/ })).toHaveTextContent("2026年10月");
  },
};

export const RightToLeft: Story = {
  args: { dir: "rtl" },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqCalendar } from "basiq-ui";
</script>

<template>
  <BasiqCalendar :default-value="parseDate('2026-09-04')" dir="rtl" />
</template>
`),
  play: async ({ canvasElement }) => {
    const initial = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-04']");
    initial?.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(canvasElement.querySelector("[data-value='2026-09-05']")).toHaveFocus();

    const previousIcon = within(canvasElement)
      .getByRole("button", { name: "前の月" })
      .querySelector("svg");
    const nextIcon = within(canvasElement)
      .getByRole("button", { name: "次の月" })
      .querySelector("svg");
    await expect(getComputedStyle(previousIcon!).transform).not.toBe("none");
    await expect(getComputedStyle(nextIcon!).transform).toBe("none");
  },
};

export const InheritedRightToLeft: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ProviderRtlCalendar },
    template: "<ProviderRtlCalendar />",
  }),
  play: async ({ canvasElement }) => {
    const initial = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-04']");
    await expect(canvasElement.querySelector("[data-view='day']")).toHaveAttribute("dir", "rtl");

    initial?.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(canvasElement.querySelector("[data-value='2026-09-05']")).toHaveFocus();
  },
};

export const PreservesCalendarSystem: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { JapaneseCalendarHarness },
    template: "<JapaneseCalendarHarness />",
  }),
  play: async ({ canvasElement }) => {
    const initial = canvasElement.querySelector<HTMLElement>("[data-value='2026-09-04']");
    initial?.focus();
    await userEvent.keyboard("{ArrowRight}");

    await expect(canvasElement.querySelector("[data-value='2026-09-05']")).toHaveFocus();
    await expect(within(canvasElement).getByTestId("calendar-system")).toHaveTextContent(
      "japanese",
    );
  },
};

export const MonthReferenceToday: Story = {
  args: { today: parseDate("2026-11-10") },
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /月を選択/ }));

    const referenceMonth = canvasElement.querySelector("[data-value='2026-11-01']");
    const runtimeMonth = canvasElement.querySelector("[data-value='2026-09-01']");
    await expect(referenceMonth).toHaveAttribute("data-today");
    await expect(referenceMonth).toHaveAttribute("aria-current", "date");
    await expect(runtimeMonth).not.toHaveAttribute("data-today");
    await expect(runtimeMonth).not.toHaveAttribute("aria-current");
  },
};

export const YearReferenceToday: Story = {
  args: { today: parseDate("2027-11-10") },
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /月を選択/ }));
    await userEvent.click(canvas.getByRole("button", { name: /年を選択/ }));

    const referenceYear = canvasElement.querySelector("[data-value='2027-01-01']");
    const runtimeYear = canvasElement.querySelector("[data-value='2026-01-01']");
    await expect(referenceYear).toHaveAttribute("data-today");
    await expect(referenceYear).toHaveAttribute("aria-current", "date");
    await expect(runtimeYear).not.toHaveAttribute("data-today");
    await expect(runtimeYear).not.toHaveAttribute("aria-current");
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: createFixedVueSourceParameters(`
<script setup lang="ts">
import { parseDate } from "@internationalized/date";
import { BasiqCalendar } from "basiq-ui";
</script>

<template>
  <BasiqCalendar :default-value="parseDate('2026-09-04')" disabled />
</template>
`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "前の月" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /月を選択/ })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "次の月" })).toBeDisabled();
    await expect(canvas.getByRole("grid", { name: "2026年9月" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
};
