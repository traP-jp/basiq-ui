<script setup lang="ts">
import { ToastClose } from "reka-ui";
import { computed } from "vue";

import BasiqIcon from "../icon/BasiqIcon.vue";
import { toastCloseIcon, toastIcons } from "./toastIcons";
import type { BasiqToastRecord } from "./types";

defineOptions({ inheritAttrs: false });

interface BasiqToastSurfaceProps {
  as?: string;
  closeLabel?: string;
  dismissible?: boolean;
  toast: BasiqToastRecord;
}

const props = withDefaults(defineProps<BasiqToastSurfaceProps>(), {
  as: "div",
  closeLabel: "通知を閉じる",
  dismissible: true,
});

const toneIcon = computed(() => toastIcons[props.toast.tone]);
</script>

<template>
  <component
    :is="as"
    v-bind="$attrs"
    :class="$style.root"
    :data-has-description="toast.description ? '' : undefined"
    :data-tone="toast.tone"
  >
    <div :class="$style.surface" data-basiq-toast-surface>
      <BasiqIcon :class="$style['status-icon']" :icon="toneIcon" />
      <div :class="$style.content">
        <div :class="$style.title">{{ toast.title }}</div>
        <div v-if="toast.description" :class="$style.description">
          {{ toast.description }}
        </div>
      </div>
      <ToastClose v-if="dismissible" :aria-label="closeLabel" :class="$style.close">
        <BasiqIcon :class="$style['close-icon']" :icon="toastCloseIcon" />
      </ToastClose>
    </div>
  </component>
</template>

<style module>
.root {
  --basiq-toast-local-accent: var(--basiq-color-toast-accent-neutral);
  --basiq-toast-local-background: var(--basiq-color-toast-background-neutral);

  box-sizing: border-box;
  width: 100%;
  border-radius: var(--basiq-radius-md);
  box-shadow: var(--basiq-shadow-toast);
  font-family: var(--basiq-font-family-sans);
  pointer-events: auto;
  overflow: clip;
  animation: basiq-toast-enter-fade var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.surface {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 32px;
  gap: var(--basiq-space-300);
  align-items: center;
  width: 100%;
  padding: var(--basiq-space-300);
  border: var(--basiq-border-width-default) solid transparent;
  border-radius: var(--basiq-radius-md);
  color: var(--basiq-color-toast-content);
  background: var(--basiq-toast-local-background);
  overflow-wrap: anywhere;
  animation: basiq-toast-enter-move var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.root[data-has-description] .surface {
  align-items: start;
}

.root[data-tone="info"] {
  --basiq-toast-local-accent: var(--basiq-color-toast-accent-info);
  --basiq-toast-local-background: var(--basiq-color-toast-background-info);
}

.root[data-tone="success"] {
  --basiq-toast-local-accent: var(--basiq-color-toast-accent-success);
  --basiq-toast-local-background: var(--basiq-color-toast-background-success);
}

.root[data-tone="warning"] {
  --basiq-toast-local-accent: var(--basiq-color-toast-accent-warning);
  --basiq-toast-local-background: var(--basiq-color-toast-background-warning);
}

.root[data-tone="error"] {
  --basiq-toast-local-accent: var(--basiq-color-toast-accent-error);
  --basiq-toast-local-background: var(--basiq-color-toast-background-error);
}

.root:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.status-icon {
  color: var(--basiq-toast-local-accent);
  font-size: 24px;
}

.root[data-has-description] .status-icon {
  margin-top: 2px;
}

.content {
  min-width: 0;
}

.title {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
}

.description {
  margin-top: var(--basiq-space-100);
  color: var(--basiq-color-toast-description);
  font-size: 0.875rem;
  line-height: 1.5;
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-toast-close);
  background: transparent;
  font: inherit;
  cursor: pointer;
  appearance: none;
}

.close:hover {
  background: var(--basiq-color-toast-close-hover);
}

.close:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.close-icon {
  font-size: 20px;
}

@keyframes basiq-toast-enter-fade {
  from {
    opacity: 0;
  }
}

/* The stable root clips this translated visual surface out of the Toast viewport's scroll area. */
@keyframes basiq-toast-enter-move {
  from {
    transform: translateY(calc(100% + var(--basiq-space-200)));
  }
}

@media (prefers-reduced-motion: reduce) {
  .root,
  .surface {
    animation: none;
  }
}

@media (forced-colors: active) {
  .surface {
    border-color: CanvasText;
    color: CanvasText;
    background: Canvas;
  }

  .status-icon,
  .close {
    color: CanvasText;
  }

  .root:focus-visible,
  .close:focus-visible {
    outline-color: Highlight;
  }
}
</style>
