import type { ComputedRef, InjectionKey } from "vue";
import { inject, provide } from "vue";

export interface BasiqPopoverContext {
  close: () => void;
  dismissible: ComputedRef<boolean>;
  modal: ComputedRef<boolean>;
  open: ComputedRef<boolean>;
}

const popoverContextKey: InjectionKey<BasiqPopoverContext> = Symbol("BasiqPopoverContext");

export function provideBasiqPopoverContext(context: BasiqPopoverContext) {
  provide(popoverContextKey, context);
}

export function injectBasiqPopoverContext() {
  const context = inject(popoverContextKey, undefined);

  if (!context) {
    throw new Error("[BasiQ UI] Popover parts must be used inside BasiqPopoverRoot.");
  }

  return context;
}
