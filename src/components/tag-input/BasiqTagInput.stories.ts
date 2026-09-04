import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fireEvent, userEvent, within } from "storybook/test";
import { defineComponent, ref } from "vue";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqTagInput from "./BasiqTagInput.vue";

const meta = {
  title: "Components/TagInput",
  component: BasiqTagInput,
  tags: ["autodocs"],
  args: {
    defaultValue: ["Vue", "TypeScript"],
    placeholder: "Add a topic",
    removeLabel: (value: string) => `Remove ${value}`,
  },
  argTypes: {
    delimiter: { control: false },
    modelValue: { control: false },
    normalizeValue: { control: false },
    removeLabel: { control: false },
  },
  render: (args) => ({
    components: { BasiqTagInput },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqTagInput v-bind="args" aria-label="Topics" />
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqTagInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: createPlaygroundStoryParameters((_source, { args }) => {
    const defaultValue = Array.isArray(args.defaultValue)
      ? args.defaultValue.filter((value): value is string => typeof value === "string")
      : [];
    const attributes = [
      'v-model="topics"',
      'aria-label="Topics"',
      ':remove-label="getRemoveLabel"',
    ];

    for (const [prop, attribute] of [
      ["allowDuplicates", "allow-duplicates"],
      ["disabled", "disabled"],
      ["invalid", "invalid"],
      ["readonly", "readonly"],
      ["required", "required"],
    ] as const) {
      if (args[prop] === true) attributes.push(attribute);
    }

    for (const [prop, attribute] of [
      ["form", "form"],
      ["id", "id"],
      ["name", "name"],
      ["placeholder", "placeholder"],
    ] as const) {
      if (typeof args[prop] === "string" && args[prop] !== "") {
        attributes.push(`${attribute}="${escapeHtmlAttribute(args[prop])}"`);
      }
    }

    for (const [prop, attribute] of [
      ["max", "max"],
      ["maxlength", "maxlength"],
    ] as const) {
      if (typeof args[prop] === "number") attributes.push(`:${attribute}="${args[prop]}"`);
    }

    return `<script setup lang="ts">
import { ref } from "vue";

const topics = ref<string[]>(${JSON.stringify(defaultValue, null, 2)});

function getRemoveLabel(topic: string) {
  return \`Remove \${topic}\`;
}
</script>

<template>
  <BasiqTagInput
    ${attributes.join("\n    ")}
  />
</template>`;
  }),
};

export const DefaultInteraction: Story = {
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Topics" });

    await expect(getComputedStyle(input).borderTopWidth).toBe("0px");
    await expect(getComputedStyle(input).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(input).not.toHaveAttribute("placeholder");
    await expect(getComputedStyle(input).flexGrow).toBe("0");
    await expect(getComputedStyle(input).fieldSizing).toBe("content");

    const initialWidth = input.getBoundingClientRect().width;
    await userEvent.type(input, "Design");
    await expect(input.getBoundingClientRect().width).toBeGreaterThan(initialWidth);
    await userEvent.keyboard("{Enter}");

    await expect(canvas.getByRole("button", { name: "Remove Design" })).toBeInTheDocument();
    await expect(input.getBoundingClientRect().width).toBeLessThanOrEqual(initialWidth);
    await userEvent.type(input, "Accessibility,");
    await expect(canvas.getByRole("button", { name: "Remove Accessibility" })).toBeInTheDocument();
  },
};

export const EmptyPlaceholderInteraction: Story = {
  args: { defaultValue: [] },
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Topics" });

    await expect(input).toHaveAttribute("placeholder", "Add a topic");
    await expect(getComputedStyle(input).flexGrow).toBe("1");

    await userEvent.type(input, "Vue{Enter}");
    await expect(input).not.toHaveAttribute("placeholder");
    await expect(getComputedStyle(input).flexGrow).toBe("0");
  },
};

export const DuplicateAndBackspace: Story = {
  args: { defaultValue: ["Vue"] },
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Topics" });

    await userEvent.type(input, "Vue{Enter}");
    await expect(canvas.getAllByRole("button", { name: "Remove Vue" })).toHaveLength(1);
    await expect(input).toHaveValue("Vue");
    await userEvent.clear(input);
    await userEvent.keyboard("{Backspace}{Backspace}");
    await expect(canvas.queryByRole("button", { name: "Remove Vue" })).not.toBeInTheDocument();
  },
};

export const CompositionSafety: Story = {
  args: { defaultValue: [] },
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Topics" });

    await fireEvent.compositionStart(input);
    await fireEvent.input(input, { target: { value: "日本語" } });
    await fireEvent.keyDown(input, { isComposing: true, key: "Enter" });
    await expect(canvas.queryByRole("button", { name: "Remove 日本語" })).not.toBeInTheDocument();
    await fireEvent.compositionEnd(input);
  },
};

const ControlledResetHarness = defineComponent({
  components: { BasiqTagInput },
  setup() {
    const value = ref(["initial"]);
    return { value };
  },
  template: `
    <form class="basiq-story" style="display: grid; gap: 12px; max-width: 24rem">
      <BasiqTagInput
        v-model="value"
        aria-label="Reset topics"
        :default-value="['initial']"
        name="topic"
        :remove-label="(tag) => \`Remove \${tag}\`"
      />
      <button type="reset">Reset</button>
    </form>
  `,
});

export const ControlledAndFormReset: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { ref } from "vue";

    const topics = ref(["initial"]);

    function getRemoveLabel(topic: string) {
      return \`Remove \${topic}\`;
    }
    </script>

    <template>
      <form>
        <BasiqTagInput
          v-model="topics"
          aria-label="Topics"
          :default-value="['initial']"
          name="topic"
          :remove-label="getRemoveLabel"
        />
        <button type="reset">Reset</button>
      </form>
    </template>
  `),
  render: () => ({
    components: { ControlledResetHarness },
    template: "<ControlledResetHarness />",
  }),
};

export const ControlledAndFormResetInteraction: Story = {
  ...ControlledAndFormReset,
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Reset topics" });

    await userEvent.type(input, "changed{Enter}");
    await expect(canvasElement.querySelectorAll('input[name="topic"]')).toHaveLength(2);
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(canvasElement.querySelectorAll('input[name="topic"]')).toHaveLength(1);
  },
};

export const ReadonlyAndDisabled: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    function getRemoveLabel(topic: string) {
      return \`Remove \${topic}\`;
    }
    </script>

    <template>
      <BasiqTagInput
        aria-label="Readonly topics"
        :default-value="['fixed']"
        readonly
        :remove-label="getRemoveLabel"
      />
      <BasiqTagInput
        aria-label="Disabled topics"
        :default-value="['fixed']"
        disabled
        :remove-label="getRemoveLabel"
      />
    </template>
  `),
  render: () => ({
    components: { BasiqTagInput },
    template: `
      <div class="basiq-story" style="display: grid; gap: 12px; max-width: 24rem">
        <BasiqTagInput
          aria-label="Readonly topics"
          :default-value="['fixed']"
          readonly
          :remove-label="(tag) => \`Remove \${tag}\`"
        />
        <BasiqTagInput
          aria-label="Disabled topics"
          :default-value="['fixed']"
          disabled
          :remove-label="(tag) => \`Remove \${tag}\`"
        />
      </div>
    `,
  }),
};

export const Empty: Story = {
  args: { defaultValue: [] },
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { ref } from "vue";

    const topics = ref<string[]>([]);

    function getRemoveLabel(topic: string) {
      return \`Remove \${topic}\`;
    }
    </script>

    <template>
      <BasiqTagInput
        v-model="topics"
        aria-label="Topics"
        placeholder="Add a topic"
        :remove-label="getRemoveLabel"
      />
    </template>
  `),
};

export const NarrowAndWrapping: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { ref } from "vue";

    const topics = ref(["A very long tag label", "Vue"]);

    function getRemoveLabel(topic: string) {
      return \`Remove \${topic}\`;
    }
    </script>

    <template>
      <div style="max-width: 16rem">
        <BasiqTagInput
          v-model="topics"
          aria-label="Topics"
          placeholder="Add a topic"
          :remove-label="getRemoveLabel"
        />
      </div>
    </template>
  `),
  render: () => ({
    components: { BasiqTagInput },
    template: `
      <div class="basiq-story" style="max-width: 16rem">
        <BasiqTagInput
          aria-label="Topics"
          :default-value="['A very long tag label', 'Vue']"
          placeholder="Add a topic"
          :remove-label="(tag) => 'Remove ' + tag"
        />
      </div>
    `,
  }),
};

const inputWidthInteractionParameters = createFixedVueSourceParameters(`
  <script setup lang="ts">
  const topics = ["Vue", "TypeScript", "Design", "Accessibility"];

  function getRemoveLabel(topic: string) {
    return \`Remove \${topic}\`;
  }
  </script>

  <template>
    <BasiqTagInput
      aria-label="Topics"
      :default-value="topics"
      placeholder="Add a topic"
      :remove-label="getRemoveLabel"
    />
  </template>
`);

export const InputWidthInteraction: Story = {
  parameters: inputWidthInteractionParameters,
  tags: ["regression", "!autodocs", "!dev"],
  render: () => ({
    components: { BasiqTagInput },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqTagInput
          aria-label="Topics"
          :default-value="['Vue', 'TypeScript', 'Design', 'Accessibility']"
          placeholder="Add a topic"
          :remove-label="(tag) => 'Remove ' + tag"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Topics" });
    const control = input.parentElement!;
    const chips = control.querySelectorAll<HTMLElement>("[data-basiq-selection-chip]");
    const lastChip = chips.item(chips.length - 1);

    await expect(input).not.toHaveAttribute("placeholder");
    await expect(getComputedStyle(input).position).toBe("absolute");
    const compactHeight = control.getBoundingClientRect().height;

    input.focus();
    await expect(getComputedStyle(lastChip, "::after").content).toBe('""');

    await userEvent.type(input, "A");
    await expect(getComputedStyle(input).position).toBe("static");
    await userEvent.clear(input);
    await expect(getComputedStyle(input).position).toBe("absolute");
    await expect(control.getBoundingClientRect().height).toBe(compactHeight);
    input.blur();
  },
};

export const NarrowAndThemes: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    function getRemoveLabel(topic: string) {
      return \`Remove \${topic}\`;
    }
    </script>

    <template>
      <BasiqThemeProvider mode="light">
        <BasiqTagInput
          aria-label="Light topics"
          :default-value="['A very long tag that is constrained by the control width', 'Vue']"
          :remove-label="getRemoveLabel"
        />
      </BasiqThemeProvider>
      <BasiqThemeProvider mode="dark">
        <BasiqTagInput
          aria-label="Dark topics"
          :default-value="['Design', 'Accessibility']"
          :remove-label="getRemoveLabel"
        />
      </BasiqThemeProvider>
    </template>
  `),
  render: () => ({
    components: { BasiqTagInput, BasiqThemeProvider },
    template: `
      <div class="basiq-story" style="display: grid; gap: 16px; max-width: 18rem">
        <BasiqThemeProvider mode="light" style="padding: 12px">
          <BasiqTagInput
            aria-label="Light topics"
            :default-value="['A very long tag that is constrained by the control width', 'Vue']"
            :remove-label="(tag) => \`Remove \${tag}\`"
          />
        </BasiqThemeProvider>
        <BasiqThemeProvider mode="dark" style="padding: 12px">
          <BasiqTagInput
            aria-label="Dark topics"
            :default-value="['Design', 'Accessibility']"
            :remove-label="(tag) => \`Remove \${tag}\`"
          />
        </BasiqThemeProvider>
      </div>
    `,
  }),
};

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
