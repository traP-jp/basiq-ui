<script setup lang="ts">
defineOptions({ inheritAttrs: false });

interface BasiqSelectionControlProps {
  disabled?: boolean;
  inputLayout?: "query" | "tag-entry";
  invalid?: boolean;
  readonly?: boolean;
}

withDefaults(defineProps<BasiqSelectionControlProps>(), {
  disabled: false,
  inputLayout: "query",
  invalid: false,
  readonly: false,
});
</script>

<template>
  <div
    v-bind="$attrs"
    :class="$style.root"
    :data-disabled="disabled ? '' : undefined"
    :data-input-layout="inputLayout"
    :data-invalid="invalid ? '' : undefined"
    :data-readonly="readonly ? '' : undefined"
  >
    <slot />
  </div>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: var(--basiq-space-100);
  align-items: center;
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 2px 6px;
  border: var(--basiq-border-width-strong) solid var(--basiq-color-text-control-border);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-text-control-content);
  background: var(--basiq-color-text-control-background);
  cursor: text;
}

.root:focus-within {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root[data-invalid] {
  border-color: var(--basiq-color-text-control-border-invalid);
}

.root[data-disabled] {
  border-color: var(--basiq-color-text-control-border-disabled);
  color: var(--basiq-color-content-disabled);
  background: var(--basiq-color-text-control-background-disabled);
  cursor: not-allowed;
}

.root[data-readonly] {
  cursor: default;
}

.root :global([data-basiq-selection-input]) {
  box-sizing: border-box;
  flex: 1 1 8rem;
  min-width: 4rem;
  height: 32px;
  padding: 0 var(--basiq-space-100);
  border: 0;
  outline: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  font-size: 1rem;
  line-height: 1.5;
  appearance: none;
}

.root :global([data-basiq-selection-input]::placeholder) {
  color: var(--basiq-color-text-control-placeholder);
  opacity: 1;
}

.root :global([data-basiq-selection-input]:disabled) {
  cursor: not-allowed;
}

.root[data-input-layout="tag-entry"]:global([data-has-values])
  :global([data-basiq-selection-input]) {
  flex: 1 1 2ch;
  min-width: 1ch;
  max-width: 100%;
  height: 28px;
  padding-inline: 0;
}

@supports (field-sizing: content) {
  .root[data-input-layout="tag-entry"]:global([data-has-values])
    :global([data-basiq-selection-input]) {
    flex: 0 1 auto;
    width: auto;
    field-sizing: content;
  }
}

.root[data-input-layout="tag-entry"]:global([data-has-values][data-entry-empty])
  :global([data-basiq-selection-input]) {
  position: absolute;
  width: 1px;
  min-width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.root[data-input-layout="tag-entry"]:global(
    [data-has-values][data-entry-empty]:not([data-disabled], [data-readonly])
  ):focus-within
  :global([data-basiq-selection-chip]:last-of-type) {
  position: relative;
}

.root[data-input-layout="tag-entry"]:global(
    [data-has-values][data-entry-empty]:not([data-disabled], [data-readonly])
  ):focus-within
  :global([data-basiq-selection-chip]:last-of-type)::after {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: -3px;
  width: 1px;
  height: 1rem;
  background: currentcolor;
  content: "";
  transform: translateY(-50%);
}

.root :global([data-basiq-selection-chip][data-state="active"]) {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: 0;
  border-radius: var(--basiq-radius-full);
}

@media (forced-colors: active) {
  .root:focus-within,
  .root :global([data-basiq-selection-chip][data-state="active"]) {
    outline-color: Highlight;
  }

  .root[data-invalid] {
    border-color: Mark;
  }
}
</style>
