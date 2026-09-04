import type { ComputedRef, InjectionKey } from "vue";
import { inject, provide } from "vue";

export interface BasiqTooltipContext {
  open: ComputedRef<boolean>;
}

const tooltipContextKey: InjectionKey<BasiqTooltipContext> = Symbol("BasiqTooltipContext");
const tooltipProviderContextKey: InjectionKey<true> = Symbol("BasiqTooltipProviderContext");

export function provideBasiqTooltipContext(context: BasiqTooltipContext) {
  provide(tooltipContextKey, context);
}

export function injectBasiqTooltipContext() {
  const context = inject(tooltipContextKey, undefined);

  if (!context) {
    throw new Error("[BasiQ UI] Tooltip parts must be used inside BasiqTooltipRoot.");
  }

  return context;
}

export function provideBasiqTooltipProviderContext() {
  provide(tooltipProviderContextKey, true);
}

export function assertBasiqTooltipProviderContext() {
  if (!inject(tooltipProviderContextKey, false)) {
    throw new Error("[BasiQ UI] BasiqTooltipRoot must be used inside BasiqTooltipProvider.");
  }
}
