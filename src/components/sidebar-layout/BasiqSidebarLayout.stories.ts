import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";

import { createFixedVueSourceParameters } from "../../stories/storybook-parameters";
import BasiqThemeProvider from "../../theme/BasiqThemeProvider.vue";
import BasiqSidebarLayout from "./BasiqSidebarLayout.vue";

const meta = {
  title: "Layouts/SidebarLayout",
  component: BasiqSidebarLayout,
  tags: ["autodocs"],
  parameters: {
    controls: { disable: true },
  },
} satisfies Meta<typeof BasiqSidebarLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqSidebarLayout>
        <template #sidebar>
          <aside aria-label="Project navigation">
            <strong>Workspace</strong>
            <p>Sidebar content</p>
          </aside>
        </template>

        <main>
          <h1>Main content</h1>
        </main>
      </BasiqSidebarLayout>
    </template>
  `),
  render: () => ({
    components: { BasiqSidebarLayout },
    template: `
      <BasiqSidebarLayout data-testid="sidebar-layout" style="min-height: 100vh">
        <template #sidebar>
          <aside aria-label="Project navigation" style="padding: 24px">
            <strong>Workspace</strong>
            <p style="margin: 12px 0 0; color: var(--basiq-color-content-subtle)">
              Sidebar content
            </p>
          </aside>
        </template>

        <main style="padding: 32px">
          <h1 style="margin: 0 0 12px">Main content</h1>
        </main>
      </BasiqSidebarLayout>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const layout = canvas.getByTestId("sidebar-layout");
    const sidebar = canvas.getByRole("complementary", { name: "Project navigation" });

    await expect(sidebar).toBeVisible();
    await expect(canvas.getByRole("main")).toBeVisible();
    layout.setAttribute("dir", "rtl");
    await expect(sidebar.parentElement?.getBoundingClientRect().left).toBe(
      layout.getBoundingClientRect().left,
    );
    layout.removeAttribute("dir");
  },
};

export const LightAndDark: Story = {
  name: "Light / Dark",
  parameters: createFixedVueSourceParameters(`
    <template>
      <BasiqThemeProvider mode="light">
        <BasiqSidebarLayout>
          <template #sidebar>Light sidebar</template>
          Light main
        </BasiqSidebarLayout>
      </BasiqThemeProvider>

      <BasiqThemeProvider mode="dark">
        <BasiqSidebarLayout>
          <template #sidebar>Dark sidebar</template>
          Dark main
        </BasiqSidebarLayout>
      </BasiqThemeProvider>
    </template>
  `),
  render: () => ({
    components: { BasiqSidebarLayout, BasiqThemeProvider },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 28rem), 1fr)); min-height: 100vh">
        <BasiqThemeProvider mode="light" data-testid="light-layout" style="padding: 24px; background: var(--basiq-color-surface-muted)">
          <BasiqSidebarLayout data-testid="light-sidebar-layout" style="min-height: 20rem">
            <template #sidebar><div style="padding: 20px">Light sidebar</div></template>
            <div style="padding: 20px">Light main</div>
          </BasiqSidebarLayout>
        </BasiqThemeProvider>

        <BasiqThemeProvider mode="dark" data-testid="dark-layout" style="padding: 24px; background: var(--basiq-color-surface-muted)">
          <BasiqSidebarLayout data-testid="dark-sidebar-layout" style="min-height: 20rem">
            <template #sidebar><div style="padding: 20px">Dark sidebar</div></template>
            <div style="padding: 20px">Dark main</div>
          </BasiqSidebarLayout>
        </BasiqThemeProvider>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lightLayout = canvas.getByTestId("light-sidebar-layout");
    const darkLayout = canvas.getByTestId("dark-sidebar-layout");
    const lightSidebarBackground = getComputedStyle(lightLayout.children[0]).backgroundColor;
    const lightMainBackground = getComputedStyle(lightLayout.children[1]).backgroundColor;
    const darkSidebarBackground = getComputedStyle(darkLayout.children[0]).backgroundColor;
    const darkMainBackground = getComputedStyle(darkLayout.children[1]).backgroundColor;

    await expect(canvas.getByTestId("light-layout")).toHaveAttribute("data-basiq-theme", "light");
    await expect(canvas.getByTestId("dark-layout")).toHaveAttribute("data-basiq-theme", "dark");
    await expect(lightSidebarBackground).not.toBe(lightMainBackground);
    await expect(darkSidebarBackground).not.toBe(darkMainBackground);
    await expect(lightSidebarBackground).not.toBe(darkSidebarBackground);
    await expect(lightMainBackground).not.toBe(darkMainBackground);
  },
};
