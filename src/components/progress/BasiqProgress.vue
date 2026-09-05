<script setup lang="ts">
import { computed, type CSSProperties, useAttrs, watchEffect } from "vue";

import { isValidProgressMax, normalizeProgressMax, normalizeProgressValue } from "./progress";

defineOptions({ inheritAttrs: false });

export interface BasiqProgressProps {
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaValueText?: string;
  max?: number;
  value: number;
}

type ProgressIndicatorStyle = CSSProperties & {
  "--basiq-progress-fill": string;
};

const props = withDefaults(defineProps<BasiqProgressProps>(), {
  ariaLabel: undefined,
  ariaLabelledby: undefined,
  ariaValueText: undefined,
  max: undefined,
});
const attrs = useAttrs();

const resolvedMax = computed(() => normalizeProgressMax(props.max));
const resolvedValue = computed(() => normalizeProgressValue(props.value, resolvedMax.value));
const resolvedAriaLabel = computed(() => resolveTextValue(props.ariaLabel, "aria-label"));
const resolvedAriaLabelledby = computed(() =>
  resolveTextValue(props.ariaLabelledby, "aria-labelledby"),
);
const hasNormalizedNumericValue = computed(
  () =>
    (props.max !== undefined && !isValidProgressMax(props.max)) ||
    typeof props.value !== "number" ||
    !Number.isFinite(props.value) ||
    props.value < 0 ||
    props.value > resolvedMax.value,
);
const suppliedAriaValueText = computed(() =>
  resolveTextValue(props.ariaValueText, "aria-valuetext"),
);
const resolvedAriaValueText = computed(() =>
  hasNormalizedNumericValue.value ? undefined : suppliedAriaValueText.value,
);
const fillStyle = computed<ProgressIndicatorStyle>(() => ({
  "--basiq-progress-fill": `${(resolvedValue.value / resolvedMax.value) * 100}%`,
}));

const reservedAttributeNames = new Set([
  "ariahidden",
  "arialabel",
  "arialabelledby",
  "ariavaluemax",
  "ariavaluemin",
  "ariavaluenow",
  "ariavaluetext",
  "role",
  "tabindex",
]);

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => {
      if (key === "class" || key === "style") return false;
      return !reservedAttributeNames.has(key.replaceAll("-", "").toLowerCase());
    }),
  );
}

function resolveTextValue(propValue: string | undefined, attributeName: string) {
  const attributeValue = attrs[attributeName];
  const value = propValue ?? (typeof attributeValue === "string" ? attributeValue : undefined);

  return value?.trim() || undefined;
}

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  if (!resolvedAriaLabel.value && !resolvedAriaLabelledby.value) {
    console.warn(
      "[BasiQ UI] BasiqProgress requires an accessible name. Pass ariaLabel or ariaLabelledby.",
    );
  }

  if (props.max !== undefined && !isValidProgressMax(props.max)) {
    console.warn(
      "[BasiQ UI] BasiqProgress max must be a finite number greater than 0. It falls back to 100.",
    );
  }

  if (typeof props.value !== "number" || !Number.isFinite(props.value)) {
    console.warn("[BasiQ UI] BasiqProgress value must be a finite number. It falls back to 0.");
  } else if (props.value < 0 || props.value > resolvedMax.value) {
    console.warn("[BasiQ UI] BasiqProgress value must be between 0 and max. It is clamped.");
  }

  if (hasNormalizedNumericValue.value && suppliedAriaValueText.value) {
    console.warn(
      "[BasiQ UI] BasiqProgress omits ariaValueText when value or max is normalized to avoid inconsistent progress semantics.",
    );
  }
});
</script>

<template>
  <div
    v-bind="getForwardedAttrs()"
    :aria-label="resolvedAriaLabel"
    :aria-labelledby="resolvedAriaLabelledby"
    aria-valuemin="0"
    :aria-valuemax="resolvedMax"
    :aria-valuenow="resolvedValue"
    :aria-valuetext="resolvedAriaValueText"
    :class="[$style.root, $attrs.class]"
    role="progressbar"
    :style="$attrs.style"
  >
    <span aria-hidden="true" :class="$style.track" data-progress-track="">
      <span :class="$style.indicator" data-progress-indicator="" :style="fillStyle" />
    </span>
  </div>
</template>

<style module>
.root {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
}

.track {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: 100%;
  height: 8px;
  overflow: hidden;
  border: var(--basiq-border-width-default) solid var(--basiq-color-progress-track-border);
  border-radius: var(--basiq-radius-full);
  background: transparent;
}

.indicator {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  display: block;
  inline-size: var(--basiq-progress-fill);
  background: var(--basiq-color-progress-indicator);
}

@media (forced-colors: active) {
  .track {
    border-color: CanvasText;
    forced-color-adjust: none;
  }

  .indicator {
    background: Highlight;
    forced-color-adjust: none;
  }
}
</style>
