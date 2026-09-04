import { describe, expect, it } from "vitest";

import { BASIQ_TOAST_LIMIT, createToastStore } from "./toastStore";

describe("createToastStore", () => {
  it("adds a neutral toast and returns a provider-local id", () => {
    const { controller, toasts } = createToastStore();

    const id = controller.add({ title: "保存しました" });

    expect(id).toBe("basiq-toast-1");
    expect(toasts.value).toEqual([
      { id, priority: "foreground", title: "保存しました", tone: "neutral" },
    ]);
  });

  it("keeps the newest three toasts without deduplicating content", () => {
    const announced: string[] = [];
    const { controller, toasts } = createToastStore({
      onAdd: (toast) => announced.push(toast.id),
    });

    const ids = Array.from({ length: BASIQ_TOAST_LIMIT + 1 }, () =>
      controller.add({ title: "更新しました", tone: "success" }),
    );

    expect(toasts.value).toHaveLength(BASIQ_TOAST_LIMIT);
    expect(toasts.value.map((toast) => toast.id)).toEqual(ids.slice(1));
    expect(announced).toEqual(ids);
  });

  it("dismisses only the matching toast", () => {
    const { controller, toasts } = createToastStore();
    const first = controller.add({ title: "最初" });
    const second = controller.add({ description: "詳細", title: "次" });

    controller.dismiss(first);
    controller.dismiss("unknown");

    expect(toasts.value).toEqual([
      {
        description: "詳細",
        id: second,
        priority: "foreground",
        title: "次",
        tone: "neutral",
      },
    ]);
  });

  it("rejects an empty title and an unknown runtime tone", () => {
    const { controller } = createToastStore();

    expect(() => controller.add({ title: "  " })).toThrow("non-empty title");
    expect(() => controller.add({ title: "通知", tone: "unknown" as never })).toThrow(
      "Invalid BasiqToast tone",
    );
  });

  it("keeps announcement priority independent from visual tone", () => {
    const { controller, toasts } = createToastStore();

    controller.add({ priority: "background", title: "同期しました", tone: "success" });

    expect(toasts.value[0]).toMatchObject({ priority: "background", tone: "success" });
    expect(() => controller.add({ priority: "urgent" as never, title: "通知" })).toThrow(
      "Invalid BasiqToast priority",
    );
  });
});
