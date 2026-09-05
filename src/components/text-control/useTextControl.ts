import type { Ref } from "vue";
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, useAttrs } from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";
import { useFormFieldControl } from "../form-field/useFormFieldControl";

interface TextControlProps {
  defaultValue?: string;
  id?: string;
  invalid?: boolean;
  modelValue?: string;
  required?: boolean;
}

interface UseTextControlOptions<Element extends HTMLInputElement | HTMLTextAreaElement> {
  componentName: string;
  element: Readonly<Pick<Ref<Element | null>, "value">>;
  emitModelValue: (value: string) => void;
  props: TextControlProps;
}

export function useTextControl<Element extends HTMLInputElement | HTMLTextAreaElement>({
  componentName,
  element,
  emitModelValue,
  props,
}: UseTextControlOptions<Element>) {
  const attrs = useAttrs();
  const isControlled = hasInitialProp("modelValue");
  const resetValue = props.defaultValue ?? props.modelValue ?? "";
  const internalValue = ref(resetValue);
  const currentValue = computed(() =>
    isControlled ? (props.modelValue ?? "") : internalValue.value,
  );
  const {
    resolveAriaDescribedBy,
    resolveAriaInvalid,
    resolveInvalid,
    resolvedId,
    resolvedRequired,
  } = useFormFieldControl({ componentName, props });
  let owningForm: HTMLFormElement | null = null;

  if (import.meta.env.DEV && attrs.value !== undefined) {
    console.warn(
      `[BasiQ UI] ${componentName} does not support the value attribute. Use v-model or defaultValue instead.`,
    );
  }

  onMounted(syncOwningForm);
  onUpdated(syncOwningForm);
  onBeforeUnmount(() => {
    owningForm?.removeEventListener("reset", handleFormReset);
  });

  function handleValueInput(event: Event) {
    const value = (event.target as Element).value;

    setValue(value);
  }

  function setValue(value: string) {
    if (!isControlled) internalValue.value = value;
    emitModelValue(value);
  }

  function syncOwningForm() {
    const nextOwningForm = element.value?.form ?? null;

    if (owningForm === nextOwningForm) return;

    owningForm?.removeEventListener("reset", handleFormReset);
    owningForm = nextOwningForm;
    owningForm?.addEventListener("reset", handleFormReset);
  }

  function handleFormReset(event: Event) {
    queueMicrotask(() => {
      if (event.defaultPrevented) return;

      if (isControlled) {
        emitModelValue(resetValue);
      } else {
        internalValue.value = resetValue;
      }
    });
  }

  return {
    currentValue,
    handleValueInput,
    resolveAriaDescribedBy,
    resolveAriaInvalid,
    resolveInvalid,
    resolvedId,
    resolvedRequired,
    setValue,
  };
}
