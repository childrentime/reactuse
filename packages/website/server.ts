import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { ModuleNode, ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production",
  hmrPort?: number,
) {
  const resolve = (p: string) => path.resolve(__dirname, p);

  const indexProd = isProd
    ? fs.readFileSync(resolve("dist/client/index.html"), "utf-8")
    : "";

  const app = express();

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite: ViteDevServer;
  if (!isProd) {
    vite = await (
      await import("vite")
    ).createServer({
      root,
      logLevel: "info",
      server: {
        middlewareMode: true,
        watch: {
          usePolling: true,
          interval: 100,
        },
        hmr: {
          port: hmrPort,
        },
      },
      appType: "custom",
    });
    app.use(vite.middlewares);
  }
  else {
    app.use((await import("compression")).default());
    app.use(
      (await import("serve-static")).default(resolve("dist/client"), {
        index: false,
      }),
    );
  }

  app.use("*", async (req, res) => {
    try {
      const url = req.originalUrl;

      let template, render;
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/main-node.tsx")).render;
      }
      else {
        template = indexProd;
        // @ts-expect-error js import
        render = (await import("./dist/server/main-node.js")).render;
      }

      const mod = await vite.moduleGraph.getModuleByUrl("/src/App.tsx") as ModuleNode;

      const cssUrls = new Set<string>();
      const collectCss = async (mod: ModuleNode) => {
        const deps = mod?.ssrTransformResult?.deps || [];
        for (const dep of deps) {
          if (dep.endsWith(".css")) {
            cssUrls.add(dep);
          }
          else if (dep.endsWith(".tsx")) {
            const depModule = await vite.moduleGraph.getModuleByUrl(dep);
            depModule && collectCss(depModule);
          }
        }
      };
      await collectCss(mod);

      const stylesTag = [...cssUrls]
        .map((url) => {
          return `<link rel="stylesheet" type="text/css" href="${url}">`;
        })
        .join("");

      const appHtml = render(url);

      const html = template
        .replace("<!--app-html-->", appHtml)
        .replace("<!--app-css-->", stylesTag);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    }
    catch (e) {
      !isProd && vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  // @ts-expect-error vite assigned
  return { app, vite };
}

createServer().then(({ app }) =>
  app.listen(8888, () => {
    console.log("http://localhost:8888");
  }),
);
