import type { InjectionKey, ShallowRef } from "vue";
import { inject, provide } from "vue";

export type BasiqPortalTarget = HTMLElement | string;

const overlayTargetKey: InjectionKey<Readonly<ShallowRef<BasiqPortalTarget | undefined>>> =
  Symbol("BasiqOverlayTarget");

export function provideOverlayTarget(target: ShallowRef<BasiqPortalTarget | undefined>) {
  provide(overlayTargetKey, target);
}

export function injectOverlayTarget() {
  return inject(overlayTargetKey, undefined);
}
