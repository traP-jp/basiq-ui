<script setup lang="ts">
import { PopoverClose } from "reka-ui";

defineOptions({ inheritAttrs: false });
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <PopoverClose v-bind="$attrs" as-child>
    <slot />
  </PopoverClose>
</template>
