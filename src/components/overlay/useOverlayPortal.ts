import type { ComputedRef, Ref } from "vue";
import { computed, onBeforeMount, onMounted, onUnmounted, shallowRef, watch } from "vue";

import { injectBasiqThemeContext } from "../../theme/context";
import type { BasiqPortalTarget } from "./overlayContext";
import { injectOverlayTarget, provideOverlayTarget } from "./overlayContext";
import {
  acquireDefaultOverlayHost,
  acquireOverlayLayer,
  acquireOverlayOrder,
  type OverlayLayer,
  releaseDefaultOverlayHost,
  releaseOverlayLayer,
  setOverlayModalOpen,
  subscribeOverlayModalState,
} from "./overlayHost";

interface UseOverlayPortalOptions {
  layer?: OverlayLayer;
  modal?: boolean;
  open: ComputedRef<boolean>;
  ordered?: boolean;
  portalTarget: Ref<BasiqPortalTarget | undefined>;
}

function warnInvalidTarget(target: BasiqPortalTarget) {
  if (!import.meta.env.DEV) return;

  console.warn(
    `[BasiQ UI] The portal target ${JSON.stringify(target)} could not be found. The default overlay host is used instead.`,
  );
}

export function useOverlayPortal({
  layer = "dialog",
  modal = false,
  open,
  ordered = true,
  portalTarget,
}: UseOverlayPortalOptions) {
  const inheritedTarget = injectOverlayTarget();
  const theme = injectBasiqThemeContext();
  const baseTarget = shallowRef<BasiqPortalTarget>();
  const target = shallowRef<BasiqPortalTarget>();
  const order = shallowRef(0);
  const modalActive = shallowRef(false);
  let defaultHost: HTMLElement | undefined;
  let mounted = false;
  let baseTargetElement: HTMLElement | undefined;
  let layerTargetElement: HTMLElement | undefined;
  let modalRegistered = false;
  let unsubscribeModalState: (() => void) | undefined;

  const themeMode = computed(() => theme?.mode.value ?? "system");
  const themeStyle = computed(() => theme?.style.value ?? {});
  const overlayStyle = computed(() => ({
    ...themeStyle.value,
    zIndex: order.value * 2,
  }));
  const contentStyle = computed(() => ({
    ...themeStyle.value,
    zIndex: order.value * 2 + 1,
  }));

  function resolveExplicitTarget(value: BasiqPortalTarget | undefined) {
    if (!value) return undefined;
    if (typeof value !== "string") return value;

    try {
      return document.querySelector<HTMLElement>(value) ?? undefined;
    } catch {
      return undefined;
    }
  }

  function isValidSelector(value: string) {
    try {
      document.querySelector(value);
      return true;
    } catch {
      return false;
    }
  }

  function useDefaultTarget() {
    defaultHost = acquireDefaultOverlayHost(document);
    setBaseTarget(defaultHost);
    return defaultHost;
  }

  function setBaseTarget(element: HTMLElement, publicTarget: BasiqPortalTarget = element) {
    baseTarget.value = publicTarget;
    baseTargetElement = element;
    layerTargetElement = acquireOverlayLayer(element, layer);
    target.value = layerTargetElement;
    unsubscribeModalState = subscribeOverlayModalState(element, (active) => {
      modalActive.value = active;
    });
  }

  function ensureTarget({ allowDeferredSelector = false } = {}) {
    if (baseTargetElement) return baseTargetElement;

    const requestedTarget = portalTarget.value ?? inheritedTarget?.value;
    const resolvedTarget = resolveExplicitTarget(requestedTarget);

    if (resolvedTarget) {
      setBaseTarget(resolvedTarget, requestedTarget);
      return resolvedTarget;
    }

    if (
      requestedTarget &&
      allowDeferredSelector &&
      typeof requestedTarget === "string" &&
      isValidSelector(requestedTarget)
    ) {
      baseTarget.value = requestedTarget;
      return undefined;
    }

    if (requestedTarget) warnInvalidTarget(requestedTarget);
    return useDefaultTarget();
  }

  function bringToFront() {
    const resolvedTarget = ensureTarget();
    if (resolvedTarget && layerTargetElement && ordered) {
      order.value = acquireOverlayOrder(layerTargetElement);
    }
  }

  function syncModalRegistration(isOpen: boolean) {
    if (!modal || !baseTargetElement || isOpen === modalRegistered) return;
    setOverlayModalOpen(baseTargetElement, isOpen);
    modalRegistered = isOpen;
  }

  provideOverlayTarget(baseTarget);

  watch(
    open,
    (isOpen, wasOpen) => {
      if (isOpen && !wasOpen && mounted) bringToFront();
      if (mounted) syncModalRegistration(isOpen);
    },
    { flush: "sync" },
  );

  onBeforeMount(() => {
    const resolvedTarget = ensureTarget({ allowDeferredSelector: true });
    if (open.value && resolvedTarget && layerTargetElement && ordered) {
      order.value = acquireOverlayOrder(layerTargetElement);
    }
    syncModalRegistration(open.value);
  });

  onMounted(() => {
    mounted = true;
    ensureTarget();
    if (open.value && order.value === 0) bringToFront();
    syncModalRegistration(open.value);
  });

  onUnmounted(() => {
    syncModalRegistration(false);
    unsubscribeModalState?.();
    if (baseTargetElement) releaseOverlayLayer(baseTargetElement, layer);
    if (defaultHost) releaseDefaultOverlayHost(defaultHost);
  });

  return { contentStyle, modalActive, overlayStyle, target, themeMode, themeStyle };
}
