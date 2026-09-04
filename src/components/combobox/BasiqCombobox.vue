<script
  setup
  lang="ts"
  generic="
    Value extends BasiqComboboxValue = BasiqComboboxValue,
    Item extends BasiqComboboxItem<Value> = BasiqComboboxItem<Value>
  "
>
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxViewport,
} from "reka-ui";
import {
  computed,
  nextTick,
  onMounted,
  ref,
  useAttrs,
  useTemplateRef,
  watch,
  watchEffect,
} from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";
import { useFormFieldControl } from "../form-field/useFormFieldControl";
import BasiqIcon from "../icon/BasiqIcon.vue";
import type { BasiqPortalTarget } from "../overlay/overlayContext";
import { useOverlayPortal } from "../overlay/useOverlayPortal";
import BasiqCheckIcon from "../selection-input/BasiqCheckIcon.vue";
import BasiqChevronDownIcon from "../selection-input/BasiqChevronDownIcon.vue";
import BasiqSelectionControl from "../selection-input/BasiqSelectionControl.vue";
import BasiqSelectionTag from "../selection-input/BasiqSelectionTag.vue";
import {
  resolveSelectionInput,
  useSelectionFormReset,
  useSelectionState,
} from "../selection-input/useSelectionState";
import type {
  BasiqComboboxEmits,
  BasiqComboboxItem,
  BasiqComboboxItemSlotProps,
  BasiqComboboxProps,
  BasiqComboboxSelectedSlotProps,
  BasiqComboboxValue,
} from "./BasiqCombobox.types";

defineOptions({ inheritAttrs: false });

const props = defineProps<BasiqComboboxProps<Value, Item>>();
const emit = defineEmits<BasiqComboboxEmits<Value>>();
const slots = defineSlots<{
  create?: (props: { query: string }) => unknown;
  empty?: () => unknown;
  item?: (props: BasiqComboboxItemSlotProps<Value, Item>) => unknown;
  "item-leading"?: (props: BasiqComboboxItemSlotProps<Value, Item>) => unknown;
  "item-trailing"?: (props: BasiqComboboxItemSlotProps<Value, Item>) => unknown;
  loading?: () => unknown;
  "selected-leading"?: (props: BasiqComboboxSelectedSlotProps<Value, Item>) => unknown;
}>();
const attrs = useAttrs();
const inputElement = useTemplateRef<HTMLInputElement>("input");
const contentElement = useTemplateRef<HTMLElement | { $el: HTMLElement }>("content");
const comboboxRoot = useTemplateRef<{ highlightFirstItem?: () => void }>("root");
const contentId = ref<string>();
const multiple = computed(() => props.multiple === true);
const disabled = computed(() => props.disabled === true);
const readonly = computed(() => props.readonly === true);
const loading = computed(() => props.loading === true);
// `filter?: false | function` is compiled as a Boolean prop, so Vue resolves an absent value to
// false. Presence is required to distinguish the default Reka filter from explicit external mode.
const hasFilterOverride = hasInitialProp("filter");
// Creatable owns its composite result list so its newly-added create option is not skipped by
// ComboboxContent's internal filter memoization.
const useRekaFilter = computed(() => !hasFilterOverride && props.creatable !== true);
const cloneValue = (value: Value | readonly Value[] | null): Value | Value[] | null => {
  if (Array.isArray(value)) return [...value];
  return value as Value | null;
};
const { currentValue, reset, setValue } = useSelectionState<Value | Value[] | null>({
  clone: cloneValue,
  defaultValue: () =>
    props.defaultValue === undefined ? undefined : cloneValue(props.defaultValue),
  emitModelValue: (value) => emit("update:modelValue", value),
  fallback: () => (multiple.value ? [] : null),
  modelValue: () => (props.modelValue === undefined ? undefined : cloneValue(props.modelValue)),
});
const isSearchControlled = hasInitialProp("searchTerm");
const internalSearchTerm = ref("");
const inputValue = ref(props.searchTerm ?? "");
const isUserInputting = ref(false);
const currentSearchTerm = computed(() =>
  isSearchControlled ? (props.searchTerm ?? "") : internalSearchTerm.value,
);
const isOpenControlled = hasInitialProp("open");
const internalOpen = ref(props.defaultOpen ?? false);
const currentOpen = computed(() =>
  readonly.value ? false : isOpenControlled ? props.open === true : internalOpen.value,
);
const { resolveAriaDescribedBy, resolveAriaInvalid, resolveInvalid, resolvedId, resolvedRequired } =
  useFormFieldControl({ componentName: "BasiqCombobox", props });
const associatedLabel = ref<string>();
const listboxAriaLabelledBy = computed(() => {
  const value = attrs["aria-labelledby"];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
});
const listboxAriaLabel = computed(() => {
  if (listboxAriaLabelledBy.value) return undefined;

  const explicitLabel = attrs["aria-label"];
  if (typeof explicitLabel === "string" && explicitLabel.trim() !== "") return explicitLabel;

  return associatedLabel.value;
});

useSelectionFormReset(inputElement, reset);

function syncAssociatedLabel() {
  const input = resolveSelectionInput(inputElement.value);
  const labels = input?.labels;

  if (!labels) {
    associatedLabel.value = undefined;
    return;
  }

  const label = Array.from(labels)
    .map((element) => element.textContent?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  associatedLabel.value = label || undefined;
}

async function syncContentId() {
  await nextTick();
  const content = contentElement.value;
  let element: HTMLElement | undefined;

  if (typeof HTMLElement !== "undefined" && content instanceof HTMLElement) {
    element = content;
  } else if (content && "$el" in content) {
    element = content.$el;
  }

  contentId.value = element?.id || undefined;
}

onMounted(() => {
  syncAssociatedLabel();
  void syncContentId();
});

watch(
  () => props.searchTerm,
  (query) => {
    if (isSearchControlled && isUserInputting.value) inputValue.value = query ?? "";
  },
);

const availableItems = computed(() => props.items.filter((item) => item.value !== ""));
const itemByValue = computed(
  () => new Map(availableItems.value.map((item) => [item.value, item] as const)),
);
const selectedValues = computed<Value[]>(() => {
  if (multiple.value) return Array.isArray(currentValue.value) ? currentValue.value : [];
  return currentValue.value === null || Array.isArray(currentValue.value)
    ? []
    : [currentValue.value];
});
const normalizedQuery = computed(() => currentSearchTerm.value.trim());
const filterQuery = computed(() => (isUserInputting.value ? normalizedQuery.value : ""));
const filteredItems = computed(() => {
  if (filterQuery.value === "") return availableItems.value;

  if (typeof props.filter === "function") {
    const filter = props.filter;
    return availableItems.value.filter((item) => filter(item, currentSearchTerm.value));
  }

  if (hasFilterOverride) return availableItems.value;

  const query = normalizeForMatch(filterQuery.value);
  return availableItems.value.filter((item) =>
    normalizeForMatch(`${item.label} ${item.description ?? ""}`).includes(query),
  );
});
const renderedItems = computed(() =>
  useRekaFilter.value ? availableItems.value : filteredItems.value,
);
function normalizeForMatch(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
}
const normalizedMatchQuery = computed(() => normalizeForMatch(normalizedQuery.value));
const canCreate = computed(
  () =>
    props.creatable === true &&
    !disabled.value &&
    !readonly.value &&
    !loading.value &&
    isUserInputting.value &&
    normalizedQuery.value !== "" &&
    !availableItems.value.some(
      (item) =>
        normalizeForMatch(item.label) === normalizedMatchQuery.value ||
        normalizeForMatch(String(item.value)) === normalizedMatchQuery.value,
    ),
);
const shouldRenderEmpty = computed(() =>
  useRekaFilter.value ? !canCreate.value : renderedItems.value.length === 0 && !canCreate.value,
);
const renderedOptionSignature = computed(() => [
  ...renderedItems.value.map((item) => `${typeof item.value}:${String(item.value)}`),
  canCreate.value ? `create:${normalizedQuery.value}` : "",
]);
const hasPortalOverride = hasInitialProp("portal");
const portalDisabled = computed(() => hasPortalOverride && props.portal === false);
const requestedPortalTarget = computed<BasiqPortalTarget | undefined>(() =>
  typeof props.portal === "string" ||
  (typeof HTMLElement !== "undefined" && props.portal instanceof HTMLElement)
    ? props.portal
    : undefined,
);
// `portal` follows the overlay foundation's mount-stable target contract. Avoid creating an empty
// overlay host for the explicitly-inline case used by embedded layouts and component tests.
const overlayPortal = portalDisabled.value
  ? undefined
  : useOverlayPortal({ open: currentOpen, portalTarget: requestedPortalTarget });
const portalTarget = computed(() => overlayPortal?.target.value ?? requestedPortalTarget.value);
const portalContentStyle = computed(() =>
  portalDisabled.value ? undefined : overlayPortal?.contentStyle.value,
);
const portalThemeMode = computed(() =>
  portalDisabled.value ? undefined : overlayPortal?.themeMode.value,
);

watchEffect(() => {
  if (!import.meta.env.DEV) return;

  const keys = props.items.map((item) => `${typeof item.value}:${String(item.value)}`);
  const duplicateKey = keys.find((key, index) => keys.indexOf(key) !== index);

  if (duplicateKey !== undefined) {
    console.warn(`[BasiQ UI] BasiqCombobox item values must be unique: "${duplicateKey}".`);
  }

  if (props.items.some((item) => item.value === "")) {
    console.warn(
      "[BasiQ UI] BasiqCombobox does not support an empty string item value because it represents no selection.",
    );
  }

  if (multiple.value && typeof props.getRemoveLabel !== "function") {
    console.warn(
      "[BasiQ UI] A multiple BasiqCombobox requires getRemoveLabel for accessible tag removal.",
    );
  }

  if (props.creatable === true && typeof props.getCreateLabel !== "function") {
    console.warn(
      "[BasiQ UI] A creatable BasiqCombobox requires getCreateLabel for its create option.",
    );
  }
});

function isSelected(value: Value) {
  return selectedValues.value.includes(value);
}

function getItemLabel(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return itemByValue.value.get(value as Value)?.label ?? String(value);
}

function handleModelUpdate(value: unknown) {
  if (disabled.value || readonly.value) return;

  const nextValue = multiple.value
    ? Array.isArray(value)
      ? (value.filter((item) => typeof item === "string" || typeof item === "number") as Value[])
      : []
    : typeof value === "string" || typeof value === "number"
      ? (value as Value)
      : null;

  setValue(nextValue);
  isUserInputting.value = false;
  handleSearchTermUpdate("");
  if (multiple.value) inputValue.value = "";
}

function handleSearchTermUpdate(query: string) {
  if (query === currentSearchTerm.value) return;
  if (!isSearchControlled) internalSearchTerm.value = query;
  emit("update:searchTerm", query);
}

function handleOpenUpdate(open: boolean) {
  if (readonly.value && open) return;
  if (!isOpenControlled) internalOpen.value = open;
  if (!open) {
    isUserInputting.value = false;
    handleSearchTermUpdate("");
    setTimeout(() => {
      resolveSelectionInput(inputElement.value)?.removeAttribute("aria-activedescendant");
    });
  } else {
    nextTick(syncAssociatedLabel);
    void syncContentId();
  }
  emit("update:open", open);
}

function handleInput(event: Event) {
  isUserInputting.value = true;
  handleSearchTermUpdate((event.target as HTMLInputElement).value);

  if (isSearchControlled) {
    nextTick(() => {
      inputValue.value = props.searchTerm ?? "";
    });
  }
}

function handleInputValueUpdate(value: string) {
  inputValue.value = value;
}

function selectCurrentSingleLabel() {
  if (multiple.value || disabled.value || readonly.value || isUserInputting.value) return;

  const selectedValue = selectedValues.value[0];
  if (selectedValue === undefined) return;

  nextTick(() => {
    const input = resolveSelectionInput(inputElement.value);
    if (
      input !== null &&
      document.activeElement === input &&
      input.value === getItemLabel(selectedValue)
    ) {
      input.select();
    }
  });
}

function handleInputFocus(event: FocusEvent) {
  emit("focus", event);
  selectCurrentSingleLabel();
}

function clearDisconnectedActiveDescendant() {
  if (typeof document === "undefined") return;

  const input = resolveSelectionInput(inputElement.value);
  const activeDescendant = input?.getAttribute("aria-activedescendant");
  if (activeDescendant && document.getElementById(activeDescendant) === null) {
    input?.removeAttribute("aria-activedescendant");
  }
}

watch(
  [currentOpen, currentSearchTerm, renderedOptionSignature],
  async ([open]) => {
    if (!open || !isUserInputting.value) return;

    await nextTick();
    await nextTick();
    if (!useRekaFilter.value) comboboxRoot.value?.highlightFirstItem?.();
    await nextTick();
    clearDisconnectedActiveDescendant();
  },
  { flush: "post" },
);

function removeValue(value: Value) {
  if (!multiple.value || disabled.value || readonly.value) return;
  setValue(selectedValues.value.filter((selectedValue) => selectedValue !== value));
  resolveSelectionInput(inputElement.value)?.focus();
}

function handleControlClick() {
  if (disabled.value) return;

  const input = resolveSelectionInput(inputElement.value);
  input?.focus();
  if (!readonly.value) input?.click();
}

function handleInputKeydown(event: KeyboardEvent) {
  if (
    multiple.value &&
    event.key === "Backspace" &&
    !event.isComposing &&
    currentSearchTerm.value === "" &&
    selectedValues.value.length > 0
  ) {
    removeValue(selectedValues.value.at(-1)!);
    event.preventDefault();
  }
}

function handleCreate(event: Event) {
  event.preventDefault();
  const query = normalizedQuery.value;

  if (!canCreate.value || query === "") return;
  emit("create", query);
}
</script>

<template>
  <ComboboxRoot
    ref="root"
    :model-value="currentValue"
    :multiple="multiple"
    :disabled="disabled"
    :open="currentOpen"
    :open-on-click="!readonly"
    :open-on-focus="openOnFocus === true && !readonly"
    :ignore-filter="!useRekaFilter"
    :reset-search-term-on-blur="true"
    :reset-search-term-on-select="true"
    @update:model-value="handleModelUpdate"
    @update:open="handleOpenUpdate"
  >
    <ComboboxAnchor as-child>
      <BasiqSelectionControl
        :disabled="disabled"
        :invalid="resolveInvalid()"
        :readonly="readonly"
        @click.self="handleControlClick"
      >
        <template v-if="multiple">
          <BasiqSelectionTag
            v-for="value in selectedValues"
            :key="`${typeof value}:${value}`"
            :disabled="disabled"
            :icon="slots['selected-leading'] ? undefined : itemByValue.get(value)?.icon"
            :label="getItemLabel(value)"
            :readonly="readonly"
            :remove-label="getRemoveLabel?.(itemByValue.get(value), value) ?? getItemLabel(value)"
            @remove="removeValue(value)"
          >
            <template v-if="slots['selected-leading']" #leading>
              <slot name="selected-leading" :item="itemByValue.get(value)" :value="value" />
            </template>
          </BasiqSelectionTag>
        </template>
        <ComboboxInput
          ref="input"
          v-bind="attrs"
          data-basiq-selection-input
          :id="resolvedId"
          :aria-describedby="resolveAriaDescribedBy()"
          :aria-controls="contentId"
          :aria-invalid="resolveAriaInvalid()"
          :aria-required="resolvedRequired || undefined"
          :disabled="disabled"
          :display-value="multiple ? undefined : getItemLabel"
          :form="form"
          :model-value="inputValue"
          :placeholder="placeholder"
          :required="resolvedRequired && selectedValues.length === 0"
          :readonly="readonly"
          @blur="emit('blur', $event)"
          @click="selectCurrentSingleLabel"
          @focus="handleInputFocus"
          @input="handleInput"
          @keydown="handleInputKeydown"
          @update:model-value="handleInputValueUpdate"
        />
        <BasiqIcon :class="$style.chevron" :icon="BasiqChevronDownIcon" />
      </BasiqSelectionControl>
    </ComboboxAnchor>

    <ComboboxPortal defer :disabled="portalDisabled" :to="portalTarget">
      <ComboboxContent
        ref="content"
        :class="$style.content"
        :aria-busy="loading || undefined"
        :aria-label="listboxAriaLabel"
        :aria-labelledby="listboxAriaLabelledBy"
        :data-basiq-theme="portalThemeMode"
        position="popper"
        :side-offset="4"
        :collision-padding="8"
        :style="portalContentStyle"
      >
        <ComboboxViewport :class="$style.viewport">
          <div v-if="loading" :class="$style.message" aria-disabled="true" role="option">
            <slot name="loading">{{ loadingText ?? "Loading…" }}</slot>
          </div>
          <template v-else>
            <ComboboxItem
              v-for="item in renderedItems"
              :key="`${typeof item.value}:${item.value}`"
              :class="$style.item"
              :aria-label="$slots.item ? item.label : undefined"
              :disabled="item.disabled"
              :text-value="`${item.label} ${item.description ?? ''}`"
              :value="item.value"
            >
              <slot
                v-if="$slots.item"
                name="item"
                :item="item"
                :selected="isSelected(item.value)"
              />
              <template v-else>
                <span v-if="item.icon || $slots['item-leading']" :class="$style.leading">
                  <slot name="item-leading" :item="item" :selected="isSelected(item.value)">
                    <BasiqIcon v-if="item.icon" :icon="item.icon" />
                  </slot>
                </span>
                <span :class="$style['item-copy']">
                  <span :class="$style['item-label']">{{ item.label }}</span>
                  <span v-if="item.description" :class="$style.description">{{
                    item.description
                  }}</span>
                </span>
                <slot name="item-trailing" :item="item" :selected="isSelected(item.value)" />
                <ComboboxItemIndicator :class="$style.indicator">
                  <BasiqIcon :icon="BasiqCheckIcon" />
                </ComboboxItemIndicator>
              </template>
            </ComboboxItem>
            <ComboboxItem
              v-if="canCreate"
              :class="[$style.item, $style.create]"
              :text-value="normalizedQuery"
              :value="normalizedQuery"
              @select="handleCreate"
            >
              <slot name="create" :query="normalizedQuery">
                {{ getCreateLabel?.(normalizedQuery) }}
              </slot>
            </ComboboxItem>
            <ComboboxEmpty v-if="shouldRenderEmpty" as-child>
              <div :class="$style.message" aria-disabled="true" role="option">
                <slot name="empty">{{ emptyText ?? "No options" }}</slot>
              </div>
            </ComboboxEmpty>
          </template>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>

  <template v-if="name">
    <input
      v-for="value in selectedValues"
      :key="`form:${typeof value}:${value}`"
      :disabled="disabled"
      :form="form"
      :name="name"
      type="hidden"
      :value="String(value)"
    />
  </template>
</template>

<style module>
.chevron {
  width: 20px;
  height: 20px;
  color: var(--basiq-color-content-subtle);
  pointer-events: none;
}

.content {
  z-index: var(--basiq-layer-overlay, 1000);
  box-sizing: border-box;
  width: var(--reka-combobox-trigger-width);
  min-width: 12rem;
  max-height: min(20rem, var(--reka-combobox-content-available-height));
  overflow: hidden;
  border: var(--basiq-border-width-default) solid var(--basiq-color-selection-content-border);
  border-radius: var(--basiq-radius-md);
  color: var(--basiq-color-content-default);
  background: var(--basiq-color-selection-content-background);
  box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
  font-family: var(--basiq-font-family-sans);
}

.viewport {
  box-sizing: border-box;
  max-height: inherit;
  padding: var(--basiq-space-100);
  overflow-y: auto;
}

.item {
  position: relative;
  box-sizing: border-box;
  display: flex;
  gap: var(--basiq-space-200);
  align-items: center;
  min-height: 40px;
  padding: var(--basiq-space-200);
  border-radius: var(--basiq-radius-sm);
  outline: none;
  cursor: pointer;
  user-select: none;
}

.item[data-highlighted] {
  background: var(--basiq-color-selection-item-background-highlighted);
}

.item[data-disabled] {
  color: var(--basiq-color-content-disabled);
  cursor: not-allowed;
}

.leading,
.indicator {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.leading {
  color: var(--basiq-color-content-subtle);
  font-size: 20px;
}

.item-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.item-label,
.description {
  overflow-wrap: anywhere;
}

.item-label {
  line-height: 1.5;
}

.description {
  color: var(--basiq-color-content-subtle);
  font-size: 0.875rem;
  line-height: 1.4;
}

.indicator {
  margin-inline-start: auto;
  color: var(--basiq-color-accent-default);
  font-size: 20px;
}

.create {
  color: var(--basiq-color-accent-default);
}

.message {
  box-sizing: border-box;
  padding: var(--basiq-space-300);
  color: var(--basiq-color-content-subtle);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@media (forced-colors: active) {
  .content {
    border-color: CanvasText;
    box-shadow: none;
  }

  .item[data-highlighted] {
    color: HighlightText;
    background: Highlight;
  }
}
</style>
