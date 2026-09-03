import { describe, expect, it } from "vitest";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  fillComponentSlot,
} from "./storybook-parameters";

interface StoryExport {
  parameters?: {
    docs?: {
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
