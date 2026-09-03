import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { defineComponent, ref, useTemplateRef } from "vue";

import {
  createFixedVueSourceParameters,
  createPlaygroundStoryParameters,
} from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqAvatar from "./BasiqAvatar.vue";

const sampleAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23126abf'/%3E%3Ccircle cx='50' cy='36' r='18' fill='white'/%3E%3Cpath d='M16 96c3-25 19-38 34-38s31 13 34 38' fill='white'/%3E%3C/svg%3E";
const alternateAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23c52233'/%3E%3Ccircle cx='50' cy='36' r='18' fill='white'/%3E%3Cpath d='M16 96c3-25 19-38 34-38s31 13 34 38' fill='white'/%3E%3C/svg%3E";
const brokenAvatar = "data:image/png;base64,broken";

const AvatarEventHarness = defineComponent({
  name: "AvatarEventHarness",
  components: { BasiqAvatar },
  setup() {
    const src = ref(sampleAvatar);
    const loadCount = ref(0);
    const errorCount = ref(0);
    const root = useTemplateRef<HTMLElement>("root");

    function handleLoad(event: Event) {
      loadCount.value += 1;
      root.value?.setAttribute("data-load-target", (event.currentTarget as Element).tagName);
    }

    function handleError(event: Event) {
      errorCount.value += 1;
      root.value?.setAttribute("data-error-target", (event.currentTarget as Element).tagName);
    }

    return {
      alternateAvatar,
      brokenAvatar,
      errorCount,
      handleError,
      handleLoad,
      loadCount,
      src,
    };
  },
  template: `
    <div ref="root" data-testid="event-harness">
      <BasiqAvatar
        data-testid="event-avatar"
        :src="src"
        alt="Avatar events"
        name="Ada Lovelace"
        @error="handleError"
        @load="handleLoad"
      />
      <output data-testid="load-count">{{ loadCount }}</output>
      <output data-testid="error-count">{{ errorCount }}</output>
      <button type="button" @click="src = alternateAvatar">Load next image</button>
      <button type="button" @click="src = brokenAvatar">Load broken image</button>
    </div>
  `,
});

const SourceChangeHarness = defineComponent({
  name: "AvatarSourceChangeHarness",
  components: { BasiqAvatar },
  setup() {
    const src = ref(sampleAvatar);

    return { alternateAvatar, brokenAvatar, src };
  },
  template: `
    <div class="basiq-story">
      <BasiqAvatar :src="src" alt="Source changes" name="Ada Lovelace" />
      <button type="button" @click="src = alternateAvatar">Change image</button>
      <button type="button" @click="src = brokenAvatar">Break image</button>
    </div>
  `,
});

const meta = {
  title: "Components/Avatar",
  component: BasiqAvatar,
  tags: ["autodocs"],
  args: {
    alt: "Ada Lovelace",
    name: "Ada Lovelace",
    shape: "circle",
    size: "md",
    src: sampleAvatar,
  },
  argTypes: {
    crossorigin: { control: "select", options: [undefined, "anonymous", "use-credentials"] },
    referrerpolicy: {
      control: "select",
      options: [undefined, "no-referrer", "origin", "strict-origin-when-cross-origin"],
    },
    shape: { control: "select", options: ["circle", "rounded", "square"] },
    size: { control: "select", options: ["sm", "md", "lg", 20, 24, 28, 32, 48] },
  },
  parameters: {
    controls: {
      disable: false,
      include: ["alt", "crossorigin", "name", "referrerpolicy", "shape", "size", "src"],
    },
  },
  render: (args) => ({
    components: { BasiqAvatar },
    setup: () => ({ args }),
    template: '<div class="basiq-story"><BasiqAvatar v-bind="args" /></div>',
  }),
} satisfies Meta<typeof BasiqAvatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: createPlaygroundStoryParameters((source) =>
    source.replace(/src="[^"]+"/, 'src="/avatar.png"'),
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByRole("img", { name: "Ada Lovelace" }).tagName).toBe("IMG");
    });
  },
};

export const Sizes: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqAvatar alt="Small" name="Small" size="sm" />
  <BasiqAvatar alt="Medium" name="Medium" size="md" />
  <BasiqAvatar alt="Large" name="Large" size="lg" />
  <BasiqAvatar alt="20 pixels" name="Compact" :size="20" />
  <BasiqAvatar alt="24 pixels" name="Compact" :size="24" />
  <BasiqAvatar alt="48 pixels" name="Profile" :size="48" />
</template>
`),
  render: () => ({
    components: { BasiqAvatar },
    template: `
      <div class="basiq-story">
        <BasiqAvatar data-testid="sm" alt="Small" name="Small" size="sm" />
        <BasiqAvatar data-testid="md" alt="Medium" name="Medium" size="md" />
        <BasiqAvatar data-testid="lg" alt="Large" name="Large" size="lg" />
        <BasiqAvatar data-testid="20" alt="20 pixels" name="Compact" :size="20" />
        <BasiqAvatar data-testid="24" alt="24 pixels" name="Compact" :size="24" />
        <BasiqAvatar data-testid="48" alt="48 pixels" name="Profile" :size="48" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const [testId, size] of Object.entries({
      sm: 36,
      md: 40,
      lg: 44,
      20: 20,
      24: 24,
      48: 48,
    })) {
      const bounds = canvas.getByTestId(testId).getBoundingClientRect();
      await expect(bounds.width).toBe(size);
      await expect(bounds.height).toBe(size);
    }
  },
};

export const Shapes: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqAvatar alt="Circle" name="Circle" shape="circle" />
  <BasiqAvatar alt="Rounded" name="Rounded" shape="rounded" />
  <BasiqAvatar alt="Square" name="Square" shape="square" />
</template>
`),
  render: () => ({
    components: { BasiqAvatar },
    template: `
      <div class="basiq-story">
        <BasiqAvatar data-testid="circle" alt="Circle" name="Circle" shape="circle" />
        <BasiqAvatar data-testid="rounded" alt="Rounded" name="Rounded" shape="rounded" />
        <BasiqAvatar data-testid="square" alt="Square" name="Square" shape="square" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("circle")).toHaveStyle({ borderRadius: "9999px" });
    await expect(canvas.getByTestId("rounded")).toHaveStyle({ borderRadius: "8px" });
    await expect(canvas.getByTestId("square")).toHaveStyle({ borderRadius: "0px" });
  },
};

export const Fallbacks: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqAvatar alt="Ada Lovelace" name="Ada Lovelace" />
  <BasiqAvatar alt="Compact Ada" name="Ada Lovelace" :size="20" />
  <BasiqAvatar alt="Unknown user" />
  <BasiqAvatar alt="Custom fallback" name="Ada Lovelace">
    <template #fallback="{ initials }">User {{ initials }}</template>
  </BasiqAvatar>
</template>
`),
  render: () => ({
    components: { BasiqAvatar },
    template: `
      <div class="basiq-story">
        <BasiqAvatar alt="Ada Lovelace" name="Ada Lovelace" />
        <BasiqAvatar alt="Compact Ada" name="Ada Lovelace" :size="20" />
        <BasiqAvatar data-testid="generic" alt="Unknown user" />
        <BasiqAvatar alt="Custom fallback" name="Ada Lovelace">
          <template #fallback="{ initials }"><strong>User {{ initials }}</strong></template>
        </BasiqAvatar>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("AL")).toBeVisible();
    await expect(canvas.getByText("A")).toBeVisible();
    await expect(canvas.getByText("User AL")).toBeVisible();
    await expect(canvas.getByTestId("generic").querySelector("svg")).toBeVisible();
  },
};

export const BrokenImage: Story = {
  args: { src: brokenAvatar },
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqAvatar alt="Ada Lovelace" name="Ada Lovelace" src="/missing-avatar.png" />
</template>
`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = canvasElement.querySelector("img");

    await waitFor(() => expect(image?.complete).toBe(true));
    await expect(canvas.getByRole("img", { name: "Ada Lovelace" }).tagName).toBe("SPAN");
    await expect(canvas.getByText("AL")).toBeVisible();
  },
};

export const SourceChanges: Story = {
  tags: ["regression", "!autodocs"],
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqAvatar :src="src" alt="Source changes" name="Ada Lovelace" />
</template>
`),
  render: () => ({
    components: { SourceChangeHarness },
    template: "<SourceChangeHarness />",
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByRole("img", { name: "Source changes" }).tagName).toBe("IMG");
    });
    await userEvent.click(canvas.getByRole("button", { name: "Change image" }));
    await waitFor(() => {
      const image = canvas.getByRole("img", { name: "Source changes" });
      expect(image.tagName).toBe("IMG");
      expect(image).toHaveAttribute("src", alternateAvatar);
    });
    await userEvent.click(canvas.getByRole("button", { name: "Break image" }));
    await waitFor(() => {
      expect(canvas.getByRole("img", { name: "Source changes" }).tagName).toBe("SPAN");
    });
  },
};

export const ImageEvents: Story = {
  tags: ["regression", "!autodocs"],
  render: () => ({
    components: { AvatarEventHarness },
    template: '<div class="basiq-story"><AvatarEventHarness /></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const avatar = canvas.getByTestId("event-avatar");
    const eventHarness = canvas.getByTestId("event-harness");
    const loadCount = canvas.getByTestId("load-count");
    const errorCount = canvas.getByTestId("error-count");

    await waitFor(() => expect(loadCount).toHaveTextContent("1"));
    await expect(eventHarness).toHaveAttribute("data-load-target", "IMG");

    avatar.dispatchEvent(new Event("load"));
    await expect(loadCount).toHaveTextContent("1");

    const firstImage = avatar.querySelector("img");
    await userEvent.click(canvas.getByRole("button", { name: "Load next image" }));
    firstImage?.dispatchEvent(new Event("error"));
    await waitFor(() => expect(loadCount).toHaveTextContent("2"));
    await expect(errorCount).toHaveTextContent("0");

    await userEvent.click(canvas.getByRole("button", { name: "Load broken image" }));
    await waitFor(() => expect(errorCount).toHaveTextContent("1"));
    await expect(eventHarness).toHaveAttribute("data-error-target", "IMG");
  },
};

export const CompactAdjacentLabel: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <span style="display: inline-flex; gap: 4px; align-items: center">
    <BasiqAvatar :size="20" alt="" name="Ada Lovelace" src="/avatar.png" />
    <span>Ada Lovelace</span>
  </span>
</template>
`),
  render: () => ({
    components: { BasiqAvatar },
    setup: () => ({ sampleAvatar }),
    template: `
      <div class="basiq-story">
        <span style="display: inline-flex; gap: 4px; align-items: center">
          <BasiqAvatar data-testid="compact-avatar" :size="20" alt="" name="Ada Lovelace" :src="sampleAvatar" />
          <span>Ada Lovelace</span>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const avatar = canvas.getByTestId("compact-avatar");

    await waitFor(() => expect(avatar.querySelector("img")).toBeVisible());
    await expect(avatar.getBoundingClientRect().width).toBe(20);
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
    await expect(canvas.getByText("Ada Lovelace")).toBeVisible();
  },
};

export const NativeImageAttributes: Story = {
  args: {
    crossorigin: "anonymous",
    referrerpolicy: "no-referrer",
  },
  tags: ["regression", "!autodocs"],
  play: async ({ canvasElement }) => {
    const image = canvasElement.querySelector("img");

    await waitFor(() => expect(image).toBeVisible());
    await expect(image).toHaveAttribute("crossorigin", "anonymous");
    await expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
    await expect(image).toHaveAttribute("draggable", "false");
    await expect(image).toHaveStyle({ objectFit: "cover", objectPosition: "50% 50%" });
  },
};

export const InsideButton: Story = {
  tags: ["regression", "!autodocs"],
  render: () => ({
    components: { BasiqAvatar },
    setup: () => ({ sampleAvatar }),
    template: `
      <div class="basiq-story">
        <button aria-label="Open Ada Lovelace's profile" type="button">
          <BasiqAvatar :src="sampleAvatar" alt="" name="Ada Lovelace" />
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Open Ada Lovelace's profile" });

    await waitFor(() => expect(button.querySelector("img")).toBeVisible());
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

export const LightAndDark: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqThemeProvider mode="light"><BasiqAvatar alt="Light" name="Light" /></BasiqThemeProvider>
  <BasiqThemeProvider mode="dark"><BasiqAvatar alt="Dark" name="Dark" /></BasiqThemeProvider>
</template>
`),
  render: () => ({
    components: { BasiqAvatar, BasiqThemeProvider },
    template: `
      <div class="basiq-story">
        <BasiqThemeProvider mode="light" style="padding: 16px"><BasiqAvatar alt="Light" name="Light" /></BasiqThemeProvider>
        <BasiqThemeProvider mode="dark" style="padding: 16px"><BasiqAvatar alt="Dark" name="Dark" /></BasiqThemeProvider>
      </div>
    `,
  }),
};

export const SurfacePlacement: Story = {
  parameters: createFixedVueSourceParameters(`
<template>
  <BasiqThemeProvider v-for="mode in ['light', 'dark']" :key="mode" :mode="mode">
    <section
      v-for="surface in ['base', 'container', 'muted']"
      :key="surface"
      :style="{ background: 'var(--basiq-color-surface-' + surface + ')' }"
    >
      <span>{{ mode }} / {{ surface }}</span>
      <BasiqAvatar :alt="mode + ' ' + surface" name="Ada Lovelace" />
    </section>
  </BasiqThemeProvider>
</template>
`),
  render: () => ({
    components: { BasiqAvatar, BasiqThemeProvider },
    setup: () => ({ modes: ["light", "dark"], surfaces: ["base", "container", "muted"] }),
    template: `
      <div class="basiq-story basiq-theme-comparison">
        <BasiqThemeProvider v-for="mode in modes" :key="mode" :mode="mode">
          <div style="display: grid; gap: 8px">
            <section
              v-for="surface in surfaces"
              :key="surface"
              :data-testid="mode + '-' + surface"
              :style="{
                alignItems: 'center',
                background: 'var(--basiq-color-surface-' + surface + ')',
                display: 'flex',
                gap: '12px',
                padding: '16px',
              }"
            >
              <BasiqAvatar :alt="mode + ' ' + surface" name="Ada Lovelace" />
              <span>{{ mode }} / {{ surface }}</span>
            </section>
          </div>
        </BasiqThemeProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const mode of ["light", "dark"]) {
      for (const surface of ["base", "container", "muted"]) {
        const placement = canvas.getByTestId(`${mode}-${surface}`);
        const avatar = placement.querySelector<HTMLElement>("[data-shape]");
        const surfaceColor = getComputedStyle(placement).backgroundColor;
        const avatarStyle = getComputedStyle(avatar!);

        await expect(avatar).toBeVisible();
        await expect(avatarStyle.color).not.toBe(avatarStyle.backgroundColor);
        if (surface === "muted") {
          await expect(avatarStyle.backgroundColor).toBe(surfaceColor);
        } else {
          await expect(avatarStyle.backgroundColor).not.toBe(surfaceColor);
        }
      }
    }
  },
};

export const ReservedSemantics: Story = {
  tags: ["regression", "!autodocs"],
  render: () => ({
    components: { BasiqAvatar },
    template: `
      <div class="basiq-story">
        <BasiqAvatar
          aria-label="Override"
          alt="Ada Lovelace"
          name="Ada Lovelace"
          role="button"
          tabindex="0"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = canvas.getByRole("img", { name: "Ada Lovelace" });
    const root = image.parentElement;

    await expect(root).not.toHaveAttribute("role", "button");
    await expect(root).not.toHaveAttribute("tabindex");
    await expect(root).not.toHaveAttribute("aria-label", "Override");
    await userEvent.tab();
    await expect(root).not.toHaveFocus();
  },
};
