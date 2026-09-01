<script setup lang="ts">
import { TabsList } from "reka-ui";

export interface BasiqTabsListProps {
  loop?: boolean;
}

withDefaults(defineProps<BasiqTabsListProps>(), {
  loop: true,
});
</script>

<template>
  <TabsList :class="$style.root" :loop="loop">
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
  align-items: stretch;
  width: max-content;
  min-width: min(10rem, 100%);
  max-width: min(15rem, 100%);
}
</style>
