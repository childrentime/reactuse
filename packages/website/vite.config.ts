import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pluginMD from "./vitePlugins/pluginMD";

export default defineConfig(async () => {
  return {
    plugins: [
      react(),
      await pluginMD(),
    ],
    build: {
      minify: "esbuild",
    },
  };
});
