<script setup lang="ts">
import { useTemplateRef } from "vue";

import { useTextControl } from "../text-control/useTextControl";

defineOptions({ inheritAttrs: false });

export type BasiqTextareaResize = "none" | "vertical";

export interface BasiqTextareaProps {
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
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  resize?: BasiqTextareaResize;
  rows?: number | string;
  wrap?: "hard" | "soft";
}

export interface BasiqTextareaEmits {
  blur: [event: FocusEvent];
  change: [event: Event];
  focus: [event: FocusEvent];
  input: [event: Event];
  "update:modelValue": [value: string];
}

const props = withDefaults(defineProps<BasiqTextareaProps>(), {
  disabled: false,
  invalid: undefined,
  readonly: false,
  required: undefined,
  resize: "vertical",
  rows: 3,
});
const emit = defineEmits<BasiqTextareaEmits>();
const textareaElement = useTemplateRef<HTMLTextAreaElement>("textarea");
const {
  currentValue,
  handleValueInput,
  resolveAriaDescribedBy,
  resolveAriaInvalid,
  resolveInvalid,
  resolvedId,
  resolvedRequired,
} = useTextControl({
  componentName: "BasiqTextarea",
  element: textareaElement,
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
  <textarea
    ref="textarea"
    v-bind="$attrs"
    :id="resolvedId"
    :class="$style.root"
    :aria-describedby="resolveAriaDescribedBy()"
    :aria-invalid="resolveAriaInvalid()"
    :autocomplete="autocomplete"
    :data-invalid="resolveInvalid() ? '' : undefined"
    :data-resize="resize"
    :disabled="disabled"
    :form="form"
    :inputmode="inputmode"
    :maxlength="maxlength"
    :minlength="minlength"
    :name="name"
    :placeholder="placeholder"
    :readonly="readonly"
    :required="resolvedRequired"
    :rows="rows"
    :value="currentValue"
    :wrap="wrap"
    @blur="handleBlur"
    @change="handleChange"
    @focus="handleFocus"
    @input="handleInput"
  />
</template>

<style module>
.root {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  padding: var(--basiq-space-200) var(--basiq-space-300);
  border: var(--basiq-border-width-strong) solid var(--basiq-color-text-control-border);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-text-control-content);
  background: var(--basiq-color-text-control-background);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
}

.root[data-resize="none"] {
  resize: none;
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
