<script setup lang="ts">
import { TabsRoot } from "reka-ui";
import { computed, watchEffect } from "vue";

export type BasiqTabsActivationMode = "automatic" | "manual";
export type BasiqTabsOrientation = "horizontal" | "vertical";

export interface BasiqTabsRootProps {
  activationMode?: BasiqTabsActivationMode;
  defaultValue?: string;
  modelValue?: string | null;
  orientation?: BasiqTabsOrientation;
  unmountOnHide?: boolean;
}

export interface BasiqTabsRootEmits {
  "update:modelValue": [value: string];
}

export interface BasiqTabsRootSlotProps {
  modelValue: string | null | undefined;
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

const isInitiallyControlled = props.modelValue !== undefined;
// Reka UI treats only undefined as uncontrolled. null keeps an intentionally empty model controlled.
const rekaModelValue = computed(
  () => props.modelValue as Exclude<BasiqTabsRootProps["modelValue"], null>,
);

if (import.meta.env.DEV && !isInitiallyControlled && props.defaultValue === undefined) {
  console.warn(
    "[BasiQ UI] BasiqTabsRoot requires modelValue or defaultValue so that one tab is selected.",
  );
}

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  const isControlled = props.modelValue !== undefined;

  if (isControlled !== isInitiallyControlled) {
    console.warn(
      "[BasiQ UI] BasiqTabsRoot must not switch between controlled and uncontrolled state. Use null for a controlled empty value.",
    );
  }
});
</script>

<template>
  <TabsRoot
    :activation-mode="activationMode"
    :class="$style.root"
    :default-value="defaultValue"
    :model-value="rekaModelValue"
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
