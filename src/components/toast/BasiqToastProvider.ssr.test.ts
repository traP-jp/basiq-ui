import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqToastProvider from "./BasiqToastProvider.vue";
import { useToast } from "./toastContext";

const AddToast = defineComponent({
  props: { title: { required: true, type: String } },
  setup(props) {
    const toast = useToast();
    const id = toast.add({ title: props.title });
    return () => h("span", { "data-toast-id": id }, props.title);
  },
});

async function renderProvider(title: string) {
  return renderToString(
    createSSRApp({
      render: () => h(BasiqToastProvider, null, { default: () => h(AddToast, { title }) }),
    }),
  );
}

describe("BasiqToastProvider SSR", () => {
  it("renders without browser globals", async () => {
    const html = await renderProvider("保存しました");

    expect(html).toContain("保存しました");
    expect(html).toContain('data-toast-id="basiq-toast-1"');
  });

  it("does not share ids between application instances", async () => {
    const [first, second] = await Promise.all([
      renderProvider("一件目"),
      renderProvider("別アプリ"),
    ]);

    expect(first).toContain('data-toast-id="basiq-toast-1"');
    expect(second).toContain('data-toast-id="basiq-toast-1"');
  });

  it("accepts an explicit portal target without accessing the document", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            BasiqToastProvider,
            { portalTarget: "#client-overlay-target" },
            { default: () => h(AddToast, { title: "SSR通知" }) },
          ),
      }),
    );

    expect(html).toContain("SSR通知");
  });

  it("throws when useToast is called without a provider", async () => {
    const OutsideProvider = defineComponent({
      setup() {
        useToast();
        return () => h("div");
      },
    });

    await expect(renderToString(createSSRApp(OutsideProvider))).rejects.toThrow(
      "must be used within BasiqToastProvider",
    );
  });
});
