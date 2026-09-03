<script setup lang="ts">
import { computed, type Component, watchEffect } from "vue";

import BasiqIcon from "../icon/BasiqIcon.vue";

export interface BasiqTagBaseProps {
  /** A currentColor-compatible Vue icon component. The tag treats it as decorative. */
  icon?: Component;
  label: string;
}

export interface BasiqTagDisplayProps extends BasiqTagBaseProps {
  disabled?: never;
  removable?: false;
  removeLabel?: never;
}

export interface BasiqTagRemovableProps extends BasiqTagBaseProps {
  disabled?: boolean;
  removable: true;
  removeLabel: string;
}

export type BasiqTagProps = BasiqTagDisplayProps | BasiqTagRemovableProps;

export interface BasiqTagEmits {
  remove: [event: MouseEvent];
}

export interface BasiqTagSlots {
  /** Replaces the decorative icon shorthand with custom leading content. */
  leading?: () => unknown;
}

const props = defineProps<BasiqTagProps>();
const emit = defineEmits<BasiqTagEmits>();
const slots = defineSlots<BasiqTagSlots>();
const resolvedRemoveLabel = computed(() => props.removeLabel?.trim() || undefined);

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (typeof props.label !== "string" || props.label.trim().length === 0) {
      console.warn("[BasiQ UI] BasiqTag label must be a non-empty string.");
    }

    if (props.removable && resolvedRemoveLabel.value === undefined) {
      console.warn(
        "[BasiQ UI] A removable BasiqTag requires a non-empty removeLabel for its remove button.",
      );
    }

    if (props.disabled && !props.removable) {
      console.warn("[BasiQ UI] BasiqTag disabled only applies when removable is true.");
    }

    if (props.icon && slots.leading) {
      console.warn(
        "[BasiQ UI] BasiqTag received both icon and a leading slot; the leading slot takes precedence.",
      );
    }
  });
}

function handleRemove(event: MouseEvent) {
  emit("remove", event);
}
</script>

<template>
  <span :class="$style.root" :data-removable="removable ? '' : undefined">
    <span v-if="$slots.leading || icon" :class="$style.leading">
      <slot v-if="$slots.leading" name="leading" />
      <BasiqIcon v-else-if="icon" :class="$style['leading-icon']" :icon="icon" />
    </span>
    <span :class="$style.label">{{ label }}</span>
    <button
      v-if="removable"
      :aria-label="resolvedRemoveLabel"
      :class="$style['remove-button']"
      :disabled="disabled"
      type="button"
      @click.stop="handleRemove"
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  </span>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: inline-flex;
  gap: var(--basiq-space-100);
  align-items: center;
  height: 32px;
  width: fit-content;
  max-width: 100%;
  padding: var(--basiq-space-100);
  padding-inline-start: var(--basiq-space-200);
  border: var(--basiq-border-width-default) solid var(--basiq-color-tag-border);
  border-radius: var(--basiq-radius-full);
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-tag-background);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  vertical-align: middle;
}

.root:not([data-removable]) {
  padding-inline-end: var(--basiq-space-200);
}

.leading {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--basiq-color-content-subtle);
}

.leading-icon {
  width: 20px;
  height: 20px;
}

.label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-button {
  box-sizing: border-box;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;

  /* Include the 1px border when centering the button on the 32px pill end cap. */
  margin-inline-end: calc(-1 * var(--basiq-border-width-default));
  border: 0;
  border-radius: var(--basiq-radius-full);
  color: var(--basiq-color-content-subtle);
  background: transparent;
  font: inherit;
  cursor: pointer;
  appearance: none;
}

.remove-button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 2;
}

.remove-button:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.remove-button:disabled {
  color: var(--basiq-color-content-disabled);
  cursor: not-allowed;
}

.remove-button:not(:disabled):hover {
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-tag-remove-background-hover);
}

.remove-button:not(:disabled):active {
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-tag-remove-background-pressed);
}

@media (forced-colors: active) {
  .remove-button:focus-visible {
    outline-color: Highlight;
  }
}
</style>
