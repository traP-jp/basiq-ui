export const controlsDisabledStoryParameters = {
  controls: {
    disable: true,
  },
} as const;

export interface PlaygroundSourceContext {
  args: Record<string, unknown>;
}

export type PlaygroundSourceTransform = (
  source: string,
  context: PlaygroundSourceContext,
) => string;

export function createPlaygroundStoryParameters(
  transformSource: PlaygroundSourceTransform = (source) => source,
) {
  return {
    controls: {
      disable: false,
    },
    docs: {
      source: {
        language: "html" as const,
        transform: (source: string, context: PlaygroundSourceContext) =>
          completeVueSfc(dedent(transformSource(source, context))),
        type: "dynamic" as const,
      },
    },
  };
}

export function composeSourceTransforms(...transforms: PlaygroundSourceTransform[]) {
  return (source: string, context: PlaygroundSourceContext) =>
    transforms.reduce((currentSource, transform) => transform(currentSource, context), source);
}

export function addComponentAttribute(
  componentName: string,
  attributeName: string,
  attributeValue: string,
) {
  return (source: string) =>
    source.replace(new RegExp(`<${componentName}\\b([^>]*)>`), (openingTag, attributes: string) => {
      if (new RegExp(`(?:^|\\s)${attributeName}(?:=|\\s|$)`).test(attributes)) {
        return openingTag;
      }

      return `<${componentName} ${attributeName}=${attributeValue}${attributes}>`;
    });
}

export function fillComponentSlot(componentName: string, content: string) {
  return (source: string) =>
    source.replace(
      new RegExp(`^([ \\t]*)<${componentName}([^>]*)\\s/>`, "m"),
      (_, indentation: string, attributes: string) => {
        const indentedContent = content
          .split("\n")
          .map((line) => `${indentation}  ${line}`)
          .join("\n");

        return `${indentation}<${componentName}${attributes}>\n${indentedContent}\n${indentation}</${componentName}>`;
      },
    );
}

function createVueSourceParameters(code: string) {
  return {
    docs: {
      source: {
        code: completeVueSfc(dedent(code)),
        language: "html" as const,
      },
    },
  };
}

function completeVueSfc(code: string) {
  const components = [
    ...new Set([...code.matchAll(/<\/?(Basiq[A-Z][A-Za-z0-9]*)\b/g)].map((match) => match[1])),
  ].sort();

  if (components.length === 0) {
    return code;
  }

  if (/from ["']basiq-ui["']/.test(code)) {
    return code;
  }

  const componentImport = `import { ${components.join(", ")} } from "basiq-ui";`;
  const scriptSetup = /<script\b[^>]*\bsetup\b[^>]*>/;

  if (scriptSetup.test(code)) {
    return code.replace(scriptSetup, (openingTag) => `${openingTag}\n${componentImport}`);
  }

  return `<script setup lang="ts">\n${componentImport}\n</script>\n\n${code}`;
}

export function createFixedVueSourceParameters(code: string) {
  return {
    ...createVueSourceParameters(code),
    ...controlsDisabledStoryParameters,
  };
}

function dedent(code: string) {
  const lines = code.trim().split("\n");
  const indentation = Math.min(
    ...lines
      .filter((line) => line.trim().length > 0)
      .map((line) => line.match(/^\s*/)?.[0].length ?? 0),
  );

  return lines.map((line) => line.slice(indentation)).join("\n");
}
