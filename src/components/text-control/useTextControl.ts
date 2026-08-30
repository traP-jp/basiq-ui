import type { AriaAttributes, Ref } from "vue";
import {
  computed,
  getCurrentInstance,
  inject,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  watch,
} from "vue";

import { basiqFormFieldContextKey } from "../form-field/context";

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
  const formField = inject(basiqFormFieldContextKey, null);
  const instance = getCurrentInstance();
  const isControlled = Object.prototype.hasOwnProperty.call(
    instance?.vnode.props ?? {},
    "modelValue",
  );
  const resetValue = props.defaultValue ?? props.modelValue ?? "";
  const internalValue = ref(resetValue);
  const currentValue = computed(() =>
    isControlled ? (props.modelValue ?? "") : internalValue.value,
  );
  const resolvedId = computed(() => formField?.controlId.value ?? props.id);
  const forcedInvalid = computed(() => formField?.invalid.value === true || props.invalid === true);
  const resolvedRequired = computed(
    () => formField?.required.value === true || props.required === true,
  );
  let owningForm: HTMLFormElement | null = null;

  if (import.meta.env.DEV && attrs.value !== undefined) {
    console.warn(
      `[BasiQ UI] ${componentName} does not support the value attribute. Use v-model or defaultValue instead.`,
    );
  }

  watch(
    [() => props.id, () => formField?.controlId.value],
    ([id, fieldControlId]) => {
      if (import.meta.env.DEV && formField !== null && id !== undefined && id !== fieldControlId) {
        console.warn(
          `[BasiQ UI] ${componentName} uses the ID owned by BasiqFormField. Set controlId on BasiqFormField instead of id on ${componentName}.`,
        );
      }
    },
    { immediate: true },
  );

  onMounted(syncOwningForm);
  onUpdated(syncOwningForm);
  onBeforeUnmount(() => {
    owningForm?.removeEventListener("reset", handleFormReset);
  });

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

  function handleValueInput(event: Event) {
    const value = (event.target as Element).value;

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
  };
}
