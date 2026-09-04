import { computed, getCurrentInstance, onBeforeUpdate, ref, type ComputedRef } from "vue";

import { hasInitialProp } from "../controllable-state/hasInitialProp";

export interface NavigationLayoutOpenProps {
  defaultOpen?: boolean;
  open?: boolean;
}

export interface BasiqNavigationLayoutEmits {
  "update:open": [value: boolean];
}

export interface BasiqNavigationLayoutSlotProps {
  close: () => void;
  open: boolean;
}

export interface NavigationLayoutOpenState {
  close: () => void;
  currentOpen: ComputedRef<boolean>;
  open: () => void;
  setOpen: (value: boolean) => void;
}

export function useNavigationLayoutOpenState(
  componentName: string,
  props: Readonly<NavigationLayoutOpenProps>,
  emit: (event: "update:open", value: boolean) => void,
): NavigationLayoutOpenState {
  const isControlled = hasInitialProp("open");
  const instance = getCurrentInstance();
  const internalOpen = ref(props.defaultOpen ?? false);
  const hasWarned = ref(false);

  const currentOpen = computed(() => (isControlled ? (props.open ?? false) : internalOpen.value));

  function setOpen(value: boolean) {
    if (!isControlled) internalOpen.value = value;
    emit("update:open", value);
  }

  onBeforeUpdate(() => {
    if (!import.meta.env.DEV || hasWarned.value) return;

    const vnodeProps = instance?.vnode.props ?? {};
    const isCurrentlyControlled = Object.prototype.hasOwnProperty.call(vnodeProps, "open");
    if (isCurrentlyControlled !== isControlled) {
      hasWarned.value = true;
      console.warn(
        `[BasiQ UI] ${componentName} must not switch between controlled and uncontrolled state.`,
      );
    }
  });

  return {
    close: () => setOpen(false),
    currentOpen,
    open: () => setOpen(true),
    setOpen,
  };
}
