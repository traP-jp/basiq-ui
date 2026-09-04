<script setup lang="ts">
import { TooltipProvider } from "reka-ui";

import { provideBasiqTooltipProviderContext } from "./context";

export interface BasiqTooltipProviderProps {
  /** Delay before pointer hover opens a tooltip, in milliseconds. */
  delayDuration?: number;
  /** Time after closing during which another tooltip opens without delay, in milliseconds. */
  skipDelayDuration?: number;
}

withDefaults(defineProps<BasiqTooltipProviderProps>(), {
  delayDuration: 700,
  skipDelayDuration: 300,
});
defineSlots<{
  default?: () => unknown;
}>();

provideBasiqTooltipProviderContext();
</script>

<template>
  <TooltipProvider
    :delay-duration="delayDuration"
    :disable-hoverable-content="false"
    :skip-delay-duration="skipDelayDuration"
  >
    <slot />
  </TooltipProvider>
</template>
