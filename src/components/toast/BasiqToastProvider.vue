<script setup lang="ts">
import { ToastPortal, ToastProvider, ToastViewport } from "reka-ui";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  toRef,
  watch,
  type ComponentPublicInstance,
} from "vue";

import type { BasiqPortalTarget } from "../overlay/overlayContext";
import { useOverlayPortal } from "../overlay/useOverlayPortal";
import BasiqToastItem from "./BasiqToastItem.vue";
import { basiqToastContextKey } from "./toastContext";
import { BASIQ_TOAST_DURATION, createToastStore } from "./toastStore";
import type {
  BasiqToastController,
  BasiqToastOptions,
  BasiqToastPriority,
  BasiqToastRecord,
} from "./types";

export interface BasiqToastProviderProps {
  /** Author-localized label announced with each toast. */
  label?: string;
  /** Author-localized accessible name for each close button. */
  closeLabel?: string;
  /** The Portal target resolved when the provider mounts. Keep it stable while mounted; remount the provider to use another target. */
  portalTarget?: BasiqPortalTarget;
}

const props = withDefaults(defineProps<BasiqToastProviderProps>(), {
  label: "通知",
  closeLabel: "通知を閉じる",
  portalTarget: undefined,
});

const REKA_TOAST_DURATION = Number.POSITIVE_INFINITY;
const ANNOUNCEMENT_INTERVAL = 1000;
const TOAST_MOVE_ANIMATION_ID = "basiq-toast-stack-move";
const TOAST_MOTION_DURATION_FALLBACK = 180;
const TOAST_MOTION_EASING_FALLBACK = "cubic-bezier(0.2, 0, 0, 1)";

const foregroundAnnouncement = ref("");
const backgroundAnnouncement = ref("");
const announcementQueues: Record<BasiqToastPriority, BasiqToastRecord[]> = {
  foreground: [],
  background: [],
};
const activeAnnouncementPriorities = new Set<BasiqToastPriority>();
const announcementTimeouts = new Map<BasiqToastPriority, number>();
let disposed = false;

function getAnnouncementRef(priority: BasiqToastPriority) {
  return priority === "foreground" ? foregroundAnnouncement : backgroundAnnouncement;
}

function formatAnnouncement(toast: BasiqToastRecord) {
  return [localizedLabel.value, toast.title, toast.description].filter(Boolean).join(" ");
}

function announceNext(priority: BasiqToastPriority) {
  if (typeof window === "undefined" || disposed || activeAnnouncementPriorities.has(priority)) {
    return;
  }

  const toast = announcementQueues[priority].shift();
  if (!toast) return;

  const announcement = getAnnouncementRef(priority);
  activeAnnouncementPriorities.add(priority);
  announcement.value = "";

  void nextTick().then(() => {
    if (disposed) return;
    announcement.value = formatAnnouncement(toast);
    const timeout = window.setTimeout(() => {
      announcement.value = "";
      activeAnnouncementPriorities.delete(priority);
      announcementTimeouts.delete(priority);
      announceNext(priority);
    }, ANNOUNCEMENT_INTERVAL);
    announcementTimeouts.set(priority, timeout);
  });
}

function enqueueAnnouncement(toast: BasiqToastRecord) {
  if (typeof window === "undefined") return;
  announcementQueues[toast.priority].push(toast);
  announceNext(toast.priority);
}

const { controller: storeController, toasts } = createToastStore({ onAdd: enqueueAnnouncement });

const hasToasts = computed(() => toasts.value.length > 0);
const portalTarget = toRef(props, "portalTarget");
const { modalActive, target, themeMode, themeStyle } = useOverlayPortal({
  layer: "toast",
  open: hasToasts,
  ordered: false,
  portalTarget,
});

let viewportElement: HTMLElement | undefined;
let focusBeforeToastNavigation: HTMLElement | undefined;
let pendingToastPositions: Map<string, number> | undefined;
const toastMoveAnimations = new Map<HTMLElement, Animation>();

interface ToastTimer {
  remaining: number;
  startedAt?: number;
  timeout?: number;
}

const toastTimers = new Map<string, ToastTimer>();
let focusPaused = false;
let pointerPaused = false;
let windowPaused = false;
let timersPaused = false;

const localizedLabel = computed(() => props.label.trim() || "通知");
const localizedCloseLabel = computed(() => props.closeLabel.trim() || "通知を閉じる");

function getViewportLabel(hotkey: string) {
  return `${localizedLabel.value} (${hotkey})`;
}

function setViewportElement(node: Element | ComponentPublicInstance | null) {
  const element = node instanceof Element ? node : node?.$el;
  viewportElement = element instanceof HTMLElement ? element : undefined;
}

function getToastElements() {
  if (!viewportElement) return [];
  return [...viewportElement.querySelectorAll<HTMLElement>("[data-basiq-toast-id]")];
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function captureToastPositions() {
  const positions = new Map<string, number>();
  for (const element of getToastElements()) {
    const id = element.dataset.basiqToastId;
    if (id) positions.set(id, element.getBoundingClientRect().top);
  }
  return positions;
}

function cancelToastMoveAnimations() {
  for (const animation of toastMoveAnimations.values()) animation.cancel();
  toastMoveAnimations.clear();
}

function parseCssDuration(value: string) {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)(ms|s)$/);
  if (!match) return TOAST_MOTION_DURATION_FALLBACK;
  const duration = Number(match[1]);
  return match[2] === "s" ? duration * 1000 : duration;
}

function getToastMotionTiming() {
  if (!viewportElement) {
    return {
      duration: TOAST_MOTION_DURATION_FALLBACK,
      easing: TOAST_MOTION_EASING_FALLBACK,
    };
  }

  const style = getComputedStyle(viewportElement);
  return {
    duration: parseCssDuration(style.getPropertyValue("--basiq-duration-overlay")),
    easing:
      style.getPropertyValue("--basiq-easing-standard").trim() || TOAST_MOTION_EASING_FALLBACK,
  };
}

function prepareToastMovement() {
  if (typeof window === "undefined") return;

  const positions = captureToastPositions();
  cancelToastMoveAnimations();
  if (prefersReducedMotion()) {
    pendingToastPositions = undefined;
    return;
  }

  pendingToastPositions ??= positions;
}

function animateToastMovement(previousPositions: Map<string, number> | undefined) {
  if (!previousPositions || prefersReducedMotion()) return;
  const timing = getToastMotionTiming();
  if (timing.duration === 0) return;

  for (const element of getToastElements()) {
    if (typeof element.animate !== "function") continue;
    const id = element.dataset.basiqToastId;
    const previousTop = id ? previousPositions.get(id) : undefined;
    if (previousTop === undefined) continue;

    const delta = previousTop - element.getBoundingClientRect().top;
    if (Math.abs(delta) < 0.5) continue;

    const animation = element.animate(
      [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
      {
        duration: timing.duration,
        easing: timing.easing,
      },
    );
    animation.id = TOAST_MOVE_ANIMATION_ID;
    toastMoveAnimations.set(element, animation);

    const cleanup = () => {
      if (toastMoveAnimations.get(element) === animation) toastMoveAnimations.delete(element);
    };
    animation.addEventListener("finish", cleanup, { once: true });
    animation.addEventListener("cancel", cleanup, { once: true });
  }
}

function focusAfterRemoval(removedId: string) {
  const items = getToastElements();
  const removedIndex = items.findIndex((item) => item.dataset.basiqToastId === removedId);
  const removedItem = removedIndex < 0 ? undefined : items[removedIndex];
  if (!removedItem?.contains(document.activeElement)) return undefined;

  return (
    items[removedIndex - 1] ??
    items[removedIndex + 1] ??
    focusBeforeToastNavigation ??
    viewportElement
  );
}

function restoreFocus(targetElement: HTMLElement | undefined) {
  void nextTick().then(() => {
    if (targetElement?.isConnected) targetElement.focus();
    else if (viewportElement?.isConnected && toasts.value.length > 0) viewportElement.focus();
  });
}

function dismissToast(id: string) {
  const focusTarget = typeof document === "undefined" ? undefined : focusAfterRemoval(id);
  storeController.dismiss(id);
  if (
    typeof document !== "undefined" &&
    (focusTarget || document.activeElement === document.body)
  ) {
    restoreFocus(focusTarget);
  }
}

function addToast(options: BasiqToastOptions) {
  const focusedToast =
    typeof document === "undefined"
      ? undefined
      : (document.activeElement?.closest<HTMLElement>("[data-basiq-toast-id]") ?? undefined);
  const id = storeController.add(options);
  prepareToastMovement();

  if (
    focusedToast &&
    !toasts.value.some((toast) => toast.id === focusedToast.dataset.basiqToastId)
  ) {
    restoreFocus(getToastElements().at(-1) ?? viewportElement);
  }

  return id;
}

const controller: BasiqToastController = { add: addToast, dismiss: dismissToast };
provide(basiqToastContextKey, controller);

function startTimer(id: string, timer: ToastTimer) {
  if (typeof window === "undefined" || timersPaused || timer.timeout !== undefined) return;
  timer.startedAt = Date.now();
  timer.timeout = window.setTimeout(() => {
    timer.timeout = undefined;
    dismissToast(id);
  }, timer.remaining);
}

function pauseTimers() {
  if (timersPaused) return;
  timersPaused = true;
  const now = Date.now();

  for (const timer of toastTimers.values()) {
    if (timer.timeout === undefined || timer.startedAt === undefined) continue;
    window.clearTimeout(timer.timeout);
    timer.timeout = undefined;
    timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    timer.startedAt = undefined;
  }
}

function resumeTimers() {
  if (!timersPaused) return;
  timersPaused = false;
  for (const [id, timer] of toastTimers) startTimer(id, timer);
}

function syncTimerPauseState() {
  if (pointerPaused || focusPaused || windowPaused) pauseTimers();
  else resumeTimers();
}

function handleViewportFocusIn() {
  focusPaused = true;
  syncTimerPauseState();
}

function handleViewportFocusOut() {
  void nextTick().then(() => {
    focusPaused = Boolean(viewportElement?.contains(document.activeElement));
    syncTimerPauseState();
  });
}

function handleViewportPointerEnter() {
  pointerPaused = true;
  syncTimerPauseState();
}

function handleViewportPointerLeave() {
  pointerPaused = false;
  syncTimerPauseState();
}

function handleWindowBlur() {
  windowPaused = true;
  syncTimerPauseState();
}

function handleWindowFocus() {
  windowPaused = false;
  syncTimerPauseState();
}

function removeFocusProxyAriaHidden() {
  const viewportRegion = viewportElement?.parentElement;
  if (!viewportRegion) return;

  for (const element of viewportRegion.children) {
    if (
      element !== viewportElement &&
      element.getAttribute("tabindex") === "0" &&
      element.getAttribute("aria-hidden") === "true"
    ) {
      element.removeAttribute("aria-hidden");
    }
  }
}

function handleKeyboardNavigation(event: KeyboardEvent) {
  if (event.key === "F8" && toasts.value.length > 0) {
    if (modalActive.value) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && !viewportElement?.contains(activeElement)) {
      focusBeforeToastNavigation = activeElement;
    }
    return;
  }

  if (event.key !== "Escape" || event.defaultPrevented) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  const toastElement = target.closest<HTMLElement>("[data-basiq-toast-id]");
  if (!toastElement || !viewportElement?.contains(toastElement)) return;

  const toastId = toastElement.dataset.basiqToastId;
  if (!toastId || !toasts.value.some((toast) => toast.id === toastId)) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  dismissToast(toastId);
}

watch(toasts, async (currentToasts) => {
  const currentIds = new Set(currentToasts.map((toast) => toast.id));
  for (const [id, timer] of toastTimers) {
    if (currentIds.has(id)) continue;
    if (timer.timeout !== undefined) window.clearTimeout(timer.timeout);
    toastTimers.delete(id);
  }

  for (const toast of currentToasts) {
    if (toastTimers.has(toast.id)) continue;
    const timer: ToastTimer = { remaining: BASIQ_TOAST_DURATION };
    toastTimers.set(toast.id, timer);
    startTimer(toast.id, timer);
  }

  if (currentToasts.length === 0) {
    pendingToastPositions = undefined;
    cancelToastMoveAnimations();
    pointerPaused = false;
    focusPaused = false;
    syncTimerPauseState();
    return;
  }

  await nextTick();
  // Reka UI 2.10.4 renders its tabbable Toast focus proxies as aria-hidden.
  // Keep the compatibility fix scoped to this viewport until upstream #2810 ships.
  removeFocusProxyAriaHidden();
  if (viewportElement) viewportElement.scrollTop = viewportElement.scrollHeight;
  const previousPositions = pendingToastPositions;
  pendingToastPositions = undefined;
  animateToastMovement(previousPositions);
});

onMounted(() => {
  windowPaused = !document.hasFocus();
  syncTimerPauseState();
  window.addEventListener("keydown", handleKeyboardNavigation, { capture: true });
  window.addEventListener("blur", handleWindowBlur);
  window.addEventListener("focus", handleWindowFocus);
});
onBeforeUnmount(() => {
  disposed = true;
  window.removeEventListener("keydown", handleKeyboardNavigation, { capture: true });
  window.removeEventListener("blur", handleWindowBlur);
  window.removeEventListener("focus", handleWindowFocus);
  for (const timer of toastTimers.values()) {
    if (timer.timeout !== undefined) window.clearTimeout(timer.timeout);
  }
  for (const timeout of announcementTimeouts.values()) window.clearTimeout(timeout);
  cancelToastMoveAnimations();
  pendingToastPositions = undefined;
  toastTimers.clear();
  announcementTimeouts.clear();
});
</script>

<template>
  <ToastProvider :disable-swipe="true" :duration="REKA_TOAST_DURATION" :label="localizedLabel">
    <slot />
    <BasiqToastItem
      v-for="toast in toasts"
      :key="toast.id"
      :close-label="localizedCloseLabel"
      :toast="toast"
      @dismiss="dismissToast(toast.id)"
    />
    <ToastPortal defer :to="target">
      <span
        :class="$style['visually-hidden']"
        :data-basiq-theme="themeMode"
        :style="themeStyle"
        aria-atomic="true"
        aria-live="assertive"
        role="alert"
        >{{ foregroundAnnouncement }}</span
      >
      <span
        :class="$style['visually-hidden']"
        :data-basiq-theme="themeMode"
        :style="themeStyle"
        aria-atomic="true"
        aria-live="polite"
        role="status"
        >{{ backgroundAnnouncement }}</span
      >
      <div :aria-hidden="modalActive ? 'true' : undefined" :inert="modalActive || undefined">
        <ToastViewport
          :ref="setViewportElement"
          :class="$style.viewport"
          :data-basiq-theme="themeMode"
          :label="getViewportLabel"
          :style="themeStyle"
          aria-live="off"
          @focusin="handleViewportFocusIn"
          @focusout="handleViewportFocusOut"
          @pointerenter="handleViewportPointerEnter"
          @pointerleave="handleViewportPointerLeave"
        />
      </div>
    </ToastPortal>
  </ToastProvider>
</template>

<style module>
.viewport {
  --basiq-toast-safe-inline-start: max(var(--basiq-space-400), env(safe-area-inset-left, 0px));
  --basiq-toast-safe-inline-end: max(var(--basiq-space-400), env(safe-area-inset-right, 0px));
  --basiq-toast-safe-block-start: max(var(--basiq-space-400), env(safe-area-inset-top, 0px));
  --basiq-toast-safe-block-end: max(var(--basiq-space-400), env(safe-area-inset-bottom, 0px));

  position: fixed;
  right: var(--basiq-toast-safe-inline-end);
  bottom: var(--basiq-toast-safe-block-end);
  z-index: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--basiq-space-200);
  width: min(
    352px,
    calc(100vw - var(--basiq-toast-safe-inline-start) - var(--basiq-toast-safe-inline-end))
  );
  max-height: calc(
    100dvh - var(--basiq-toast-safe-block-start) - var(--basiq-toast-safe-block-end)
  );
  overflow-y: auto;
  overscroll-behavior: contain;
  margin: 0;
  padding: 0;
  list-style: none;
  outline: none;
  pointer-events: none;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
