import type { Ref } from "vue";
import { computed, onBeforeUnmount, onMounted, onUpdated, ref } from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";
import { useFormFieldControl } from "../form-field/useFormFieldControl";

interface CheckableControlProps {
  defaultValue?: boolean;
  id?: string;
  invalid?: boolean;
  modelValue?: boolean;
  required?: boolean;
}

interface UseCheckableControlOptions {
  componentName: string;
  element: Readonly<Pick<Ref<HTMLInputElement | null>, "value">>;
  emitModelValue: (value: boolean) => void;
  props: CheckableControlProps;
}

export function useCheckableControl({
  componentName,
  element,
  emitModelValue,
  props,
}: UseCheckableControlOptions) {
  const isControlled = hasInitialProp("modelValue");
  const resetValue = props.defaultValue ?? props.modelValue ?? false;
  const internalValue = ref(resetValue);
  const currentValue = computed(() =>
    isControlled ? (props.modelValue ?? false) : internalValue.value,
  );
  const {
    resolveAriaDescribedBy,
    resolveAriaInvalid,
    resolveInvalid,
    resolvedId,
    resolvedRequired,
  } = useFormFieldControl({ componentName, props });
  let owningForm: HTMLFormElement | null = null;

  onMounted(() => {
    syncChecked();
    syncOwningForm();
  });
  onUpdated(() => {
    syncChecked();
    syncOwningForm();
  });
  onBeforeUnmount(() => {
    owningForm?.removeEventListener("reset", handleFormReset);
  });

  function syncChecked() {
    if (element.value !== null) element.value.checked = currentValue.value;
  }

  function syncOwningForm() {
    const nextOwningForm = element.value?.form ?? null;

    if (owningForm === nextOwningForm) return;

    owningForm?.removeEventListener("reset", handleFormReset);
    owningForm = nextOwningForm;
    owningForm?.addEventListener("reset", handleFormReset);
  }

  function handleCheckedChange(event: Event) {
    const nextValue = (event.currentTarget as HTMLInputElement).checked;

    if (!isControlled) internalValue.value = nextValue;
    emitModelValue(nextValue);
    queueMicrotask(syncChecked);

    return nextValue;
  }

  function handleFormReset(event: Event) {
    queueMicrotask(() => {
      if (event.defaultPrevented) {
        syncChecked();
        return;
      }

      if (isControlled) {
        emitModelValue(resetValue);
      } else {
        internalValue.value = resetValue;
      }

      syncChecked();
    });
  }

  return {
    currentValue,
    handleCheckedChange,
    resolveAriaDescribedBy,
    resolveAriaInvalid,
    resolveInvalid,
    resolvedId,
    resolvedRequired,
  };
}
