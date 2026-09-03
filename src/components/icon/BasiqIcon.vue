<script setup lang="ts">
import { computed, type Component, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

export interface BasiqIconProps {
  /** A currentColor-compatible Vue component whose single root element accepts fallthrough attributes. */
  icon: Component;
  /** Gives a meaningful standalone icon an accessible name. Omit for decorative icons. */
  label?: string;
}

const props = defineProps<BasiqIconProps>();
const attrs = useAttrs();
const accessibleLabel = computed(() => props.label?.trim() || undefined);
const hasLabel = computed(() => accessibleLabel.value !== undefined);

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) =>
        key !== "aria-hidden" &&
        key !== "aria-label" &&
        key !== "class" &&
        key !== "focusable" &&
        key !== "role" &&
        key !== "style" &&
        key !== "tabindex" &&
        key !== "tabIndex",
    ),
  );
}
</script>

<template>
  <component
    :is="icon"
    v-bind="getForwardedAttrs()"
    :class="[$style.root, $attrs.class]"
    :style="$attrs.style || null"
    :aria-hidden="hasLabel ? undefined : 'true'"
    :aria-label="accessibleLabel"
    :focusable="false"
    :role="hasLabel ? 'img' : undefined"
  />
</template>

<style module>
.root {
  display: inline-block;
  flex: 0 0 auto;
  width: 1em;
  height: 1em;
  color: inherit;
  user-select: none;
  vertical-align: -0.125em;
}
</style>
