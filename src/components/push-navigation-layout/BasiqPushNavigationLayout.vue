<script setup lang="ts">
import { nextTick, useAttrs, useId, useTemplateRef, watch } from "vue";

import BasiqNavigationEdgeControl from "../navigation-layout/BasiqNavigationEdgeControl.vue";
import {
  type BasiqNavigationLayoutEmits,
  type BasiqNavigationLayoutSlotProps,
  useNavigationLayoutOpenState,
} from "../navigation-layout/navigationLayout";
import { useNavigationLayoutMotion } from "../navigation-layout/useNavigationLayoutMotion";

export interface BasiqPushNavigationLayoutProps {
  closeLabel: string;
  controlOffsetBlockStart?: string;
  defaultOpen?: boolean;
  open?: boolean;
  openLabel: string;
}
export type BasiqPushNavigationLayoutEmits = BasiqNavigationLayoutEmits;
export type BasiqPushNavigationLayoutNavigationSlotProps = BasiqNavigationLayoutSlotProps;

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<BasiqPushNavigationLayoutProps>(), {
  defaultOpen: false,
  open: undefined,
});
const emit = defineEmits<BasiqPushNavigationLayoutEmits>();
defineSlots<{
  default?: () => unknown;
  navigation?: (props: BasiqPushNavigationLayoutNavigationSlotProps) => unknown;
}>();

const attrs = useAttrs();
const panelId = useId();
const navigationElement = useTemplateRef<HTMLElement>("navigation");
const edgeRailElement = useTemplateRef<HTMLElement>("edgeRail");
const {
  close: setClosed,
  currentOpen,
  open,
} = useNavigationLayoutOpenState("BasiqPushNavigationLayout", props, emit);
const {
  finish: finishMotion,
  moving,
  start: startMotion,
  suppressHover,
  suppressUntilPointerMovement,
} = useNavigationLayoutMotion();

function restoreControlFocusAfterClose() {
  const shouldRestoreFocus =
    typeof document !== "undefined" &&
    navigationElement.value?.contains(document.activeElement) === true;

  if (!shouldRestoreFocus) return;

  void nextTick(() => {
    if (currentOpen.value) return;
    const navigation = navigationElement.value;
    const activeElement = document.activeElement;
    if (!navigation) return;
    if (activeElement !== document.body && !navigation.contains(activeElement)) return;
    edgeRailElement.value?.querySelector<HTMLButtonElement>("button")?.focus();
  });
}

watch(currentOpen, (open, previousOpen) => {
  suppressUntilPointerMovement();
  if (!open && previousOpen) restoreControlFocusAfterClose();
});

function close() {
  setClosed();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape" || !currentOpen.value) return;
  event.preventDefault();
  close();
}

function onTrackTransitionStart(event: TransitionEvent) {
  if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
  startMotion();
}

function onTrackTransitionEnd(event: TransitionEvent) {
  if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
  finishMotion();
}
</script>

<template>
  <div
    v-bind="attrs"
    :class="$style.root"
    :data-moving="moving || undefined"
    :data-open="currentOpen"
    :style="{
      '--basiq-navigation-layout-control-offset-block-start': controlOffsetBlockStart,
    }"
    @keydown="onKeydown"
  >
    <div
      ref="navigation"
      :id="panelId"
      :aria-hidden="currentOpen ? undefined : 'true'"
      :class="$style.navigation"
      :inert="!currentOpen"
    >
      <slot name="navigation" :close="close" :open="currentOpen" />
    </div>

    <div
      :class="$style['content-track']"
      @transitioncancel="onTrackTransitionEnd"
      @transitionend="onTrackTransitionEnd"
      @transitionrun="onTrackTransitionStart"
    >
      <div ref="edgeRail" :class="$style['edge-rail']">
        <BasiqNavigationEdgeControl
          :controls="panelId"
          :direction="currentOpen ? 'left' : 'right'"
          :expanded="currentOpen"
          :label="currentOpen ? closeLabel : openLabel"
          :suppress-hover="suppressHover"
          :class="$style['edge-control']"
          @click="currentOpen ? close() : open()"
        />
      </div>
      <div :class="$style.content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style module>
.root {
  --basiq-navigation-layout-control-offset-block-start: var(--basiq-space-400);
  --basiq-navigation-layout-width: 17.5rem;
  --basiq-navigation-layout-effective-width: min(
    var(--basiq-navigation-layout-width),
    calc(100% - 40px)
  );

  box-sizing: border-box;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 100%;
  overflow: hidden;
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-surface-base);
  font-family: var(--basiq-font-family-sans);
}

.navigation {
  box-sizing: border-box;
  position: absolute;
  z-index: 1;
  inset-block: 0;
  left: 0;
  width: var(--basiq-navigation-layout-effective-width);
  min-width: 0;
  overflow: auto;
  visibility: hidden;
  background: var(--basiq-color-surface-container);
  transform: translateX(-100%);
  transition:
    transform var(--basiq-duration-overlay) var(--basiq-easing-standard),
    visibility 0s linear var(--basiq-duration-overlay);
}

.content-track {
  box-sizing: border-box;
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  padding-left: 40px;
  min-width: 0;
  min-height: 100%;
  background: var(--basiq-color-surface-base);
  transition: transform var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.root[data-open="true"] .navigation {
  visibility: visible;
  transform: translateX(0);
  transition-delay: 0s;
}

.root[data-open="true"] .content-track {
  transform: translateX(var(--basiq-navigation-layout-effective-width));
}

.edge-rail {
  box-sizing: border-box;
  position: absolute;
  inset-block: 0;
  left: 0;
  display: grid;
  place-items: start center;
  width: 40px;
  min-height: 40px;
}

.edge-control {
  position: absolute;
  top: var(--basiq-navigation-layout-control-offset-block-start);
  left: 0;
}

.content {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  min-width: 0;
  background: var(--basiq-color-surface-base);
}

@media (prefers-reduced-motion: reduce) {
  .navigation,
  .content-track {
    transition: none;
  }
}
</style>
