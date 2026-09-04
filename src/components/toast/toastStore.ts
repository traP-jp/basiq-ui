import { shallowRef } from "vue";

import type {
  BasiqToastController,
  BasiqToastOptions,
  BasiqToastPriority,
  BasiqToastRecord,
  BasiqToastTone,
} from "./types";

export const BASIQ_TOAST_DURATION = 5000;
export const BASIQ_TOAST_LIMIT = 3;

const tones = new Set<BasiqToastTone>(["neutral", "info", "success", "warning", "error"]);
const priorities = new Set<BasiqToastPriority>(["foreground", "background"]);

interface CreateToastStoreOptions {
  onAdd?: (toast: BasiqToastRecord) => void;
}

export function createToastStore({ onAdd }: CreateToastStoreOptions = {}) {
  const toasts = shallowRef<readonly BasiqToastRecord[]>([]);
  let nextId = 0;

  function add(options: BasiqToastOptions) {
    if (typeof options.title !== "string" || options.title.trim().length === 0) {
      throw new Error("BasiqToast requires a non-empty title.");
    }

    const tone = options.tone ?? "neutral";
    if (!tones.has(tone)) {
      throw new Error(`Invalid BasiqToast tone: ${String(tone)}.`);
    }

    const priority = options.priority ?? "foreground";
    if (!priorities.has(priority)) {
      throw new Error(`Invalid BasiqToast priority: ${String(priority)}.`);
    }

    const toast: BasiqToastRecord = {
      id: `basiq-toast-${++nextId}`,
      priority,
      title: options.title,
      tone,
      ...(options.description === undefined ? {} : { description: options.description }),
    };

    toasts.value = [...toasts.value.slice(-(BASIQ_TOAST_LIMIT - 1)), toast];
    onAdd?.(toast);
    return toast.id;
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  const controller: BasiqToastController = { add, dismiss };
  return { controller, toasts };
}
