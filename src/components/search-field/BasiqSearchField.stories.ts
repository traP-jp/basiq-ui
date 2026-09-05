import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref, useTemplateRef } from "vue";

import { SampleInfoIcon } from "../../stories/sample-icons";
import {
  addComponentAttribute,
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqSearchField, { type BasiqSearchFieldExposed } from "./BasiqSearchField.vue";

const ValueHarness = defineComponent({
  name: "SearchFieldValueHarness",
  components: { BasiqSearchField },
  setup() {
    const clearCount = ref(0);
    const eventOrder = ref<string[]>([]);
    const lastUpdate = ref<string>();
    const controlledClearCount = ref(0);
    const controlledEventOrder = ref<string[]>([]);
    const controlledRequest = ref<string>();

    function handleUpdate(value: string) {
      lastUpdate.value = value;
      eventOrder.value.push("update");
    }

    function handleControlledUpdate(value: string) {
      controlledRequest.value = value;
      controlledEventOrder.value.push("update");
    }

    return {
      clearCount,
      controlledClearCount,
      controlledEventOrder,
      controlledRequest,
      eventOrder,
      handleControlledUpdate,
      handleUpdate,
      lastUpdate,
    };
  },
  template: `
    <div class="basiq-story basiq-form-story" style="max-width: 24rem">
      <BasiqSearchField
        aria-label="編集可能な検索"
        clear-label="検索語を消去"
        default-value="検索語"
        @clear="clearCount += 1; eventOrder.push('clear')"
        @update:model-value="handleUpdate"
      />
      <output data-testid="uncontrolled-events">
        {{ clearCount }}/{{ JSON.stringify(lastUpdate) }}/{{ eventOrder.join('>') }}
      </output>
      <BasiqSearchField
        aria-label="親が維持する検索"
        clear-label="親が維持する検索語を消去"
        model-value="親の値"
        @clear="controlledClearCount += 1; controlledEventOrder.push('clear')"
        @update:model-value="handleControlledUpdate"
      />
      <output data-testid="controlled-events">
        {{ controlledClearCount }}/{{ JSON.stringify(controlledRequest) }}/{{ controlledEventOrder.join('>') }}
      </output>
    </div>
  `,
});

const FormSubmitHarness = defineComponent({
  name: "SearchFieldFormSubmitHarness",
  components: { BasiqSearchField },
  setup() {
    const submitCount = ref(0);
    const submittedQuery = ref("");

    function handleSubmit(event: Event) {
      submitCount.value += 1;
      submittedQuery.value = String(
        new FormData(event.currentTarget as HTMLFormElement).get("query") ?? "",
      );
    }

    return { handleSubmit, submitCount, submittedQuery };
  },
  template: `
    <form class="basiq-story basiq-form-story" @submit.prevent="handleSubmit">
      <BasiqSearchField
        aria-label="送信する検索語"
        clear-label="送信する検索語を消去"
        default-value="BasiQ UI"
        name="query"
      />
      <button type="submit">検索</button>
      <output data-testid="submit-result">{{ submitCount }}/{{ submittedQuery }}</output>
    </form>
  `,
});

const ExposedMethodsHarness = defineComponent({
  name: "SearchFieldExposedMethodsHarness",
  components: { BasiqSearchField },
  setup() {
    const search = useTemplateRef<BasiqSearchFieldExposed>("search");

    return {
      focusSearch: () => search.value?.focus({ preventScroll: true }),
      selectSearch: () => search.value?.select(),
    };
  },
  template: `
    <div class="basiq-story basiq-form-story" style="max-width: 24rem">
      <BasiqSearchField
        ref="search"
        aria-label="公開メソッド対象"
        clear-label="公開メソッド対象を消去"
        default-value="選択対象"
      />
      <button type="button" @click="focusSearch">検索欄へフォーカス</button>
      <button type="button" @click="selectSearch">検索語を全選択</button>
    </div>
  `,
});

const NativeEventsHarness = defineComponent({
  name: "SearchFieldNativeEventsHarness",
  components: { BasiqSearchField },
  setup() {
    const targets = ref<string[]>([]);

    function recordTarget(type: string, event: Event) {
      targets.value.push(`${type}:${(event.target as Element).tagName}`);
    }

    return { recordTarget, targets };
  },
  template: `
    <div class="basiq-story basiq-form-story" style="max-width: 24rem">
      <BasiqSearchField
        aria-label="イベント対象"
        clear-label="イベント対象を消去"
        @blur="recordTarget('blur', $event)"
        @change="recordTarget('change', $event)"
        @focus="recordTarget('focus', $event)"
        @input="recordTarget('input', $event)"
      />
      <button type="button">次の要素</button>
      <output data-testid="event-targets">{{ targets.join(',') }}</output>
    </div>
  `,
});

const meta = {
  title: "Components/SearchField",
  component: BasiqSearchField,
  tags: ["autodocs"],
  args: {
    clearLabel: "検索語を消去",
    defaultValue: "",
    disabled: false,
    invalid: false,
    placeholder: "検索",
    readonly: false,
    required: false,
    size: "md",
  },
  parameters: {
    controls: {
      disable: false,
      include: ["clearLabel", "disabled", "invalid", "placeholder", "readonly", "required", "size"],
    },
  },
  render: (args) => ({
    components: { BasiqSearchField },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story basiq-form-story" style="max-width: 24rem">
        <BasiqSearchField v-bind="args" aria-label="検索" />
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqSearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(
    addComponentAttribute("BasiqSearchField", "aria-label", '"検索"'),
  ),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqSearchField
        aria-label="サイト内検索"
        clear-label="検索語を消去"
        default-value="BasiQ UI"
        placeholder="検索"
      />
    </template>
  `),
  args: {
    defaultValue: "BasiQ UI",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "検索" });
    const surface = search.parentElement!;

    await expect(search).toHaveAttribute("type", "search");
    await expect(search).toHaveValue("BasiQ UI");
    await expect(surface.querySelector("[data-input-affix] svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "検索語を消去" })).toBeVisible();
  },
};

export const ValueAndClear: Story = {
  tags: ["regression"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ValueHarness },
    template: "<ValueHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const uncontrolled = canvas.getByRole("searchbox", { name: "編集可能な検索" });

    await userEvent.click(uncontrolled);
    await userEvent.click(canvas.getByRole("button", { name: "検索語を消去" }));
    await expect(uncontrolled).toHaveValue("");
    await expect(uncontrolled).toHaveFocus();
    await expect(canvas.getByTestId("uncontrolled-events")).toHaveTextContent('1/""/update>clear');

    const controlled = canvas.getByRole("searchbox", { name: "親が維持する検索" });
    await userEvent.click(controlled);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await expect(controlled).toHaveValue("親の値");
    await expect(controlled).toHaveFocus();
    await expect(canvas.getByTestId("controlled-events")).toHaveTextContent('1/""/update>clear');
  },
};

export const FormSubmission: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { FormSubmitHarness },
    template: "<FormSubmitHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "送信する検索語" });

    await userEvent.click(search);
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByTestId("submit-result")).toHaveTextContent("1/BasiQ UI");
  },
};

export const FormFieldIntegration: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqFormField
        label="検索語"
        description="タイトルと本文を検索します"
        required
      >
        <BasiqSearchField clear-label="検索語を消去" />
      </BasiqFormField>
    </template>
  `),
  render: () => ({
    components: { BasiqFormField, BasiqSearchField },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField
          label="検索語"
          description="タイトルと本文を検索します"
          required
        >
          <BasiqSearchField clear-label="検索語を消去" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "検索語" });

    await expect(search).toBeRequired();
    await expect(search).toHaveAccessibleDescription("タイトルと本文を検索します");
  },
};

export const States: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqSearchField aria-label="空" clear-label="検索語を消去" />
      <BasiqSearchField aria-label="読み取り専用" clear-label="検索語を消去" default-value="値" readonly />
      <BasiqSearchField aria-label="無効" clear-label="検索語を消去" default-value="値" disabled />
    </template>
  `),
  render: () => ({
    components: { BasiqSearchField },
    template: `
      <div class="basiq-story basiq-form-story" style="max-width: 24rem">
        <BasiqSearchField aria-label="空" clear-label="空の検索語を消去" />
        <BasiqSearchField
          aria-label="読み取り専用"
          clear-label="読み取り専用の検索語を消去"
          default-value="値"
          readonly
        />
        <BasiqSearchField
          aria-label="無効"
          clear-label="無効な検索語を消去"
          default-value="値"
          disabled
        />
        <fieldset disabled>
          <BasiqSearchField
            aria-label="fieldset内"
            clear-label="fieldset内の検索語を消去"
            default-value="値"
          />
        </fieldset>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("searchbox", { name: "読み取り専用" })).toHaveAttribute(
      "readonly",
    );
    await expect(canvas.getByRole("searchbox", { name: "無効" })).toBeDisabled();
    await expect(canvas.getByRole("searchbox", { name: "fieldset内" })).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: /検索語を消去/ })).not.toBeInTheDocument();
  },
};

export const AttributeContract: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { BasiqSearchField },
    setup: () => ({ SampleInfoIcon }),
    template: `
      <div class="basiq-story basiq-form-story" style="max-width: 24rem">
        <BasiqSearchField
          data-testid="fixed-search"
          aria-label="固定検索"
          class="consumer-search"
          clear-label="固定検索を消去"
          :clearable="false"
          default-value="שלום"
          dir="auto"
          :leading-icon="SampleInfoIcon"
          style="inline-size: 20rem"
          :trailing-icon="SampleInfoIcon"
          type="text"
        />
        <BasiqSearchField
          data-testid="hidden-search"
          aria-label="非表示検索"
          clear-label="非表示検索を消去"
          default-value="値"
          hidden
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByTestId("fixed-search");
    const surface = search.parentElement!;

    await expect(search).toHaveAttribute("type", "search");
    await expect(surface).toHaveClass("consumer-search");
    await expect(surface.style.inlineSize).toBe("20rem");
    await expect(surface.querySelectorAll("[data-input-affix]")).toHaveLength(1);
    await expect(surface.querySelector("[data-input-affix] svg")).not.toHaveAttribute(
      "data-unsupported-icon",
    );
    await expect(canvas.getByRole("button", { name: "固定検索を消去" })).toBeVisible();
    await expect(getComputedStyle(search).direction).toBe("rtl");
    await expect(getComputedStyle(surface).direction).toBe("rtl");

    const hiddenSearch = canvas.getByTestId("hidden-search");
    await expect(hiddenSearch.parentElement).not.toBeVisible();
  },
};

export const ExposedMethods: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ExposedMethodsHarness },
    template: "<ExposedMethodsHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "公開メソッド対象" }) as HTMLInputElement;

    await userEvent.click(canvas.getByRole("button", { name: "検索欄へフォーカス" }));
    await expect(search).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "検索語を全選択" }));
    await expect(search.selectionStart).toBe(0);
    await expect(search.selectionEnd).toBe(search.value.length);
  },
};

export const NativeEvents: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { NativeEventsHarness },
    template: "<NativeEventsHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "イベント対象" });

    await userEvent.click(search);
    await userEvent.type(search, "A");
    await userEvent.tab();
    await expect(canvas.getByTestId("event-targets")).toHaveTextContent(
      "focus:INPUT,input:INPUT,change:INPUT,blur:INPUT",
    );
  },
};
