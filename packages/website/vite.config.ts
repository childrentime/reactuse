import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pluginMD from "./vitePlugins/pluginMD";

export default defineConfig(async () => {
  return {
    plugins: [
      await pluginMD(),
      react({
        include: /\.(md|js|jsx|ts|tsx)$/,
      }),
    ],
    build: {
      minify: "esbuild",
    },
  };
});
