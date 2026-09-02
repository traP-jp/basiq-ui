import { create } from "storybook/theming/create";

const storybookTheme = create({
  base: "light",
  brandTitle: "BasiQ UI",
  colorPrimary: "#126abf",
  colorSecondary: "#126abf",
  appBg: "#f2f5f7",
  appContentBg: "#ffffff",
  appPreviewBg: "#ffffff",
  appBorderColor: "#ced6db",
  appBorderRadius: 4,
  fontBase: '"Inter", sans-serif',
  fontCode: "ui-monospace, monospace",
  textColor: "#333333",
  textMutedColor: "#6d6d6e",
  barTextColor: "#333333",
  barHoverColor: "#126abf",
  barSelectedColor: "#126abf",
  barBg: "#ffffff",
  inputBg: "#ffffff",
  inputBorder: "#8795a3",
  inputTextColor: "#333333",
});

export default storybookTheme;
