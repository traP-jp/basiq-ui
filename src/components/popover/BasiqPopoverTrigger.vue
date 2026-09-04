<script setup lang="ts">
import { PopoverTrigger } from "reka-ui";

defineOptions({ inheritAttrs: false });
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <PopoverTrigger v-bind="$attrs" as-child>
    <slot />
  </PopoverTrigger>
</template>
