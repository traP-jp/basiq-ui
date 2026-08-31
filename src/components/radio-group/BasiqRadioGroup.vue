<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  useId,
  watchEffect,
} from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";

defineOptions({ inheritAttrs: false });

export type BasiqRadioGroupOrientation = "horizontal" | "vertical";

export interface BasiqRadioGroupItemDefinition {
  description?: string;
  disabled?: boolean;
  label: string;
  value: string;
}

interface NormalizedRadioGroupItem extends BasiqRadioGroupItemDefinition {
  disabled: boolean;
}

export interface BasiqRadioGroupProps {
  defaultValue?: string | null;
  description?: string;
  disabled?: boolean;
  error?: string;
  form?: string;
  id?: string;
  invalid?: boolean;
  items: readonly (BasiqRadioGroupItemDefinition | string)[];
  label?: string;
  modelValue?: string | null;
  name?: string;
  orientation?: BasiqRadioGroupOrientation;
  required?: boolean;
}

export interface BasiqRadioGroupEmits {
  change: [event: Event];
  "update:modelValue": [value: string | null];
}

export interface BasiqRadioGroupItemLabelSlotProps {
  checked: boolean;
  index: number;
  item: BasiqRadioGroupItemDefinition;
}

const props = withDefaults(defineProps<BasiqRadioGroupProps>(), {
  disabled: false,
  invalid: undefined,
  modelValue: undefined,
  orientation: "vertical",
  required: false,
});
const emit = defineEmits<BasiqRadioGroupEmits>();
const slots = defineSlots<{
  description?: () => unknown;
  error?: (props: { error: string }) => unknown;
  "item-label"?: (props: BasiqRadioGroupItemLabelSlotProps) => unknown;
  label?: () => unknown;
  required?: () => unknown;
}>();
const attrs = useAttrs();
const baseId = `basiq-radio-${useId()}`;
const groupId = computed(() => props.id ?? `${baseId}-group`);
const labelId = `${baseId}-label`;
const descriptionId = `${baseId}-description`;
const errorId = `${baseId}-error`;
const generatedName = `${baseId}-option`;
const resolvedName = computed(() => props.name ?? generatedName);
const isControlled = hasInitialProp("modelValue");
const resetValue =
  props.defaultValue !== undefined ? props.defaultValue : (props.modelValue ?? null);
const internalValue = ref<string | null>(resetValue);
const currentValue = computed(() =>
  isControlled ? (props.modelValue ?? null) : internalValue.value,
);
const hasLabel = computed(() => props.label !== undefined || Boolean(slots.label));
const hasDescription = computed(
  () => props.description !== undefined || Boolean(slots.description),
);
const hasError = computed(() => typeof props.error === "string" && props.error.length > 0);
const forcedInvalid = computed(() => props.invalid === true || hasError.value);
const normalizedItems = computed(() =>
  props.items.map<NormalizedRadioGroupItem>((item) =>
    typeof item === "string"
      ? { disabled: false, label: item, value: item }
      : { ...item, disabled: item.disabled ?? false },
  ),
);
const inputElements = ref<HTMLInputElement[]>([]);
let owningForm: HTMLFormElement | null = null;

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  const values = normalizedItems.value.map((item) => item.value);
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);

  if (duplicate !== undefined) {
    console.warn(`[BasiQ UI] BasiqRadioGroup item values must be unique: "${duplicate}".`);
  }

  if (props.required && !props.disabled && normalizedItems.value.every((item) => item.disabled)) {
    console.warn(
      "[BasiQ UI] BasiqRadioGroup requires at least one enabled item when required is true.",
    );
  }
});

onMounted(() => {
  syncInputs();
  syncOwningForm();

  if (
    import.meta.env.DEV &&
    !hasLabel.value &&
    attrs["aria-label"] === undefined &&
    attrs["aria-labelledby"] === undefined
  ) {
    console.warn(
      "[BasiQ UI] BasiqRadioGroup requires an accessible name. Set label, use the label slot, or set aria-label/aria-labelledby.",
    );
  }
});
onUpdated(() => {
  syncInputs();
  syncOwningForm();
});
onBeforeUnmount(() => {
  owningForm?.removeEventListener("formdata", handleFormData);
  owningForm?.removeEventListener("reset", handleFormReset);
});

function hasAttributeInvalid() {
  const value = attrs["aria-invalid"];

  return value === true || value === "true" || value === "grammar" || value === "spelling";
}

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) =>
        key !== "aria-describedby" &&
        key !== "aria-invalid" &&
        key !== "aria-labelledby" &&
        key !== "class" &&
        key !== "style",
    ),
  );
}

function resolveInvalid() {
  return forcedInvalid.value || hasAttributeInvalid();
}

function mergeAriaIds(...values: unknown[]) {
  const ids = values
    .flatMap((value) => (typeof value === "string" ? value.split(/\s+/) : []))
    .filter((value, index, allValues) => value !== "" && allValues.indexOf(value) === index);

  return ids.join(" ") || undefined;
}

function resolveAriaDescribedBy() {
  return mergeAriaIds(
    attrs["aria-describedby"],
    hasDescription.value ? descriptionId : undefined,
    hasError.value ? errorId : undefined,
  );
}

function resolveAriaLabelledBy() {
  return mergeAriaIds(attrs["aria-labelledby"], hasLabel.value ? labelId : undefined);
}

function resolveAriaInvalid() {
  if (forcedInvalid.value) return "true";

  const value = attrs["aria-invalid"];

  if (
    typeof value === "boolean" ||
    value === "false" ||
    value === "grammar" ||
    value === "spelling" ||
    value === "true"
  ) {
    return value;
  }

  return undefined;
}

function resolveItemLabelId(index: number) {
  return `${baseId}-option-${index}-label`;
}

function resolveItemDescriptionId(index: number) {
  return `${baseId}-option-${index}-description`;
}

function syncInputs() {
  for (const input of inputElements.value) {
    input.checked = input.value === currentValue.value;
  }
}

function syncOwningForm() {
  const nextOwningForm = inputElements.value[0]?.form ?? null;

  if (owningForm === nextOwningForm) return;

  owningForm?.removeEventListener("formdata", handleFormData);
  owningForm?.removeEventListener("reset", handleFormReset);
  owningForm = nextOwningForm;
  owningForm?.addEventListener("formdata", handleFormData);
  owningForm?.addEventListener("reset", handleFormReset);
}

function handleChange(event: Event) {
  const input = event.currentTarget as HTMLInputElement;

  if (!input.checked) return;

  if (!isControlled) internalValue.value = input.value;
  emit("update:modelValue", input.value);
  emit("change", event);
  queueMicrotask(syncInputs);
}

function handleFormData(event: FormDataEvent) {
  if (props.name === undefined) event.formData.delete(generatedName);
}

function handleFormReset(event: Event) {
  queueMicrotask(() => {
    if (event.defaultPrevented) {
      syncInputs();
      return;
    }

    if (isControlled) {
      emit("update:modelValue", resetValue);
    } else {
      internalValue.value = resetValue;
    }

    syncInputs();
  });
}
</script>

<template>
  <fieldset
    v-bind="getForwardedAttrs()"
    :id="groupId"
    :class="[$style.root, $attrs.class]"
    :aria-describedby="resolveAriaDescribedBy()"
    :aria-invalid="resolveAriaInvalid()"
    :aria-labelledby="resolveAriaLabelledBy()"
    :aria-orientation="orientation"
    :aria-required="required || undefined"
    :data-invalid="resolveInvalid() ? '' : undefined"
    :disabled="disabled"
    role="radiogroup"
    :style="$attrs.style"
  >
    <legend v-if="hasLabel" :id="labelId" :class="$style.legend">
      <span
        ><slot name="label">{{ label }}</slot></span
      >
      <span v-if="required" :class="$style.required" aria-hidden="true">
        <slot name="required">必須</slot>
      </span>
    </legend>
    <p v-if="hasDescription" :id="descriptionId" :class="$style.description">
      <slot name="description">{{ description }}</slot>
    </p>
    <div :class="$style.options" :data-orientation="orientation">
      <label
        v-for="(item, index) in normalizedItems"
        :key="item.value"
        :class="$style.option"
        :data-disabled="disabled || item.disabled ? '' : undefined"
      >
        <span :class="$style.control">
          <input
            ref="inputElements"
            :checked="currentValue === item.value"
            :class="$style.input"
            :aria-describedby="item.description ? resolveItemDescriptionId(index) : undefined"
            :aria-labelledby="resolveItemLabelId(index)"
            :disabled="disabled || item.disabled"
            :form="form"
            :name="resolvedName"
            :required="required"
            type="radio"
            :value="item.value"
            @change="handleChange"
          />
          <span :class="$style.visual" aria-hidden="true" />
        </span>
        <span :class="$style['option-content']">
          <span :id="resolveItemLabelId(index)" :class="$style['option-label']">
            <slot
              name="item-label"
              :checked="currentValue === item.value"
              :index="index"
              :item="item"
            >
              {{ item.label }}
            </slot>
          </span>
          <span
            v-if="item.description"
            :id="resolveItemDescriptionId(index)"
            :class="$style['option-description']"
          >
            {{ item.description }}
          </span>
        </span>
      </label>
    </div>
    <p v-if="hasError" :id="errorId" :class="$style.error">
      <slot name="error" :error="error ?? ''">{{ error }}</slot>
    </p>
  </fieldset>
</template>

<style module>
.root {
  display: grid;
  gap: var(--basiq-space-200);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--basiq-color-content-default);
  font-family: inherit;
}

.legend {
  display: flex;
  gap: var(--basiq-space-200);
  align-items: center;
  min-width: 0;
  margin: 0;
  padding: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
}

.required {
  color: var(--basiq-color-content-danger);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.5;
}

.description,
.error {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.description,
.option-description {
  color: var(--basiq-color-content-subtle);
}

.error {
  color: var(--basiq-color-content-danger);
}

.options {
  display: flex;
  gap: var(--basiq-space-200);
  align-items: flex-start;
  min-width: 0;
}

.options[data-orientation="vertical"] {
  flex-direction: column;
}

.options[data-orientation="horizontal"] {
  flex-wrap: wrap;
}

.option {
  position: relative;
  display: inline-flex;
  gap: var(--basiq-space-200);
  align-items: flex-start;
  width: fit-content;
  min-width: 0;
  min-height: 24px;
  cursor: pointer;
}

.control {
  position: relative;
  display: grid;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  place-items: center;
}

.input {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.visual {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: 18px;
  height: 18px;
  border: var(--basiq-border-width-strong) solid var(--basiq-color-radio-border-unchecked-rest);
  border-radius: var(--basiq-radius-full);
  background: var(--basiq-color-radio-background-rest);
}

.input:checked + .visual {
  border-color: var(--basiq-color-radio-border-checked-rest);
}

.input:checked + .visual::after {
  position: absolute;
  inset: 3px;
  border-radius: var(--basiq-radius-full);
  background: var(--basiq-color-radio-indicator);
  content: "";
}

.input:focus-visible + .visual {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root[data-invalid] .visual {
  border-color: var(--basiq-color-radio-border-invalid);
}

.option[data-disabled] {
  color: var(--basiq-color-content-disabled);
  cursor: not-allowed;
}

.option[data-disabled] .visual {
  border-color: var(--basiq-color-radio-border-disabled);
  background: var(--basiq-color-radio-background-disabled);
}

.option[data-disabled] .input:checked + .visual::after {
  background: var(--basiq-color-radio-indicator-disabled);
}

.root:not([data-invalid]) .option:hover:not([data-disabled]) .visual {
  border-color: var(--basiq-color-radio-border-hover);
  background: var(--basiq-color-radio-background-hover);
}

.root:not([data-invalid]) .option:active:not([data-disabled]) .visual {
  background: var(--basiq-color-radio-background-pressed);
}

.option-content {
  display: grid;
  gap: var(--basiq-space-100);
  min-width: 0;
}

.option-label {
  font-size: 1rem;
  line-height: 1.5;
}

.option-description {
  font-size: 0.875rem;
  line-height: 1.5;
}

@media (forced-colors: active) {
  .visual,
  .input:checked + .visual {
    border-color: ButtonText;
    background: Canvas;
    forced-color-adjust: none;
  }

  .input:checked + .visual::after {
    background: ButtonText;
  }

  .input:focus-visible + .visual {
    outline-color: Highlight;
  }

  .option[data-disabled] .visual {
    border-color: GrayText;
    background: Canvas;
  }

  .option[data-disabled] .input:checked + .visual::after {
    background: GrayText;
  }
}
</style>
