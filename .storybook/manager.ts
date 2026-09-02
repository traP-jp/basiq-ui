import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-700.css";
import { addons } from "storybook/manager-api";

import storybookTheme from "./storybook-theme";

addons.setConfig({
  theme: storybookTheme,
});
