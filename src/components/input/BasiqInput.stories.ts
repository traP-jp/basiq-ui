import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { defineComponent, ref, useTemplateRef } from "vue";

import { SampleInfoIcon, SampleTagIcon } from "../../stories/sample-icons";
import {
  addComponentAttribute,
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
  controlsDisabledStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqFormField from "../form-field/BasiqFormField.vue";
import BasiqInput, { type BasiqInputExposed } from "./BasiqInput.vue";

const ClearableInputHarness = defineComponent({
  name: "ClearableInputHarness",
  components: { BasiqInput },
  setup() {
    const changeCount = ref(0);
    const clearCount = ref(0);
    const clearEventType = ref("");
    const eventOrder = ref<string[]>([]);
    const inputCount = ref(0);
    const lastUpdate = ref<string>();
    const controlledClearCount = ref(0);
    const controlledEventOrder = ref<string[]>([]);
    const controlledRequest = ref<string>();

    function handleClear(event: MouseEvent) {
      clearCount.value += 1;
      clearEventType.value = event instanceof MouseEvent ? event.type : "invalid";
      eventOrder.value.push("clear");
    }

    function handleUpdate(value: string) {
      lastUpdate.value = value;
      eventOrder.value.push("update");
    }

    function handleControlledClear() {
      controlledClearCount.value += 1;
      controlledEventOrder.value.push("clear");
    }

    function handleControlledUpdate(value: string) {
      controlledRequest.value = value;
      controlledEventOrder.value.push("update");
    }

    return {
      changeCount,
      clearCount,
      clearEventType,
      controlledClearCount,
      controlledEventOrder,
      controlledRequest,
      eventOrder,
      handleClear,
      handleControlledClear,
      handleControlledUpdate,
      handleUpdate,
      inputCount,
      lastUpdate,
    };
  },
  template: `
    <div class="basiq-story basiq-form-story" style="max-width: 24rem">
      <BasiqInput
        aria-label="編集可能な入力"
        clear-label="入力を消去"
        clearable
        default-value="検索語"
        @change="changeCount += 1"
        @clear="handleClear"
        @input="inputCount += 1"
        @update:model-value="handleUpdate"
      />
      <output data-testid="uncontrolled-events">
        {{ clearCount }}/{{ inputCount }}/{{ changeCount }}/{{ JSON.stringify(lastUpdate) }}/{{ clearEventType }}/{{ eventOrder.join(">") }}
      </output>
      <BasiqInput
        aria-label="親が維持する入力"
        clear-label="親が維持する入力を消去"
        clearable
        model-value="親の値"
        @clear="handleControlledClear"
        @update:model-value="handleControlledUpdate"
      />
      <output data-testid="controlled-events">
        {{ controlledClearCount }}/{{ JSON.stringify(controlledRequest) }}/{{ controlledEventOrder.join(">") }}
      </output>
    </div>
  `,
});

const ExposedMethodsHarness = defineComponent({
  name: "ExposedInputMethodsHarness",
  components: { BasiqInput },
  setup() {
    const input = useTemplateRef<BasiqInputExposed>("input");

    function focusInput() {
      input.value?.focus({ preventScroll: true });
    }

    function selectInput() {
      input.value?.select();
    }

    return { focusInput, selectInput };
  },
  template: `
    <div class="basiq-story basiq-form-story" style="max-width: 24rem">
      <BasiqInput ref="input" aria-label="公開メソッド対象" default-value="選択対象" />
      <button type="button" @click="focusInput">入力へフォーカス</button>
      <button type="button" @click="selectInput">入力を全選択</button>
    </div>
  `,
});

const DisabledFieldsetHarness = defineComponent({
  name: "DisabledInputFieldsetHarness",
  components: { BasiqInput },
  setup() {
    const fieldsetDisabled = ref(true);

    return { fieldsetDisabled };
  },
  template: `
    <div class="basiq-story basiq-form-story" style="max-width: 24rem">
      <button type="button" @click="fieldsetDisabled = !fieldsetDisabled">
        fieldsetを切り替え
      </button>
      <fieldset :disabled="fieldsetDisabled">
        <BasiqInput
          aria-label="fieldset内の入力"
          clear-label="値を消去"
          clearable
          default-value="変更可能な値"
        />
      </fieldset>
    </div>
  `,
});

const ControlledResetHarness = defineComponent({
  name: "ControlledInputResetHarness",
  components: { BasiqInput },
  setup() {
    const value = ref("初期値");

    return { value };
  },
  template: `
    <form class="basiq-story basiq-form-story">
      <BasiqInput
        v-model="value"
        aria-label="リセット対象"
        default-value="初期値"
        name="reset-target"
      />
      <button type="reset">リセット</button>
    </form>
  `,
});

const UncontrolledResetHarness = defineComponent({
  name: "UncontrolledInputResetHarness",
  components: { BasiqInput },
  template: `
    <form class="basiq-story basiq-form-story">
      <BasiqInput aria-label="リセット対象" default-value="初期値" />
      <button type="reset">リセット</button>
    </form>
  `,
});

const CanceledResetHarness = defineComponent({
  name: "CanceledInputResetHarness",
  components: { BasiqInput },
  template: `
    <form class="basiq-story basiq-form-story" @reset.prevent>
      <BasiqInput aria-label="キャンセル対象" default-value="初期値" />
      <button type="reset">リセット</button>
    </form>
  `,
});

const DynamicAriaHarness = defineComponent({
  name: "DynamicInputAriaHarness",
  components: { BasiqInput },
  setup() {
    const describedBy = ref("first-description");
    const invalid = ref<"false" | "grammar">("false");

    function updateAria() {
      describedBy.value = "second-description";
      invalid.value = "grammar";
    }

    return { describedBy, invalid, updateAria };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <p id="first-description">最初の説明</p>
      <p id="second-description">更新後の説明</p>
      <BasiqInput
        :aria-describedby="describedBy"
        :aria-invalid="invalid"
        aria-label="動的なARIA"
      />
      <button type="button" @click="updateAria">ARIAを更新</button>
    </div>
  `,
});

const NativeEventsHarness = defineComponent({
  name: "InputNativeEventsHarness",
  components: { BasiqInput },
  setup() {
    const blurCount = ref(0);
    const changeCount = ref(0);
    const focusCount = ref(0);
    const inputCount = ref(0);
    const targets = ref<string[]>([]);

    function recordTarget(type: string, event: Event) {
      targets.value.push(`${type}:${(event.target as Element).tagName}`);
    }

    return { blurCount, changeCount, focusCount, inputCount, recordTarget, targets };
  },
  template: `
    <div class="basiq-story basiq-form-story">
      <BasiqInput
        aria-label="イベント対象"
        @blur="blurCount += 1; recordTarget('blur', $event)"
        @change="changeCount += 1; recordTarget('change', $event)"
        @focus="focusCount += 1; recordTarget('focus', $event)"
        @input="inputCount += 1; recordTarget('input', $event)"
      />
      <button type="button">次の要素</button>
      <output data-testid="event-counts">
        {{ inputCount }}/{{ changeCount }}/{{ focusCount }}/{{ blurCount }}
      </output>
      <output data-testid="event-targets">{{ targets.join(",") }}</output>
    </div>
  `,
});

const meta = {
  title: "Components/Input",
  component: BasiqInput,
  tags: ["autodocs"],
  args: {
    clearable: false,
    defaultValue: "",
    disabled: false,
    invalid: false,
    placeholder: "入力してください",
    readonly: false,
    required: false,
    size: "md",
    type: "text",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "tel", "url"],
    },
  },
  parameters: {
    controls: {
      disable: true,
      include: [
        "clearLabel",
        "clearable",
        "disabled",
        "invalid",
        "placeholder",
        "readonly",
        "required",
        "size",
        "type",
      ],
    },
  },
  render: (args) => ({
    components: { BasiqInput },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqInput v-bind="args" aria-label="入力内容" />
      </div>
    `,
  }),
} satisfies Meta<typeof BasiqInput>;

export default meta;

type Story = StoryObj<typeof meta>;

function horizontalCenter(element: Element) {
  const bounds = element.getBoundingClientRect();
  return bounds.left + bounds.width / 2;
}

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters(
    addComponentAttribute("BasiqInput", "aria-label", '"入力内容"'),
  ),
};

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-label="入力内容" placeholder="入力してください" />
    </template>
  `),
};

export const DefaultInteraction: Story = {
  ...Default,
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "入力内容" });

    await userEvent.click(input);
    await userEvent.type(input, "BasiQ UI");
    await expect(input).toHaveValue("BasiQ UI");
  },
};

export const Invalid: Story = {
  args: { invalid: true },
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-label="入力内容" invalid />
    </template>
  `),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "入力内容" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-label="入力内容" disabled />
    </template>
  `),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "入力内容" })).toBeDisabled();
  },
};

export const Sizes: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-label="Small" default-value="sm / 36px" size="sm" />
      <BasiqInput aria-label="Medium" default-value="md / 40px" size="md" />
      <BasiqInput aria-label="Large" default-value="lg / 44px" size="lg" />
    </template>
  `),
  render: () => ({
    components: { BasiqInput },
    template: `
      <div class="basiq-story basiq-form-story">
        <BasiqInput aria-label="Small" default-value="sm / 36px" size="sm" />
        <BasiqInput aria-label="Medium" default-value="md / 40px" size="md" />
        <BasiqInput aria-label="Large" default-value="lg / 44px" size="lg" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const small = canvas.getByRole("textbox", { name: "Small" });
    const medium = canvas.getByRole("textbox", { name: "Medium" });
    const large = canvas.getByRole("textbox", { name: "Large" });

    await expect(small.parentElement).toHaveStyle({ height: "36px" });
    await expect(medium.parentElement).toHaveStyle({ height: "40px" });
    await expect(large.parentElement).toHaveStyle({ height: "44px" });
    await expect(small).toHaveValue("sm / 36px");
    await expect(medium).toHaveValue("md / 40px");
    await expect(large).toHaveValue("lg / 44px");
  },
};

export const Adornments: Story = {
  parameters: createFixedVueSourceParameters(`
    <script setup lang="ts">
    import { SampleInfoIcon, SampleTagIcon } from "./icons";
    </script>

    <template>
      <BasiqInput
        aria-label="アイコン付き入力"
        :leading-icon="SampleTagIcon"
        :trailing-icon="SampleInfoIcon"
        placeholder="ラベルを入力"
      />
      <BasiqInput aria-label="金額">
        <template #leading>¥</template>
        <template #trailing>円</template>
      </BasiqInput>
    </template>
  `),
  render: () => ({
    components: { BasiqInput },
    setup: () => ({ SampleInfoIcon, SampleTagIcon }),
    template: `
      <div class="basiq-story basiq-form-story" style="max-width: 24rem">
        <BasiqInput
          aria-label="アイコン付き入力"
          :leading-icon="SampleTagIcon"
          :trailing-icon="SampleInfoIcon"
          placeholder="ラベルを入力"
        />
        <BasiqInput aria-label="金額">
          <template #leading><span>¥</span></template>
          <template #trailing><span>円</span></template>
        </BasiqInput>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const iconInput = canvas.getByRole("textbox", { name: "アイコン付き入力" });
    const amountInput = canvas.getByRole("textbox", { name: "金額" });

    await expect(iconInput.parentElement?.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(
      2,
    );
    await userEvent.click(canvas.getByText("円"));
    await expect(amountInput).toHaveFocus();
  },
};

export const DirectionAndOverflow: Story = {
  tags: ["regression"],
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput
        aria-label="RTL入力"
        clear-label="RTL入力を消去"
        clearable
        default-value="内容"
        dir="rtl"
      >
        <template #leading>先頭</template>
        <template #trailing>末尾</template>
      </BasiqInput>
    </template>
  `),
  render: () => ({
    components: { BasiqInput },
    template: `
      <div class="basiq-story basiq-form-story" style="max-width: 24rem">
        <BasiqInput
          data-testid="rtl-input"
          aria-label="RTL入力"
          clear-label="RTL入力を消去"
          clearable
          default-value="内容"
          dir="rtl"
        >
          <template #leading><span data-testid="rtl-leading">先頭</span></template>
          <template #trailing><span data-testid="rtl-trailing">末尾</span></template>
        </BasiqInput>
        <BasiqInput
          data-testid="narrow-input"
          aria-label="狭幅入力"
          clear-label="狭幅入力を消去"
          clearable
          default-value="内容"
          style="inline-size: 10rem"
        >
          <template #leading>非常に長い先頭装飾</template>
          <template #trailing>非常に長い末尾装飾</template>
        </BasiqInput>
        <BasiqInput
          data-testid="auto-direction-input"
          aria-label="自動方向入力"
          clear-label="自動方向入力を消去"
          clearable
          default-value="שלום"
          dir="auto"
        >
          <template #leading><span data-testid="auto-direction-leading">先頭</span></template>
          <template #trailing><span data-testid="auto-direction-trailing">末尾</span></template>
        </BasiqInput>
        <BasiqInput
          data-testid="hidden-input"
          aria-label="非表示入力"
          clear-label="非表示入力を消去"
          clearable
          default-value="非表示"
          hidden
        />
        <BasiqInput
          data-testid="until-found-input"
          aria-label="検索時に表示する入力"
          default-value="検索対象"
          hidden="until-found"
        />
        <BasiqInput
          data-testid="aria-hidden-input"
          aria-hidden="true"
          aria-label="ARIA非表示入力"
          clear-label="ARIA非表示入力を消去"
          clearable
          default-value="ARIA非表示"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rtlInput = canvas.getByTestId("rtl-input");
    const rtlSurface = rtlInput.parentElement;
    const leading = canvas.getByTestId("rtl-leading");
    const trailing = canvas.getByTestId("rtl-trailing");
    const clear = canvas.getByRole("button", { name: "RTL入力を消去" });

    await expect(rtlSurface).toHaveAttribute("dir", "rtl");
    await expect(getComputedStyle(rtlSurface!).direction).toBe("rtl");
    await expect(horizontalCenter(leading)).toBeGreaterThan(horizontalCenter(rtlInput));
    await expect(horizontalCenter(rtlInput)).toBeGreaterThan(horizontalCenter(trailing));
    await expect(horizontalCenter(trailing)).toBeGreaterThan(horizontalCenter(clear));

    const narrowInput = canvas.getByTestId("narrow-input");
    const narrowSurface = narrowInput.parentElement!;
    await expect(narrowSurface.scrollWidth).toBeLessThanOrEqual(narrowSurface.clientWidth);

    const autoDirectionInput = canvas.getByTestId("auto-direction-input");
    const autoDirectionSurface = autoDirectionInput.parentElement!;
    const autoDirectionLeading = canvas.getByTestId("auto-direction-leading");
    const autoDirectionTrailing = canvas.getByTestId("auto-direction-trailing");
    const autoDirectionClear = canvas.getByRole("button", { name: "自動方向入力を消去" });

    await expect(autoDirectionSurface).toHaveAttribute("dir", "auto");
    await expect(autoDirectionInput).toHaveAttribute("dir", "auto");
    await expect(getComputedStyle(autoDirectionInput).direction).toBe("rtl");
    await expect(getComputedStyle(autoDirectionSurface).direction).toBe("rtl");
    await expect(horizontalCenter(autoDirectionLeading)).toBeGreaterThan(
      horizontalCenter(autoDirectionInput),
    );
    await expect(horizontalCenter(autoDirectionInput)).toBeGreaterThan(
      horizontalCenter(autoDirectionTrailing),
    );
    await expect(horizontalCenter(autoDirectionTrailing)).toBeGreaterThan(
      horizontalCenter(autoDirectionClear),
    );

    await userEvent.clear(autoDirectionInput);
    await userEvent.type(autoDirectionInput, "hello");
    await expect(getComputedStyle(autoDirectionInput).direction).toBe("ltr");
    await expect(getComputedStyle(autoDirectionSurface).direction).toBe("ltr");
    await expect(horizontalCenter(autoDirectionLeading)).toBeLessThan(
      horizontalCenter(autoDirectionInput),
    );
    await expect(horizontalCenter(autoDirectionInput)).toBeLessThan(
      horizontalCenter(autoDirectionTrailing),
    );
    await expect(horizontalCenter(autoDirectionTrailing)).toBeLessThan(
      horizontalCenter(autoDirectionClear),
    );

    const hiddenInput = canvas.getByTestId("hidden-input");
    const hiddenSurface = hiddenInput.parentElement!;
    await expect(hiddenSurface).toHaveAttribute("hidden");
    await expect(hiddenSurface).not.toBeVisible();
    await expect(hiddenInput).not.toBeVisible();
    await expect(hiddenSurface.querySelector("button")).not.toBeVisible();

    const untilFoundInput = canvas.getByTestId("until-found-input");
    const untilFoundSurface = untilFoundInput.parentElement!;
    await expect(untilFoundSurface).toHaveAttribute("hidden", "until-found");
    await expect(getComputedStyle(untilFoundSurface).display).toBe("flex");
    await expect(getComputedStyle(untilFoundSurface).contentVisibility).toBe("hidden");

    const ariaHiddenInput = canvas.getByTestId("aria-hidden-input");
    const ariaHiddenSurface = ariaHiddenInput.parentElement!;
    await expect(ariaHiddenSurface).toHaveAttribute("aria-hidden", "true");
    await expect(ariaHiddenSurface).toHaveAttribute("inert");
    await expect(ariaHiddenInput).not.toHaveAttribute("aria-hidden");
    await expect(
      canvas.queryByRole("button", { name: "ARIA非表示入力を消去" }),
    ).not.toBeInTheDocument();
  },
};

export const Clearable: Story = {
  tags: ["regression"],
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput
        clearable
        clear-label="入力を消去"
        default-value="検索語"
        aria-label="編集可能な入力"
      />
    </template>
  `),
  render: () => ({
    components: { ClearableInputHarness },
    template: "<ClearableInputHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const document = canvasElement.ownerDocument;
    const uncontrolledInput = canvas.getByRole("textbox", { name: "編集可能な入力" });

    await userEvent.click(uncontrolledInput);
    const clearButton = canvas.getByRole("button", { name: "入力を消去" });
    const clearButtonWidth = clearButton.getBoundingClientRect().width;
    await userEvent.click(clearButton);
    await expect(uncontrolledInput).toHaveValue("");
    await expect(uncontrolledInput).toHaveFocus();
    await expect(clearButton).not.toBeVisible();
    await expect(clearButton.getBoundingClientRect().width).toBe(clearButtonWidth);
    await expect(clearButtonWidth).toBe(24);
    await expect(canvas.getByTestId("uncontrolled-events")).toHaveTextContent(
      '1/0/0/""/click/update>clear',
    );

    const controlledInput = canvas.getByRole("textbox", { name: "親が維持する入力" });
    await userEvent.click(controlledInput);
    await userEvent.tab();

    const controlledClear = canvas.getByRole("button", { name: "親が維持する入力を消去" });
    await expect(controlledClear).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(controlledInput).toHaveValue("親の値");
    await expect(document.activeElement).toBe(controlledInput);
    await expect(canvas.getByTestId("controlled-events")).toHaveTextContent('1/""/update>clear');
  },
};

export const DisabledFieldset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { DisabledFieldsetHarness },
    template: "<DisabledFieldsetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "fieldset内の入力" });
    const surface = input.parentElement!;
    const clear = surface.querySelector("button")!;
    const toggle = canvas.getByRole("button", { name: "fieldsetを切り替え" });

    await expect(input).toBeDisabled();
    await expect(clear.matches(":disabled")).toBe(true);
    await expect(clear).not.toBeVisible();
    await expect(getComputedStyle(surface).cursor).toBe("not-allowed");

    await userEvent.click(toggle);
    await expect(input).toBeEnabled();
    await expect(clear).toBeVisible();
    await expect(getComputedStyle(surface).cursor).toBe("text");

    await userEvent.click(toggle);
    await expect(input).toBeDisabled();
    await expect(clear).not.toBeVisible();

    await userEvent.click(toggle);
    await userEvent.click(canvas.getByRole("button", { name: "値を消去" }));
    await expect(input).toHaveValue("");
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
        <BasiqInput clearable clear-label="検索語を消去" default-value="BasiQ UI" />
      </BasiqFormField>
    </template>
  `),
  render: () => ({
    components: { BasiqFormField, BasiqInput },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqFormField
          label="検索語"
          description="タイトルと本文を検索します"
          required
        >
          <BasiqInput clearable clear-label="検索語を消去" default-value="BasiQ UI" />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "検索語" });

    await expect(input).toBeRequired();
    await expect(input).toHaveAccessibleDescription("タイトルと本文を検索します");
    await expect(canvas.getByRole("button", { name: "検索語を消去" })).toBeVisible();
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
    const input = canvas.getByRole("textbox", { name: "公開メソッド対象" }) as HTMLInputElement;

    await userEvent.click(canvas.getByRole("button", { name: "入力へフォーカス" }));
    await expect(input).toHaveFocus();

    await userEvent.click(canvas.getByRole("button", { name: "入力を全選択" }));
    await expect(input).toHaveFocus();
    await expect(input.selectionStart).toBe(0);
    await expect(input.selectionEnd).toBe(input.value.length);
  },
};

export const AriaInvalidReason: Story = {
  name: "ARIA invalid reason",
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqInput aria-invalid="grammar" aria-label="入力内容" />
    </template>
  `),
  render: () => ({
    components: { BasiqInput },
    template: `
      <div class="basiq-story" style="max-width: 24rem">
        <BasiqInput aria-invalid="grammar" aria-label="入力内容" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "入力内容" })).toHaveAttribute(
      "aria-invalid",
      "grammar",
    );
  },
};

export const ControlledFormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { ControlledResetHarness },
    template: "<ControlledResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "リセット対象" });

    await userEvent.clear(input);
    await userEvent.type(input, "変更後");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(input).toHaveValue("初期値");
  },
};

export const UncontrolledFormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { UncontrolledResetHarness },
    template: "<UncontrolledResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "リセット対象" });

    await userEvent.clear(input);
    await userEvent.type(input, "変更後");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(input).toHaveValue("初期値");
  },
};

export const CanceledFormReset: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { CanceledResetHarness },
    template: "<CanceledResetHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "キャンセル対象" });

    await userEvent.clear(input);
    await userEvent.type(input, "変更後");
    await userEvent.click(canvas.getByRole("button", { name: "リセット" }));
    await expect(input).toHaveValue("変更後");
  },
};

export const DynamicAria: Story = {
  tags: ["regression", "!autodocs"],
  parameters: controlsDisabledStoryParameters,
  render: () => ({
    components: { DynamicAriaHarness },
    template: "<DynamicAriaHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "動的なARIA" });

    await expect(input).toHaveAttribute("aria-describedby", "first-description");
    await expect(input).toHaveAttribute("aria-invalid", "false");
    await userEvent.click(canvas.getByRole("button", { name: "ARIAを更新" }));
    await expect(input).toHaveAttribute("aria-describedby", "second-description");
    await expect(input).toHaveAttribute("aria-invalid", "grammar");
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
    const input = canvas.getByRole("textbox", { name: "イベント対象" });
    const counts = canvas.getByTestId("event-counts");

    await userEvent.click(input);
    await userEvent.type(input, "A");
    await userEvent.tab();
    await expect(counts).toHaveTextContent("1/1/1/1");
    await expect(canvas.getByTestId("event-targets")).toHaveTextContent(
      "focus:INPUT,input:INPUT,change:INPUT,blur:INPUT",
    );
  },
};
