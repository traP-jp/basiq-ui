<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";
import BasiqTabsContent from "./BasiqTabsContent.vue";
import BasiqTabsList from "./BasiqTabsList.vue";
import BasiqTabsRoot, {
  type BasiqTabsActivationMode,
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
  items: readonly BasiqTabsItem[];
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
const currentValue = computed(() => (isControlled ? props.modelValue : internalValue.value));

watchEffect(() => {
  if (!isControlled && internalValue.value === undefined) {
    internalValue.value = firstEnabledValue.value;
  }
});

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  const values = props.items.map((item) => item.value);
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);

  if (duplicate !== undefined) {
    console.warn(`[BasiQ UI] BasiqTabs item values must be unique: "${duplicate}".`);
  }

  if (props.items.length > 0 && firstEnabledValue.value === undefined) {
    console.warn("[BasiQ UI] BasiqTabs requires at least one enabled item.");
  }

  if (isControlled && currentValue.value === undefined && firstEnabledValue.value !== undefined) {
    console.warn("[BasiQ UI] BasiqTabs modelValue must select an enabled item.");
  }

  if (
    currentValue.value !== undefined &&
    !props.items.some((item) => item.value === currentValue.value && item.disabled !== true)
  ) {
    console.warn(
      `[BasiQ UI] BasiqTabs selected value must match an enabled item: "${currentValue.value}".`,
    );
  }
});

function handleValueChange(value: string) {
  if (!isControlled) internalValue.value = value;
  emit("update:modelValue", value);
}
</script>

<template>
  <BasiqTabsRoot
    :activation-mode="activationMode"
    :model-value="currentValue"
    :orientation="orientation"
    :unmount-on-hide="unmountOnHide"
    @update:model-value="handleValueChange"
  >
    <BasiqTabsList :aria-label="ariaLabel" :aria-labelledby="ariaLabelledby" :loop="loop">
      <BasiqTabsTrigger
        v-for="(item, index) in items"
        :key="item.value"
        :disabled="item.disabled"
        :value="item.value"
      >
        <slot
          v-if="$slots.trigger"
          name="trigger"
          :index="index"
          :item="item"
          :selected="item.value === currentValue"
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
        :selected="item.value === currentValue"
      />
      <template v-else>{{ item.content }}</template>
    </BasiqTabsContent>
  </BasiqTabsRoot>
</template>
