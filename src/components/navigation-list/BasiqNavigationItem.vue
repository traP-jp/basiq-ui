<script setup lang="ts">
import { Primitive } from "reka-ui";
import { watchEffect } from "vue";

export interface BasiqNavigationItemProps {
  asChild?: boolean;
  current?: boolean;
  href?: string;
}

const props = withDefaults(defineProps<BasiqNavigationItemProps>(), {
  asChild: false,
  current: false,
  href: undefined,
});
defineSlots<{
  default?: () => unknown;
}>();

watchEffect(() => {
  if (!import.meta.env.DEV || props.asChild || props.href?.trim()) return;

  console.warn("[BasiQ UI] BasiqNavigationItem requires href unless asChild is true.");
});
</script>

<template>
  <li :class="$style.item">
    <Primitive
      as="a"
      :aria-current="current ? 'page' : undefined"
      :as-child="asChild"
      :class="$style.link"
      :data-current="current ? '' : undefined"
      :href="asChild ? undefined : href"
    >
      <slot />
    </Primitive>
  </li>
</template>

<style module>
.item {
  min-width: 0;
}

.link {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: var(--basiq-space-200) var(--basiq-space-300);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-navigation-item-content-rest);
  background: var(--basiq-color-navigation-item-background-rest);
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  text-align: start;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.link[data-current] {
  color: var(--basiq-color-navigation-item-content-current-rest);
  background: var(--basiq-color-navigation-item-background-current-rest);
}

.link:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.link:not([data-current]):hover {
  color: var(--basiq-color-navigation-item-content-hover);
  background: var(--basiq-color-navigation-item-background-hover);
}

.link:not([data-current]):active {
  color: var(--basiq-color-navigation-item-content-pressed);
  background: var(--basiq-color-navigation-item-background-pressed);
}

.link[data-current]:hover {
  color: var(--basiq-color-navigation-item-content-current-hover);
  background: var(--basiq-color-navigation-item-background-current-hover);
}

.link[data-current]:active {
  color: var(--basiq-color-navigation-item-content-current-pressed);
  background: var(--basiq-color-navigation-item-background-current-pressed);
}

@media (forced-colors: active) {
  .link[data-current] {
    outline: var(--basiq-border-width-strong) solid Highlight;
  }

  .link:focus-visible {
    outline-color: Highlight;
  }
}
</style>
