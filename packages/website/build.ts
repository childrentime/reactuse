import { build as viteBuild, InlineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pluginMD from "./vitePlugins/pluginMD";
import pluginRoutes from "./vitePlugins/pluginRoutes";
import path from "path";
import { fileURLToPath } from "url";
import routesJSON from "./src/routes.json";
import fs from "fs-extra";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routes = routesJSON.main.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);

const desc = path.resolve(__dirname, "./viteSSG");

const root = path.resolve(__dirname, "./");

/**
 * @description static file generation
 */
async function bundle() {
  const resolveViteConfig = async (ssr: boolean): Promise<InlineConfig> => {
    return {
      mode: "production",
      plugins: [await pluginMD(), react(), pluginRoutes()],
      root,
      build: {
        minify: false,
        ssr,
        outDir: ssr
          ? path.join(root, "./dist/server")
          : path.join(root, "./dist/client"),
        rollupOptions: {
          input: ssr
            ? path.join(root, "./src/main-node.tsx")
            : path.join(root, "./src/main-web.tsx"),
          output: {
            format: "esm",
            entryFileNames: ssr ? "main-node.js" : "main-web.js",
          },
        },
        copyPublicDir: ssr ? false : true,
      },
    };
  };

  fs.removeSync("./viteSSG");
  fs.mkdirSync("./viteSSG");

  try {
    await Promise.all([
      viteBuild(await resolveViteConfig(false)),
      viteBuild(await resolveViteConfig(true)),
    ]);

    const { render } = await import("./dist/server/main-node.js");

    const assets = fs
      .readdirSync("./dist/client/assets")
      .map((asset) => `/assets/${asset}`);

    for (const route of routes) {
      const html = await render(`/${route}`, assets);

      fs.ensureDir(desc);
      fs.writeFile(`${desc}/${route}.html`, html);
    }

    const html = await render("/", assets);
    fs.writeFile(`${desc}/index.html`, html);

    fs.copy(path.resolve(__dirname, "./dist/client"), desc);

    console.log("finish");
  } catch (error) {
    console.log("error", error);
  }
}

bundle();
