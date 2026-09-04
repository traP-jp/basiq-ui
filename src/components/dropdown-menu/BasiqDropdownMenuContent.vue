<script setup lang="ts">
import { DropdownMenuContent, DropdownMenuPortal } from "reka-ui";
import { computed, toRef, useAttrs } from "vue";

import type { BasiqPortalTarget } from "../overlay/overlayContext";
import { useOverlayPortal } from "../overlay/useOverlayPortal";
import { injectBasiqDropdownMenuContext } from "./context";

defineOptions({ inheritAttrs: false });

export type { BasiqPortalTarget } from "../overlay/overlayContext";
export type BasiqDropdownMenuAlign = "center" | "end" | "start";
export type BasiqDropdownMenuSide = "bottom" | "left" | "right" | "top";
export type BasiqDropdownMenuWidth = "content" | "trigger";

export interface BasiqDropdownMenuContentProps {
  align?: BasiqDropdownMenuAlign;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  loop?: boolean;
  /** The Portal target resolved when the content mounts. Keep it stable while mounted. */
  portalTarget?: BasiqPortalTarget;
  side?: BasiqDropdownMenuSide;
  sideOffset?: number;
  width?: BasiqDropdownMenuWidth;
}

const props = withDefaults(defineProps<BasiqDropdownMenuContentProps>(), {
  align: "start",
  alignOffset: 0,
  avoidCollisions: true,
  collisionPadding: 8,
  loop: true,
  portalTarget: undefined,
  side: "bottom",
  sideOffset: 4,
  width: "content",
});
defineSlots<{
  default?: () => unknown;
}>();

const attrs = useAttrs();
const dropdownMenu = injectBasiqDropdownMenuContext();
const portalTarget = toRef(props, "portalTarget");
const { contentStyle, target, themeMode } = useOverlayPortal({
  modal: dropdownMenu.modal,
  open: dropdownMenu.open,
  portalTarget,
});
const widthStyle = computed(() =>
  props.width === "trigger" ? "var(--reka-dropdown-menu-trigger-width)" : "max-content",
);

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"),
  );
}
</script>

<template>
  <DropdownMenuPortal defer :to="target">
    <DropdownMenuContent
      v-bind="getForwardedAttrs()"
      :align="align"
      :align-offset="alignOffset"
      :avoid-collisions="avoidCollisions"
      :class="[$style.content, $attrs.class]"
      :collision-padding="collisionPadding"
      :data-basiq-theme="themeMode"
      :data-width="width"
      :loop="loop"
      :side="side"
      :side-offset="sideOffset"
      :style="[{ width: widthStyle }, $attrs.style, contentStyle]"
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>

<style module>
.content {
  --basiq-dropdown-menu-motion-x: 0;
  --basiq-dropdown-menu-motion-y: 0;

  box-sizing: border-box;
  min-width: 10rem;
  max-height: var(--reka-dropdown-menu-content-available-height);
  padding: var(--basiq-space-100);
  overflow: hidden auto;
  overflow-wrap: anywhere;
  border: var(--basiq-border-width-default) solid var(--basiq-color-dropdown-menu-border);
  border-radius: var(--basiq-radius-md);
  color: var(--basiq-color-dropdown-menu-content);
  background: var(--basiq-color-dropdown-menu-background);
  box-shadow: 0 4px 16px rgb(13 18 23 / 20%);
  font-family: var(--basiq-font-family-sans);
  font-size: 0.875rem;
  line-height: 1.5;
  transform-origin: var(--reka-dropdown-menu-content-transform-origin);
  animation: basiq-dropdown-menu-content-in var(--basiq-duration-overlay)
    var(--basiq-easing-standard);
}

.content[data-width="content"] {
  max-width: min(20rem, var(--reka-dropdown-menu-content-available-width));
}

.content[data-width="trigger"] {
  min-width: 0;
  max-width: var(--reka-dropdown-menu-content-available-width);
}

.content[data-side="top"] {
  --basiq-dropdown-menu-motion-y: var(--basiq-space-100);
}

.content[data-side="right"] {
  --basiq-dropdown-menu-motion-x: calc(-1 * var(--basiq-space-100));
}

.content[data-side="bottom"] {
  --basiq-dropdown-menu-motion-y: calc(-1 * var(--basiq-space-100));
}

.content[data-side="left"] {
  --basiq-dropdown-menu-motion-x: var(--basiq-space-100);
}

.content[data-state="closed"] {
  animation-name: basiq-dropdown-menu-content-out;
}

.content:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

@keyframes basiq-dropdown-menu-content-in {
  from {
    opacity: 0;
    transform: translate(var(--basiq-dropdown-menu-motion-x), var(--basiq-dropdown-menu-motion-y))
      scale(0.98);
  }
}

@keyframes basiq-dropdown-menu-content-out {
  to {
    opacity: 0;
    transform: translate(var(--basiq-dropdown-menu-motion-x), var(--basiq-dropdown-menu-motion-y))
      scale(0.98);
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
}
</style>
