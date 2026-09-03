import { describe, expect, it, vi } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import BasiqAvatar, { type BasiqAvatarProps } from "./BasiqAvatar.vue";

async function renderAvatar(
  props: BasiqAvatarProps & Record<string, unknown>,
  slots?: Record<string, (props: { initials?: string }) => ReturnType<typeof h>>,
) {
  return renderToString(createSSRApp({ render: () => h(BasiqAvatar, props, slots) }));
}

describe("BasiqAvatar SSR", () => {
  it("renders an accessible initials fallback at the default size", async () => {
    const html = await renderAvatar({ alt: "Ada Lovelace", name: "Ada Lovelace" });

    expect(html).toContain('data-shape="circle"');
    expect(html).toContain('data-size="md"');
    expect(html).toContain("--basiq-avatar-size:40px");
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Ada Lovelace"');
    expect(html).toContain(">AL</span>");
    expect(html).not.toContain("<img");
  });

  it("keeps fallback content decorative when alt is empty", async () => {
    const html = await renderAvatar({ alt: "", name: "Ada Lovelace" });

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("aria-label");
  });

  it("renders a hidden image and fallback with native image attributes before hydration", async () => {
    const html = await renderAvatar({
      alt: "Ada Lovelace",
      crossorigin: "anonymous",
      name: "Ada Lovelace",
      referrerpolicy: "no-referrer",
      size: 24,
      src: " https://example.com/avatar.png ",
    });

    expect(html).toContain("<img");
    expect(html).toContain('style="display:none;"');
    expect(html).toContain('alt="Ada Lovelace"');
    expect(html).toContain('crossorigin="anonymous"');
    expect(html).toContain('referrerpolicy="no-referrer"');
    expect(html).toContain('src="https://example.com/avatar.png"');
    expect(html).toContain('width="24"');
    expect(html).toContain('height="24"');
    expect(html).toContain('draggable="false"');
    expect(html).toContain(">A</span>");
  });

  it.each([
    { expected: "<svg", name: "Ada Lovelace", size: 16 },
    { expected: ">A</span>", name: "Ada Lovelace", size: 20 },
    { expected: ">A</span>", name: "Ada Lovelace", size: 28 },
    { expected: ">AL</span>", name: "Ada Lovelace", size: 32 },
    { expected: ">山太</span>", name: "山田 太郎", size: 40 },
    { expected: ">アリ</span>", name: "アリス", size: 40 },
    { expected: ">é</span>", name: "éclair", size: 20 },
    { expected: ">éc</span>", name: "éclair", size: 40 },
    { expected: ">👩‍💻</span>", name: "👩‍💻 Developer", size: 20 },
    { expected: ">👩‍💻D</span>", name: "👩‍💻 Developer", size: 40 },
  ])("uses a size-aware fallback for $size px", async ({ expected, name, size }) => {
    const html = await renderAvatar({ alt: name, name, size });

    expect(html).toContain(expected);
  });

  it("passes generated initials to a custom fallback", async () => {
    const html = await renderAvatar(
      { alt: "Ada Lovelace", name: "Ada Lovelace", shape: "rounded", size: "lg" },
      {
        fallback: ({ initials }) =>
          h("strong", { "data-initials": initials }, `Custom ${initials}`),
      },
    );

    expect(html).toContain('data-shape="rounded"');
    expect(html).toContain('data-size="lg"');
    expect(html).toContain("--basiq-avatar-size:44px");
    expect(html).toContain('data-initials="AL"');
    expect(html).toContain("Custom AL");
  });

  it("falls back to md and warns for an invalid numeric size", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const html = await renderAvatar({ alt: "Ada", name: "Ada", size: 12 });

    expect(html).toContain('data-size="custom"');
    expect(html).toContain("--basiq-avatar-size:40px");
    expect(warn).toHaveBeenCalledWith(
      "[BasiQ UI] BasiqAvatar size must be a finite integer greater than or equal to 16.",
    );
    warn.mockRestore();
  });

  it("forwards root attributes without allowing conflicting image semantics", async () => {
    const html = await renderAvatar({
      alt: "Ada",
      "aria-hidden": "true",
      "aria-label": "Override",
      "data-testid": "avatar",
      id: "user-avatar",
      name: "Ada",
      role: "button",
      tabindex: 0,
    });

    expect(html).toContain('id="user-avatar"');
    expect(html).toContain('data-testid="avatar"');
    expect(html).not.toContain('role="button"');
    expect(html).not.toContain("tabindex");
    expect(html).not.toContain('aria-label="Override"');
    expect(html).toContain('aria-label="Ada"');
  });
});
