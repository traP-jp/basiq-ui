<script setup lang="ts">
export interface BasiqNavigationEdgeControlProps {
  controls?: string;
  direction: "left" | "right";
  expanded?: boolean;
  label: string;
  suppressHover?: boolean;
}

withDefaults(defineProps<BasiqNavigationEdgeControlProps>(), {
  controls: undefined,
  expanded: undefined,
  suppressHover: false,
});
defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    type="button"
    :aria-controls="controls"
    :aria-expanded="expanded"
    :aria-label="label"
    :class="$style.root"
    :data-direction="direction"
    :data-suppress-hover="suppressHover || undefined"
    @click="$emit('click', $event)"
  >
    <svg :class="$style.icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M18.41,7.41L17,6L11,12L17,18L18.41,16.59L13.83,12L18.41,7.41M12.41,7.41L11,6L5,12L11,18L12.41,16.59L7.83,12L12.41,7.41Z"
      />
    </svg>
  </button>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 0 var(--basiq-radius-sm) var(--basiq-radius-sm) 0;
  color: var(--basiq-color-content-default);
  background: transparent;
  cursor: pointer;
  appearance: none;
}

.root:hover {
  background: var(--basiq-color-surface-muted);
}

.root:active {
  background: var(--basiq-color-border-separator);
}

.root[data-suppress-hover="true"]:hover {
  background: transparent;
}

.root[data-suppress-hover="true"]:active {
  background: var(--basiq-color-border-separator);
}

.root:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: calc(-1 * (var(--basiq-focus-ring-width) + var(--basiq-focus-ring-gap)));
}

.icon {
  width: 24px;
  height: 24px;
  transition: transform var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.root[data-direction="right"] .icon {
  transform: scaleX(-1);
}

@media (prefers-reduced-motion: reduce) {
  .icon {
    transition: none;
  }
}
</style>
