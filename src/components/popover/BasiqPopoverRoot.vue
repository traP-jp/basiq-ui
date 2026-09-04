<script setup lang="ts">
import { PopoverRoot } from "reka-ui";
import { computed, ref, watchEffect } from "vue";

import { provideBasiqPopoverContext } from "./context";

export interface BasiqPopoverRootProps {
  defaultOpen?: boolean;
  /** Controls passive dismissal through Escape and outside interactions. Trigger and explicit close controls remain available. */
  dismissible?: boolean;
  /** Isolates pointer, focus, scrolling, and screen-reader interaction while open. Popovers do not render a visual scrim. */
  modal?: boolean;
  open?: boolean;
}

export interface BasiqPopoverRootEmits {
  "update:open": [value: boolean];
}

export interface BasiqPopoverRootSlotProps {
  close: () => void;
  open: boolean;
}

const props = withDefaults(defineProps<BasiqPopoverRootProps>(), {
  defaultOpen: false,
  dismissible: true,
  modal: false,
  open: undefined,
});
const emit = defineEmits<BasiqPopoverRootEmits>();
defineSlots<{
  default?: (props: BasiqPopoverRootSlotProps) => unknown;
}>();

const uncontrolledOpen = ref(props.defaultOpen);
const isInitiallyControlled = props.open !== undefined;
const currentOpen = computed(() => props.open ?? uncontrolledOpen.value);
const dismissible = computed(() => props.dismissible);
const modal = computed(() => props.modal);

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  if ((props.open !== undefined) !== isInitiallyControlled) {
    console.warn(
      "[BasiQ UI] BasiqPopoverRoot must not switch between controlled and uncontrolled state.",
    );
  }
});

function setOpen(value: boolean) {
  if (!isInitiallyControlled) uncontrolledOpen.value = value;
  emit("update:open", value);
}

function close() {
  setOpen(false);
}

provideBasiqPopoverContext({ close, dismissible, modal, open: currentOpen });
</script>

<template>
  <PopoverRoot :modal="modal" :open="currentOpen" @update:open="setOpen">
    <slot :close="close" :open="currentOpen" />
  </PopoverRoot>
</template>
