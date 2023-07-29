import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pluginMD from "./vitePlugins/pluginMD";
import pluginRoutes from "./vitePlugins/pluginRoutes";

export default defineConfig(async () => {
  return {
    plugins: [
      react(),
      await pluginMD(),
      pluginRoutes(),
    ],
    ssgOptions: {
      rootContainerId: "main",
    },
  };
});
