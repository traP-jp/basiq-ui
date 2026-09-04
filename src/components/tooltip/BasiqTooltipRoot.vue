<script setup lang="ts">
import { TooltipRoot } from "reka-ui";
import { computed, ref, watchEffect } from "vue";

import { assertBasiqTooltipProviderContext, provideBasiqTooltipContext } from "./context";

export interface BasiqTooltipRootProps {
  defaultOpen?: boolean;
  delayDuration?: number;
  disabled?: boolean;
  open?: boolean;
}

export interface BasiqTooltipRootEmits {
  "update:open": [value: boolean];
}

export interface BasiqTooltipRootSlotProps {
  open: boolean;
}

const props = withDefaults(defineProps<BasiqTooltipRootProps>(), {
  defaultOpen: false,
  delayDuration: undefined,
  disabled: false,
  open: undefined,
});
const emit = defineEmits<BasiqTooltipRootEmits>();
defineSlots<{
  default?: (props: BasiqTooltipRootSlotProps) => unknown;
}>();

assertBasiqTooltipProviderContext();

const uncontrolledOpen = ref(props.defaultOpen);
const isInitiallyControlled = props.open !== undefined;
const currentOpen = computed(() => props.open ?? uncontrolledOpen.value);

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  if ((props.open !== undefined) !== isInitiallyControlled) {
    console.warn(
      "[BasiQ UI] BasiqTooltipRoot must not switch between controlled and uncontrolled state.",
    );
  }
});

function setOpen(value: boolean) {
  if (!isInitiallyControlled) uncontrolledOpen.value = value;
  emit("update:open", value);
}

provideBasiqTooltipContext({ open: currentOpen });
</script>

<template>
  <TooltipRoot
    :delay-duration="delayDuration"
    :disabled="disabled"
    :open="currentOpen"
    @update:open="setOpen"
  >
    <slot :open="currentOpen" />
  </TooltipRoot>
</template>
