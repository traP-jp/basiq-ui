<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "reka-ui";
import { computed, ref, toRef, useAttrs, watchEffect } from "vue";

import BasiqIcon from "../icon/BasiqIcon.vue";
import type { BasiqPortalTarget } from "../overlay/overlayContext";
import { useOverlayPortal } from "../overlay/useOverlayPortal";
import BasiqDialogCloseIcon from "./BasiqDialogCloseIcon.vue";

defineOptions({ inheritAttrs: false });

export type { BasiqPortalTarget } from "../overlay/overlayContext";
export type BasiqDialogInitialFocus = "auto" | "title";

export interface BasiqDialogProps {
  closeLabel?: string;
  defaultOpen?: boolean;
  description?: string;
  /** Controls passive dismissal through Escape and outside pointer interactions. Explicit close controls remain available. */
  dismissible?: boolean;
  initialFocus?: BasiqDialogInitialFocus;
  open?: boolean;
  /** The Portal target resolved when the Dialog mounts. Keep it stable while mounted; remount the Dialog to use another target. */
  portalTarget?: BasiqPortalTarget;
  showCloseButton?: boolean;
  title: string;
}

export interface BasiqDialogEmits {
  "update:open": [value: boolean];
}

export interface BasiqDialogSlotProps {
  close: () => void;
  open: boolean;
}

const props = withDefaults(defineProps<BasiqDialogProps>(), {
  closeLabel: "Close dialog",
  defaultOpen: false,
  description: undefined,
  dismissible: true,
  initialFocus: "auto",
  open: undefined,
  portalTarget: undefined,
  showCloseButton: true,
});
const emit = defineEmits<BasiqDialogEmits>();
defineSlots<{
  default?: (props: BasiqDialogSlotProps) => unknown;
  footer?: (props: BasiqDialogSlotProps) => unknown;
  trigger?: (props: { open: boolean }) => unknown;
}>();

const attrs = useAttrs();
const titleElement = ref<HTMLElement>();
const uncontrolledOpen = ref(props.defaultOpen);
const isInitiallyControlled = props.open !== undefined;
const currentOpen = computed(() => props.open ?? uncontrolledOpen.value);
const portalTarget = toRef(props, "portalTarget");
const { contentStyle, overlayStyle, target, themeMode } = useOverlayPortal({
  layer: "dialog",
  modal: true,
  open: currentOpen,
  portalTarget,
});
const slotProps = computed<BasiqDialogSlotProps>(() => ({
  close: () => setOpen(false),
  open: currentOpen.value,
}));
const hasExternalDescription = computed(() => attrs["aria-describedby"] !== undefined);

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  if ((props.open !== undefined) !== isInitiallyControlled) {
    console.warn(
      "[BasiQ UI] BasiqDialog must not switch between controlled and uncontrolled state.",
    );
  }
});

function setOpen(value: boolean) {
  if (!isInitiallyControlled) uncontrolledOpen.value = value;
  emit("update:open", value);
}

function getForwardedAttrs() {
  const forwardedAttrs = Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"),
  );

  if (!props.description && attrs["aria-describedby"] === undefined) {
    forwardedAttrs["aria-describedby"] = undefined;
  }
  return forwardedAttrs;
}

function handleDismissEvent(event: Event) {
  if (!props.dismissible) event.preventDefault();
}

function handleOpenAutoFocus(event: Event) {
  if (props.initialFocus !== "title") return;

  event.preventDefault();
  titleElement.value?.focus();
}
</script>

<template>
  <DialogRoot :open="currentOpen" @update:open="setOpen">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" :open="currentOpen" />
    </DialogTrigger>

    <DialogPortal defer :to="target">
      <DialogOverlay :class="$style.overlay" :data-basiq-theme="themeMode" :style="overlayStyle" />
      <DialogContent
        v-bind="getForwardedAttrs()"
        aria-modal="true"
        :class="[$style.content, $attrs.class]"
        :data-basiq-theme="themeMode"
        :style="[$attrs.style, contentStyle]"
        @escape-key-down="handleDismissEvent"
        @interact-outside="handleDismissEvent"
        @open-auto-focus="handleOpenAutoFocus"
        @pointer-down-outside="handleDismissEvent"
      >
        <header :class="$style.header">
          <div :class="$style.heading">
            <DialogTitle as-child>
              <h2 ref="titleElement" :class="$style.title" :tabindex="-1">
                {{ title }}
              </h2>
            </DialogTitle>

            <DialogDescription v-if="description" :class="$style.description">
              {{ description }}
            </DialogDescription>
          </div>

          <DialogClose v-if="showCloseButton" as-child>
            <button :aria-label="closeLabel" :class="$style.close" type="button">
              <BasiqIcon :icon="BasiqDialogCloseIcon" />
            </button>
          </DialogClose>
        </header>

        <DialogDescription v-if="!description && hasExternalDescription" hidden />

        <div :class="$style.body">
          <slot v-bind="slotProps" />
        </div>

        <footer v-if="$slots.footer" :class="$style.footer">
          <slot name="footer" v-bind="slotProps" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--basiq-color-overlay-scrim);
  animation: basiq-dialog-overlay-in var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.overlay[data-state="closed"] {
  animation-name: basiq-dialog-overlay-out;
}

.content {
  box-sizing: border-box;
  position: fixed;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  width: min(32rem, calc(100vw - var(--basiq-space-800)));
  max-height: calc(100dvh - var(--basiq-space-800));
  overflow: auto;
  border: var(--basiq-border-width-default) solid var(--basiq-color-border-separator);
  border-radius: var(--basiq-radius-md);
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-surface-container);
  box-shadow: 0 16px 48px rgb(13 18 23 / 24%);
  font-family: var(--basiq-font-family-sans);
  transform: translate(-50%, -50%);
  animation: basiq-dialog-content-in var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.content[data-state="closed"] {
  animation-name: basiq-dialog-content-out;
}

.content:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.header {
  display: flex;
  gap: var(--basiq-space-300);
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--basiq-space-600) var(--basiq-space-600) 0;
}

.heading {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  gap: var(--basiq-space-100);
}

.title {
  margin: 0;
  color: var(--basiq-color-content-default);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.4;
}

.close {
  box-sizing: border-box;
  display: inline-grid;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-content-subtle);
  background: transparent;
  font: inherit;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  place-items: center;
}

.close:hover {
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-surface-muted);
}

.close:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.description {
  margin: 0;
  color: var(--basiq-color-content-subtle);
  font-size: 0.875rem;
  line-height: 1.5;
}

.body {
  min-width: 0;
  padding: var(--basiq-space-400) var(--basiq-space-600) var(--basiq-space-600);
  line-height: 1.5;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--basiq-space-300);
  justify-content: flex-end;
  padding: 0 var(--basiq-space-600) var(--basiq-space-600);
}

@keyframes basiq-dialog-overlay-in {
  from {
    opacity: 0;
  }
}

@keyframes basiq-dialog-overlay-out {
  to {
    opacity: 0;
  }
}

@keyframes basiq-dialog-content-in {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-50% + var(--basiq-space-200))) scale(0.98);
  }
}

@keyframes basiq-dialog-content-out {
  to {
    opacity: 0;
    transform: translate(-50%, calc(-50% + var(--basiq-space-200))) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay,
  .content {
    animation: none;
    transition: none;
  }
}

@media (forced-colors: active) {
  .overlay {
    background: rgb(0 0 0 / 50%);
    forced-color-adjust: none;
  }

  .content {
    border-color: CanvasText;
    box-shadow: none;
  }

  .close:focus-visible {
    outline-color: Highlight;
  }

  .content:focus-visible {
    outline-color: Highlight;
  }
}
</style>
