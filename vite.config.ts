import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["vue"],
  },
  optimizeDeps: {
    include: ["reka-ui"],
  },
  build: {
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL("./src/entry.ts", import.meta.url)),
      fileName: "index",
      formats: ["es"],
      cssFileName: "styles",
    },
    rollupOptions: {
      external: ["vue", "reka-ui"],
    },
  },
});
