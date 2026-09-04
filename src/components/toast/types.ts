export type BasiqToastTone = "neutral" | "info" | "success" | "warning" | "error";
export type BasiqToastPriority = "foreground" | "background";

export type BasiqToastId = string;

export interface BasiqToastOptions {
  description?: string;
  priority?: BasiqToastPriority;
  title: string;
  tone?: BasiqToastTone;
}

export interface BasiqToastController {
  add(options: BasiqToastOptions): BasiqToastId;
  dismiss(id: BasiqToastId): void;
}

export interface BasiqToastRecord {
  description?: string;
  id: BasiqToastId;
  priority: BasiqToastPriority;
  title: string;
  tone: BasiqToastTone;
}
