import { describe, expect, it } from "vitest";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  fillComponentSlot,
} from "./storybook-parameters";

interface StoryExport {
  tags?: unknown;
  parameters?: {
    docs?: {
      canvas?: {
        sourceState?: unknown;
      };
      description?: {
        component?: unknown;
      };
      source?: {
        code?: unknown;
      };
    };
  };
}

const storyModules = import.meta.glob<Record<string, unknown>>("../**/*.stories.ts", {
  eager: true,
});

describe("Storybook source examples", () => {
  it("imports every BasiQ UI component used by fixed source examples", () => {
    for (const [modulePath, storyModule] of Object.entries(storyModules)) {
      for (const [exportName, exportedValue] of Object.entries(storyModule)) {
        if (
          exportName === "default" ||
          typeof exportedValue !== "object" ||
          exportedValue === null
        ) {
          continue;
        }

        const code = (exportedValue as StoryExport).parameters?.docs?.source?.code;

        if (typeof code !== "string") {
          continue;
        }

        const componentNames = [
          ...new Set(
            [...code.matchAll(/<\/?(Basiq[A-Z][A-Za-z0-9]*)\b/g)].map((match) => match[1]),
          ),
        ];

        if (componentNames.length === 0) {
          continue;
        }

        expect(code, `${modulePath}#${exportName} must be a Vue SFC`).toMatch(
          /<script\b[^>]*\bsetup\b[^>]*>/,
        );

        const importedNames = [
          ...code.matchAll(/import\s*{([^}]*)}\s*from\s*["']basiq-ui["']/gs),
        ].flatMap((match) => match[1].split(",").map((name) => name.trim()));

        for (const componentName of componentNames) {
          expect(
            importedNames,
            `${modulePath}#${exportName} must import ${componentName}`,
          ).toContain(componentName);
        }
      }
    }
  });

  it("publishes copyable Toast examples without Story-only helpers", () => {
    const toastStories = storyModules[
      "../components/toast/BasiqToastProvider.stories.ts"
    ] as Record<string, StoryExport>;
    const exampleNames = ["Playground", "UseToast", "Tones", "Priorities", "LongContent"];

    for (const exampleName of exampleNames) {
      const code = toastStories[exampleName]?.parameters?.docs?.source?.code;

      expect(code, `${exampleName} must define a fixed source example`).toBeTypeOf("string");
      expect(code).toMatch(/<script\b[^>]*\bsetup\b[^>]*>/);
      expect(code).toMatch(/<template>/);
      expect(code).not.toMatch(
        /ToastControls|ToneControls|PriorityControls|StatusColorComparisonGallery/,
      );
    }

    expect(toastStories.default?.parameters?.docs?.description?.component).toContain(
      "BasiqToastProvider",
    );
    expect(toastStories.StatusColorComparison?.parameters?.docs?.canvas?.sourceState).toBe("none");
  });

  it("publishes copyable Calendar examples without serialized Story args", () => {
    const calendarStories = storyModules[
      "../components/calendar/BasiqCalendar.stories.ts"
    ] as Record<string, StoryExport>;
    const exampleNames = [
      "Default",
      "Controlled",
      "Restrictions",
      "LocaleAndWeekStart",
      "Readonly",
      "RightToLeft",
      "Disabled",
    ];

    for (const exampleName of exampleNames) {
      const code = calendarStories[exampleName]?.parameters?.docs?.source?.code;

      expect(code, `${exampleName} must define a fixed source example`).toBeTypeOf("string");
      expect(code).toMatch(/<script\b[^>]*\bsetup\b[^>]*>/);
      expect(code).toMatch(/<template>/);
      expect(code).toContain("BasiqCalendar");
      expect(code).not.toMatch(
        /ControlledCalendar|RejectingCalendar|calendar\.identifier|"calendar":\s*\{/,
      );
    }

    expect(calendarStories.MonthAndYearNavigation?.tags).toContain("!autodocs");
  });

  it("keeps generated Playground props while completing the Vue SFC", () => {
    const parameters = createPlaygroundStoryParameters(fillComponentSlot("BasiqButton", "Button"));
    const transform = parameters.docs.source.transform;
    const source = transform(
      `
        <template>
          <BasiqButton tone="danger" variant="outline" />
        </template>
      `,
      { args: {} },
    );

    expect(source).toBe(`<script setup lang="ts">
import { BasiqButton } from "basiq-ui";
</script>

<template>
  <BasiqButton tone="danger" variant="outline">
    Button
  </BasiqButton>
</template>`);
  });

  it("dedents fixed source examples that already contain a script", () => {
    const parameters = createFixedVueSourceParameters(`
      <script setup lang="ts">
      const label = "保存";
      </script>

      <template>
        <BasiqButton>{{ label }}</BasiqButton>
      </template>
    `);

    expect(parameters.docs.source.code).toBe(`<script setup lang="ts">
import { BasiqButton } from "basiq-ui";
const label = "保存";
</script>

<template>
  <BasiqButton>{{ label }}</BasiqButton>
</template>`);
  });
});
