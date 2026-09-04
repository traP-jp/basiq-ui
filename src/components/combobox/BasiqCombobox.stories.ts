import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { computed, defineComponent, ref } from "vue";

import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqAvatar from "../avatar/BasiqAvatar.vue";
import BasiqFormField from "../form-field/BasiqFormField.vue";
import type { BasiqComboboxItem } from "./BasiqCombobox.types";
import BasiqCombobox from "./BasiqCombobox.vue";

const members: BasiqComboboxItem[] = [
  { description: "@alice", label: "Alice", value: "alice" },
  { description: "@bob", label: "Bob", value: "bob" },
  { description: "Unavailable", disabled: true, label: "Carol", value: "carol" },
];

interface MemberWithProfile extends BasiqComboboxItem<string> {
  profileName: string;
}

const membersWithProfiles: MemberWithProfile[] = [
  { description: "@alice", label: "Alice", profileName: "Alice A.", value: "alice" },
  { description: "@bob", label: "Bob", profileName: "Bob B.", value: "bob" },
];

const meta: Meta = {
  title: "Components/Combobox",
  // Storybook's Vue renderer does not currently accept generic SFC types here.
  component: BasiqCombobox as never,
  tags: ["autodocs"],
  args: {
    items: members,
    placeholder: "Search members",
    portal: false,
  },
  argTypes: {
    filter: { control: false },
    getCreateLabel: { control: false },
    getRemoveLabel: { control: false },
    items: { control: false },
    portal: { control: false },
  },
  render: (args) => ({
    components: { BasiqCombobox },
    setup: () => ({ args }),
    template: `
      <div class="basiq-story" style="max-width: 24rem; min-height: 18rem">
        <BasiqCombobox v-bind="args" aria-label="Member" />
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj;

export const Single: Story = {};

export const SingleInteraction: Story = {
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Member" });
    const control = input.parentElement;

    await expect(control).not.toBeNull();
    await expect(getComputedStyle(input).borderTopWidth).toBe("0px");
    await expect(getComputedStyle(input).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(getComputedStyle(input).flexGrow).toBe("1");
    await userEvent.click(control!);
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute("aria-expanded", "true");

    await userEvent.type(input, "bo");
    const option = canvas.getByRole("option", { name: /Bob/ });
    await expect(canvas.getAllByRole("option")).toHaveLength(1);
    await expect(option).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("Bob");
  },
};

export const Multiple: Story = {
  args: {
    defaultValue: ["alice"],
    getRemoveLabel: (item: BasiqComboboxItem | undefined) => `Remove ${item?.label ?? "member"}`,
    multiple: true,
    name: "member",
  },
};

export const MultipleInteraction: Story = {
  ...Multiple,
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Member" });

    await expect(canvas.getByRole("button", { name: "Remove Alice" })).toBeInTheDocument();
    await userEvent.type(input, "bo");
    const option = canvas.getByRole("option", { name: /Bob/ });
    await expect(canvas.getAllByRole("option")).toHaveLength(1);
    await expect(option).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{Enter}{Escape}");
    await expect(canvas.getByRole("button", { name: "Remove Bob" })).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('input[name="member"]')).toHaveLength(2);
  },
};

const CreatableHarness = defineComponent({
  components: { BasiqCombobox },
  setup() {
    const items = ref<BasiqComboboxItem[]>([...members]);
    const value = ref<string | number | null>(null);

    function create(query: string) {
      items.value.push({ label: query, value: query });
      value.value = query;
    }

    return { create, items, value };
  },
  template: `
    <div class="basiq-story" style="max-width: 24rem; min-height: 18rem">
      <BasiqCombobox
        v-model="value"
        aria-label="Creatable member"
        creatable
        :get-create-label="(query) => \`Create &quot;\${query}&quot;\`"
        :items="items"
        :portal="false"
        @create="create"
      />
    </div>
  `,
});

const renderCreatable = () => ({
  components: { CreatableHarness },
  template: "<CreatableHarness />",
});

export const Creatable: Story = {
  render: renderCreatable,
};

export const CreatableInteraction: Story = {
  render: renderCreatable,
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Creatable member" });

    await userEvent.type(input, "Dave");
    const option = canvas.getByRole("option", { name: 'Create "Dave"' });
    await expect(canvas.getAllByRole("option")).toHaveLength(1);
    await expect(option).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("Dave");
  },
};

export const ExistingItemWinsOverCreate: Story = {
  args: {
    creatable: true,
    getCreateLabel: (query: string) => `Create "${query}"`,
  },
};

export const ExistingItemWinsOverCreateInteraction: Story = {
  ...ExistingItemWinsOverCreate,
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Member" });

    await userEvent.type(input, "alice");
    await expect(canvas.queryByText('Create "alice"')).not.toBeInTheDocument();
    const option = canvas.getByRole("option", { name: /Alice/ });
    await expect(canvas.getAllByRole("option")).toHaveLength(1);
    await expect(option).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("Alice");
  },
};

const ExternalSearchHarness = defineComponent({
  components: { BasiqCombobox },
  setup() {
    const query = ref("");
    const allItems = members.filter((item) => !item.disabled);
    const items = computed(() => {
      const normalized = query.value.toLocaleLowerCase();
      return allItems.filter((item) => item.label.toLocaleLowerCase().includes(normalized));
    });

    return { items, query };
  },
  template: `
    <div class="basiq-story" style="max-width: 24rem; min-height: 18rem">
      <BasiqCombobox
        v-model:search-term="query"
        aria-label="External search"
        :filter="false"
        :items="items"
        :portal="false"
        placeholder="Server-backed search"
      />
    </div>
  `,
});

export const ExternalSearch: Story = {
  render: () => ({
    components: { ExternalSearchHarness },
    template: "<ExternalSearchHarness />",
  }),
};

export const ExternalSearchInteraction: Story = {
  ...ExternalSearch,
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "External search" });

    await userEvent.type(input, "bo");
    const option = canvas.getByRole("option", { name: /Bob/ });
    await expect(canvas.getAllByRole("option")).toHaveLength(1);
    await expect(option).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("Bob");
  },
};

export const CustomFilterInteraction: Story = {
  args: {
    filter: (item: BasiqComboboxItem, query: string) =>
      item.label.toLocaleLowerCase().startsWith(query.trim().toLocaleLowerCase()),
  },
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Member" });

    await userEvent.type(input, "bo");
    const option = canvas.getByRole("option", { name: /Bob/ });
    await expect(canvas.getAllByRole("option")).toHaveLength(1);
    await expect(option).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("Bob");
  },
};

export const NoResultsInteraction: Story = {
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Member" });

    await userEvent.type(input, "nobody");
    const emptyOption = canvas.getByRole("option", { name: "No options" });
    await expect(emptyOption).toHaveAttribute("aria-disabled", "true");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
    await userEvent.keyboard("{Escape}");
  },
};

export const Loading: Story = {
  render: () => ({
    components: { BasiqCombobox },
    template: `
      <div class="basiq-story" style="max-width: 24rem; min-height: 12rem">
        <BasiqCombobox
          aria-label="Loading members"
          :items="[]"
          loading
          loading-text="Searching…"
          :open="true"
          :portal="false"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Loading members" });
    const listbox = canvas.getByRole("listbox", { name: "Loading members" });

    await expect(input).toHaveAttribute("aria-controls", listbox.id);
    await expect(listbox).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByRole("option", { name: "Searching…" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
};

export const Empty: Story = {
  render: () => ({
    components: { BasiqCombobox, BasiqFormField },
    template: `
      <div class="basiq-story" style="max-width: 24rem; min-height: 12rem">
        <BasiqFormField label="Empty members">
          <BasiqCombobox
            empty-text="No matching members"
            :items="[]"
            :open="true"
            :portal="false"
          />
        </BasiqFormField>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Empty members" });
    const listbox = canvas.getByRole("listbox", { name: "Empty members" });

    await expect(input).toHaveAttribute("aria-controls", listbox.id);
    await expect(canvas.getByRole("option", { name: "No matching members" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
};

export const ReadonlyAndDisabled: Story = {
  render: () => ({
    components: { BasiqCombobox },
    setup: () => ({ members }),
    template: `
      <div class="basiq-story" style="display: grid; gap: 12px; max-width: 24rem">
        <BasiqCombobox
          aria-label="Readonly member"
          default-value="alice"
          :items="members"
          readonly
        />
        <BasiqCombobox
          aria-label="Disabled member"
          default-value="alice"
          disabled
          :items="members"
        />
      </div>
    `,
  }),
};

export const ReadonlyAndDisabledInteraction: Story = {
  ...ReadonlyAndDisabled,
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const readonlyInput = canvas.getByRole("combobox", { name: "Readonly member" });
    const disabledInput = canvas.getByRole("combobox", { name: "Disabled member" });

    await userEvent.click(readonlyInput.parentElement!);
    await expect(readonlyInput).toHaveFocus();
    await expect(readonlyInput).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(disabledInput.parentElement!);
    await expect(disabledInput).not.toHaveFocus();
    await expect(disabledInput).toHaveAttribute("aria-expanded", "false");
  },
};

export const AvatarSlots: Story = {
  render: () => ({
    components: { BasiqAvatar, BasiqCombobox },
    setup: () => ({ membersWithProfiles }),
    template: `
      <div class="basiq-story" style="max-width: 24rem; min-height: 18rem">
        <BasiqCombobox
          aria-label="Member with avatar"
          default-value="alice"
          :items="membersWithProfiles"
          :portal="false"
        >
          <template #item-leading="{ item }">
            <BasiqAvatar alt="" :name="item.profileName" :size="24" />
          </template>
        </BasiqCombobox>
      </div>
    `,
  }),
};

export const AvatarSlotsInteraction: Story = {
  ...AvatarSlots,
  tags: ["regression", "!autodocs", "!dev"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Member with avatar" });

    await userEvent.click(input);
    await userEvent.type(input, "bob");
    await expect(input).toHaveValue("bob");
    const option = canvas.getByRole("option", { name: /Bob/ });
    await expect(canvas.getAllByRole("option")).toHaveLength(1);
    await expect(option).toHaveAttribute("data-highlighted");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("Bob");
  },
};

export const NarrowAndThemes: Story = {
  render: () => ({
    components: { BasiqCombobox, BasiqThemeProvider },
    setup: () => ({ members }),
    template: `
      <div class="basiq-story" style="display: grid; gap: 16px; max-width: 18rem">
        <BasiqThemeProvider mode="light" style="padding: 12px">
          <BasiqCombobox
            aria-label="Light member"
            :items="members"
            :portal="false"
            placeholder="A long placeholder wraps only outside"
          />
        </BasiqThemeProvider>
        <BasiqThemeProvider mode="dark" style="padding: 12px">
          <BasiqCombobox
            aria-label="Dark member"
            :items="members"
            placeholder="Search"
          />
        </BasiqThemeProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const input = canvas.getByRole("combobox", { name: "Dark member" });

    await userEvent.click(input);
    const listbox = await body.findByRole("listbox", { name: "Dark member" });
    await expect(listbox).toHaveAttribute("data-basiq-theme", "dark");
    await userEvent.keyboard("{Escape}");
  },
};
