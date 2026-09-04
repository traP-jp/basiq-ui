<script setup lang="ts">
import { TooltipTrigger } from "reka-ui";

defineOptions({ inheritAttrs: false });
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <TooltipTrigger v-bind="$attrs" as-child>
    <slot />
  </TooltipTrigger>
</template>
