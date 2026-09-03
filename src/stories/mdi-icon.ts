import { defineComponent, h, markRaw, useAttrs, type Component } from "vue";

export function createStoryMdiIcon(name: string, path: string): Component {
  return markRaw(
    defineComponent({
      name,
      inheritAttrs: false,
      setup() {
        const attrs = useAttrs();

        return () =>
          h(
            "svg",
            {
              ...attrs,
              fill: "currentColor",
              viewBox: "0 0 24 24",
              xmlns: "http://www.w3.org/2000/svg",
            },
            h("path", { d: path }),
          );
      },
    }),
  );
}
