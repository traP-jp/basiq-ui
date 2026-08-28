<script setup lang="ts">
import type { AriaAttributes } from "vue";
import {
  computed,
  getCurrentInstance,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
} from "vue";

import { basiqFormFieldContextKey } from "../form-field/context";

defineOptions({ inheritAttrs: false });

export type BasiqInputType = "email" | "password" | "search" | "tel" | "text" | "url";
export type BasiqInputSize = "lg" | "md" | "sm";

export interface BasiqInputProps {
  autocomplete?: string;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  inputmode?: "decimal" | "email" | "none" | "numeric" | "search" | "tel" | "text" | "url";
  invalid?: boolean;
  maxlength?: number | string;
  minlength?: number | string;
  modelValue?: string;
  name?: string;
  pattern?: string;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  size?: BasiqInputSize;
  type?: BasiqInputType;
}

export interface BasiqInputEmits {
  blur: [event: FocusEvent];
  change: [event: Event];
  focus: [event: FocusEvent];
  input: [event: Event];
  "update:modelValue": [value: string];
}

const props = withDefaults(defineProps<BasiqInputProps>(), {
  disabled: false,
  invalid: undefined,
  readonly: false,
  required: undefined,
  size: "md",
  type: "text",
});
const emit = defineEmits<BasiqInputEmits>();
const attrs = useAttrs();
const formField = inject(basiqFormFieldContextKey, null);
const instance = getCurrentInstance();
const isControlled = Object.prototype.hasOwnProperty.call(
  instance?.vnode.props ?? {},
  "modelValue",
);
const resetValue = props.defaultValue ?? props.modelValue ?? "";
const internalValue = ref(resetValue);
const inputElement = useTemplateRef<HTMLInputElement>("input");
const currentValue = computed(() =>
  isControlled ? (props.modelValue ?? "") : internalValue.value,
);
let owningForm: HTMLFormElement | null = null;

if (import.meta.env.DEV && attrs.value !== undefined) {
  console.warn(
    "[BasiQ UI] BasiqInput does not support the value attribute. Use v-model or defaultValue instead.",
  );
}

watch(
  [() => props.id, () => formField?.controlId.value],
  ([id, fieldControlId]) => {
    if (import.meta.env.DEV && formField !== null && id !== undefined && id !== fieldControlId) {
      console.warn(
        "[BasiQ UI] BasiqInput uses the ID owned by BasiqFormField. Set controlId on BasiqFormField instead of id on BasiqInput.",
      );
    }
  },
  { immediate: true },
);

onMounted(() => {
  owningForm = inputElement.value?.form ?? null;
  owningForm?.addEventListener("reset", handleFormReset);
});

onBeforeUnmount(() => {
  owningForm?.removeEventListener("reset", handleFormReset);
});

const resolvedId = computed(() => formField?.controlId.value ?? props.id);
const forcedInvalid = computed(() => formField?.invalid.value === true || props.invalid === true);
const resolvedRequired = computed(
  () => formField?.required.value === true || props.required === true,
);

function hasAttributeInvalid() {
  const value = attrs["aria-invalid"];

  return value === true || value === "true" || value === "grammar" || value === "spelling";
}

function resolveInvalid() {
  return forcedInvalid.value || hasAttributeInvalid();
}

function resolveAriaInvalid(): AriaAttributes["aria-invalid"] {
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

function resolveAriaDescribedBy() {
  const ids = [attrs["aria-describedby"], formField?.describedBy.value]
    .flatMap((value) => (typeof value === "string" ? value.split(/\s+/) : []))
    .filter((value, index, values) => value !== "" && values.indexOf(value) === index);

  return ids.join(" ") || undefined;
}

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;

  if (!isControlled) internalValue.value = value;
  emit("update:modelValue", value);
  emit("input", event);
}

function handleChange(event: Event) {
  emit("change", event);
}

function handleFocus(event: FocusEvent) {
  emit("focus", event);
}

function handleBlur(event: FocusEvent) {
  emit("blur", event);
}

function handleFormReset(event: Event) {
  queueMicrotask(() => {
    if (event.defaultPrevented) return;

    if (isControlled) {
      emit("update:modelValue", resetValue);
    } else {
      internalValue.value = resetValue;
    }
  });
}
</script>

<template>
  <input
    ref="input"
    v-bind="$attrs"
    :id="resolvedId"
    :class="$style.root"
    :aria-describedby="resolveAriaDescribedBy()"
    :aria-invalid="resolveAriaInvalid()"
    :autocomplete="autocomplete"
    :data-invalid="resolveInvalid() ? '' : undefined"
    :disabled="disabled"
    :inputmode="inputmode"
    :maxlength="maxlength"
    :minlength="minlength"
    :name="name"
    :pattern="pattern"
    :placeholder="placeholder"
    :readonly="readonly"
    :required="resolvedRequired"
    :data-size="size"
    :type="type"
    :value="currentValue"
    @blur="handleBlur"
    @change="handleChange"
    @focus="handleFocus"
    @input="handleInput"
  />
</template>

<style module>
.root {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 var(--basiq-space-300);
  border: var(--basiq-border-width-strong) solid var(--basiq-color-input-border);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-input-content);
  background: var(--basiq-color-input-background);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  appearance: none;
}

.root[data-size="sm"] {
  height: 36px;
}

.root[data-size="lg"] {
  height: 44px;
}

.root::placeholder {
  color: var(--basiq-color-input-placeholder);
  opacity: 1;
}

.root:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.root[data-invalid] {
  border-color: var(--basiq-color-input-border-invalid);
}

.root:disabled {
  border-color: var(--basiq-color-input-border-disabled);
  color: var(--basiq-color-content-disabled);
  background: var(--basiq-color-input-background-disabled);
  cursor: not-allowed;
}

@media (forced-colors: active) {
  .root:focus-visible {
    outline-color: Highlight;
  }

  .root[data-invalid] {
    border-color: Mark;
  }
}
</style>
