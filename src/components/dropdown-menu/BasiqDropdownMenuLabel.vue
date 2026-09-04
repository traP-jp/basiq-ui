<script setup lang="ts">
import { DropdownMenuLabel } from "reka-ui";

defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <DropdownMenuLabel :class="$style.label">
    <slot />
  </DropdownMenuLabel>
</template>

<style module>
.label {
  padding: var(--basiq-space-100) var(--basiq-space-200);
  color: var(--basiq-color-dropdown-menu-content-subtle);
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
