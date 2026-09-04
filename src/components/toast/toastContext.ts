import { inject, type InjectionKey } from "vue";

import type { BasiqToastController } from "./types";

export const basiqToastContextKey: InjectionKey<BasiqToastController> = Symbol("BasiqToast");

export function useToast(): BasiqToastController {
  const controller = inject(basiqToastContextKey);

  if (!controller) {
    throw new Error("useToast() must be used within BasiqToastProvider.");
  }

  return controller;
}
