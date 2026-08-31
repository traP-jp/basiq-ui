<script setup lang="ts">
import { computed, onMounted, ref, useAttrs } from "vue";

import { useCheckableControl } from "../checkable-control/useCheckableControl";

defineOptions({ inheritAttrs: false });

export interface BasiqSwitchProps {
  defaultValue?: boolean;
  disabled?: boolean;
  form?: string;
  id?: string;
  invalid?: boolean;
  modelValue?: boolean;
  name?: string;
  required?: boolean;
  value?: string;
}

export interface BasiqSwitchEmits {
  blur: [event: FocusEvent];
  change: [event: Event];
  focus: [event: FocusEvent];
  input: [event: Event];
  "update:modelValue": [value: boolean];
}

const props = withDefaults(defineProps<BasiqSwitchProps>(), {
  disabled: false,
  invalid: undefined,
  required: undefined,
  value: "on",
});
const emit = defineEmits<BasiqSwitchEmits>();
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
  componentName: "BasiqSwitch",
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
  if (
    import.meta.env.DEV &&
    inputElement.value?.labels?.length === 0 &&
    attrs["aria-label"] === undefined &&
    attrs["aria-labelledby"] === undefined
  ) {
    console.warn(
      "[BasiQ UI] BasiqSwitch requires an accessible name. Add visible slot content, wrap it in BasiqFormField, or set aria-label/aria-labelledby.",
    );
  }
});

function handleInput(event: Event) {
  emit("input", event);
}

function handleChange(event: Event) {
  handleCheckedChange(event);
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
        :disabled="disabled"
        :form="form"
        :name="name"
        :required="resolvedRequired"
        role="switch"
        type="checkbox"
        :value="value"
        @blur="handleBlur"
        @change="handleChange"
        @focus="handleFocus"
        @input="handleInput"
      />
      <span :class="$style.track" aria-hidden="true">
        <span :class="$style.thumb" />
      </span>
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
  display: block;
  flex: 0 0 auto;
  width: 44px;
  height: 24px;
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

.track {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: 44px;
  height: 24px;
  border-radius: var(--basiq-radius-full);
  background: var(--basiq-color-switch-track-off-rest);
}

.thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  display: block;
  width: 16px;
  height: 16px;
  border-radius: var(--basiq-radius-full);
  background: var(--basiq-color-switch-thumb-rest);
}

.input:checked + .track {
  background: var(--basiq-color-switch-track-on-rest);
}

.input:checked + .track .thumb {
  transform: translateX(20px);
}

.input:focus-visible + .track {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root[data-disabled] {
  color: var(--basiq-color-content-disabled);
  cursor: not-allowed;
}

.root[data-disabled] .track {
  background: var(--basiq-color-switch-track-off-disabled);
}

.root[data-disabled] .input:checked + .track {
  background: var(--basiq-color-switch-track-on-disabled);
}

.root[data-disabled] .track .thumb {
  background: var(--basiq-color-switch-thumb-disabled);
}

.root:hover:not([data-disabled]) .input:not(:checked) + .track {
  background: var(--basiq-color-switch-track-off-hover);
}

.root:hover:not([data-disabled]) .input:checked + .track {
  background: var(--basiq-color-switch-track-on-hover);
}

.root:active:not([data-disabled]) .input:not(:checked) + .track {
  background: var(--basiq-color-switch-track-off-pressed);
}

.root:active:not([data-disabled]) .input:checked + .track {
  background: var(--basiq-color-switch-track-on-pressed);
}

.label {
  min-width: 0;
  font-size: 1rem;
  line-height: 1.5;
}

@media (forced-colors: active) {
  .track,
  .input:checked + .track {
    border: var(--basiq-border-width-default) solid ButtonText;
    background: Canvas;
    forced-color-adjust: none;
  }

  .thumb {
    background: ButtonText;
  }

  .input:focus-visible + .track {
    outline-color: Highlight;
  }

  .root[data-disabled] .track,
  .root[data-disabled] .input:checked + .track {
    border-color: GrayText;
    background: Canvas;
  }

  .root[data-disabled] .thumb {
    background: GrayText;
  }
}
</style>
