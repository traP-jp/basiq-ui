import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    cssCodeSplit: true,
    lib: {
      entry: {
        index: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
        styles: fileURLToPath(
          new URL("./src/styles/index.css", import.meta.url),
        ),
      },
      formats: ["es"],
      cssFileName: "styles",
    },
    rollupOptions: {
      external: ["vue", "reka-ui"],
    },
  },
});
