<script setup lang="ts">
import { computed, provide, useId } from "vue";

import { basiqFormFieldContextKey } from "./context";

export interface BasiqFormFieldProps {
  controlId?: string;
  description?: string;
  error?: string;
  invalid?: boolean;
  label?: string;
  required?: boolean;
}

export interface BasiqFormFieldSlotProps {
  describedBy?: string;
  id: string;
  invalid: boolean;
  required: boolean;
}

const props = withDefaults(defineProps<BasiqFormFieldProps>(), {
  invalid: undefined,
  required: false,
});
const slots = defineSlots<{
  default: (props: BasiqFormFieldSlotProps) => unknown;
  description?: () => unknown;
  error?: (props: { error: string }) => unknown;
  label?: () => unknown;
  required?: () => unknown;
}>();

const baseId = `basiq-field-${useId()}`;
const resolvedControlId = computed(() => props.controlId ?? `${baseId}-control`);
const descriptionId = `${baseId}-description`;
const errorId = `${baseId}-error`;
const hasLabel = computed(() => props.label !== undefined || Boolean(slots.label));
const hasDescription = computed(
  () => props.description !== undefined || Boolean(slots.description),
);
const hasError = computed(() => typeof props.error === "string" && props.error.length > 0);
const errorMessage = computed(() => props.error ?? "");
const invalid = computed(() => props.invalid === true || hasError.value);
const required = computed(() => props.required);
const describedBy = computed(() => {
  const ids = [
    hasDescription.value ? descriptionId : undefined,
    hasError.value ? errorId : undefined,
  ];
  const value = ids.filter((id): id is string => id !== undefined).join(" ");

  return value || undefined;
});
const registeredControls = new Map<symbol, string>();
let hasWarnedAboutMultipleControls = false;
let warningScheduled = false;

function registerControl(componentName: string) {
  if (!import.meta.env.DEV) return () => {};

  const registration = Symbol(componentName);

  registeredControls.set(registration, componentName);
  scheduleMultipleControlsWarning();

  return () => {
    registeredControls.delete(registration);
    if (registeredControls.size <= 1) hasWarnedAboutMultipleControls = false;
  };
}

function scheduleMultipleControlsWarning() {
  if (warningScheduled) return;

  warningScheduled = true;
  queueMicrotask(() => {
    warningScheduled = false;
    if (hasWarnedAboutMultipleControls || registeredControls.size <= 1) return;

    hasWarnedAboutMultipleControls = true;
    console.warn(
      `[BasiQ UI] BasiqFormField supports one logical control. Multiple controls were registered: ${Array.from(registeredControls.values()).join(", ")}. Use a group component for multiple controls.`,
    );
  });
}

provide(basiqFormFieldContextKey, {
  controlId: resolvedControlId,
  describedBy,
  invalid,
  registerControl,
  required,
});
</script>

<template>
  <div :class="$style.root" :data-invalid="invalid ? '' : undefined">
    <div v-if="hasLabel || hasDescription" :class="$style.meta">
      <div v-if="hasLabel" :class="$style['label-row']">
        <label :class="$style.label" :for="resolvedControlId">
          <slot name="label">{{ label }}</slot>
        </label>
        <span v-if="required" :class="$style.required" aria-hidden="true">
          <slot name="required">必須</slot>
        </span>
      </div>

      <p v-if="hasDescription" :id="descriptionId" :class="$style.description">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <div :class="$style.control">
      <slot
        :described-by="describedBy"
        :id="resolvedControlId"
        :invalid="invalid"
        :required="required"
      />
    </div>

    <p v-if="hasError" :id="errorId" :class="$style.error">
      <slot name="error" :error="errorMessage">{{ errorMessage }}</slot>
    </p>
  </div>
</template>

<style module>
.root {
  display: grid;
  gap: var(--basiq-space-200);
  min-width: 0;
  color: var(--basiq-color-content-default);
  font-family: var(--basiq-font-family-sans);
}

.meta {
  display: grid;
  gap: var(--basiq-space-100);
  min-width: 0;
}

.label-row {
  display: flex;
  gap: var(--basiq-space-200);
  align-items: center;
  min-width: 0;
}

.label {
  width: fit-content;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
  cursor: pointer;
}

.required {
  color: var(--basiq-color-content-danger);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.5;
}

.control {
  min-width: 0;
}

.description,
.error {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.description {
  color: var(--basiq-color-content-subtle);
}

.error {
  color: var(--basiq-color-content-danger);
}
</style>
