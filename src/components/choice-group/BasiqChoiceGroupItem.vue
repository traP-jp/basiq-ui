<script setup lang="ts">
import { ToggleGroupItem } from "reka-ui";

export interface BasiqChoiceGroupItemProps {
  disabled?: boolean;
  value: string;
}

withDefaults(defineProps<BasiqChoiceGroupItemProps>(), {
  disabled: false,
});
</script>

<template>
  <ToggleGroupItem :class="$style.root" :disabled="disabled" :value="value">
    <slot />
  </ToggleGroupItem>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--basiq-radius-full);
  color: var(--basiq-color-choice-group-item-content-unselected-rest);
  background: var(--basiq-color-choice-group-item-background-unselected-rest);
  font: inherit;
  cursor: pointer;
  appearance: none;
}

.root[data-state="on"] {
  color: var(--basiq-color-choice-group-item-content-selected-rest);
  background: var(--basiq-color-choice-group-item-background-selected-rest);
}

.root:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root:disabled {
  color: var(--basiq-color-content-disabled);
  background: transparent;
  cursor: not-allowed;
}

.root[data-state="on"]:disabled {
  background: var(--basiq-color-control-background-disabled-accent);
}

.root:not(:disabled):hover {
  color: var(--basiq-color-choice-group-item-content-unselected-hover);
  background: var(--basiq-color-choice-group-item-background-unselected-hover);
}

.root[data-state="on"]:not(:disabled):hover {
  color: var(--basiq-color-choice-group-item-content-selected-hover);
  background: var(--basiq-color-choice-group-item-background-selected-hover);
}

.root:not(:disabled):active {
  color: var(--basiq-color-choice-group-item-content-unselected-pressed);
  background: var(--basiq-color-choice-group-item-background-unselected-pressed);
}

.root[data-state="on"]:not(:disabled):active {
  color: var(--basiq-color-choice-group-item-content-selected-pressed);
  background: var(--basiq-color-choice-group-item-background-selected-pressed);
}

@media (forced-colors: active) {
  .root:focus-visible {
    outline-color: Highlight;
  }
}
</style>
