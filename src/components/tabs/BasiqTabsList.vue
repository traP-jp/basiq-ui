<script setup lang="ts">
import { TabsList } from "reka-ui";
import { useAttrs } from "vue";

export interface BasiqTabsListProps {
  loop?: boolean;
}

withDefaults(defineProps<BasiqTabsListProps>(), {
  loop: true,
});

const attrs = useAttrs();
const ariaLabel = attrs["aria-label"];
const ariaLabelledby = attrs["aria-labelledby"];
const hasAccessibleName = [ariaLabel, ariaLabelledby].some(
  (value) => typeof value === "string" && value.trim().length > 0,
);

if (import.meta.env.DEV && !hasAccessibleName) {
  console.warn(
    "[BasiQ UI] BasiqTabsList requires an accessible name. Pass ariaLabel/ariaLabelledby to BasiqTabs, or aria-label/aria-labelledby to BasiqTabsList.",
  );
}
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
  flex: 0 1 auto;
  align-items: stretch;
  width: max-content;
  min-width: 0;
  max-width: min(15rem, 50%);
}
</style>
