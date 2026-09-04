<script setup lang="ts">
import { DropdownMenuRoot } from "reka-ui";
import { computed, ref, watchEffect } from "vue";

import { provideBasiqDropdownMenuContext } from "./context";

export type BasiqDropdownMenuDirection = "ltr" | "rtl";

export interface BasiqDropdownMenuRootProps {
  defaultOpen?: boolean;
  dir?: BasiqDropdownMenuDirection;
  /** Isolates pointer, focus, scrolling, and screen-reader interaction while open. */
  modal?: boolean;
  open?: boolean;
}

export interface BasiqDropdownMenuRootEmits {
  "update:open": [value: boolean];
}

export interface BasiqDropdownMenuRootSlotProps {
  open: boolean;
}

const props = withDefaults(defineProps<BasiqDropdownMenuRootProps>(), {
  defaultOpen: false,
  dir: undefined,
  modal: false,
  open: undefined,
});
const emit = defineEmits<BasiqDropdownMenuRootEmits>();
defineSlots<{
  default?: (props: BasiqDropdownMenuRootSlotProps) => unknown;
}>();

const uncontrolledOpen = ref(props.defaultOpen);
const isInitiallyControlled = props.open !== undefined;
const currentOpen = computed(() => props.open ?? uncontrolledOpen.value);
const modal = computed(() => props.modal);

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  if ((props.open !== undefined) !== isInitiallyControlled) {
    console.warn(
      "[BasiQ UI] BasiqDropdownMenuRoot must not switch between controlled and uncontrolled state.",
    );
  }
});

function setOpen(value: boolean) {
  if (!isInitiallyControlled) uncontrolledOpen.value = value;
  emit("update:open", value);
}

provideBasiqDropdownMenuContext({ modal, open: currentOpen });
</script>

<template>
  <DropdownMenuRoot :dir="dir" :modal="modal" :open="currentOpen" @update:open="setOpen">
    <slot :open="currentOpen" />
  </DropdownMenuRoot>
</template>
