import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pluginMD from "./vitePlugins/pluginMD";
import pluginRoutes from "./vitePlugins/pluginRoutes";
import { createSitemapGener } from "./scripts/sitemap-gen";

const sitemapGener = createSitemapGener();

export default defineConfig(async () => {
  return {
    plugins: [
      react(),
      await pluginMD(),
      pluginRoutes(),
    ],
    ssr: {
      noExternal: ["react-icons/**"],
    },
    ssgOptions: {
      rootContainerId: "main",
      onPageRendered: (route: string) => {
        sitemapGener.add(route);
      },
      onFinished: () => {
        sitemapGener.end();
      },
      includedRoutes: (paths: string[]) => {
        return paths.filter(path => !["core", "guide"].includes(path));
      },
    },
  };
});
