<template>
  <div :class="$style.root">
    <slot />
  </div>
</template>

<style module>
.root {
  box-sizing: border-box;
  width: 100%;
  max-width: var(--basiq-layout-container-max-width);
  margin-inline: auto;
  padding-inline: var(--basiq-layout-container-padding-inline);
}
</style>
