<script setup lang="ts">
import { DropdownMenuItem } from "reka-ui";

defineOptions({ inheritAttrs: false });

export type BasiqDropdownMenuItemTone = "danger" | "default";

export interface BasiqDropdownMenuItemProps {
  disabled?: boolean;
  textValue?: string;
  tone?: BasiqDropdownMenuItemTone;
}

export interface BasiqDropdownMenuItemEmits {
  select: [event: Event];
}

withDefaults(defineProps<BasiqDropdownMenuItemProps>(), {
  disabled: false,
  textValue: undefined,
  tone: "default",
});
const emit = defineEmits<BasiqDropdownMenuItemEmits>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <DropdownMenuItem
    v-bind="$attrs"
    :class="[$style.item, $attrs.class]"
    :data-tone="tone"
    :disabled="disabled"
    :text-value="textValue"
    @select="emit('select', $event)"
  >
    <slot />
  </DropdownMenuItem>
</template>

<style module>
.item {
  box-sizing: border-box;
  display: flex;
  min-height: 2rem;
  align-items: center;
  gap: var(--basiq-space-200);
  padding: var(--basiq-space-100) var(--basiq-space-200);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-dropdown-menu-content);
  cursor: default;
  outline: none;
  user-select: none;
}

.item[data-highlighted] {
  background: var(--basiq-color-dropdown-menu-item-background-highlighted);
}

.item[data-tone="danger"] {
  color: var(--basiq-color-dropdown-menu-content-danger);
}

.item[data-disabled] {
  color: var(--basiq-color-dropdown-menu-content-disabled);
  cursor: not-allowed;
}

@media (forced-colors: active) {
  .item[data-highlighted] {
    color: HighlightText;
    background: Highlight;
  }

  .item[data-disabled] {
    color: GrayText;
  }
}
</style>
