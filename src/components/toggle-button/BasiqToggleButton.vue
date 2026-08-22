<script setup lang="ts">
import { Toggle } from "reka-ui";

export interface BasiqToggleButtonProps {
  defaultValue?: boolean;
  disabled?: boolean;
  modelValue?: boolean;
}

export interface BasiqToggleButtonEmits {
  "update:modelValue": [value: boolean];
}

withDefaults(defineProps<BasiqToggleButtonProps>(), {
  defaultValue: false,
  disabled: false,
  // Keep an omitted Boolean prop undefined so Reka UI can use uncontrolled mode.
  modelValue: undefined,
});

defineEmits<BasiqToggleButtonEmits>();
</script>

<template>
  <Toggle
    :class="$style.root"
    :default-value="defaultValue"
    :disabled="disabled"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <slot />
  </Toggle>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--basiq-radius-md);
  color: var(--basiq-color-toggle-button-content-off);
  background: var(--basiq-color-toggle-button-background-off-rest);
  font: inherit;
  cursor: pointer;
  appearance: none;
}

.root[data-state="on"] {
  color: var(--basiq-color-toggle-button-content-on);
  background: var(--basiq-color-toggle-button-background-on-rest);
}

.root:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root:disabled {
  color: var(--basiq-color-content-disabled);
  background: var(--basiq-color-control-background-disabled);
  cursor: not-allowed;
}

.root[data-state="on"]:disabled {
  background: var(--basiq-color-control-background-disabled-accent);
}

.root:not(:disabled):hover {
  background: var(--basiq-color-toggle-button-background-off-hover);
}

.root[data-state="on"]:not(:disabled):hover {
  background: var(--basiq-color-toggle-button-background-on-hover);
}

.root:not(:disabled):active {
  background: var(--basiq-color-toggle-button-background-off-pressed);
}

.root[data-state="on"]:not(:disabled):active {
  background: var(--basiq-color-toggle-button-background-on-pressed);
}

@media (forced-colors: active) {
  .root:focus-visible {
    outline-color: Highlight;
  }
}
</style>
