<script setup lang="ts">
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "reka-ui";
import {
  computed,
  type Component,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  toRef,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
  watchEffect,
} from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";
import { useFormFieldControl } from "../form-field/useFormFieldControl";
import BasiqIcon from "../icon/BasiqIcon.vue";
import type { BasiqPortalTarget } from "../overlay/overlayContext";
import { useOverlayPortal } from "../overlay/useOverlayPortal";
import BasiqSelectCheckIcon from "./BasiqSelectCheckIcon.vue";
import BasiqSelectChevronIcon from "./BasiqSelectChevronIcon.vue";

defineOptions({ inheritAttrs: false });

export type { BasiqPortalTarget } from "../overlay/overlayContext";
export type BasiqSelectDirection = "ltr" | "rtl";
export type BasiqSelectSize = "lg" | "md" | "sm";

export interface BasiqSelectItemDefinition {
  description?: string;
  disabled?: boolean;
  /** A currentColor-compatible Vue component. The Select treats it as decorative. */
  icon?: Component;
  label: string;
  value: string;
}

export interface BasiqSelectProps {
  autocomplete?: string;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  dir?: BasiqSelectDirection;
  disabled?: boolean;
  form?: string;
  id?: string;
  invalid?: boolean;
  items: readonly (BasiqSelectItemDefinition | string)[];
  modelValue?: string | null;
  name?: string;
  open?: boolean;
  placeholder?: string;
  /** The Portal target resolved when the Select mounts. Keep it stable while mounted. */
  portalTarget?: BasiqPortalTarget;
  required?: boolean;
  size?: BasiqSelectSize;
}

export interface BasiqSelectEmits {
  change: [event: Event];
  "update:modelValue": [value: string | null];
  "update:open": [value: boolean];
}

export interface BasiqSelectItemSlotProps {
  index: number;
  item: BasiqSelectItemDefinition;
  selected: boolean;
}

export interface BasiqSelectValueSlotProps {
  item?: BasiqSelectItemDefinition;
  placeholder: string;
}

interface NormalizedSelectItem extends BasiqSelectItemDefinition {
  disabled: boolean;
  index: number;
}

const props = withDefaults(defineProps<BasiqSelectProps>(), {
  defaultOpen: false,
  disabled: false,
  invalid: undefined,
  modelValue: undefined,
  open: undefined,
  placeholder: "",
  portalTarget: undefined,
  required: undefined,
  size: "md",
});
const emit = defineEmits<BasiqSelectEmits>();
const slots = defineSlots<{
  item?: (props: BasiqSelectItemSlotProps) => unknown;
  value?: (props: BasiqSelectValueSlotProps) => unknown;
}>();

const attrs = useAttrs();
const componentInstance = getCurrentInstance();
const rootElement = useTemplateRef<HTMLDivElement>("root");
const triggerElement = useTemplateRef<HTMLButtonElement>("trigger");
const nativeSelectElement = useTemplateRef<HTMLSelectElement>("nativeSelect");
const baseId = `basiq-select-${useId()}`;
const isValueControlled = hasInitialProp("modelValue");
const isOpenControlled = hasInitialProp("open");
const resetValue =
  props.defaultValue !== undefined ? props.defaultValue : (props.modelValue ?? null);
const internalValue = ref<string | null>(resetValue);
const internalOpen = ref(props.defaultOpen);
const inheritedDirection = ref<BasiqSelectDirection>();
const nativeInvalid = ref(false);
const resolvedDirection = computed(() => props.dir ?? inheritedDirection.value);
const currentValue = computed(() =>
  isValueControlled ? (props.modelValue ?? null) : internalValue.value,
);
const currentOpen = computed(() => (isOpenControlled ? (props.open ?? false) : internalOpen.value));
const normalizedItems = computed<NormalizedSelectItem[]>(() =>
  props.items.flatMap((item, index) => {
    const normalized =
      typeof item === "string"
        ? { disabled: false, index, label: item, value: item }
        : { ...item, disabled: item.disabled ?? false, index };

    // Reka reserves the empty string for clearing the selection and throws for such items.
    return normalized.value === "" ? [] : [normalized];
  }),
);
const selectedItem = computed(() =>
  normalizedItems.value.find((item) => item.value === currentValue.value),
);
const { resolveAriaDescribedBy, resolveAriaInvalid, resolveInvalid, resolvedId, resolvedRequired } =
  useFormFieldControl({ componentName: "BasiqSelect", props });
const portalTarget = toRef(props, "portalTarget");
const { contentStyle, target, themeMode } = useOverlayPortal({
  open: currentOpen,
  portalTarget,
});
let dispatchingChange = false;
let typeaheadSearch = "";
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
let skipCloseAutoFocus = false;

watch(
  [currentValue, resolvedRequired],
  ([value, required]) => {
    if (!required || value !== null) nativeInvalid.value = false;
  },
  { flush: "sync" },
);

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  const values = props.items.map((item) => (typeof item === "string" ? item : item.value));
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);

  if (values.includes("")) {
    console.warn(
      "[BasiQ UI] BasiqSelect item values must not be empty strings. Use null for an empty selection.",
    );
  }

  if (duplicate !== undefined) {
    console.warn(`[BasiQ UI] BasiqSelect item values must be unique: "${duplicate}".`);
  }

  const emptyLabel = props.items.find((item) =>
    typeof item === "string" ? item.trim() === "" : item.label.trim() === "",
  );
  if (emptyLabel !== undefined) {
    console.warn("[BasiQ UI] BasiqSelect item labels must be non-empty strings.");
  }

  if (currentValue.value !== null && selectedItem.value === undefined) {
    console.warn(
      `[BasiQ UI] BasiqSelect value ${JSON.stringify(currentValue.value)} does not match an item.`,
    );
  }

  if (
    resolvedRequired.value &&
    !props.disabled &&
    normalizedItems.value.every((item) => item.disabled)
  ) {
    console.warn(
      "[BasiQ UI] BasiqSelect requires at least one enabled item when required is true.",
    );
  }

  if (hasCurrentProp("modelValue") !== isValueControlled) {
    console.warn(
      "[BasiQ UI] BasiqSelect must not switch between controlled and uncontrolled value state.",
    );
  }

  if (hasCurrentProp("open") !== isOpenControlled) {
    console.warn(
      "[BasiQ UI] BasiqSelect must not switch between controlled and uncontrolled open state.",
    );
  }
});

onMounted(() => {
  const root = rootElement.value;
  if (root) {
    inheritedDirection.value = getComputedStyle(root).direction === "rtl" ? "rtl" : "ltr";
  }
  syncNativeSelect();
  document.addEventListener("reset", handleDocumentReset, true);

  if (
    import.meta.env.DEV &&
    attrs["aria-label"] === undefined &&
    attrs["aria-labelledby"] === undefined &&
    triggerElement.value?.labels?.length === 0
  ) {
    console.warn(
      "[BasiQ UI] BasiqSelect requires an accessible name. Wrap it in BasiqFormField or set aria-label/aria-labelledby.",
    );
  }
});
onUpdated(() => {
  syncNativeSelect();
});
onBeforeUnmount(() => {
  document.removeEventListener("reset", handleDocumentReset, true);
  if (typeaheadTimer !== undefined) clearTimeout(typeaheadTimer);
});

function setValue(value: string | null) {
  if (!isValueControlled) internalValue.value = value;
  emit("update:modelValue", value);
}

function handleValueChange(value: unknown) {
  if (typeof value !== "string") return;

  nativeInvalid.value = false;
  setValue(value);
  dispatchNativeChange(value);
  queueMicrotask(syncNativeSelect);
}

function setOpen(value: boolean) {
  if (!isOpenControlled) internalOpen.value = value;
  emit("update:open", value);
}

function dispatchNativeChange(value: string) {
  const select = nativeSelectElement.value;
  if (!select) return;

  select.value = value;
  const event = new Event("change", { bubbles: true });
  dispatchingChange = true;
  try {
    select.dispatchEvent(event);
  } finally {
    dispatchingChange = false;
  }
}

function handleNativeInput(event: Event) {
  const value = (event.currentTarget as HTMLSelectElement).value || null;
  nativeInvalid.value = false;
  setValue(value);
  queueMicrotask(syncNativeSelect);
}

function handleNativeChange(event: Event) {
  if (dispatchingChange) {
    emit("change", event);
    return;
  }

  const value = (event.currentTarget as HTMLSelectElement).value || null;
  nativeInvalid.value = false;
  setValue(value);
  emit("change", event);
  queueMicrotask(syncNativeSelect);
}

function handleNativeInvalid() {
  nativeInvalid.value = true;
}

function handleNativeFocus() {
  void nextTick(() => triggerElement.value?.focus());
}

function syncNativeSelect() {
  const select = nativeSelectElement.value;
  if (!select) return;

  select.value = currentValue.value ?? "";
}

function handleDocumentReset(event: Event) {
  if (event.target !== nativeSelectElement.value?.form) return;

  queueMicrotask(() => {
    if (event.defaultPrevented) {
      syncNativeSelect();
      return;
    }

    nativeInvalid.value = false;
    if (isValueControlled) emit("update:modelValue", resetValue);
    else internalValue.value = resetValue;
    syncNativeSelect();
  });
}

function handleTriggerKeydownCapture(event: KeyboardEvent) {
  if (
    currentOpen.value ||
    event.isComposing ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.key.length !== 1 ||
    (event.key === " " && typeaheadSearch === "")
  ) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  typeaheadSearch += event.key;
  if (typeaheadTimer !== undefined) clearTimeout(typeaheadTimer);
  typeaheadTimer = setTimeout(() => {
    typeaheadSearch = "";
    typeaheadTimer = undefined;
  }, 1000);

  const characters = Array.from(typeaheadSearch);
  const repeatedCharacter = characters.every((character) => character === characters[0]);
  const query = repeatedCharacter ? event.key : typeaheadSearch;
  const enabledItems = normalizedItems.value.filter((item) => !item.disabled);
  const currentIndex = enabledItems.findIndex((item) => item.value === currentValue.value);
  const orderedItems = [
    ...enabledItems.slice(currentIndex + 1),
    ...enabledItems.slice(0, currentIndex + 1),
  ];
  const normalizedQuery = query.toLocaleLowerCase();
  let match = orderedItems.find((item) =>
    item.label.toLocaleLowerCase().startsWith(normalizedQuery),
  );

  if (!match && query !== event.key) {
    typeaheadSearch = event.key;
    const fallbackQuery = event.key.toLocaleLowerCase();
    match = orderedItems.find((item) => item.label.toLocaleLowerCase().startsWith(fallbackQuery));
  }

  if (match && match.value !== currentValue.value) handleValueChange(match.value);
}

function handleContentKeydownCapture(event: KeyboardEvent) {
  if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey) return;

  const activeElement = document.activeElement;
  const value =
    activeElement instanceof HTMLElement ? activeElement.dataset.basiqSelectValue : undefined;

  event.preventDefault();
  event.stopImmediatePropagation();
  if (value !== undefined && value !== currentValue.value) handleValueChange(value);
  skipCloseAutoFocus = true;
  setOpen(false);
  focusAdjacentToTrigger(event.shiftKey);
  void nextTick(() => {
    if (currentOpen.value) skipCloseAutoFocus = false;
  });
}

function handleCloseAutoFocus(event: Event) {
  if (!skipCloseAutoFocus) return;

  skipCloseAutoFocus = false;
  event.preventDefault();
}

function focusAdjacentToTrigger(backwards: boolean) {
  const trigger = triggerElement.value;
  if (!trigger) return;

  const dialog = trigger.closest<HTMLElement>('[role="dialog"][aria-modal="true"]');
  const candidateRoot: ParentNode = dialog ?? document;

  const selectors = [
    "a[href]",
    "area[href]",
    "button:not(:disabled)",
    "input:not(:disabled):not([type='hidden'])",
    "select:not(:disabled)",
    "textarea:not(:disabled)",
    "iframe",
    "object",
    "embed",
    "[contenteditable='true']",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  const elements = Array.from(candidateRoot.querySelectorAll<HTMLElement>(selectors))
    .filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(":disabled") &&
        element.getClientRects().length > 0 &&
        element.closest("[inert]") === null,
    )
    .map((element, index) => ({ element, index }))
    .sort((left, right) => {
      const leftTabIndex = left.element.tabIndex;
      const rightTabIndex = right.element.tabIndex;
      if (leftTabIndex > 0 || rightTabIndex > 0) {
        if (leftTabIndex === 0) return 1;
        if (rightTabIndex === 0) return -1;
        if (leftTabIndex !== rightTabIndex) return leftTabIndex - rightTabIndex;
      }
      return left.index - right.index;
    })
    .map(({ element }) => element);
  const triggerIndex = elements.indexOf(trigger);
  if (triggerIndex < 0) {
    trigger.blur();
    return;
  }

  const candidates = backwards
    ? elements.slice(0, triggerIndex).reverse()
    : elements.slice(triggerIndex + 1);
  if (dialog) {
    candidates.push(
      ...(backwards ? elements.slice(triggerIndex + 1).reverse() : elements.slice(0, triggerIndex)),
    );
  }

  for (const candidate of candidates) {
    const activeElement = document.activeElement;
    candidate.focus();
    if (document.activeElement !== activeElement) return;
  }

  trigger.blur();
}

function getForwardedAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) =>
        key !== "aria-autocomplete" &&
        key !== "aria-controls" &&
        key !== "aria-describedby" &&
        key !== "aria-expanded" &&
        key !== "aria-invalid" &&
        key !== "aria-required" &&
        key !== "class" &&
        key !== "data-disabled" &&
        key !== "data-placeholder" &&
        key !== "data-state" &&
        key !== "role" &&
        key !== "style",
    ),
  );
}

function hasCurrentProp(name: string) {
  const vnodeProps = componentInstance?.vnode.props ?? {};
  const kebabName = name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);

  return (
    Object.prototype.hasOwnProperty.call(vnodeProps, name) ||
    Object.prototype.hasOwnProperty.call(vnodeProps, kebabName)
  );
}

function resolveTriggerAriaInvalid() {
  return nativeInvalid.value ? "true" : resolveAriaInvalid();
}

function resolveItemDescriptionId(item: NormalizedSelectItem) {
  return `${baseId}-item-${item.index}-description`;
}

function resolveSlotItem(item: NormalizedSelectItem): BasiqSelectItemDefinition {
  return item;
}
</script>

<template>
  <div ref="root" :class="[$style.root, $attrs.class]" :dir="dir" :style="$attrs.style">
    <SelectRoot
      :dir="resolvedDirection"
      :disabled="disabled"
      :model-value="currentValue"
      :open="currentOpen"
      :required="resolvedRequired"
      @update:model-value="handleValueChange"
      @update:open="setOpen"
    >
      <SelectTrigger as-child>
        <button
          ref="trigger"
          v-bind="getForwardedAttrs()"
          :id="resolvedId"
          :class="$style.trigger"
          :aria-describedby="resolveAriaDescribedBy()"
          :aria-invalid="resolveTriggerAriaInvalid()"
          :data-invalid="resolveInvalid() || nativeInvalid ? '' : undefined"
          :data-size="size"
          type="button"
          @keydown.capture="handleTriggerKeydownCapture"
        >
          <SelectValue as-child>
            <span :class="$style.value">
              <slot
                name="value"
                :item="selectedItem ? resolveSlotItem(selectedItem) : undefined"
                :placeholder="placeholder"
              >
                <template v-if="selectedItem">
                  <BasiqIcon
                    v-if="selectedItem.icon"
                    :class="$style['value-icon']"
                    :icon="selectedItem.icon"
                  />
                  <span :class="$style['value-label']">{{ selectedItem.label }}</span>
                </template>
                <span v-else :class="$style.placeholder">{{ placeholder }}</span>
              </slot>
            </span>
          </SelectValue>

          <BasiqIcon :class="$style.chevron" :icon="BasiqSelectChevronIcon" />
        </button>
      </SelectTrigger>

      <SelectPortal defer :to="target">
        <SelectContent
          :class="$style.content"
          :data-basiq-theme="themeMode"
          :data-size="size"
          :side-offset="4"
          :style="contentStyle"
          align="start"
          position="popper"
          @close-auto-focus="handleCloseAutoFocus"
          @keydown.capture="handleContentKeydownCapture"
        >
          <SelectViewport :class="$style.viewport">
            <SelectItem
              v-for="item in normalizedItems"
              :key="`${item.value}-${item.index}`"
              :class="$style.item"
              :aria-describedby="item.description ? resolveItemDescriptionId(item) : undefined"
              :data-basiq-select-value="item.value"
              :disabled="item.disabled"
              :text-value="item.label"
              :value="item.value"
            >
              <template v-if="slots.item">
                <SelectItemText :class="$style['visually-hidden']">
                  {{ item.label }}
                </SelectItemText>
                <span :class="$style['custom-item']">
                  <slot
                    name="item"
                    :index="item.index"
                    :item="resolveSlotItem(item)"
                    :selected="currentValue === item.value"
                  />
                </span>
                <span
                  v-if="item.description"
                  :id="resolveItemDescriptionId(item)"
                  :class="$style['visually-hidden']"
                >
                  {{ item.description }}
                </span>
              </template>

              <template v-else>
                <span v-if="item.icon" :class="$style.leading">
                  <BasiqIcon :class="$style['item-icon']" :icon="item.icon" />
                </span>
                <span :class="$style['item-content']">
                  <SelectItemText :class="$style['item-label']">
                    {{ item.label }}
                  </SelectItemText>
                  <span
                    v-if="item.description"
                    :id="resolveItemDescriptionId(item)"
                    :class="$style['item-description']"
                  >
                    {{ item.description }}
                  </span>
                </span>
              </template>

              <SelectItemIndicator :class="$style.indicator">
                <BasiqIcon :class="$style['indicator-icon']" :icon="BasiqSelectCheckIcon" />
              </SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <select
      ref="nativeSelect"
      :class="$style['native-select']"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :form="form"
      :name="name"
      :required="resolvedRequired"
      :value="currentValue ?? ''"
      aria-hidden="true"
      tabindex="-1"
      @change="handleNativeChange"
      @focus="handleNativeFocus"
      @input="handleNativeInput"
      @invalid="handleNativeInvalid"
    >
      <option value="" :selected="currentValue === null" />
      <option
        v-for="item in normalizedItems"
        :key="`${item.value}-${item.index}`"
        :disabled="item.disabled"
        :selected="currentValue === item.value"
        :value="item.value"
      >
        {{ item.label }}
      </option>
    </select>
  </div>
</template>

<style module>
.root {
  position: relative;
  width: 100%;
  min-width: 0;
  font-family: inherit;
}

.trigger {
  box-sizing: border-box;
  display: flex;
  gap: var(--basiq-space-200);
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 40px;
  padding: 0 var(--basiq-space-300);
  border: var(--basiq-border-width-strong) solid var(--basiq-color-select-trigger-border);
  border-radius: var(--basiq-radius-sm);
  color: var(--basiq-color-select-trigger-content);
  background: var(--basiq-color-select-trigger-background);
  font: inherit;
  font-size: 1rem;
  line-height: 1.5;
  text-align: start;
  cursor: pointer;
  appearance: none;
}

.trigger[data-size="sm"] {
  height: 36px;
}

.trigger[data-size="lg"] {
  height: 44px;
}

.trigger:focus-visible {
  outline: var(--basiq-focus-ring-width) solid var(--basiq-color-focus-ring);
  outline-offset: var(--basiq-focus-ring-gap);
}

.trigger[data-invalid] {
  border-color: var(--basiq-color-select-trigger-border-invalid);
}

.trigger:disabled {
  border-color: var(--basiq-color-select-trigger-border-disabled);
  color: var(--basiq-color-content-disabled);
  background: var(--basiq-color-select-trigger-background-disabled);
  cursor: not-allowed;
}

.trigger:hover:not(:disabled, [data-invalid]) {
  border-color: var(--basiq-color-select-trigger-border-hover);
}

.value {
  display: flex;
  flex: 1 1 auto;
  gap: var(--basiq-space-200);
  align-items: center;
  min-width: 0;
  pointer-events: none;
}

.value-label,
.placeholder {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder {
  color: var(--basiq-color-select-trigger-placeholder);
}

.value-icon,
.item-icon,
.indicator-icon,
.chevron {
  width: 20px;
  height: 20px;
}

.value-icon,
.leading,
.indicator,
.chevron {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
}

.value-icon,
.leading,
.chevron {
  color: var(--basiq-color-select-icon);
}

.chevron {
  transition: transform var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.trigger[data-state="open"] .chevron {
  transform: rotate(180deg);
}

.content {
  box-sizing: border-box;
  width: max-content;
  min-width: var(--reka-select-trigger-width);
  max-width: min(var(--reka-select-content-available-width), calc(100vw - var(--basiq-space-400)));
  max-height: min(var(--reka-select-content-available-height), 20rem);
  overflow: hidden;
  border: var(--basiq-border-width-default) solid var(--basiq-color-select-content-border);
  border-radius: var(--basiq-radius-md);
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-select-content-background);
  box-shadow: 0 8px 24px rgb(13 18 23 / 18%);
  font-family: var(--basiq-font-family-sans);
  transform-origin: var(--reka-select-content-transform-origin);
  animation: basiq-select-content-in var(--basiq-duration-overlay) var(--basiq-easing-standard);
}

.content[data-state="closed"] {
  animation-name: basiq-select-content-out;
}

.viewport {
  box-sizing: border-box;
  padding: var(--basiq-space-100);
}

.item {
  box-sizing: border-box;
  position: relative;
  display: flex;
  gap: var(--basiq-space-200);
  align-items: center;
  min-width: 0;
  min-height: 40px;
  padding: var(--basiq-space-200) var(--basiq-space-300);
  padding-inline-end: calc(var(--basiq-space-300) + 20px + var(--basiq-space-200));
  border-radius: var(--basiq-radius-sm);
  outline: none;
  cursor: pointer;
  user-select: none;
}

.content[data-size="sm"] .item {
  min-height: 36px;
}

.content[data-size="lg"] .item {
  min-height: 44px;
}

.item[data-highlighted] {
  background: var(--basiq-color-select-item-background-highlighted);
}

.item[data-state="checked"] {
  color: var(--basiq-color-select-item-content-selected);
}

.item[data-disabled] {
  color: var(--basiq-color-content-disabled);
  cursor: not-allowed;
}

.item-content {
  display: grid;
  flex: 1 1 auto;
  gap: var(--basiq-space-100);
  min-width: 0;
}

.item-label,
.item-description {
  min-width: 0;
  overflow-wrap: anywhere;
}

.item-label {
  font-size: 1rem;
  line-height: 1.5;
}

.item-description {
  color: var(--basiq-color-content-subtle);
  font-size: 0.875rem;
  line-height: 1.4;
}

.item[data-highlighted] .item-description {
  color: var(--basiq-color-content-default);
}

.item[data-disabled] .item-description {
  color: var(--basiq-color-content-disabled);
}

.custom-item {
  flex: 1 1 auto;
  min-width: 0;
}

.indicator {
  position: absolute;
  inset-inline-end: var(--basiq-space-300);
  color: var(--basiq-color-select-item-indicator);
}

.native-select,
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  border: 0;
  white-space: nowrap;
}

.native-select {
  inset-block-start: 0;
  inset-inline-start: 0;
}

@keyframes basiq-select-content-in {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
}

@keyframes basiq-select-content-out {
  to {
    opacity: 0;
    transform: scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .content,
  .chevron {
    animation: none;
    transition: none;
  }
}

@media (forced-colors: active) {
  .trigger:focus-visible {
    outline-color: Highlight;
  }

  .trigger[data-invalid] {
    border-color: Mark;
  }

  .item[data-highlighted] {
    outline: 1px solid Highlight;
  }

  .item[data-state="checked"] .indicator {
    color: Highlight;
  }
}
</style>
