import type { Component } from "vue";

import type { BasiqPortalTarget } from "../overlay/overlayContext";

export type BasiqComboboxValue = string | number;

export interface BasiqComboboxItem<Value extends BasiqComboboxValue = BasiqComboboxValue> {
  /** Secondary text rendered below the label and included in the default client filter. */
  description?: string;
  disabled?: boolean;
  /** A currentColor-compatible Vue icon component. Use item-leading for richer content. */
  icon?: Component;
  label: string;
  /** Stable selection key. This is also the submitted form value. */
  value: Value;
}

interface BasiqComboboxBaseProps<
  Value extends BasiqComboboxValue,
  Item extends BasiqComboboxItem<Value>,
> {
  defaultOpen?: boolean;
  disabled?: boolean;
  emptyText?: string;
  /** Set to false when items are already filtered by an external search. */
  filter?: false | ((item: Item, query: string) => boolean);
  form?: string;
  id?: string;
  invalid?: boolean;
  items: readonly Item[];
  loading?: boolean;
  loadingText?: string;
  /** Submits selected values as repeated entries with this name. */
  name?: string;
  open?: boolean;
  openOnFocus?: boolean;
  placeholder?: string;
  /**
   * Uses the shared overlay Portal by default. Set false to render inline, or provide a stable
   * target resolved when the component mounts.
   */
  portal?: boolean | BasiqPortalTarget;
  readonly?: boolean;
  required?: boolean;
  /** Controlled search query. It is cleared after selection and when the popup closes. */
  searchTerm?: string;
}

export interface BasiqComboboxSingleProps<
  Value extends BasiqComboboxValue = BasiqComboboxValue,
  Item extends BasiqComboboxItem<Value> = BasiqComboboxItem<Value>,
> extends BasiqComboboxBaseProps<Value, Item> {
  defaultValue?: Value | null;
  getRemoveLabel?: never;
  modelValue?: Value | null;
  multiple?: false;
}

export interface BasiqComboboxMultipleProps<
  Value extends BasiqComboboxValue = BasiqComboboxValue,
  Item extends BasiqComboboxItem<Value> = BasiqComboboxItem<Value>,
> extends BasiqComboboxBaseProps<Value, Item> {
  defaultValue?: readonly Value[];
  getRemoveLabel: (item: Item | undefined, value: Value) => string;
  modelValue?: readonly Value[];
  multiple: true;
}

export interface BasiqComboboxCreatableProps {
  /** Shows a create option for a non-empty query without an exact item label/value match. */
  creatable: true;
  getCreateLabel: (query: string) => string;
}

export interface BasiqComboboxNonCreatableProps {
  creatable?: false;
  getCreateLabel?: never;
}

export type BasiqComboboxProps<
  Value extends BasiqComboboxValue = BasiqComboboxValue,
  Item extends BasiqComboboxItem<Value> = BasiqComboboxItem<Value>,
> = (BasiqComboboxSingleProps<Value, Item> | BasiqComboboxMultipleProps<Value, Item>) &
  (BasiqComboboxCreatableProps | BasiqComboboxNonCreatableProps);

export interface BasiqComboboxEmits<Value extends BasiqComboboxValue = BasiqComboboxValue> {
  blur: [event: FocusEvent];
  /** Requests creation. The consumer owns async state and adding/selecting the resulting item. */
  create: [query: string];
  focus: [event: FocusEvent];
  "update:modelValue": [value: Value | Value[] | null];
  "update:open": [open: boolean];
  "update:searchTerm": [query: string];
}

export interface BasiqComboboxItemSlotProps<
  Value extends BasiqComboboxValue = BasiqComboboxValue,
  Item extends BasiqComboboxItem<Value> = BasiqComboboxItem<Value>,
> {
  item: Item;
  selected: boolean;
}

export interface BasiqComboboxSelectedSlotProps<
  Value extends BasiqComboboxValue = BasiqComboboxValue,
  Item extends BasiqComboboxItem<Value> = BasiqComboboxItem<Value>,
> {
  item: Item | undefined;
  value: Value;
}
