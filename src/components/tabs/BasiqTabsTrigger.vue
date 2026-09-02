<script setup lang="ts">
import { TabsTrigger } from "reka-ui";

export interface BasiqTabsTriggerProps {
  disabled?: boolean;
  value: string;
}

withDefaults(defineProps<BasiqTabsTriggerProps>(), {
  disabled: false,
});
</script>

<template>
  <TabsTrigger :class="$style.root" :disabled="disabled" :value="value">
    <slot />
  </TabsTrigger>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: var(--basiq-space-200) var(--basiq-space-300);
  border: 0;
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-tabs-trigger-content-unselected-rest);
  background: var(--basiq-color-tabs-trigger-background-unselected-rest);
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  text-align: center;
  cursor: pointer;
  appearance: none;
}

.root[data-orientation="horizontal"] {
  white-space: nowrap;
}

.root[data-orientation="vertical"] {
  width: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
}

.root[data-state="active"] {
  color: var(--basiq-color-tabs-trigger-content-selected-rest);
  background: var(--basiq-color-tabs-trigger-background-selected-rest);
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

.root[data-state="active"]:disabled {
  background: var(--basiq-color-control-background-disabled-accent);
}

.root[data-state="inactive"]:not(:disabled):hover {
  color: var(--basiq-color-tabs-trigger-content-unselected-hover);
  background: var(--basiq-color-tabs-trigger-background-unselected-hover);
}

.root[data-state="active"]:not(:disabled):hover {
  color: var(--basiq-color-tabs-trigger-content-selected-hover);
  background: var(--basiq-color-tabs-trigger-background-selected-hover);
}

.root[data-state="inactive"]:not(:disabled):active {
  color: var(--basiq-color-tabs-trigger-content-unselected-pressed);
  background: var(--basiq-color-tabs-trigger-background-unselected-pressed);
}

.root[data-state="active"]:not(:disabled):active {
  color: var(--basiq-color-tabs-trigger-content-selected-pressed);
  background: var(--basiq-color-tabs-trigger-background-selected-pressed);
}

@media (forced-colors: active) {
  .root[data-state="active"] {
    outline: var(--basiq-border-width-strong) solid Highlight;
  }

  .root:focus-visible {
    outline: var(--basiq-focus-ring-width) solid Highlight;
    outline-offset: var(--basiq-focus-ring-gap);
  }
}
</style>
