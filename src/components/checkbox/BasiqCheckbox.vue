<script setup lang="ts">
import { computed, onMounted, onUpdated, ref, useAttrs } from "vue";

import { useCheckableControl } from "../checkable-control/useCheckableControl";

defineOptions({ inheritAttrs: false });

export interface BasiqCheckboxProps {
  defaultValue?: boolean;
  disabled?: boolean;
  form?: string;
  id?: string;
  indeterminate?: boolean;
  invalid?: boolean;
  modelValue?: boolean;
  name?: string;
  required?: boolean;
  value?: string;
}

export interface BasiqCheckboxEmits {
  blur: [event: FocusEvent];
  change: [event: Event];
  focus: [event: FocusEvent];
  input: [event: Event];
  "update:indeterminate": [value: boolean];
  "update:modelValue": [value: boolean];
}

const props = withDefaults(defineProps<BasiqCheckboxProps>(), {
  disabled: false,
  indeterminate: false,
  invalid: undefined,
  required: undefined,
  value: "on",
});
const emit = defineEmits<BasiqCheckboxEmits>();
const slots = defineSlots<{ default?: () => unknown }>();
const attrs = useAttrs();
const inputElement = ref<HTMLInputElement | null>(null);
const hasLabel = computed(() => Boolean(slots.default));
const {
  currentValue,
  handleCheckedChange,
  resolveAriaDescribedBy,
  resolveAriaInvalid,
  resolveInvalid,
  resolvedId,
  resolvedRequired,
} = useCheckableControl({
  componentName: "BasiqCheckbox",
  element: inputElement,
  emitModelValue: (value) => emit("update:modelValue", value),
  props,
});

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"),
  );
}

onMounted(() => {
  syncIndeterminate();

  if (
    import.meta.env.DEV &&
    inputElement.value?.labels?.length === 0 &&
    attrs["aria-label"] === undefined &&
    attrs["aria-labelledby"] === undefined
  ) {
    console.warn(
      "[BasiQ UI] BasiqCheckbox requires an accessible name. Add visible slot content, wrap it in BasiqFormField, or set aria-label/aria-labelledby.",
    );
  }
});
onUpdated(syncIndeterminate);

function syncIndeterminate() {
  if (inputElement.value !== null) inputElement.value.indeterminate = props.indeterminate;
}

function handleInput(event: Event) {
  emit("input", event);
}

function handleChange(event: Event) {
  handleCheckedChange(event);
  if (props.indeterminate) emit("update:indeterminate", false);
  emit("change", event);
  queueMicrotask(syncIndeterminate);
}

function handleFocus(event: FocusEvent) {
  emit("focus", event);
}

function handleBlur(event: FocusEvent) {
  emit("blur", event);
}
</script>

<template>
  <component
    :is="hasLabel ? 'label' : 'span'"
    :class="[$style.root, $attrs.class]"
    :data-disabled="disabled ? '' : undefined"
    :data-invalid="resolveInvalid() ? '' : undefined"
    :style="$attrs.style"
  >
    <span :class="$style.control">
      <input
        ref="inputElement"
        v-bind="getForwardedAttrs()"
        :id="resolvedId"
        :class="$style.input"
        :aria-describedby="resolveAriaDescribedBy()"
        :aria-invalid="resolveAriaInvalid()"
        :checked="currentValue"
        :data-indeterminate="indeterminate ? '' : undefined"
        :disabled="disabled"
        :form="form"
        :name="name"
        :required="resolvedRequired"
        type="checkbox"
        :value="value"
        @blur="handleBlur"
        @change="handleChange"
        @focus="handleFocus"
        @input="handleInput"
      />
      <span :class="$style.visual" aria-hidden="true" />
    </span>
    <span v-if="hasLabel" :class="$style.label"><slot /></span>
  </component>
</template>

<style module>
.root {
  position: relative;
  display: inline-flex;
  gap: var(--basiq-space-200);
  align-items: flex-start;
  width: fit-content;
  min-width: 0;
  min-height: 24px;
  color: var(--basiq-color-content-default);
  font-family: inherit;
  cursor: pointer;
}

.control {
  position: relative;
  display: grid;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  place-items: center;
}

.input {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.visual {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: 18px;
  height: 18px;
  border: var(--basiq-border-width-strong) solid var(--basiq-color-checkbox-border-unchecked-rest);
  border-radius: var(--basiq-radius-sm);
  background: var(--basiq-color-checkbox-background-unchecked-rest);
}

.input:checked + .visual,
.input[data-indeterminate] + .visual {
  border-color: var(--basiq-color-checkbox-border-checked-rest);
  background: var(--basiq-color-checkbox-background-checked-rest);
}

.input:is(:checked, [data-indeterminate]) + .visual::after {
  position: absolute;
  content: "";
}

.input:checked + .visual::after {
  top: 2px;
  left: 4px;
  width: 4px;
  height: 7px;
  border: solid var(--basiq-color-checkbox-indicator);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.input[data-indeterminate] + .visual::after {
  position: absolute;
  top: 6px;
  left: 3px;
  width: 8px;
  height: 2px;
  border: 0;
  background: var(--basiq-color-checkbox-indicator);
  transform: none;
}

.input:focus-visible + .visual {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root[data-invalid] .visual {
  border-color: var(--basiq-color-checkbox-border-invalid);
}

.root[data-disabled] {
  color: var(--basiq-color-content-disabled);
  cursor: not-allowed;
}

.root[data-disabled] .visual {
  border-color: var(--basiq-color-checkbox-border-unchecked-disabled);
  background: var(--basiq-color-checkbox-background-unchecked-disabled);
}

.root[data-disabled] .input:is(:checked, [data-indeterminate]) + .visual {
  border-color: var(--basiq-color-checkbox-border-checked-disabled);
  background: var(--basiq-color-checkbox-background-checked-disabled);
}

.root[data-disabled] .input:checked + .visual::after {
  border-color: var(--basiq-color-checkbox-indicator-disabled);
}

.root[data-disabled] .input[data-indeterminate] + .visual::after {
  background: var(--basiq-color-checkbox-indicator-disabled);
}

.root:hover:not([data-disabled], [data-invalid])
  .input:not(:checked, [data-indeterminate])
  + .visual {
  border-color: var(--basiq-color-checkbox-border-unchecked-hover);
  background: var(--basiq-color-checkbox-background-unchecked-hover);
}

.root:hover:not([data-disabled], [data-invalid])
  .input:is(:checked, [data-indeterminate])
  + .visual {
  border-color: var(--basiq-color-checkbox-border-checked-hover);
  background: var(--basiq-color-checkbox-background-checked-hover);
}

.root:active:not([data-disabled], [data-invalid])
  .input:not(:checked, [data-indeterminate])
  + .visual {
  background: var(--basiq-color-checkbox-background-unchecked-pressed);
}

.root:active:not([data-disabled], [data-invalid])
  .input:is(:checked, [data-indeterminate])
  + .visual {
  border-color: var(--basiq-color-checkbox-border-checked-pressed);
  background: var(--basiq-color-checkbox-background-checked-pressed);
}

.label {
  min-width: 0;
  font-size: 1rem;
  line-height: 1.5;
}

@media (forced-colors: active) {
  .visual,
  .input:checked + .visual,
  .input[data-indeterminate] + .visual {
    border-color: ButtonText;
    background: Canvas;
    forced-color-adjust: none;
  }

  .input:checked + .visual::after {
    border-color: ButtonText;
  }

  .input[data-indeterminate] + .visual::after {
    background: ButtonText;
  }

  .input:focus-visible + .visual {
    outline-color: Highlight;
  }

  .root[data-disabled] .visual,
  .root[data-disabled] .input:is(:checked, [data-indeterminate]) + .visual {
    border-color: GrayText;
    background: Canvas;
  }

  .root[data-disabled] .input:checked + .visual::after {
    border-color: GrayText;
  }

  .root[data-disabled] .input[data-indeterminate] + .visual::after {
    background: GrayText;
  }
}
</style>
