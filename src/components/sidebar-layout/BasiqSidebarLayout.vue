<template>
  <div :class="$style.root">
    <div :class="$style.sidebar">
      <slot name="sidebar" />
    </div>
    <div :class="$style.main">
      <slot />
    </div>
  </div>
</template>

<style module>
.root {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: 100%;
  padding-left: var(--basiq-layout-sidebar-width);
  min-width: 0;
  min-height: 100%;
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-surface-base);
  font-family: var(--basiq-font-family-sans);
}

.sidebar,
.main {
  box-sizing: border-box;
  min-width: 0;
}

.sidebar {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: var(--basiq-layout-sidebar-width);
  background: var(--basiq-color-surface-container);
}

.main {
  width: 100%;
  min-height: 100%;
  background: var(--basiq-color-surface-base);
}
</style>
