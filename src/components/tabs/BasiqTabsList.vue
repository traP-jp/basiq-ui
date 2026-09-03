<script setup lang="ts">
import { TabsList } from "reka-ui";
import { computed, type CSSProperties, watchEffect } from "vue";

export interface BasiqTabsListProps {
  ariaLabel?: string;
  ariaLabelledby?: string;
  loop?: boolean;
  width?: string;
}

const props = withDefaults(defineProps<BasiqTabsListProps>(), {
  ariaLabel: undefined,
  ariaLabelledby: undefined,
  loop: true,
  width: undefined,
});

const listStyle = computed<CSSProperties | undefined>(() => {
  const width = props.width?.trim();

  return width ? { "--basiq-tabs-list-width": width } : undefined;
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
    :data-explicit-width="listStyle ? '' : undefined"
    :loop="loop"
    :style="listStyle"
  >
    <slot />
  </TabsList>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: flex;
  flex: 0 0 auto;
  gap: var(--basiq-space-200);
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
  width: var(--basiq-tabs-list-width, max-content);
  min-width: 0;
  max-width: min(15rem, 50%);
}

.root[data-orientation="vertical"][data-explicit-width] {
  max-width: 50%;
}
</style>
