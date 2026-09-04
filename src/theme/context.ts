import type { ComputedRef, InjectionKey } from "vue";
import { inject, provide } from "vue";

export type BasiqThemeMode = "light" | "dark" | "system";

export interface BasiqThemeColorOverrides {
  accentDefault?: string;
  borderControl?: string;
  borderSeparator?: string;
  contentAccent?: string;
  contentDanger?: string;
  contentDefault?: string;
  contentDisabled?: string;
  contentOnAccent?: string;
  contentOnDanger?: string;
  contentOnNeutral?: string;
  contentSubtle?: string;
  controlBackgroundDisabled?: string;
  controlBackgroundDisabledAccent?: string;
  focusRing?: string;
  overlayScrim?: string;
  surfaceBase?: string;
  surfaceContainer?: string;
  surfaceMuted?: string;
}

export interface BasiqThemeOverrides {
  color?: BasiqThemeColorOverrides;
}

export type BasiqThemeStyle = Record<`--basiq-${string}`, string>;

export interface BasiqThemeContext {
  mode: ComputedRef<BasiqThemeMode>;
  style: ComputedRef<BasiqThemeStyle>;
}

const themeContextKey: InjectionKey<BasiqThemeContext> = Symbol("BasiqThemeContext");

const colorVariableNames = {
  accentDefault: "--basiq-color-accent-default",
  borderControl: "--basiq-color-border-control",
  borderSeparator: "--basiq-color-border-separator",
  contentAccent: "--basiq-color-content-accent",
  contentDanger: "--basiq-color-content-danger",
  contentDefault: "--basiq-color-content-default",
  contentDisabled: "--basiq-color-content-disabled",
  contentOnAccent: "--basiq-color-content-on-accent",
  contentOnDanger: "--basiq-color-content-on-danger",
  contentOnNeutral: "--basiq-color-content-on-neutral",
  contentSubtle: "--basiq-color-content-subtle",
  controlBackgroundDisabled: "--basiq-color-control-background-disabled",
  controlBackgroundDisabledAccent: "--basiq-color-control-background-disabled-accent",
  focusRing: "--basiq-color-focus-ring",
  overlayScrim: "--basiq-color-overlay-scrim",
  surfaceBase: "--basiq-color-surface-base",
  surfaceContainer: "--basiq-color-surface-container",
  surfaceMuted: "--basiq-color-surface-muted",
} as const satisfies Record<keyof BasiqThemeColorOverrides, `--basiq-${string}`>;

export function resolveBasiqThemeOverrides(
  overrides: BasiqThemeOverrides | undefined,
): BasiqThemeStyle {
  const style: BasiqThemeStyle = {};

  if (!overrides?.color) return style;

  for (const key of Object.keys(colorVariableNames) as (keyof BasiqThemeColorOverrides)[]) {
    const value = overrides.color[key];
    if (value !== undefined) style[colorVariableNames[key]] = value;
  }

  return style;
}

export function provideBasiqThemeContext(context: BasiqThemeContext) {
  provide(themeContextKey, context);
}

export function injectBasiqThemeContext() {
  return inject(themeContextKey, undefined);
}
