import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import { defineComponent, h } from "vue";

const checks = [
  "Inter 400／700とM PLUS 1p 400／700",
  "System／Light／Dark toolbar",
  "Vitest Browser ModeとPlaywright Chromium",
  "Storybook accessibility test",
];

const StorybookScaffold = defineComponent({
  name: "StorybookScaffold",
  setup() {
    return () =>
      h("main", { class: "storybook-scaffold" }, [
        h("p", { class: "storybook-scaffold-eyebrow" }, "BasiQ UI"),
        h("h1", "Storybook scaffold"),
        h(
          "p",
          { class: "storybook-scaffold-lead" },
          "Storybook、ブラウザテスト、アクセシビリティ検査、推奨フォントを確認するための開発専用storyです。",
        ),
        h(
          "section",
          {
            class: "storybook-scaffold-panel",
            "aria-labelledby": "scaffold-checks-title",
          },
          [
            h("h2", { id: "scaffold-checks-title" }, "Scaffold checks"),
            h(
              "ul",
              { class: "storybook-scaffold-checks" },
              checks.map((check) => h("li", { key: check }, check)),
            ),
          ],
        ),
      ]);
  },
});

const meta = {
  title: "Development/Storybook scaffold",
  component: StorybookScaffold,
  tags: ["test"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("heading", { level: 1, name: "Storybook scaffold" }),
    ).toBeVisible();
    await expect(canvasElement.querySelector(".basiq-storybook-root")).toHaveAttribute(
      "data-storybook-mode",
      String(globals.themeMode),
    );
  },
};
