<script setup lang="ts">
import { computed, type Component } from "vue";

import BasiqIcon from "../icon/BasiqIcon.vue";

export type BasiqButtonTone = "accent" | "neutral" | "danger";
export type BasiqButtonVariant = "solid" | "outline";
export type BasiqButtonIconPlacement = "leading" | "trailing" | "only";

export interface BasiqButtonProps {
  disabled?: boolean;
  /** A currentColor-compatible Vue icon component. The button controls its size and spacing and treats it as decorative. */
  icon?: Component;
  /** Places an icon before the label, after it, or by itself. With an icon, `only` omits the default slot and requires an accessible name on the button. */
  iconPlacement?: BasiqButtonIconPlacement;
  tone?: BasiqButtonTone;
  type?: "button" | "submit" | "reset";
  variant?: BasiqButtonVariant;
}

const props = withDefaults(defineProps<BasiqButtonProps>(), {
  disabled: false,
  iconPlacement: "leading",
  tone: "accent",
  type: "button",
  variant: "solid",
});
const isIconOnly = computed(() => Boolean(props.icon) && props.iconPlacement === "only");
</script>

<template>
  <button
    :class="$style.root"
    :data-icon-only="isIconOnly ? '' : undefined"
    :data-tone="tone"
    :data-variant="variant"
    :disabled="disabled"
    :type="type"
  >
    <BasiqIcon v-if="icon && iconPlacement !== 'trailing'" :class="$style.icon" :icon="icon" />
    <slot v-if="!isIconOnly" />
    <BasiqIcon v-if="icon && iconPlacement === 'trailing'" :class="$style.icon" :icon="icon" />
  </button>
</template>

<style module>
.root {
  --basiq-button-local-background-rest: transparent;
  --basiq-button-local-background-hover: transparent;
  --basiq-button-local-background-pressed: transparent;
  --basiq-button-local-border: transparent;
  --basiq-button-local-content: inherit;

  box-sizing: border-box;
  display: inline-flex;
  gap: var(--basiq-space-200);
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 var(--basiq-space-400);
  border: 0 solid var(--basiq-button-local-border);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-button-local-content);
  background: var(--basiq-button-local-background-rest);
  font: inherit;
  font-weight: 700;
  line-height: 1.5;
  cursor: pointer;
  appearance: none;
}

.root[data-icon-only] {
  width: 40px;
  min-width: 40px;
  padding: 0;
}

.icon {
  font-size: 20px;
}

.root[data-icon-only] .icon {
  font-size: 24px;
}

.root[data-tone="accent"][data-variant="solid"] {
  --basiq-button-local-background-rest: var(--basiq-color-button-background-accent-solid-rest);
  --basiq-button-local-background-hover: var(--basiq-color-button-background-accent-solid-hover);
  --basiq-button-local-background-pressed: var(
    --basiq-color-button-background-accent-solid-pressed
  );
  --basiq-button-local-content: var(--basiq-color-button-content-accent-solid);
}

.root[data-tone="neutral"][data-variant="solid"] {
  --basiq-button-local-background-rest: var(--basiq-color-button-background-neutral-solid-rest);
  --basiq-button-local-background-hover: var(--basiq-color-button-background-neutral-solid-hover);
  --basiq-button-local-background-pressed: var(
    --basiq-color-button-background-neutral-solid-pressed
  );
  --basiq-button-local-content: var(--basiq-color-button-content-neutral-solid);
}

.root[data-tone="danger"][data-variant="solid"] {
  --basiq-button-local-background-rest: var(--basiq-color-button-background-danger-solid-rest);
  --basiq-button-local-background-hover: var(--basiq-color-button-background-danger-solid-hover);
  --basiq-button-local-background-pressed: var(
    --basiq-color-button-background-danger-solid-pressed
  );
  --basiq-button-local-content: var(--basiq-color-button-content-danger-solid);
}

.root[data-variant="outline"] {
  border-width: var(--basiq-border-width-strong);
}

.root[data-tone="accent"][data-variant="outline"] {
  --basiq-button-local-background-hover: var(--basiq-color-button-background-accent-outline-hover);
  --basiq-button-local-background-pressed: var(
    --basiq-color-button-background-accent-outline-pressed
  );
  --basiq-button-local-border: var(--basiq-color-button-border-accent-outline);
  --basiq-button-local-content: var(--basiq-color-button-content-accent-outline);
}

.root[data-tone="neutral"][data-variant="outline"] {
  --basiq-button-local-background-hover: var(--basiq-color-button-background-neutral-outline-hover);
  --basiq-button-local-background-pressed: var(
    --basiq-color-button-background-neutral-outline-pressed
  );
  --basiq-button-local-border: var(--basiq-color-button-border-neutral-outline);
  --basiq-button-local-content: var(--basiq-color-button-content-neutral-outline);
}

.root[data-tone="danger"][data-variant="outline"] {
  --basiq-button-local-background-hover: var(--basiq-color-button-background-danger-outline-hover);
  --basiq-button-local-background-pressed: var(
    --basiq-color-button-background-danger-outline-pressed
  );
  --basiq-button-local-border: var(--basiq-color-button-foreground-danger-outline);
  --basiq-button-local-content: var(--basiq-color-button-foreground-danger-outline);
}

.root:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root:disabled {
  color: var(--basiq-color-content-disabled);
  background: var(--basiq-color-control-background-disabled);
  cursor: not-allowed;
}

.root[data-variant="outline"]:disabled {
  border-color: var(--basiq-color-button-border-outline-disabled);
  background: transparent;
}

.root:not(:disabled):hover {
  background: var(--basiq-button-local-background-hover);
}

.root:not(:disabled):active {
  background: var(--basiq-button-local-background-pressed);
}

@media (forced-colors: active) {
  .root:focus-visible {
    outline-color: Highlight;
  }
}
</style>
