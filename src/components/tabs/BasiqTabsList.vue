<script setup lang="ts">
import { TabsList } from "reka-ui";
import { watchEffect } from "vue";

export interface BasiqTabsListProps {
  ariaLabel?: string;
  ariaLabelledby?: string;
  loop?: boolean;
}

const props = withDefaults(defineProps<BasiqTabsListProps>(), {
  ariaLabel: undefined,
  ariaLabelledby: undefined,
  loop: true,
});

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  const hasAccessibleName = [props.ariaLabel, props.ariaLabelledby].some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (!hasAccessibleName) {
    console.warn(
      "[BasiQ UI] BasiqTabsList requires an accessible name. Pass ariaLabel or ariaLabelledby.",
    );
  }
});
</script>

<template>
  <TabsList
    :aria-label="ariaLabel"
    :aria-labelledby="ariaLabelledby"
    :class="$style.root"
    :loop="loop"
  >
    <slot />
  </TabsList>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  gap: var(--basiq-space-100);
  border-radius: var(--basiq-radius-sm);
  background: transparent;
}

.root[data-orientation="horizontal"] {
  flex-direction: row;
  max-width: 100%;
  padding: var(--basiq-tabs-focus-gutter);
  overflow: auto hidden;
}

.root[data-orientation="vertical"] {
  flex-direction: column;
  flex: 0 1 auto;
  align-items: stretch;
  width: max-content;
  min-width: 0;
  max-width: min(15rem, 50%);
}
</style>
