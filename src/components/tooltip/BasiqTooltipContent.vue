<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal } from "reka-ui";
import { toRef, useAttrs } from "vue";

import type { BasiqPortalTarget } from "../overlay/overlayContext";
import { useOverlayPortal } from "../overlay/useOverlayPortal";
import { injectBasiqTooltipContext } from "./context";

defineOptions({ inheritAttrs: false });

export type { BasiqPortalTarget } from "../overlay/overlayContext";
export type BasiqTooltipAlign = "center" | "end" | "start";
export type BasiqTooltipSide = "bottom" | "left" | "right" | "top";

export interface BasiqTooltipContentProps {
  align?: BasiqTooltipAlign;
  alignOffset?: number;
  ariaLabel?: string;
  arrow?: boolean;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  /** The Portal target resolved when the content mounts. Keep it stable while mounted. */
  portalTarget?: BasiqPortalTarget;
  side?: BasiqTooltipSide;
  sideOffset?: number;
}

const props = withDefaults(defineProps<BasiqTooltipContentProps>(), {
  align: "center",
  alignOffset: 0,
  ariaLabel: undefined,
  arrow: true,
  avoidCollisions: true,
  collisionPadding: 8,
  portalTarget: undefined,
  side: "top",
  sideOffset: 6,
});
defineSlots<{
  default?: () => unknown;
}>();

const attrs = useAttrs();
const tooltip = injectBasiqTooltipContext();
const portalTarget = toRef(props, "portalTarget");
const { contentStyle, target, themeMode } = useOverlayPortal({
  open: tooltip.open,
  portalTarget,
});

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"),
  );
}
</script>

<template>
  <TooltipPortal defer :to="target">
    <TooltipContent
      v-bind="getForwardedAttrs()"
      :align="align"
      :align-offset="alignOffset"
      :aria-label="ariaLabel"
      :avoid-collisions="avoidCollisions"
      :class="[$style.content, $attrs.class]"
      :collision-padding="collisionPadding"
      :data-basiq-theme="themeMode"
      :side="side"
      :side-offset="sideOffset"
      :style="[$attrs.style, contentStyle]"
    >
      <slot />
      <TooltipArrow v-if="arrow" :class="$style.arrow" :height="5" rounded :width="10" />
    </TooltipContent>
  </TooltipPortal>
</template>

<style module>
.content {
  --basiq-tooltip-motion-x: 0;
  --basiq-tooltip-motion-y: 0;

  box-sizing: border-box;
  width: max-content;
  max-width: min(20rem, var(--reka-tooltip-content-available-width));
  padding: var(--basiq-space-100) var(--basiq-space-200);
  overflow-wrap: anywhere;
  border: var(--basiq-border-width-default) solid var(--basiq-color-tooltip-border);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-tooltip-content);
  background: var(--basiq-color-tooltip-background);
  box-shadow: 0 4px 12px rgb(13 18 23 / 20%);
  font-family: var(--basiq-font-family-sans);
  font-size: 0.875rem;
  line-height: 1.4;
  transform-origin: var(--reka-tooltip-content-transform-origin);
  animation: basiq-tooltip-content-in var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.content[data-side="top"] {
  --basiq-tooltip-motion-y: var(--basiq-space-100);
}

.content[data-side="right"] {
  --basiq-tooltip-motion-x: calc(-1 * var(--basiq-space-100));
}

.content[data-side="bottom"] {
  --basiq-tooltip-motion-y: calc(-1 * var(--basiq-space-100));
}

.content[data-side="left"] {
  --basiq-tooltip-motion-x: var(--basiq-space-100);
}

.content[data-state="closed"] {
  animation-name: basiq-tooltip-content-out;
}

.arrow {
  fill: var(--basiq-color-tooltip-background);
  stroke: var(--basiq-color-tooltip-border);
  stroke-width: var(--basiq-border-width-default);
}

@keyframes basiq-tooltip-content-in {
  from {
    opacity: 0;
    transform: translate(var(--basiq-tooltip-motion-x), var(--basiq-tooltip-motion-y)) scale(0.98);
  }
}

@keyframes basiq-tooltip-content-out {
  to {
    opacity: 0;
    transform: translate(var(--basiq-tooltip-motion-x), var(--basiq-tooltip-motion-y)) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .content {
    animation: none;
  }
}

@media (forced-colors: active) {
  .content {
    border-color: CanvasText;
    color: CanvasText;
    background: Canvas;
    box-shadow: none;
  }

  .arrow {
    fill: Canvas;
    stroke: CanvasText;
  }
}
</style>
