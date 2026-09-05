<script setup lang="ts">
import { useAttrs, useTemplateRef } from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";
import BasiqInput, { type BasiqInputExposed, type BasiqInputSize } from "../input/BasiqInput.vue";
import BasiqSearchFieldSearchIcon from "./BasiqSearchFieldSearchIcon.vue";

defineOptions({ inheritAttrs: false });

export interface BasiqSearchFieldProps {
  autocomplete?: string;
  /** Accessible name for the clear button. */
  clearLabel: string;
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
}

export interface BasiqSearchFieldEmits {
  blur: [event: FocusEvent];
  change: [event: Event];
  clear: [event: MouseEvent];
  focus: [event: FocusEvent];
  input: [event: Event];
  "update:modelValue": [value: string];
}

export interface BasiqSearchFieldExposed {
  focus: (options?: FocusOptions) => void;
  select: () => void;
}

const props = defineProps<BasiqSearchFieldProps>();
const emit = defineEmits<BasiqSearchFieldEmits>();
const attrs = useAttrs();
const input = useTemplateRef<BasiqInputExposed>("input");
const hasInitialModelValue = hasInitialProp("modelValue");
const fixedAttributeNames = new Set([
  "clearable",
  "leading-icon",
  "leadingIcon",
  "trailing-icon",
  "trailingIcon",
  "type",
]);

function getForwardedAttrs() {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => !fixedAttributeNames.has(key)));
}

function getInputBindings() {
  const forwardedProps = Object.fromEntries(
    Object.entries(props).filter(
      ([key, value]) => value !== undefined || (key === "modelValue" && hasInitialModelValue),
    ),
  );

  return { ...getForwardedAttrs(), ...forwardedProps };
}

function focus(options?: FocusOptions) {
  input.value?.focus(options);
}

function select() {
  input.value?.select();
}

defineExpose<BasiqSearchFieldExposed>({ focus, select });
</script>

<template>
  <BasiqInput
    ref="input"
    v-bind="getInputBindings()"
    clearable
    :leading-icon="BasiqSearchFieldSearchIcon"
    type="search"
    @blur="emit('blur', $event)"
    @change="emit('change', $event)"
    @clear="emit('clear', $event)"
    @focus="emit('focus', $event)"
    @input="emit('input', $event)"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
