import type { ComputedRef, Ref } from "vue";
import { computed, onBeforeMount, onMounted, onUnmounted, shallowRef, watch } from "vue";

import { injectBasiqThemeContext } from "../../theme/context";
import type { BasiqPortalTarget } from "./overlayContext";
import { injectOverlayTarget, provideOverlayTarget } from "./overlayContext";
import {
  acquireDefaultOverlayHost,
  acquireOverlayOrder,
  releaseDefaultOverlayHost,
} from "./overlayHost";

interface UseOverlayPortalOptions {
  open: ComputedRef<boolean>;
  portalTarget: Ref<BasiqPortalTarget | undefined>;
}

function warnInvalidTarget(target: BasiqPortalTarget) {
  if (!import.meta.env.DEV) return;

  console.warn(
    `[BasiQ UI] The portal target ${JSON.stringify(target)} could not be found. The default overlay host is used instead.`,
  );
}

export function useOverlayPortal({ open, portalTarget }: UseOverlayPortalOptions) {
  const inheritedTarget = injectOverlayTarget();
  const theme = injectBasiqThemeContext();
  const target = shallowRef<BasiqPortalTarget>();
  const order = shallowRef(0);
  let defaultHost: HTMLElement | undefined;
  let mounted = false;
  let targetElement: HTMLElement | undefined;

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
    target.value = defaultHost;
    targetElement = defaultHost;
    return defaultHost;
  }

  function ensureTarget({ allowDeferredSelector = false } = {}) {
    if (targetElement) return targetElement;

    const requestedTarget = portalTarget.value ?? inheritedTarget?.value;
    const resolvedTarget = resolveExplicitTarget(requestedTarget);

    if (resolvedTarget) {
      target.value = requestedTarget;
      targetElement = resolvedTarget;
      return resolvedTarget;
    }

    if (
      requestedTarget &&
      allowDeferredSelector &&
      typeof requestedTarget === "string" &&
      isValidSelector(requestedTarget)
    ) {
      target.value = requestedTarget;
      return undefined;
    }

    if (requestedTarget) warnInvalidTarget(requestedTarget);
    return useDefaultTarget();
  }

  function bringToFront() {
    const resolvedTarget = ensureTarget();
    if (resolvedTarget) order.value = acquireOverlayOrder(resolvedTarget);
  }

  provideOverlayTarget(target);

  watch(
    open,
    (isOpen, wasOpen) => {
      if (isOpen && !wasOpen && mounted) bringToFront();
    },
    { flush: "sync" },
  );

  onBeforeMount(() => {
    const resolvedTarget = ensureTarget({ allowDeferredSelector: true });
    if (open.value && resolvedTarget) order.value = acquireOverlayOrder(resolvedTarget);
  });

  onMounted(() => {
    mounted = true;
    ensureTarget();
    if (open.value && order.value === 0) bringToFront();
  });

  onUnmounted(() => {
    if (defaultHost) releaseDefaultOverlayHost(defaultHost);
  });

  return { contentStyle, overlayStyle, target, themeMode, themeStyle };
}
