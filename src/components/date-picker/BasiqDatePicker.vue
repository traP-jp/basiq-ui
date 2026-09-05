<script setup lang="ts">
import type { CalendarDate } from "@internationalized/date";
import {
  ConfigProvider,
  PopoverAnchor,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
  useDirection,
} from "reka-ui";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  shallowRef,
  toRef,
  useAttrs,
  useId,
  watch,
  watchEffect,
} from "vue";

import BasiqCalendar, {
  type BasiqCalendarDirection,
  type BasiqCalendarLabels,
  type BasiqDateMatcher,
  type BasiqWeekStartsOn,
} from "../calendar/BasiqCalendar.vue";
import { hasInitialProp } from "../controllable-state/hasInitialProp";
import { useFormFieldControl } from "../form-field/useFormFieldControl";
import BasiqIcon from "../icon/BasiqIcon.vue";
import type { BasiqPortalTarget } from "../overlay/overlayContext";
import { useOverlayPortal } from "../overlay/useOverlayPortal";
import BasiqDatePickerCalendarIcon from "./BasiqDatePickerCalendarIcon.vue";
import {
  formatDateInput,
  parseDateInput,
  toGregorianDate,
  validateDate,
  type BasiqDatePickerValidationReason,
} from "./datePickerDate";
import { defaultDatePickerLabels, type BasiqDatePickerLabels } from "./datePickerLabels";

defineOptions({ inheritAttrs: false });

export type { BasiqDatePickerLabels } from "./datePickerLabels";
export type { BasiqDatePickerValidationReason } from "./datePickerDate";
export type BasiqDatePickerSize = "lg" | "md" | "sm";

export type BasiqDatePickerValidationState =
  | { reason: null; status: "pending" }
  | { reason: null; status: "valid" }
  | { reason: BasiqDatePickerValidationReason; status: "invalid" };

export interface BasiqDatePickerValidationMessageSlotProps {
  message: string;
  reason: BasiqDatePickerValidationReason;
}

export interface BasiqDatePickerProps {
  autocomplete?: string;
  closeOnSelect?: boolean;
  defaultOpen?: boolean;
  defaultValue?: CalendarDate | null;
  dir?: BasiqCalendarDirection;
  disabled?: boolean;
  form?: string;
  id?: string;
  invalid?: boolean;
  isDateDisabled?: BasiqDateMatcher;
  isDateUnavailable?: BasiqDateMatcher;
  labels?: Partial<Omit<BasiqDatePickerLabels, "calendar" | "validation">> & {
    calendar?: Partial<BasiqCalendarLabels>;
    validation?: Partial<BasiqDatePickerLabels["validation"]>;
  };
  locale?: string;
  maxValue?: CalendarDate;
  minValue?: CalendarDate;
  modelValue?: CalendarDate | null;
  name?: string;
  open?: boolean;
  placeholder?: string;
  /** The Portal target resolved when the DatePicker mounts. Keep it stable while mounted. */
  portalTarget?: BasiqPortalTarget;
  readonly?: boolean;
  required?: boolean;
  size?: BasiqDatePickerSize;
  /** Reference date used by the calendar. Defaults to the local date captured when the calendar mounts. Pass explicitly during SSR and update it for long-lived views. */
  today?: CalendarDate;
  weekStartsOn?: BasiqWeekStartsOn;
}

export interface BasiqDatePickerEmits {
  blur: [event: FocusEvent];
  change: [event: Event];
  focus: [event: FocusEvent];
  input: [event: Event];
  invalid: [event: Event];
  "update:modelValue": [value: CalendarDate | null];
  "update:open": [value: boolean];
  validationChange: [state: BasiqDatePickerValidationState];
}

const props = withDefaults(defineProps<BasiqDatePickerProps>(), {
  closeOnSelect: true,
  defaultOpen: false,
  defaultValue: null,
  disabled: false,
  invalid: undefined,
  labels: undefined,
  locale: "ja-JP",
  modelValue: undefined,
  open: undefined,
  placeholder: "yyyy/mm/dd",
  portalTarget: undefined,
  readonly: false,
  required: undefined,
  size: "md",
  weekStartsOn: undefined,
});
const emit = defineEmits<BasiqDatePickerEmits>();
defineSlots<{
  "validation-message"?: (props: BasiqDatePickerValidationMessageSlotProps) => unknown;
}>();
const attrs = useAttrs();
const inputElement = ref<HTMLInputElement | null>(null);
const contentViewportElement = ref<HTMLElement | null>(null);
const contentViewportInnerElement = ref<HTMLElement | null>(null);
const isContentViewportScrollable = ref(false);
const resolvedDirection = useDirection(toRef(props, "dir"));
const isValueControlled = hasInitialProp("modelValue");
const isOpenControlled = hasInitialProp("open");
const resetValue = toNullableGregorianDate(
  hasInitialProp("defaultValue") ? (props.defaultValue ?? null) : (props.modelValue ?? null),
);
const internalValue = shallowRef<CalendarDate | null>(resetValue);
const internalOpen = ref(props.defaultOpen);
const currentValue = computed(() =>
  isValueControlled ? toNullableGregorianDate(props.modelValue ?? null) : internalValue.value,
);
const currentOpen = computed(() => (isOpenControlled ? (props.open ?? false) : internalOpen.value));
const effectiveOpen = computed(() => !props.disabled && currentOpen.value);
const textValue = ref(formatDateInput(currentValue.value));
const dirty = ref(false);
const isComposing = ref(false);
const baseId = `basiq-date-picker-${useId()}`;
const triggerLabelId = `${baseId}-trigger-label`;
const validationMessageId = `${baseId}-validation`;
const resolvedLabels = computed<BasiqDatePickerLabels>(() => ({
  ...defaultDatePickerLabels,
  ...props.labels,
  calendar: {
    ...defaultDatePickerLabels.calendar,
    ...props.labels?.calendar,
  },
  validation: {
    ...defaultDatePickerLabels.validation,
    ...props.labels?.validation,
  },
}));
const portalTarget = toRef(props, "portalTarget");
const { contentStyle, target, themeMode } = useOverlayPortal({
  open: effectiveOpen,
  portalTarget,
});
const {
  resolveAriaDescribedBy,
  resolveAriaInvalid,
  resolveInvalid,
  resolvedId,
  resolvedLabelId,
  resolvedRequired,
} = useFormFieldControl({ componentName: "BasiqDatePicker", props });
const normalizedMinValue = computed(() =>
  props.minValue ? toGregorianDate(props.minValue) : undefined,
);
const normalizedMaxValue = computed(() =>
  props.maxValue ? toGregorianDate(props.maxValue) : undefined,
);
const normalizedToday = computed(() => (props.today ? toGregorianDate(props.today) : undefined));
const parsedText = computed(() => parseDateInput(textValue.value));
const submissionReason = computed<BasiqDatePickerValidationReason | null>(() => {
  const result = parsedText.value;
  if (result.status === "invalid") return result.reason;
  if (result.status === "empty") return resolvedRequired.value ? "required" : null;
  return validateCurrentDate(result.value);
});
const formValue = computed(() => (dirty.value ? "" : (currentValue.value?.toString() ?? "")));
const validationState = ref<BasiqDatePickerValidationState>(
  currentValue.value
    ? toValidationState(validateCurrentDate(currentValue.value))
    : resolvedRequired.value
      ? { reason: null, status: "pending" }
      : { reason: null, status: "valid" },
);
const validationReason = computed(() =>
  !props.disabled && validationState.value.status === "invalid"
    ? validationState.value.reason
    : null,
);
const validationMessage = computed(() =>
  validationReason.value ? resolvedLabels.value.validation[validationReason.value] : "",
);
const externallyInvalid = computed(() => resolveInvalid());
const effectiveInvalid = computed(
  () => externallyInvalid.value || (!props.disabled && validationState.value.status === "invalid"),
);
const triggerAriaLabel = computed(() => {
  const explicitLabel = attrs["aria-label"];
  const explicitLabelledBy = attrs["aria-labelledby"];
  if (typeof explicitLabelledBy === "string" && explicitLabelledBy.trim() !== "") {
    return undefined;
  }
  if (typeof explicitLabel === "string" && explicitLabel.trim() !== "") {
    return `${explicitLabel} ${resolvedLabels.value.trigger}`;
  }
  return resolvedLabelId.value ? undefined : resolvedLabels.value.trigger;
});
const triggerAriaLabelledBy = computed(() => {
  const explicitLabelledBy = attrs["aria-labelledby"];
  const labelIds =
    typeof explicitLabelledBy === "string" && explicitLabelledBy.trim() !== ""
      ? explicitLabelledBy
      : resolvedLabelId.value;
  return labelIds ? mergeAriaIds(labelIds, triggerLabelId) : undefined;
});
let owningForm: HTMLFormElement | null = null;
let valueRequestId = 0;
let openRequestId = 0;
let focusInputAfterClose = false;
let activeCommit: Promise<boolean> | null = null;
let bypassNextSubmit = false;
let contentViewportResizeObserver: ResizeObserver | undefined;

function updateContentViewportScrollable() {
  const viewport = contentViewportElement.value;
  isContentViewportScrollable.value = Boolean(
    viewport &&
    (viewport.scrollHeight > viewport.clientHeight || viewport.scrollWidth > viewport.clientWidth),
  );
}

async function observeContentViewport() {
  await nextTick();
  contentViewportResizeObserver?.disconnect();
  updateContentViewportScrollable();
  if (contentViewportElement.value) {
    contentViewportResizeObserver?.observe(contentViewportElement.value);
  }
  if (contentViewportInnerElement.value) {
    contentViewportResizeObserver?.observe(contentViewportInnerElement.value);
  }
}

onMounted(() => {
  syncOwningForm();
  syncCustomValidity();
  if (typeof ResizeObserver === "undefined") return;

  contentViewportResizeObserver = new ResizeObserver(updateContentViewportScrollable);
  if (effectiveOpen.value) void observeContentViewport();
});
onUpdated(syncOwningForm);
onBeforeUnmount(() => {
  disconnectOwningForm();
  contentViewportResizeObserver?.disconnect();
});

watch(
  effectiveOpen,
  (open) => {
    if (open) {
      void observeContentViewport();
    } else {
      contentViewportResizeObserver?.disconnect();
      isContentViewportScrollable.value = false;
    }
  },
  { flush: "post" },
);

watch(
  () => props.modelValue,
  (value, previousValue) => {
    if (!isValueControlled) return;
    if (
      datesEqual(
        toNullableGregorianDate(value ?? null),
        toNullableGregorianDate(previousValue ?? null),
      )
    ) {
      return;
    }
    syncTextToCurrentValue();
  },
);

watch(
  [
    currentValue,
    normalizedMinValue,
    normalizedMaxValue,
    () => props.isDateDisabled,
    () => props.isDateUnavailable,
    resolvedRequired,
    () => props.disabled,
  ],
  () => {
    if (dirty.value) {
      setValidationState({ reason: null, status: "pending" });
    } else {
      syncValidationToCurrentValue();
    }
    syncCustomValidity();
  },
);

watch([submissionReason, resolvedLabels, () => props.disabled], syncCustomValidity, {
  flush: "post",
});

watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled || !currentOpen.value) return;
    focusInputAfterClose = false;
    void requestOpen(false);
  },
);

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  if ((props.modelValue !== undefined) !== isValueControlled) {
    console.warn(
      "[BasiQ UI] BasiqDatePicker must not switch modelValue between controlled and uncontrolled state.",
    );
  }
  if ((props.open !== undefined) !== isOpenControlled) {
    console.warn(
      "[BasiQ UI] BasiqDatePicker must not switch open between controlled and uncontrolled state.",
    );
  }
});

function toNullableGregorianDate(value: CalendarDate | null) {
  return value ? toGregorianDate(value) : null;
}

function datesEqual(left: CalendarDate | null, right: CalendarDate | null) {
  if (!left || !right) return left === right;
  return left.compare(right) === 0;
}

function validateCurrentDate(value: CalendarDate) {
  return validateDate(value, {
    isDateDisabled: props.isDateDisabled,
    isDateUnavailable: props.isDateUnavailable,
    maxValue: props.maxValue,
    minValue: props.minValue,
  });
}

function toValidationState(
  reason: BasiqDatePickerValidationReason | null,
): BasiqDatePickerValidationState {
  return reason ? { reason, status: "invalid" } : { reason: null, status: "valid" };
}

function setValidationState(state: BasiqDatePickerValidationState) {
  if (
    validationState.value.status === state.status &&
    validationState.value.reason === state.reason
  ) {
    return;
  }

  validationState.value = state;
  emit("validationChange", state);
}

function syncCustomValidity() {
  const reason = props.disabled ? null : submissionReason.value;
  inputElement.value?.setCustomValidity(reason ? resolvedLabels.value.validation[reason] : "");
}

function mergeAriaIds(...values: Array<string | undefined>) {
  const ids = values
    .flatMap((value) => value?.split(/\s+/) ?? [])
    .filter((value, index, allValues) => value !== "" && allValues.indexOf(value) === index);
  return ids.join(" ") || undefined;
}

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) =>
        key !== "aria-describedby" &&
        key !== "aria-invalid" &&
        key !== "class" &&
        key !== "style" &&
        key !== "type" &&
        key !== "value",
    ),
  );
}

function resolveInputAriaInvalid() {
  return !props.disabled && validationState.value.status === "invalid"
    ? "true"
    : resolveAriaInvalid();
}

function resolveInputAriaDescribedBy() {
  return mergeAriaIds(
    resolveAriaDescribedBy(),
    validationReason.value ? validationMessageId : undefined,
  );
}

function syncTextToCurrentValue() {
  textValue.value = formatDateInput(currentValue.value);
  dirty.value = false;
  syncValidationToCurrentValue();
  syncCustomValidity();
}

function syncValidationToCurrentValue() {
  if (currentValue.value) {
    setValidationState(toValidationState(validateCurrentDate(currentValue.value)));
    return;
  }

  setValidationState(
    resolvedRequired.value
      ? { reason: null, status: "pending" }
      : { reason: null, status: "valid" },
  );
}

async function requestValue(value: CalendarDate | null) {
  const requestId = ++valueRequestId;
  const normalized = toNullableGregorianDate(value);

  if (!isValueControlled) internalValue.value = normalized;
  emit("update:modelValue", normalized);
  await nextTick();

  return requestId === valueRequestId && datesEqual(currentValue.value, normalized);
}

async function commitText() {
  const result = parsedText.value;

  if (result.status === "invalid") {
    setValidationState(toValidationState(result.reason));
    return false;
  }

  if (result.status === "empty") {
    if (resolvedRequired.value) {
      setValidationState(toValidationState("required"));
      return false;
    }

    if (!(await requestValue(null))) {
      syncTextToCurrentValue();
      return false;
    }

    textValue.value = "";
    dirty.value = false;
    setValidationState(toValidationState(null));
    syncCustomValidity();
    return true;
  }

  const reason = validateCurrentDate(result.value);
  if (reason) {
    setValidationState(toValidationState(reason));
    return false;
  }

  if (!(await requestValue(result.value))) {
    syncTextToCurrentValue();
    return false;
  }

  textValue.value = formatDateInput(result.value);
  dirty.value = false;
  setValidationState(toValidationState(null));
  syncCustomValidity();
  return true;
}

function requestTextCommit() {
  if (activeCommit) return activeCommit;

  const commit = commitText().finally(() => {
    if (activeCommit === commit) activeCommit = null;
  });
  activeCommit = commit;
  return commit;
}

function revertText() {
  syncTextToCurrentValue();
}

async function requestOpen(value: boolean) {
  const requestId = ++openRequestId;
  if (value && props.disabled) return false;
  if (!isOpenControlled) internalOpen.value = value;
  emit("update:open", value);
  await nextTick();

  return requestId === openRequestId && currentOpen.value === value;
}

function setOpen(value: boolean) {
  void requestOpen(value);
}

function handleInput(event: Event) {
  textValue.value = (event.currentTarget as HTMLInputElement).value;
  dirty.value = textValue.value !== formatDateInput(currentValue.value);
  if (dirty.value) setValidationState({ reason: null, status: "pending" });
  else syncValidationToCurrentValue();
  syncCustomValidity();
  emit("input", event);
}

function handleChange(event: Event) {
  void requestTextCommit();
  emit("change", event);
}

function handleFocus(event: FocusEvent) {
  emit("focus", event);
}

function handleBlur(event: FocusEvent) {
  emit("blur", event);
}

function handleInvalid(event: Event) {
  if (submissionReason.value) setValidationState(toValidationState(submissionReason.value));
  emit("invalid", event);
}

async function handleKeydown(event: KeyboardEvent) {
  if (isComposing.value || event.isComposing) return;

  if (event.key === "Enter") {
    if (inputElement.value?.form) {
      void requestTextCommit();
      return;
    }
    event.preventDefault();
    await requestTextCommit();
    return;
  }
  if (event.key === "Escape" && dirty.value) {
    event.preventDefault();
    revertText();
    return;
  }
}

function handleCompositionStart() {
  isComposing.value = true;
}

function handleCompositionEnd() {
  isComposing.value = false;
  syncCustomValidity();
}

async function handleCalendarValue(value: CalendarDate | null) {
  if (!value) return;
  const normalized = toGregorianDate(value);
  if (!(await requestValue(normalized))) return;

  textValue.value = formatDateInput(normalized);
  dirty.value = false;
  setValidationState(toValidationState(null));
  syncCustomValidity();
  if (props.closeOnSelect) {
    focusInputAfterClose = true;
    if (!(await requestOpen(false))) focusInputAfterClose = false;
  }
}

function handleCloseAutoFocus(event: Event) {
  const shouldFocusInput = focusInputAfterClose && !props.disabled;
  focusInputAfterClose = false;
  if (!shouldFocusInput) return;

  event.preventDefault();
  inputElement.value?.focus();
}

function syncOwningForm() {
  const nextOwningForm = inputElement.value?.form ?? null;
  if (nextOwningForm === owningForm) return;

  disconnectOwningForm();
  owningForm = nextOwningForm;
  owningForm?.addEventListener("reset", handleFormReset);
  owningForm?.addEventListener("submit", handleFormSubmit, true);
}

function disconnectOwningForm() {
  owningForm?.removeEventListener("reset", handleFormReset);
  owningForm?.removeEventListener("submit", handleFormSubmit, true);
  owningForm = null;
}

function submitSkipsValidation(event: SubmitEvent) {
  const submitter = event.submitter as HTMLButtonElement | HTMLInputElement | null;
  return Boolean(owningForm?.noValidate || submitter?.formNoValidate);
}

async function handleFormSubmit(event: SubmitEvent) {
  if (bypassNextSubmit) {
    bypassNextSubmit = false;
    return;
  }
  if (event.defaultPrevented || !dirty.value) return;
  if (submissionReason.value && submitSkipsValidation(event)) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const form = event.currentTarget as HTMLFormElement;
  const submitter = event.submitter as HTMLButtonElement | HTMLInputElement | null;

  if (!(await requestTextCommit())) {
    inputElement.value?.focus();
    return;
  }

  bypassNextSubmit = true;
  try {
    form.requestSubmit(submitter ?? undefined);
  } finally {
    bypassNextSubmit = false;
  }
}

function handleFormReset(event: Event) {
  queueMicrotask(() => {
    if (event.defaultPrevented) return;
    void resetAfterNativeFormReset();
  });
}

async function resetAfterNativeFormReset() {
  if (!(await requestValue(resetValue))) {
    syncTextToCurrentValue();
  } else {
    textValue.value = formatDateInput(resetValue);
    dirty.value = false;
    syncValidationToCurrentValue();
    syncCustomValidity();
  }

  focusInputAfterClose = false;
  await requestOpen(false);
}
</script>

<template>
  <ConfigProvider :dir="resolvedDirection">
    <PopoverRoot :open="effectiveOpen" @update:open="setOpen">
      <PopoverAnchor as-child>
        <div
          :class="[$style.root, $attrs.class]"
          :data-disabled="disabled ? '' : undefined"
          :data-invalid="effectiveInvalid ? '' : undefined"
          :data-readonly="readonly ? '' : undefined"
          :data-size="size"
          :dir="resolvedDirection"
          :style="$attrs.style"
        >
          <input
            ref="inputElement"
            v-bind="getForwardedAttrs()"
            :id="resolvedId"
            :class="$style.input"
            :aria-describedby="resolveInputAriaDescribedBy()"
            :aria-invalid="resolveInputAriaInvalid()"
            :autocomplete="autocomplete"
            :disabled="disabled"
            dir="ltr"
            :form="form"
            inputmode="numeric"
            :maxlength="10"
            :placeholder="placeholder"
            :readonly="readonly"
            :required="resolvedRequired"
            type="text"
            :value="textValue"
            @blur="handleBlur"
            @change="handleChange"
            @compositionend="handleCompositionEnd"
            @compositionstart="handleCompositionStart"
            @focus="handleFocus"
            @input="handleInput"
            @invalid="handleInvalid"
            @keydown="handleKeydown"
          />

          <PopoverTrigger as-child>
            <button
              :aria-label="triggerAriaLabel"
              :aria-labelledby="triggerAriaLabelledBy"
              :class="$style.trigger"
              :disabled="disabled"
              type="button"
            >
              <BasiqIcon :icon="BasiqDatePickerCalendarIcon" />
              <span :id="triggerLabelId" :class="$style['visually-hidden']">
                {{ resolvedLabels.trigger }}
              </span>
            </button>
          </PopoverTrigger>

          <input
            v-if="name"
            :disabled="disabled"
            :form="form"
            :name="name"
            type="hidden"
            :value="formValue"
          />
        </div>
      </PopoverAnchor>

      <PopoverPortal defer :to="target">
        <PopoverContent
          align="start"
          :class="$style.content"
          :collision-padding="8"
          :data-basiq-theme="themeMode"
          :side-offset="8"
          :style="contentStyle"
          @close-auto-focus="handleCloseAutoFocus"
        >
          <div
            ref="contentViewportElement"
            :class="$style['content-viewport']"
            :tabindex="isContentViewportScrollable ? 0 : undefined"
          >
            <div ref="contentViewportInnerElement">
              <BasiqCalendar
                :dir="resolvedDirection"
                :disabled="disabled"
                initial-focus
                :is-date-disabled="isDateDisabled"
                :is-date-unavailable="isDateUnavailable"
                :locale="locale"
                :labels="resolvedLabels.calendar"
                :max-value="normalizedMaxValue"
                :min-value="normalizedMinValue"
                :model-value="currentValue"
                :readonly="readonly"
                :today="normalizedToday"
                :week-starts-on="weekStartsOn"
                @update:model-value="handleCalendarValue"
              />
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

    <p
      :id="validationMessageId"
      aria-atomic="true"
      aria-live="polite"
      :class="$style['validation-message']"
      :data-visible="validationReason ? '' : undefined"
    >
      <slot
        v-if="validationReason"
        name="validation-message"
        :message="validationMessage"
        :reason="validationReason"
      >
        {{ validationMessage }}
      </slot>
    </p>
  </ConfigProvider>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: inline-flex;
  width: 100%;
  min-width: 0;
  height: 40px;
  overflow: hidden;
  border: var(--basiq-border-width-strong) solid var(--basiq-color-text-control-border);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-text-control-content);
  background: var(--basiq-color-text-control-background);
  font-family: var(--basiq-font-family-sans);
}

.root[data-size="sm"] {
  height: 36px;
}

.root[data-size="lg"] {
  height: 44px;
}

.root:focus-within {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root[data-invalid] {
  border-color: var(--basiq-color-text-control-border-invalid);
}

.root[data-disabled] {
  border-color: var(--basiq-color-text-control-border-disabled);
  color: var(--basiq-color-content-disabled);
  background: var(--basiq-color-text-control-background-disabled);
}

.input {
  box-sizing: border-box;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  padding: 0 var(--basiq-space-300);
  border: 0;
  outline: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  appearance: none;
}

.input::placeholder {
  color: var(--basiq-color-text-control-placeholder);
  opacity: 1;
}

.input:disabled {
  cursor: not-allowed;
}

.trigger {
  box-sizing: border-box;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 40px;
  padding: 0;
  border: 0;
  border-inline-start: var(--basiq-border-width-default) solid var(--basiq-color-border-separator);
  color: inherit;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
}

.trigger:focus-visible {
  outline: 0;
}

.trigger:disabled {
  color: var(--basiq-color-content-disabled);
  cursor: not-allowed;
}

.trigger:not(:disabled):hover {
  background: var(--basiq-color-surface-muted);
}

.trigger:not(:disabled):active {
  background: var(--basiq-color-calendar-cell-pressed);
}

.content {
  box-sizing: border-box;
  display: flex;
  max-width: var(--reka-popover-content-available-width);
  max-height: var(--reka-popover-content-available-height);
  overflow: visible;
  outline: 0;
  filter: drop-shadow(0 8px 16px rgb(13 18 23 / 20%));
  animation: basiq-date-picker-content-in var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.content-viewport {
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.content[data-state="closed"] {
  animation-name: basiq-date-picker-content-out;
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

.validation-message {
  margin: 0;
  color: var(--basiq-color-content-danger);
  font-family: var(--basiq-font-family-sans);
  font-size: 0.875rem;
  line-height: 1.5;
}

.validation-message[data-visible] {
  margin-top: var(--basiq-space-100);
}

@keyframes basiq-date-picker-content-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}

@keyframes basiq-date-picker-content-out {
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .content {
    animation: none;
  }
}

@media (forced-colors: active) {
  .root:focus-within {
    outline-color: Highlight;
  }

  .root[data-invalid] {
    border-color: Mark;
  }
}
</style>
