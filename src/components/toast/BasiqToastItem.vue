<script setup lang="ts">
import { ToastRoot } from "reka-ui";

import BasiqToastSurface from "./BasiqToastSurface.vue";
import type { BasiqToastRecord } from "./types";

interface BasiqToastItemProps {
  closeLabel: string;
  toast: BasiqToastRecord;
}

defineProps<BasiqToastItemProps>();
const emit = defineEmits<{ dismiss: [] }>();

function preventRekaEscape(event: KeyboardEvent) {
  event.preventDefault();
}
</script>

<template>
  <ToastRoot
    as-child
    :data-basiq-toast-id="toast.id"
    :open="true"
    :type="toast.priority"
    @escape-key-down="preventRekaEscape"
    @update:open="(open) => !open && emit('dismiss')"
  >
    <BasiqToastSurface as="li" :close-label="closeLabel" :toast="toast" />
  </ToastRoot>
</template>
