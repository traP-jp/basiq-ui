import type { ComputedRef, InjectionKey } from "vue";

export interface BasiqFormFieldContext {
  controlId: ComputedRef<string>;
  describedBy: ComputedRef<string | undefined>;
  invalid: ComputedRef<boolean>;
  registerControl: (componentName: string) => () => void;
  required: ComputedRef<boolean>;
}

export const basiqFormFieldContextKey: InjectionKey<BasiqFormFieldContext> =
  Symbol("BasiqFormFieldContext");
