<script setup lang="ts">
import { computed } from "vue";

import {
  provideBasiqThemeContext,
  resolveBasiqThemeOverrides,
  type BasiqThemeMode,
  type BasiqThemeOverrides,
} from "./context";

export type { BasiqThemeColorOverrides, BasiqThemeMode, BasiqThemeOverrides } from "./context";

export interface BasiqThemeProviderProps {
  mode?: BasiqThemeMode;
  overrides?: BasiqThemeOverrides;
}

const props = withDefaults(defineProps<BasiqThemeProviderProps>(), {
  mode: "system",
  overrides: undefined,
});

const mode = computed(() => props.mode);
const themeStyle = computed(() => resolveBasiqThemeOverrides(props.overrides));

provideBasiqThemeContext({ mode, style: themeStyle });
</script>

<template>
  <div :data-basiq-theme="mode" :style="themeStyle">
    <slot />
  </div>
</template>
