<script setup lang="ts">
import { ToggleGroupRoot } from "reka-ui";
import { computed, ref, watchEffect } from "vue";

export type BasiqChoiceGroupOrientation = "horizontal" | "vertical";

export interface BasiqChoiceGroupProps {
  allowEmptySelection?: boolean;
  defaultValue?: string | null;
  disabled?: boolean;
  loop?: boolean;
  modelValue?: string | null;
  orientation?: BasiqChoiceGroupOrientation;
}

export interface BasiqChoiceGroupEmits {
  "update:modelValue": [value: string | null];
}

const props = withDefaults(defineProps<BasiqChoiceGroupProps>(), {
  allowEmptySelection: false,
  disabled: false,
  loop: true,
  orientation: "horizontal",
});
const emit = defineEmits<BasiqChoiceGroupEmits>();

const isControlled = computed(() => props.modelValue !== undefined);
const internalValue = ref<string | null>(props.defaultValue ?? null);
const currentValue = computed(() =>
  isControlled.value ? (props.modelValue ?? null) : internalValue.value,
);

watchEffect(() => {
  if (import.meta.env.DEV && !props.allowEmptySelection && currentValue.value === null) {
    console.warn(
      "[BasiQ UI] BasiqChoiceGroup requires modelValue or defaultValue when allowEmptySelection is false.",
    );
  }
});

function handleValueChange(value: unknown) {
  const nextValue = typeof value === "string" ? value : null;

  if (nextValue === null && !props.allowEmptySelection) return;

  if (!isControlled.value) internalValue.value = nextValue;
  emit("update:modelValue", nextValue);
}
</script>

<template>
  <ToggleGroupRoot
    :class="$style.root"
    :data-orientation="orientation"
    :disabled="disabled"
    :loop="loop"
    :model-value="currentValue"
    :orientation="orientation"
    type="single"
    @update:model-value="handleValueChange"
  >
    <slot :model-value="currentValue" />
  </ToggleGroupRoot>
</template>

<style module>
.root {
  display: inline-flex;
  gap: var(--basiq-space-200);
}

.root[data-orientation="vertical"] {
  flex-direction: column;
}
</style>
