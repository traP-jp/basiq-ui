<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";
import BasiqTabsContent from "./BasiqTabsContent.vue";
import BasiqTabsList from "./BasiqTabsList.vue";
import BasiqTabsRoot, {
  type BasiqTabsActivationMode,
  type BasiqTabsDirection,
  type BasiqTabsOrientation,
} from "./BasiqTabsRoot.vue";
import BasiqTabsTrigger from "./BasiqTabsTrigger.vue";

export interface BasiqTabsItem {
  content?: string;
  disabled?: boolean;
  label: string;
  value: string;
}

export interface BasiqTabsProps {
  activationMode?: BasiqTabsActivationMode;
  ariaLabel?: string;
  ariaLabelledby?: string;
  defaultValue?: string;
  dir?: BasiqTabsDirection;
  items: readonly BasiqTabsItem[];
  listWidth?: string;
  loop?: boolean;
  modelValue?: string;
  orientation?: BasiqTabsOrientation;
  unmountOnHide?: boolean;
}

export interface BasiqTabsEmits {
  "update:modelValue": [value: string];
}

export interface BasiqTabsItemSlotProps {
  index: number;
  item: BasiqTabsItem;
  selected: boolean;
}

const props = withDefaults(defineProps<BasiqTabsProps>(), {
  activationMode: "automatic",
  ariaLabel: undefined,
  ariaLabelledby: undefined,
  defaultValue: undefined,
  dir: undefined,
  listWidth: undefined,
  loop: true,
  modelValue: undefined,
  orientation: "horizontal",
  unmountOnHide: true,
});
const emit = defineEmits<BasiqTabsEmits>();
defineSlots<{
  content?: (props: BasiqTabsItemSlotProps) => unknown;
  trigger?: (props: BasiqTabsItemSlotProps) => unknown;
}>();

const isControlled = hasInitialProp("modelValue");
const firstEnabledValue = computed(() => props.items.find((item) => item.disabled !== true)?.value);
const internalValue = ref<string | undefined>(props.defaultValue ?? firstEnabledValue.value);
const ownedValue = computed(() => (isControlled ? props.modelValue : internalValue.value));
const selectedValue = computed(() =>
  isEnabledValue(ownedValue.value) ? ownedValue.value : firstEnabledValue.value,
);
let hasValidatedDefaultValue = false;
let hasWarnedModeSwitch = false;

watchEffect(() => {
  if (isControlled || isEnabledValue(internalValue.value)) return;
  if (firstEnabledValue.value !== undefined) internalValue.value = firstEnabledValue.value;
});

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  const values = props.items.map((item) => item.value);
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  const unnamedItem = props.items.find((item) => item.label.trim().length === 0);

  if (duplicate !== undefined) {
    console.warn(`[BasiQ UI] BasiqTabs item values must be unique: "${duplicate}".`);
  }

  if (unnamedItem !== undefined) {
    console.warn(
      `[BasiQ UI] BasiqTabs item labels must not be empty: "${unnamedItem.value}". The label is used as the tab's accessible name.`,
    );
  }

  if (props.items.length > 0 && firstEnabledValue.value === undefined) {
    console.warn("[BasiQ UI] BasiqTabs requires at least one enabled item.");
  }

  if (isControlled && firstEnabledValue.value !== undefined && !isEnabledValue(props.modelValue)) {
    console.warn(
      `[BasiQ UI] BasiqTabs modelValue must match an enabled item: "${String(props.modelValue)}". The first enabled item is displayed instead.`,
    );
  }

  if (!isControlled && !hasWarnedModeSwitch && props.modelValue !== undefined) {
    hasWarnedModeSwitch = true;
    console.warn("[BasiQ UI] BasiqTabs must not switch between controlled and uncontrolled state.");
  }

  if (
    !isControlled &&
    !hasValidatedDefaultValue &&
    props.defaultValue !== undefined &&
    firstEnabledValue.value !== undefined
  ) {
    hasValidatedDefaultValue = true;

    if (!isEnabledValue(props.defaultValue)) {
      console.warn(
        `[BasiQ UI] BasiqTabs defaultValue must match an enabled item: "${props.defaultValue}". The first enabled item is displayed instead.`,
      );
    }
  }
});

function isEnabledValue(value: string | undefined): value is string {
  return props.items.some((item) => item.value === value && item.disabled !== true);
}

function handleValueChange(value: string) {
  if (!isControlled) internalValue.value = value;
  emit("update:modelValue", value);
}
</script>

<template>
  <BasiqTabsRoot
    :key="selectedValue === undefined ? 'empty' : 'selected'"
    :activation-mode="activationMode"
    :dir="dir"
    :model-value="selectedValue"
    :orientation="orientation"
    :unmount-on-hide="unmountOnHide"
    @update:model-value="handleValueChange"
  >
    <BasiqTabsList
      :aria-label="ariaLabel"
      :aria-labelledby="ariaLabelledby"
      :loop="loop"
      :width="listWidth"
    >
      <BasiqTabsTrigger
        v-for="(item, index) in items"
        :key="item.value"
        :aria-label="$slots.trigger ? item.label : undefined"
        :disabled="item.disabled"
        :value="item.value"
      >
        <slot
          v-if="$slots.trigger"
          name="trigger"
          :index="index"
          :item="item"
          :selected="item.value === selectedValue"
        />
        <template v-else>{{ item.label }}</template>
      </BasiqTabsTrigger>
    </BasiqTabsList>

    <BasiqTabsContent v-for="(item, index) in items" :key="item.value" :value="item.value">
      <slot
        v-if="$slots.content"
        name="content"
        :index="index"
        :item="item"
        :selected="item.value === selectedValue"
      />
      <template v-else>{{ item.content }}</template>
    </BasiqTabsContent>
  </BasiqTabsRoot>
</template>
