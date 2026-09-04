<script setup lang="ts">
import { PopoverArrow, PopoverContent, PopoverPortal } from "reka-ui";
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  toRef,
  useAttrs,
  useTemplateRef,
  watch,
} from "vue";

import type { BasiqPortalTarget } from "../overlay/overlayContext";
import { useOverlayPortal } from "../overlay/useOverlayPortal";
import { injectBasiqPopoverContext } from "./context";

defineOptions({ inheritAttrs: false });

export type { BasiqPortalTarget } from "../overlay/overlayContext";
export type BasiqPopoverAlign = "center" | "end" | "start";
export type BasiqPopoverSide = "bottom" | "left" | "right" | "top";
export type BasiqPopoverWidth = "content" | "trigger";

export interface BasiqPopoverContentProps {
  align?: BasiqPopoverAlign;
  alignOffset?: number;
  arrow?: boolean;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  /** The Portal target resolved when the content mounts. Keep it stable while mounted. */
  portalTarget?: BasiqPortalTarget;
  side?: BasiqPopoverSide;
  sideOffset?: number;
  width?: BasiqPopoverWidth;
}

export interface BasiqPopoverContentSlotProps {
  close: () => void;
}

const props = withDefaults(defineProps<BasiqPopoverContentProps>(), {
  align: "center",
  alignOffset: 0,
  arrow: false,
  avoidCollisions: true,
  collisionPadding: 8,
  portalTarget: undefined,
  side: "bottom",
  sideOffset: 8,
  width: "content",
});
defineSlots<{
  default?: (props: BasiqPopoverContentSlotProps) => unknown;
}>();

const attrs = useAttrs();
const popover = injectBasiqPopoverContext();
const viewportElement = useTemplateRef<HTMLElement>("viewport");
const viewportContentElement = useTemplateRef<HTMLElement>("viewportContent");
const isViewportScrollable = ref(false);
const portalTarget = toRef(props, "portalTarget");
const { contentStyle, target, themeMode } = useOverlayPortal({
  modal: popover.modal,
  open: popover.open,
  portalTarget,
});
const widthStyle = computed(() =>
  props.width === "trigger" ? "var(--reka-popover-trigger-width)" : "max-content",
);
let viewportResizeObserver: ResizeObserver | undefined;

function updateViewportScrollable() {
  const viewport = viewportElement.value;
  isViewportScrollable.value = Boolean(viewport && viewport.scrollHeight > viewport.clientHeight);
}

async function observeViewport() {
  await nextTick();
  viewportResizeObserver?.disconnect();
  updateViewportScrollable();
  if (viewportElement.value) viewportResizeObserver?.observe(viewportElement.value);
  if (viewportContentElement.value) viewportResizeObserver?.observe(viewportContentElement.value);
}

watch(
  popover.open,
  (open) => {
    if (open) {
      void observeViewport();
    } else {
      viewportResizeObserver?.disconnect();
      isViewportScrollable.value = false;
    }
  },
  { flush: "post" },
);

onMounted(() => {
  if (typeof ResizeObserver === "undefined") return;

  viewportResizeObserver = new ResizeObserver(updateViewportScrollable);
  if (popover.open.value) void observeViewport();
});

onUnmounted(() => viewportResizeObserver?.disconnect());

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"),
  );
}

function handleDismissEvent(event: Event) {
  if (!popover.dismissible.value) event.preventDefault();
}
</script>

<template>
  <PopoverPortal defer :to="target">
    <PopoverContent
      v-bind="getForwardedAttrs()"
      :align="align"
      :align-offset="alignOffset"
      :avoid-collisions="avoidCollisions"
      :class="[$style.content, $attrs.class]"
      :collision-padding="collisionPadding"
      :data-basiq-theme="themeMode"
      :data-width="width"
      :side="side"
      :side-offset="sideOffset"
      :style="[{ width: widthStyle }, $attrs.style, contentStyle]"
      @escape-key-down="handleDismissEvent"
      @interact-outside="handleDismissEvent"
    >
      <div ref="viewport" :class="$style.viewport" :tabindex="isViewportScrollable ? 0 : undefined">
        <div ref="viewportContent">
          <slot :close="popover.close" />
        </div>
      </div>
      <PopoverArrow v-if="arrow" :class="$style.arrow" :height="6" rounded :width="12" />
    </PopoverContent>
  </PopoverPortal>
</template>

<style module>
.content {
  --basiq-popover-motion-x: 0;
  --basiq-popover-motion-y: 0;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: var(--reka-popover-content-available-height);
  overflow: visible;
  border: var(--basiq-border-width-default) solid var(--basiq-color-border-separator);
  border-radius: var(--basiq-radius-md);
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-surface-container);
  box-shadow: 0 4px 16px rgb(13 18 23 / 20%);
  font-family: var(--basiq-font-family-sans);
  line-height: 1.5;
  transform-origin: var(--reka-popover-content-transform-origin);
  animation: basiq-popover-content-in var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.content[data-width="content"] {
  max-width: min(20rem, var(--reka-popover-content-available-width));
}

.content[data-width="trigger"] {
  min-width: 0;
  max-width: var(--reka-popover-content-available-width);
}

.viewport {
  box-sizing: border-box;
  min-height: 0;
  overflow: hidden auto;
  overflow-wrap: anywhere;
  padding: var(--basiq-space-400);
  border-radius: calc(var(--basiq-radius-md) - var(--basiq-border-width-default));
}

.content[data-side="top"] {
  --basiq-popover-motion-y: var(--basiq-space-100);
}

.content[data-side="right"] {
  --basiq-popover-motion-x: calc(-1 * var(--basiq-space-100));
}

.content[data-side="bottom"] {
  --basiq-popover-motion-y: calc(-1 * var(--basiq-space-100));
}

.content[data-side="left"] {
  --basiq-popover-motion-x: var(--basiq-space-100);
}

.content[data-state="closed"] {
  animation-name: basiq-popover-content-out;
}

.content:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.arrow {
  fill: var(--basiq-color-surface-container);
  stroke: var(--basiq-color-border-separator);
  stroke-width: var(--basiq-border-width-default);
}

@keyframes basiq-popover-content-in {
  from {
    opacity: 0;
    transform: translate(var(--basiq-popover-motion-x), var(--basiq-popover-motion-y)) scale(0.98);
  }
}

@keyframes basiq-popover-content-out {
  to {
    opacity: 0;
    transform: translate(var(--basiq-popover-motion-x), var(--basiq-popover-motion-y)) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .content {
    animation: none;
    transition: none;
  }
}

@media (forced-colors: active) {
  .content {
    border-color: CanvasText;
    box-shadow: none;
  }

  .content:focus-visible {
    outline-color: Highlight;
  }

  .arrow {
    fill: Canvas;
    stroke: CanvasText;
  }
}
</style>
