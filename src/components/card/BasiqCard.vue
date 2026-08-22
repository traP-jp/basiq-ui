<script setup lang="ts">
import { computed, useSlots } from "vue";

export interface BasiqCardProps {
  description?: string;
  title?: string;
}

const props = defineProps<BasiqCardProps>();
const slots = useSlots();

const hasHeader = computed(() => Boolean(slots.header || props.title || props.description));
const hasFooter = computed(() => Boolean(slots.footer));
</script>

<template>
  <div :class="$style.root">
    <div v-if="hasHeader" :class="$style.header">
      <slot v-if="$slots.header" name="header" />
      <template v-else>
        <div v-if="title" :class="$style.title">{{ title }}</div>
        <div v-if="description" :class="$style.description">{{ description }}</div>
      </template>
    </div>
    <div :class="[$style.body, hasHeader && $style['with-divider']]">
      <slot />
    </div>
    <div v-if="hasFooter" :class="[$style.footer, $style['with-divider']]">
      <slot name="footer" />
    </div>
  </div>
</template>

<style module>
.root {
  overflow: hidden;
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-card-background);
  font-family: var(--basiq-font-family-sans);
}

.header,
.body,
.footer {
  box-sizing: border-box;
  padding: var(--basiq-space-300) var(--basiq-space-400);
}

.body,
.footer {
  position: relative;
  font-size: 1rem;
  line-height: 1.5;
}

.with-divider::before {
  position: absolute;
  top: 0;
  right: var(--basiq-space-400);
  left: var(--basiq-space-400);
  height: var(--basiq-border-width-strong);
  background: var(--basiq-color-card-divider);
  content: "";
}

.title {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
}

.description {
  margin-top: var(--basiq-space-100);
  color: var(--basiq-color-content-subtle);
  font-size: 0.875rem;
  line-height: 1.5;
}
</style>
