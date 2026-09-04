import type { ComputedRef, InjectionKey } from "vue";
import { inject, provide } from "vue";

export interface BasiqDropdownMenuContext {
  modal: ComputedRef<boolean>;
  open: ComputedRef<boolean>;
}

const dropdownMenuContextKey: InjectionKey<BasiqDropdownMenuContext> = Symbol(
  "BasiqDropdownMenuContext",
);

export function provideBasiqDropdownMenuContext(context: BasiqDropdownMenuContext) {
  provide(dropdownMenuContextKey, context);
}

export function injectBasiqDropdownMenuContext() {
  const context = inject(dropdownMenuContextKey, undefined);

  if (!context) {
    throw new Error("[BasiQ UI] DropdownMenu parts must be used inside BasiqDropdownMenuRoot.");
  }

  return context;
}
