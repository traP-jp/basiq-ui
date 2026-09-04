<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "reka-ui";
import { computed, ref, useAttrs, useTemplateRef, watch } from "vue";

import BasiqNavigationEdgeControl from "../navigation-layout/BasiqNavigationEdgeControl.vue";
import {
  type BasiqNavigationLayoutEmits,
  type BasiqNavigationLayoutSlotProps,
  useNavigationLayoutOpenState,
} from "../navigation-layout/navigationLayout";
import { useNavigationLayoutMotion } from "../navigation-layout/useNavigationLayoutMotion";

export interface BasiqOverlayNavigationLayoutProps {
  closeLabel: string;
  controlOffsetBlockStart?: string;
  defaultOpen?: boolean;
  navigationLabel: string;
  open?: boolean;
  openLabel: string;
}
export type BasiqOverlayNavigationLayoutEmits = BasiqNavigationLayoutEmits;
export type BasiqOverlayNavigationLayoutNavigationSlotProps = BasiqNavigationLayoutSlotProps;

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<BasiqOverlayNavigationLayoutProps>(), {
  defaultOpen: false,
  open: undefined,
});
const emit = defineEmits<BasiqOverlayNavigationLayoutEmits>();
defineSlots<{
  default?: () => unknown;
  navigation?: (props: BasiqOverlayNavigationLayoutNavigationSlotProps) => unknown;
}>();

const attrs = useAttrs();
const rootElement = useTemplateRef<HTMLElement>("root");
const { close, currentOpen, setOpen } = useNavigationLayoutOpenState(
  "BasiqOverlayNavigationLayout",
  props,
  emit,
);
const panelPresent = ref(currentOpen.value);
const triggerHidden = computed(() => currentOpen.value || panelPresent.value);
const {
  finish: finishMotion,
  moving,
  start: startMotion,
  suppressHover,
  suppressUntilPointerMovement,
} = useNavigationLayoutMotion();

function captureMotionOrigin() {
  if (typeof window === "undefined") return;
  const root = rootElement.value;
  const scrim = root?.querySelector<HTMLElement>("[data-basiq-navigation-scrim]");
  const navigation = root?.querySelector<HTMLElement>("[data-basiq-navigation-panel]");

  if (scrim) {
    scrim.style.setProperty(
      "--basiq-overlay-navigation-motion-from-opacity",
      getComputedStyle(scrim).opacity,
    );
  }
  if (navigation) {
    navigation.style.setProperty(
      "--basiq-overlay-navigation-motion-from-transform",
      getComputedStyle(navigation).transform,
    );
  }
}

watch(
  currentOpen,
  () => {
    captureMotionOrigin();
    suppressUntilPointerMovement();
  },
  { flush: "sync" },
);

function onPanelMotionStart(event: Event) {
  panelPresent.value = true;
  const element = event.currentTarget;
  if (!(element instanceof HTMLElement) || getComputedStyle(element).animationName === "none")
    return;
  startMotion();
}

function onPanelMotionEnd() {
  finishMotion();
}

function onPanelAfterLeave() {
  finishMotion();
  panelPresent.value = false;
}
</script>

<template>
  <DialogRoot :open="currentOpen" @update:open="setOpen">
    <div
      ref="root"
      v-bind="attrs"
      :class="$style.root"
      :data-moving="moving || undefined"
      :data-open="currentOpen"
      :style="{
        '--basiq-navigation-layout-control-offset-block-start': controlOffsetBlockStart,
      }"
    >
      <div :class="$style['edge-rail']" :data-control-hidden="triggerHidden || undefined">
        <DialogTrigger as-child>
          <BasiqNavigationEdgeControl
            direction="right"
            :label="openLabel"
            :class="$style['edge-control']"
          />
        </DialogTrigger>
      </div>

      <div :class="$style.content">
        <slot />
      </div>

      <DialogOverlay data-basiq-navigation-scrim :class="$style.scrim" />
      <DialogContent
        data-basiq-navigation-panel
        :aria-describedby="undefined"
        :class="$style.navigation"
        @after-enter="onPanelMotionEnd"
        @after-leave="onPanelAfterLeave"
        @enter="onPanelMotionStart"
        @leave="onPanelMotionStart"
      >
        <DialogTitle :class="$style['visually-hidden']">{{ navigationLabel }}</DialogTitle>
        <div :class="$style['navigation-body']">
          <slot name="navigation" :close="close" :open="currentOpen" />
        </div>
        <DialogClose as-child>
          <BasiqNavigationEdgeControl
            direction="left"
            :label="closeLabel"
            :suppress-hover="suppressHover"
            :class="$style['close-control']"
          />
        </DialogClose>
      </DialogContent>
    </div>
  </DialogRoot>
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
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-surface-base);
  font-family: var(--basiq-font-family-sans);
}

.edge-rail {
  box-sizing: border-box;
  position: absolute;
  z-index: 0;
  top: 0;
  bottom: 0;
  left: 0;
  display: grid;
  place-items: start center;
  width: 40px;
  min-height: 40px;
}

.edge-rail[data-control-hidden="true"] {
  opacity: 0;
  pointer-events: none;
}

.edge-control {
  position: absolute;
  top: var(--basiq-navigation-layout-control-offset-block-start);
  left: 0;
}

.content {
  box-sizing: border-box;
  width: calc(100% - 40px);
  height: 100%;
  margin-left: 40px;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: var(--basiq-color-surface-base);
}

.scrim {
  position: fixed;
  z-index: calc(var(--basiq-layer-overlay) - 1);
  inset: 0;
  background: var(--basiq-color-overlay-scrim);
  animation: basiq-overlay-navigation-scrim-out var(--basiq-duration-overlay)
    var(--basiq-easing-standard) forwards;
}

.scrim[data-state="open"] {
  animation-name: basiq-overlay-navigation-scrim-in;
}

.navigation {
  box-sizing: border-box;
  position: fixed;
  z-index: var(--basiq-layer-overlay);
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--basiq-navigation-layout-effective-width);
  min-width: 0;
  outline: none;
  background: var(--basiq-color-surface-container);
  box-shadow: 8px 0 24px rgb(13 18 23 / 22%);
  animation: basiq-overlay-navigation-panel-out var(--basiq-duration-overlay)
    var(--basiq-easing-standard) forwards;
}

.navigation[data-state="open"] {
  animation-name: basiq-overlay-navigation-panel-in;
}

.navigation-body {
  box-sizing: border-box;
  height: 100%;
  min-width: 0;
  overflow: auto;
}

.close-control {
  position: absolute;
  top: var(--basiq-navigation-layout-control-offset-block-start);
  left: 100%;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@keyframes basiq-overlay-navigation-scrim-in {
  from {
    opacity: var(--basiq-overlay-navigation-motion-from-opacity, 0);
  }

  to {
    opacity: 1;
  }
}

@keyframes basiq-overlay-navigation-scrim-out {
  from {
    opacity: var(--basiq-overlay-navigation-motion-from-opacity, 1);
  }

  to {
    opacity: 0;
  }
}

@keyframes basiq-overlay-navigation-panel-in {
  from {
    transform: var(--basiq-overlay-navigation-motion-from-transform, translateX(-100%));
  }

  to {
    transform: translateX(0);
  }
}

@keyframes basiq-overlay-navigation-panel-out {
  from {
    transform: var(--basiq-overlay-navigation-motion-from-transform, translateX(0));
  }

  to {
    transform: translateX(-100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .scrim,
  .navigation {
    animation: none;
  }
}
</style>
