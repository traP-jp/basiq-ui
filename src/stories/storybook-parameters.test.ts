import { describe, expect, it } from "vitest";

import { createPlaygroundStoryParameters, fillComponentSlot } from "./storybook-parameters";

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

    expect(source).toContain('import { BasiqButton } from "basiq-ui";');
    expect(source).toContain('<BasiqButton tone="danger" variant="outline">');
    expect(source).toContain("Button");
  });
});
