<script setup lang="ts">
import { useTemplateRef } from "vue";

import { useTextControl } from "../text-control/useTextControl";

defineOptions({ inheritAttrs: false });

export type BasiqInputType = "email" | "password" | "search" | "tel" | "text" | "url";
export type BasiqInputSize = "lg" | "md" | "sm";

export interface BasiqInputProps {
  autocomplete?: string;
  defaultValue?: string;
  disabled?: boolean;
  form?: string;
  id?: string;
  inputmode?: "decimal" | "email" | "none" | "numeric" | "search" | "tel" | "text" | "url";
  invalid?: boolean;
  maxlength?: number | string;
  minlength?: number | string;
  modelValue?: string;
  name?: string;
  pattern?: string;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  size?: BasiqInputSize;
  type?: BasiqInputType;
}

export interface BasiqInputEmits {
  blur: [event: FocusEvent];
  change: [event: Event];
  focus: [event: FocusEvent];
  input: [event: Event];
  "update:modelValue": [value: string];
}

const props = withDefaults(defineProps<BasiqInputProps>(), {
  disabled: false,
  invalid: undefined,
  readonly: false,
  required: undefined,
  size: "md",
  type: "text",
});
const emit = defineEmits<BasiqInputEmits>();
const inputElement = useTemplateRef<HTMLInputElement>("input");
const {
  currentValue,
  handleValueInput,
  resolveAriaDescribedBy,
  resolveAriaInvalid,
  resolveInvalid,
  resolvedId,
  resolvedRequired,
} = useTextControl({
  componentName: "BasiqInput",
  element: inputElement,
  emitModelValue: (value) => emit("update:modelValue", value),
  props,
});

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
</script>

<template>
  <input
    ref="input"
    v-bind="$attrs"
    :id="resolvedId"
    :class="$style.root"
    :aria-describedby="resolveAriaDescribedBy()"
    :aria-invalid="resolveAriaInvalid()"
    :autocomplete="autocomplete"
    :data-invalid="resolveInvalid() ? '' : undefined"
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
    :data-size="size"
    :type="type"
    :value="currentValue"
    @blur="handleBlur"
    @change="handleChange"
    @focus="handleFocus"
    @input="handleInput"
  />
</template>

<style module>
.root {
  box-sizing: border-box;
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
  appearance: none;
}

.root[data-size="sm"] {
  height: 36px;
}

.root[data-size="lg"] {
  height: 44px;
}

.root::placeholder {
  color: var(--basiq-color-text-control-placeholder);
  opacity: 1;
}

.root:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root[data-invalid] {
  border-color: var(--basiq-color-text-control-border-invalid);
}

.root:disabled {
  border-color: var(--basiq-color-text-control-border-disabled);
  color: var(--basiq-color-content-disabled);
  background: var(--basiq-color-text-control-background-disabled);
  cursor: not-allowed;
}

@media (forced-colors: active) {
  .root:focus-visible {
    outline-color: Highlight;
  }

  .root[data-invalid] {
    border-color: Mark;
  }
}
</style>
