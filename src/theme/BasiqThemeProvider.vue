<script setup lang="ts">
export type BasiqThemeMode = "light" | "dark" | "system";

export interface BasiqThemeProviderProps {
  mode?: BasiqThemeMode;
}

withDefaults(defineProps<BasiqThemeProviderProps>(), {
  mode: "system",
});
</script>

<template>
  <div :data-basiq-theme="mode">
    <slot />
  </div>
</template>
