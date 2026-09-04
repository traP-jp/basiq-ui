<script setup lang="ts">
import { useSlots, watchEffect } from "vue";

import BasiqNavigationItem from "./BasiqNavigationItem.vue";

export interface BasiqNavigationItemDefinition {
  current?: boolean;
  href: string;
  label: string;
}

export interface BasiqNavigationListProps {
  ariaLabel?: string;
  ariaLabelledby?: string;
  items?: readonly BasiqNavigationItemDefinition[];
}

const props = withDefaults(defineProps<BasiqNavigationListProps>(), {
  ariaLabel: undefined,
  ariaLabelledby: undefined,
  items: undefined,
});
const slots = useSlots();
defineSlots<{
  default?: () => unknown;
}>();

watchEffect(() => {
  if (!import.meta.env.DEV || props.items === undefined || slots.default === undefined) return;

  console.warn(
    "[BasiQ UI] BasiqNavigationList ignores its default slot when items are provided. Use either the items API or the compound API.",
  );
});
</script>

<template>
  <nav :aria-label="ariaLabel" :aria-labelledby="ariaLabelledby" :class="$style.root">
    <ul :class="$style.list">
      <template v-if="items !== undefined">
        <BasiqNavigationItem
          v-for="item in items"
          :key="item.href"
          :current="item.current"
          :href="item.href"
        >
          {{ item.label }}
        </BasiqNavigationItem>
      </template>
      <slot v-else />
    </ul>
  </nav>
</template>

<style module>
.root {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  color: var(--basiq-color-content-default);
  font-family: var(--basiq-font-family-sans);
}

.list {
  display: grid;
  gap: var(--basiq-space-200);
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
