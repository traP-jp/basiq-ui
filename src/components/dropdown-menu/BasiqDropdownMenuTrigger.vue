<script setup lang="ts">
import { DropdownMenuTrigger } from "reka-ui";

defineOptions({ inheritAttrs: false });

export interface BasiqDropdownMenuTriggerProps {
  disabled?: boolean;
}

withDefaults(defineProps<BasiqDropdownMenuTriggerProps>(), {
  disabled: false,
});
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <DropdownMenuTrigger v-bind="$attrs" as-child :disabled="disabled">
    <slot />
  </DropdownMenuTrigger>
</template>
