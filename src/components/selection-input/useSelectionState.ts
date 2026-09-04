import type { Ref } from "vue";
import { computed, onBeforeUnmount, onMounted, onUpdated, shallowRef } from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";

interface UseSelectionStateOptions<Value> {
  clone: (value: Value) => Value;
  defaultValue: () => Value | undefined;
  emitModelValue: (value: Value) => void;
  fallback: () => Value;
  modelValue: () => Value | undefined;
}

export function useSelectionState<Value>({
  clone,
  defaultValue,
  emitModelValue,
  fallback,
  modelValue,
}: UseSelectionStateOptions<Value>) {
  const isControlled = hasInitialProp("modelValue");
  const resetValue = clone(defaultValue() ?? modelValue() ?? fallback());
  const internalValue = shallowRef<Value>(clone(resetValue));
  const currentValue = computed<Value>(() =>
    isControlled ? clone(modelValue() ?? fallback()) : internalValue.value,
  );

  function setValue(value: Value) {
    const nextValue = clone(value);

    if (!isControlled) internalValue.value = nextValue;
    emitModelValue(nextValue);
  }

  function reset() {
    const nextValue = clone(resetValue);

    if (isControlled) {
      emitModelValue(nextValue);
    } else {
      internalValue.value = nextValue;
    }
  }

  return { currentValue, isControlled, reset, setValue };
}

export function useSelectionFormReset(
  element: Readonly<Pick<Ref<unknown>, "value">>,
  reset: () => void,
) {
  let owningForm: HTMLFormElement | null = null;

  onMounted(syncOwningForm);
  onUpdated(syncOwningForm);
  onBeforeUnmount(() => owningForm?.removeEventListener("reset", handleFormReset));

  function syncOwningForm() {
    const nextOwningForm = resolveSelectionInput(element.value)?.form ?? null;

    if (owningForm === nextOwningForm) return;

    owningForm?.removeEventListener("reset", handleFormReset);
    owningForm = nextOwningForm;
    owningForm?.addEventListener("reset", handleFormReset);
  }

  function handleFormReset(event: Event) {
    queueMicrotask(() => {
      if (!event.defaultPrevented) reset();
    });
  }
}

export function resolveSelectionInput(value: unknown) {
  if (typeof HTMLInputElement !== "undefined" && value instanceof HTMLInputElement) return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "$el" in value &&
    typeof HTMLInputElement !== "undefined" &&
    value.$el instanceof HTMLInputElement
  ) {
    return value.$el;
  }

  return null;
}
