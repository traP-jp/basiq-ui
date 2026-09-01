<script setup lang="ts">
import { TabsContent } from "reka-ui";

export interface BasiqTabsContentProps {
  value: string;
}

defineProps<BasiqTabsContentProps>();
</script>

<template>
  <TabsContent :class="$style.root" :value="value">
    <slot />
  </TabsContent>
</template>

<style module>
.root {
  box-sizing: border-box;
  min-width: 0;
  padding: var(--basiq-space-400);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-tabs-content-background);
}

.root[data-orientation="horizontal"] {
  width: calc(100% - 2 * var(--basiq-tabs-focus-gutter));
  margin-inline: var(--basiq-tabs-focus-gutter);
}

.root[data-orientation="vertical"] {
  flex: 1 1 auto;
}

.root:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

@media (forced-colors: active) {
  .root:focus-visible {
    outline-color: Highlight;
  }
}
</style>
