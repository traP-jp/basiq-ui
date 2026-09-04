<script setup lang="ts">
import { TagsInputInput, TagsInputItem, TagsInputItemText, TagsInputRoot } from "reka-ui";
import { computed, nextTick, ref, useAttrs, useTemplateRef, watchEffect } from "vue";

import { useFormFieldControl } from "../form-field/useFormFieldControl";
import BasiqSelectionControl from "../selection-input/BasiqSelectionControl.vue";
import BasiqSelectionTag from "../selection-input/BasiqSelectionTag.vue";
import {
  resolveSelectionInput,
  useSelectionFormReset,
  useSelectionState,
} from "../selection-input/useSelectionState";

defineOptions({ inheritAttrs: false });

export interface BasiqTagInputProps {
  allowDuplicates?: boolean;
  defaultValue?: readonly string[];
  /** Commits the current input when this string or regular expression is entered. */
  delimiter?: string | RegExp;
  disabled?: boolean;
  form?: string;
  id?: string;
  invalid?: boolean;
  max?: number;
  maxlength?: number;
  modelValue?: readonly string[];
  /** Submits tags as repeated entries with this name. */
  name?: string;
  /** Converts committed text before blank/duplicate/max validation. Defaults to trim. */
  normalizeValue?: (value: string) => string;
  placeholder?: string;
  readonly?: boolean;
  /** Produces the accessible name of each tag's remove button. */
  removeLabel: (value: string, index: number) => string;
  required?: boolean;
}

export interface BasiqTagInputEmits {
  add: [value: string];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
  "invalid-value": [value: string];
  remove: [value: string];
  "update:modelValue": [value: string[]];
}

export interface BasiqTagInputTagSlotProps {
  index: number;
  value: string;
}

const props = defineProps<BasiqTagInputProps>();
const emit = defineEmits<BasiqTagInputEmits>();
const slots = defineSlots<{
  "tag-leading"?: (props: BasiqTagInputTagSlotProps) => unknown;
}>();
const attrs = useAttrs();
const inputElement = useTemplateRef<HTMLInputElement>("input");
const draftValue = ref("");
const resolvedMax = computed(() =>
  props.max !== undefined && Number.isInteger(props.max) && props.max > 0 ? props.max : 0,
);
const cloneValue = (value: readonly string[]) => [...value];
const { currentValue, reset, setValue } = useSelectionState<string[]>({
  clone: cloneValue,
  defaultValue: () => (props.defaultValue ? [...props.defaultValue] : undefined),
  emitModelValue: (value) => emit("update:modelValue", value),
  fallback: () => [],
  modelValue: () => (props.modelValue ? [...props.modelValue] : undefined),
});
const { resolveAriaDescribedBy, resolveAriaInvalid, resolveInvalid, resolvedId, resolvedRequired } =
  useFormFieldControl({ componentName: "BasiqTagInput", props });

useSelectionFormReset(inputElement, () => {
  draftValue.value = "";
  reset();
});

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  if (typeof props.removeLabel !== "function") {
    console.warn("[BasiQ UI] BasiqTagInput requires removeLabel for accessible tag removal.");
  }

  if (props.max !== undefined && (!Number.isInteger(props.max) || props.max < 1)) {
    console.warn("[BasiQ UI] BasiqTagInput max must be a positive integer when provided.");
  }

  if (currentValue.value.some((value) => value.trim() === "")) {
    console.warn("[BasiQ UI] BasiqTagInput values must not be blank.");
  }
});

function resolveNormalizedValue(value: string) {
  return props.normalizeValue?.(value) ?? value.trim();
}

function getRemoveLabel(value: string, index: number) {
  return props.removeLabel?.(value, index) ?? value;
}

function syncDraftValue(event: Event) {
  draftValue.value = (event.target as HTMLInputElement).value;
}

async function handleDraftInput(event: Event) {
  await nextTick();
  syncDraftValue(event);
}

function handleModelUpdate(value: string[]) {
  if (props.disabled || props.readonly) return;
  const acceptedValues = value.filter((item) => item.trim() !== "");

  if (acceptedValues.length !== value.length) emit("invalid-value", "");
  setValue(acceptedValues);
}

function removeValue(index: number) {
  if (props.disabled || props.readonly) return;
  const removedValue = currentValue.value[index];

  if (removedValue === undefined) return;
  setValue(currentValue.value.filter((_, currentIndex) => currentIndex !== index));
  emit("remove", removedValue);
  resolveSelectionInput(inputElement.value)?.focus();
}

async function handleKeydown(event: KeyboardEvent) {
  if (event.isComposing) return;

  if (
    props.readonly &&
    (event.key === "Backspace" || event.key === "Delete" || event.key === "Enter")
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  if (event.key === "Enter") {
    const value = resolveNormalizedValue((event.target as HTMLInputElement).value);

    if (value === "") event.preventDefault();
  }

  await nextTick();
  await nextTick();
  syncDraftValue(event);
}

function handleAdd(value: string) {
  if (value.trim() !== "") emit("add", value);
}

function handleInvalid(value: string) {
  emit("invalid-value", value);
}
</script>

<template>
  <TagsInputRoot
    :model-value="currentValue"
    :convert-value="resolveNormalizedValue"
    :delimiter="delimiter ?? ','"
    :disabled="disabled === true"
    :duplicate="allowDuplicates === true"
    :max="resolvedMax"
    as-child
    @add-tag="handleAdd"
    @invalid="handleInvalid"
    @remove-tag="emit('remove', String($event))"
    @update:model-value="handleModelUpdate"
  >
    <BasiqSelectionControl
      :data-entry-empty="draftValue === '' ? '' : undefined"
      :data-has-values="currentValue.length > 0 ? '' : undefined"
      :disabled="disabled"
      input-layout="tag-entry"
      :invalid="resolveInvalid()"
      :readonly="readonly"
      @click.self="resolveSelectionInput(inputElement)?.focus()"
    >
      <TagsInputItem
        v-for="(value, index) in currentValue"
        :key="`${value}:${index}`"
        :class="$style.chip"
        data-basiq-selection-chip
        :disabled="disabled"
        :value="value"
      >
        <TagsInputItemText :class="$style['visually-hidden']">{{ value }}</TagsInputItemText>
        <BasiqSelectionTag
          density="compact"
          :disabled="disabled"
          :label="value"
          :readonly="readonly"
          :remove-label="getRemoveLabel(value, index)"
          @remove="removeValue(index)"
        >
          <template v-if="slots['tag-leading']" #leading>
            <slot name="tag-leading" :index="index" :value="value" />
          </template>
        </BasiqSelectionTag>
      </TagsInputItem>
      <TagsInputInput
        ref="input"
        v-bind="attrs"
        data-basiq-selection-input
        :id="resolvedId"
        :aria-describedby="resolveAriaDescribedBy()"
        :aria-invalid="resolveAriaInvalid()"
        :aria-required="resolvedRequired || undefined"
        :form="form"
        :maxlength="maxlength"
        :placeholder="currentValue.length === 0 ? placeholder : undefined"
        :required="resolvedRequired && currentValue.length === 0"
        :readonly="readonly"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
        @input="handleDraftInput"
        @keydown.capture="handleKeydown"
      />
    </BasiqSelectionControl>
  </TagsInputRoot>

  <template v-if="name">
    <input
      v-for="(value, index) in currentValue"
      :key="`form:${value}:${index}`"
      :disabled="disabled"
      :form="form"
      :name="name"
      type="hidden"
      :value="value"
    />
  </template>
</template>

<style module>
.chip {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  outline: none;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
