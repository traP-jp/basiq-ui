import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/m-plus-1p/japanese-400.css";
import "@fontsource/m-plus-1p/japanese-700.css";
import type { Preview } from "@storybook/vue3-vite";
import { defineComponent, h } from "vue";

import "./preview.css";

const preview: Preview = {
  decorators: [
    (story, context) =>
      defineComponent({
        name: "StorybookThemeDecorator",
        setup() {
          return () =>
            h(
              "div",
              {
                class: "basiq-storybook-root",
                "data-storybook-mode": context.globals.themeMode,
              },
              [h(story())],
            );
        },
      }),
  ],
  globalTypes: {
    themeMode: {
      description: "Theme used to render every story",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    themeMode: "system",
  },
  parameters: {
    a11y: {
      test: "error",
    },
  },
};

export default preview;
