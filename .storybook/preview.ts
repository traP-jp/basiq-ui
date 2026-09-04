import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/m-plus-1p/japanese-400.css";
import "@fontsource/m-plus-1p/japanese-700.css";
import type { Preview } from "@storybook/vue3-vite";

import BasiqThemeProvider from "../src/theme/BasiqThemeProvider.vue";
import storybookTheme from "./storybook-theme";

import "../src/styles/index.css";
import "./preview.css";

const preview: Preview = {
  decorators: [
    (story, context) => ({
      name: "StorybookThemeDecorator",
      components: { BasiqThemeProvider, story },
      setup() {
        const rootClass = [
          "basiq-storybook-root",
          context.viewMode === "docs" ? "basiq-storybook-docs-root" : undefined,
        ];

        return { rootClass, storybookContext: context };
      },
      template: `
          <BasiqThemeProvider
            :class="rootClass"
            :mode="storybookContext.globals.themeMode"
            :data-storybook-mode="storybookContext.globals.themeMode"
          >
            <story />
          </BasiqThemeProvider>
        `,
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
    layout: "fullscreen",
    htmlLang: "ja",
    a11y: {
      test: "error",
    },
    docs: {
      codePanel: true,
      lang: "ja",
      story: {
        autoplay: false,
      },
      theme: storybookTheme,
    },
    options: {
      storySort: {
        order: ["Documents", "Foundation", "Components", "Layouts", "Examples", "Development"],
      },
    },
  },
};

export default preview;
