<script setup lang="ts">
import {
  computed,
  type CSSProperties,
  type ImgHTMLAttributes,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
  watchEffect,
  watchPostEffect,
} from "vue";

import BasiqIcon from "../icon/BasiqIcon.vue";
import BasiqAvatarFallbackIcon from "./BasiqAvatarFallbackIcon.vue";

defineOptions({ inheritAttrs: false });

type BasiqAvatarNamedSize = "lg" | "md" | "sm";
export type BasiqAvatarSize = BasiqAvatarNamedSize | number;
export type BasiqAvatarShape = "circle" | "rounded" | "square";

export interface BasiqAvatarProps {
  /** Native alternative text. Use an empty string when adjacent text already identifies the avatar. */
  alt: string;
  crossorigin?: ImgHTMLAttributes["crossorigin"];
  name?: string;
  referrerpolicy?: ImgHTMLAttributes["referrerpolicy"];
  shape?: BasiqAvatarShape;
  size?: BasiqAvatarSize;
  src?: string;
}

export interface BasiqAvatarEmits {
  error: [event: Event];
  load: [event: Event];
}

export interface BasiqAvatarFallbackSlotProps {
  initials?: string;
}

interface BasiqAvatarSlots {
  fallback?: (props: BasiqAvatarFallbackSlotProps) => unknown;
}

const namedSizes: Record<BasiqAvatarNamedSize, number> = {
  sm: 36,
  md: 40,
  lg: 44,
};
const defaultSize = namedSizes.md;

const props = withDefaults(defineProps<BasiqAvatarProps>(), {
  crossorigin: undefined,
  name: undefined,
  referrerpolicy: undefined,
  shape: "circle",
  size: "md",
  src: undefined,
});
const emit = defineEmits<BasiqAvatarEmits>();
defineSlots<BasiqAvatarSlots>();

const attrs = useAttrs();
const imageElement = useTemplateRef<HTMLImageElement>("image");
const imageStatus = ref<"error" | "idle" | "loaded" | "loading">("idle");
const resolvedAlt = computed(() => (typeof props.alt === "string" ? props.alt : ""));
const accessibleLabel = computed(() => resolvedAlt.value.trim() || undefined);
const resolvedSrc = computed(() => props.src?.trim() || undefined);
const resolvedSize = computed(() => {
  if (typeof props.size === "number") {
    return isValidNumericSize(props.size) ? props.size : defaultSize;
  }

  return namedSizes[props.size];
});
const initials = computed(() => createInitials(props.name, resolvedSize.value));
const rootStyle = computed<CSSProperties & Record<"--basiq-avatar-size", string>>(() => ({
  "--basiq-avatar-size": `${resolvedSize.value}px`,
}));

watch(
  resolvedSrc,
  (src) => {
    imageStatus.value = src ? "loading" : "idle";
  },
  { immediate: true },
);

watchPostEffect(() => {
  const image = imageElement.value;
  if (!image || imageStatus.value !== "loading" || !image.complete) return;

  imageStatus.value = image.naturalWidth > 0 ? "loaded" : "error";
});

watchEffect(() => {
  if (import.meta.env.DEV && typeof props.size === "number" && !isValidNumericSize(props.size)) {
    console.warn(
      "[BasiQ UI] BasiqAvatar size must be a finite integer greater than or equal to 16.",
    );
  }
});

function isValidNumericSize(size: number) {
  return Number.isFinite(size) && Number.isInteger(size) && size >= 16;
}

const graphemeSegmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : undefined;

function splitGraphemes(value: string) {
  if (!graphemeSegmenter) return Array.from(value);
  return Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment);
}

function createInitials(name: string | undefined, size: number) {
  const words = name?.trim().split(/\s+/u).filter(Boolean) ?? [];
  if (words.length === 0 || size < 20) return undefined;

  const firstWordGraphemes = splitGraphemes(words[0]);
  if (size < 32) return firstWordGraphemes[0];

  if (words.length === 1) return firstWordGraphemes.slice(0, 2).join("") || undefined;
  return (
    `${firstWordGraphemes[0] ?? ""}${splitGraphemes(words.at(-1) ?? "")[0] ?? ""}` || undefined
  );
}

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) =>
        key !== "aria-hidden" &&
        key !== "aria-label" &&
        key !== "class" &&
        key !== "role" &&
        key !== "style" &&
        key !== "tabindex" &&
        key !== "tabIndex",
    ),
  );
}

function isCurrentImageEvent(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null;
  if (!image) return false;
  return image === imageElement.value && image.getAttribute("src") === resolvedSrc.value;
}

function handleLoad(event: Event) {
  if (!isCurrentImageEvent(event)) return;
  imageStatus.value = "loaded";
  emit("load", event);
}

function handleError(event: Event) {
  if (!isCurrentImageEvent(event)) return;
  imageStatus.value = "error";
  emit("error", event);
}
</script>

<template>
  <span
    v-bind="getForwardedAttrs()"
    :class="[$style.root, $attrs.class]"
    :data-shape="shape"
    :data-size="typeof size === 'number' ? 'custom' : size"
    :style="[rootStyle, $attrs.style || null]"
  >
    <img
      v-if="resolvedSrc"
      v-show="imageStatus === 'loaded'"
      :key="resolvedSrc"
      ref="image"
      :alt="resolvedAlt"
      :aria-hidden="accessibleLabel ? undefined : 'true'"
      :class="$style.image"
      :crossorigin="crossorigin"
      :height="resolvedSize"
      :referrerpolicy="referrerpolicy"
      :src="resolvedSrc"
      :width="resolvedSize"
      draggable="false"
      @error="handleError"
      @load="handleLoad"
    />
    <span
      v-if="imageStatus !== 'loaded'"
      :aria-hidden="accessibleLabel ? undefined : 'true'"
      :aria-label="accessibleLabel"
      :class="$style.fallback"
      :role="accessibleLabel ? 'img' : undefined"
    >
      <span :class="$style['fallback-content']" aria-hidden="true">
        <slot name="fallback" :initials="initials">
          <span v-if="initials" :class="$style.initials">{{ initials }}</span>
          <BasiqIcon v-else :class="$style['fallback-icon']" :icon="BasiqAvatarFallbackIcon" />
        </slot>
      </span>
    </span>
  </span>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: inline-flex;
  position: relative;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: var(--basiq-avatar-size);
  height: var(--basiq-avatar-size);
  overflow: hidden;
  color: var(--basiq-color-avatar-content);
  background: var(--basiq-color-avatar-background);
  font-family: inherit;
  font-size: calc(var(--basiq-avatar-size) / 2);
  font-weight: 700;
  line-height: 1;
  user-select: none;
  vertical-align: middle;
}

.root[data-shape="circle"] {
  border-radius: var(--basiq-radius-full);
}

.root[data-shape="rounded"] {
  border-radius: var(--basiq-radius-md);
}

.root[data-shape="square"] {
  border-radius: 0;
}

.image,
.fallback,
.fallback-content {
  width: 100%;
  height: 100%;
}

.image {
  display: block;
  border-radius: inherit;
  object-fit: cover;
  object-position: center;
}

.fallback,
.fallback-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.initials {
  max-width: 100%;
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap;
}

.fallback-icon {
  font-size: 60%;
}
</style>
