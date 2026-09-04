<script setup lang="ts">
import type { Component } from "vue";

import BasiqTag from "../tag/BasiqTag.vue";

interface BasiqSelectionTagProps {
  density?: "default" | "compact";
  disabled?: boolean;
  icon?: Component;
  label: string;
  readonly?: boolean;
  removeLabel: string;
}

withDefaults(defineProps<BasiqSelectionTagProps>(), {
  density: "default",
  disabled: false,
  readonly: false,
});

const emit = defineEmits<{ remove: [event: MouseEvent] }>();
</script>

<template>
  <BasiqTag
    v-if="readonly"
    :class="density === 'compact' ? $style.compact : undefined"
    :icon="icon"
    :label="label"
  >
    <template v-if="$slots.leading" #leading><slot name="leading" /></template>
  </BasiqTag>
  <BasiqTag
    v-else
    :class="density === 'compact' ? $style.compact : undefined"
    :disabled="disabled"
    :icon="icon"
    :label="label"
    removable
    :remove-label="removeLabel"
    @remove="emit('remove', $event)"
  >
    <template v-if="$slots.leading" #leading><slot name="leading" /></template>
  </BasiqTag>
</template>

<style module>
.compact {
  gap: 2px;
  height: 28px;
  padding: 2px;
  padding-inline-start: 6px;
  font-size: 0.8125rem;
}

.compact:not([data-removable]) {
  padding-inline-end: 6px;
}

.compact > button {
  width: 24px;
  height: 24px;
}

.compact > button svg {
  width: 14px;
  height: 14px;
}
</style>
