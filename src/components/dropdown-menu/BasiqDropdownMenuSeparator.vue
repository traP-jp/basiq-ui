<script setup lang="ts">
import { DropdownMenuSeparator } from "reka-ui";
</script>

<template>
  <DropdownMenuSeparator :class="$style.separator" />
</template>

<style module>
.separator {
  height: var(--basiq-border-width-default);
  margin: var(--basiq-space-100) calc(-1 * var(--basiq-space-100));
  background: var(--basiq-color-dropdown-menu-border);
}

@media (forced-colors: active) {
  .separator {
    background: CanvasText;
  }
}
</style>
