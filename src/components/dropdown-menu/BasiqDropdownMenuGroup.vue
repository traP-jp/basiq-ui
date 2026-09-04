<script setup lang="ts">
import { DropdownMenuGroup } from "reka-ui";

defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <DropdownMenuGroup>
    <slot />
  </DropdownMenuGroup>
</template>
