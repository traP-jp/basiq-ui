<script setup lang="ts">
import { computed, type Component, useAttrs, useTemplateRef, watchEffect } from "vue";

import BasiqIcon from "../icon/BasiqIcon.vue";
import { useTextControl } from "../text-control/useTextControl";

defineOptions({ inheritAttrs: false });

export type BasiqInputType = "email" | "password" | "search" | "tel" | "text" | "url";
export type BasiqInputSize = "lg" | "md" | "sm";

export interface BasiqInputProps {
  autocomplete?: string;
  /** Shows a labelled clear button. Pair it with a non-empty clearLabel. */
  clearable?: boolean;
  /** Accessible name for the clear button. */
  clearLabel?: string;
  defaultValue?: string;
  disabled?: boolean;
  form?: string;
  id?: string;
  inputmode?: "decimal" | "email" | "none" | "numeric" | "search" | "tel" | "text" | "url";
  invalid?: boolean;
  /** A currentColor-compatible Vue icon component. The Input treats it as decorative. */
  leadingIcon?: Component;
  maxlength?: number | string;
  minlength?: number | string;
  modelValue?: string;
  name?: string;
  pattern?: string;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  size?: BasiqInputSize;
  /** A currentColor-compatible Vue icon component. The Input treats it as decorative. */
  trailingIcon?: Component;
  type?: BasiqInputType;
}

export interface BasiqInputEmits {
  blur: [event: FocusEvent];
  change: [event: Event];
  clear: [event: MouseEvent];
  focus: [event: FocusEvent];
  input: [event: Event];
  "update:modelValue": [value: string];
}

export interface BasiqInputSlots {
  /** Replaces leadingIcon with non-interactive leading content. */
  leading?: () => unknown;
  /** Replaces trailingIcon with non-interactive trailing content. */
  trailing?: () => unknown;
}

export interface BasiqInputExposed {
  focus: (options?: FocusOptions) => void;
  select: () => void;
}

const props = withDefaults(defineProps<BasiqInputProps>(), {
  clearable: false,
  disabled: false,
  invalid: undefined,
  readonly: false,
  required: undefined,
  size: "md",
  type: "text",
});
const emit = defineEmits<BasiqInputEmits>();
const slots = defineSlots<BasiqInputSlots>();
const attrs = useAttrs();
const inputElement = useTemplateRef<HTMLInputElement>("input");
const surfaceOnlyAttributeNames = new Set(["aria-hidden", "hidden", "inert", "lang", "translate"]);
const sharedSurfaceAttributeNames = new Set(["dir"]);
const {
  currentValue,
  handleValueInput,
  resolveAriaDescribedBy,
  resolveAriaInvalid,
  resolveInvalid,
  resolvedId,
  resolvedRequired,
  setValue,
} = useTextControl({
  componentName: "BasiqInput",
  element: inputElement,
  emitModelValue: (value) => emit("update:modelValue", value),
  props,
});
const resolvedClearLabel = computed(() => props.clearLabel?.trim() || undefined);
const canClear = computed(
  () =>
    props.clearable &&
    resolvedClearLabel.value !== undefined &&
    currentValue.value.length > 0 &&
    !props.disabled &&
    !props.readonly,
);

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (props.clearable && resolvedClearLabel.value === undefined) {
      console.warn(
        "[BasiQ UI] A clearable BasiqInput requires a non-empty clearLabel for its clear button.",
      );
    }

    if (props.leadingIcon && slots.leading) {
      console.warn(
        "[BasiQ UI] BasiqInput received both leadingIcon and a leading slot; the leading slot takes precedence.",
      );
    }

    if (props.trailingIcon && slots.trailing) {
      console.warn(
        "[BasiQ UI] BasiqInput received both trailingIcon and a trailing slot; the trailing slot takes precedence.",
      );
    }
  });
}

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => key !== "class" && key !== "style" && !surfaceOnlyAttributeNames.has(key),
    ),
  );
}

function getSurfaceAttrs() {
  const surfaceAttrs = Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => surfaceOnlyAttributeNames.has(key) || sharedSurfaceAttributeNames.has(key),
    ),
  );

  if (String(surfaceAttrs["aria-hidden"]).toLowerCase() === "true") {
    surfaceAttrs.inert = true;
  }

  return surfaceAttrs;
}

function focus(options?: FocusOptions) {
  inputElement.value?.focus(options);
}

function select() {
  inputElement.value?.select();
}

defineExpose<BasiqInputExposed>({ focus, select });

function handleInput(event: Event) {
  handleValueInput(event);
  emit("input", event);
}

function handleChange(event: Event) {
  emit("change", event);
}

function handleFocus(event: FocusEvent) {
  emit("focus", event);
}

function handleBlur(event: FocusEvent) {
  emit("blur", event);
}

function handleSurfacePointerDown(event: PointerEvent) {
  if (isInputEffectivelyDisabled()) return;

  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest("input, button, a, select, textarea, [contenteditable='true']")) return;

  event.preventDefault();
  focus();
}

function handleClearPointerDown(event: PointerEvent) {
  if (canClear.value && !isInputEffectivelyDisabled()) event.preventDefault();
}

function handleClear(event: MouseEvent) {
  if (!canClear.value || isInputEffectivelyDisabled()) return;

  setValue("");
  emit("clear", event);
  focus();
}

function isInputEffectivelyDisabled() {
  return props.disabled || inputElement.value?.matches(":disabled") === true;
}
</script>

<template>
  <span
    v-bind="getSurfaceAttrs()"
    :class="[$style.root, $attrs.class]"
    :data-clearable="clearable ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-invalid="resolveInvalid() ? '' : undefined"
    :data-readonly="readonly ? '' : undefined"
    :data-size="size"
    :style="$attrs.style || null"
    @pointerdown="handleSurfacePointerDown"
  >
    <span v-if="$slots.leading || leadingIcon" :class="$style.affix" data-input-affix>
      <slot v-if="$slots.leading" name="leading" />
      <BasiqIcon v-else-if="leadingIcon" :class="$style.icon" :icon="leadingIcon" />
    </span>
    <input
      ref="input"
      v-bind="getForwardedAttrs()"
      :id="resolvedId"
      :class="$style.input"
      :aria-describedby="resolveAriaDescribedBy()"
      :aria-invalid="resolveAriaInvalid()"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :form="form"
      :inputmode="inputmode"
      :maxlength="maxlength"
      :minlength="minlength"
      :name="name"
      :pattern="pattern"
      :placeholder="placeholder"
      :readonly="readonly"
      :required="resolvedRequired"
      :type="type"
      :value="currentValue"
      @blur="handleBlur"
      @change="handleChange"
      @focus="handleFocus"
      @input="handleInput"
    />
    <span v-if="$slots.trailing || trailingIcon" :class="$style.affix" data-input-affix>
      <slot v-if="$slots.trailing" name="trailing" />
      <BasiqIcon v-else-if="trailingIcon" :class="$style.icon" :icon="trailingIcon" />
    </span>
    <button
      v-if="clearable"
      :aria-hidden="canClear ? undefined : 'true'"
      :aria-label="resolvedClearLabel"
      :class="$style['clear-button']"
      :data-hidden="canClear ? undefined : ''"
      :disabled="!canClear"
      :tabindex="canClear ? undefined : -1"
      type="button"
      @click="handleClear"
      @pointerdown="handleClearPointerDown"
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  </span>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: flex;
  gap: var(--basiq-space-200);
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 var(--basiq-space-300);
  border: var(--basiq-border-width-strong) solid var(--basiq-color-text-control-border);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-text-control-content);
  background: var(--basiq-color-text-control-background);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  cursor: text;
}

.root[hidden]:not([hidden="until-found" i]) {
  display: none;
}

.root[dir="auto"]:has(> .input:dir(ltr)) {
  direction: ltr;
}

.root[dir="auto"]:has(> .input:dir(rtl)) {
  direction: rtl;
}

.root[data-size="sm"] {
  height: 36px;
}

.root[data-size="lg"] {
  height: 44px;
}

.input {
  box-sizing: border-box;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  cursor: inherit;
  appearance: none;
}

.input::placeholder {
  color: var(--basiq-color-text-control-placeholder);
  opacity: 1;
}

.root[data-clearable] .input[type="search"]::-webkit-search-cancel-button {
  appearance: none;
}

.root:focus-within {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root[data-invalid] {
  border-color: var(--basiq-color-text-control-border-invalid);
}

.root[data-disabled],
.root:has(.input:disabled) {
  border-color: var(--basiq-color-text-control-border-disabled);
  color: var(--basiq-color-content-disabled);
  background: var(--basiq-color-text-control-background-disabled);
  cursor: not-allowed;
}

.affix {
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-width: 50%;
  overflow: hidden;
  color: var(--basiq-color-content-subtle);
  white-space: nowrap;
}

.icon {
  width: 20px;
  height: 20px;
}

.clear-button {
  box-sizing: border-box;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--basiq-radius-full);
  color: var(--basiq-color-content-subtle);
  background: transparent;
  font: inherit;
  cursor: pointer;
  appearance: none;
}

.clear-button[data-hidden] {
  visibility: hidden;
  pointer-events: none;
}

.clear-button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 2;
}

.clear-button:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.clear-button:not(:disabled):hover,
.clear-button:not(:disabled):active {
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-surface-muted);
}

.root:has(.input:disabled) .clear-button {
  visibility: hidden;
  pointer-events: none;
}

@media (forced-colors: active) {
  .root:focus-within,
  .clear-button:focus-visible {
    outline-color: Highlight;
  }

  .root[data-invalid] {
    border-color: Mark;
  }
}
</style>
