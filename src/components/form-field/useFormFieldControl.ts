import type { AriaAttributes } from "vue";
import { computed, inject, onBeforeUnmount, useAttrs, watch } from "vue";

import { basiqFormFieldContextKey } from "./context";

interface FormFieldControlProps {
  id?: string;
  invalid?: boolean;
  required?: boolean;
}

interface UseFormFieldControlOptions {
  componentName: string;
  props: FormFieldControlProps;
}

export function useFormFieldControl({ componentName, props }: UseFormFieldControlOptions) {
  const attrs = useAttrs();
  const formField = inject(basiqFormFieldContextKey, null);
  const resolvedId = computed(() => formField?.controlId.value ?? props.id);
  const resolvedLabelId = computed(() => formField?.labelId.value);
  const forcedInvalid = computed(() => formField?.invalid.value === true || props.invalid === true);
  const resolvedRequired = computed(
    () => formField?.required.value === true || props.required === true,
  );
  const unregisterControl = formField?.registerControl(componentName);

  onBeforeUnmount(() => unregisterControl?.());

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

  function mergeAriaIds(...values: unknown[]) {
    const ids = values
      .flatMap((value) => (typeof value === "string" ? value.split(/\s+/) : []))
      .filter((value, index, allValues) => value !== "" && allValues.indexOf(value) === index);

    return ids.join(" ") || undefined;
  }

  function resolveAriaDescribedBy() {
    return mergeAriaIds(attrs["aria-describedby"], formField?.describedBy.value);
  }

  return {
    resolveAriaDescribedBy,
    resolveAriaInvalid,
    resolveInvalid,
    resolvedId,
    resolvedLabelId,
    resolvedRequired,
  };
}
