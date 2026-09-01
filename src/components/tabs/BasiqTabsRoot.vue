<script setup lang="ts">
import { TabsRoot } from "reka-ui";

import { hasInitialProp } from "../controllable-state/hasInitialProp";

export type BasiqTabsActivationMode = "automatic" | "manual";
export type BasiqTabsOrientation = "horizontal" | "vertical";

export interface BasiqTabsRootProps {
  activationMode?: BasiqTabsActivationMode;
  defaultValue?: string;
  modelValue?: string;
  orientation?: BasiqTabsOrientation;
  unmountOnHide?: boolean;
}

export interface BasiqTabsRootEmits {
  "update:modelValue": [value: string];
}

export interface BasiqTabsRootSlotProps {
  modelValue: string | undefined;
}

const props = withDefaults(defineProps<BasiqTabsRootProps>(), {
  activationMode: "automatic",
  modelValue: undefined,
  orientation: "horizontal",
  unmountOnHide: true,
});
defineEmits<BasiqTabsRootEmits>();
defineSlots<{
  default?: (props: BasiqTabsRootSlotProps) => unknown;
}>();

const hasModelValue = hasInitialProp("modelValue");

if (import.meta.env.DEV && !hasModelValue && props.defaultValue === undefined) {
  console.warn(
    "[BasiQ UI] BasiqTabsRoot requires modelValue or defaultValue so that one tab is selected.",
  );
}
</script>

<template>
  <TabsRoot
    :activation-mode="activationMode"
    :class="$style.root"
    :default-value="defaultValue"
    :model-value="modelValue"
    :orientation="orientation"
    :unmount-on-hide="unmountOnHide"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #default="{ modelValue: currentValue }">
      <slot :model-value="currentValue" />
    </template>
  </TabsRoot>
</template>

<style module>
.root {
  --basiq-tabs-focus-gutter: calc(var(--basiq-focus-ring-gap) + var(--basiq-focus-ring-width));

  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-width: 0;
  color: var(--basiq-color-content-default);
  font-family: var(--basiq-font-family-sans);
}

.root[data-orientation="horizontal"] {
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--basiq-space-300) - var(--basiq-tabs-focus-gutter));
}

.root[data-orientation="vertical"] {
  flex-direction: row;
  align-items: flex-start;
  gap: var(--basiq-space-400);
}
</style>
