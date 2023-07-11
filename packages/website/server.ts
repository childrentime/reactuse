import express from "express";
import type { ModuleNode } from "vite";

/**
 * @description dev ssr
 */
export async function createServer(root = process.cwd(), hmrPort?: number) {
  const app = express();

  const vite = await (
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

  app.use("*", async (req, res) => {
    try {
      const url = req.originalUrl;

      const { render } = await vite.ssrLoadModule("/src/main-node.tsx");

      const mod = (await vite.moduleGraph.getModuleByUrl(
        "/src/App.tsx",
      )) as ModuleNode;

      const assetsUrls = new Set<string>();
      const collectAssets = async (mod: ModuleNode) => {
        const deps = mod?.ssrTransformResult?.deps || [];
        for (const dep of deps) {
          if (
            dep.endsWith(".css")
            || dep.endsWith(".png")
            || dep.endsWith(".ico")
            || dep.endsWith("svg")
          ) {
            assetsUrls.add(dep);
          }
          else if (dep.endsWith(".tsx")) {
            const depModule = await vite.moduleGraph.getModuleByUrl(dep);
            depModule && collectAssets(depModule);
          }
        }
      };
      await collectAssets(mod);

      const appHtml = await render(url, [...assetsUrls]);
      const html = await vite.transformIndexHtml(url, appHtml);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    }
    catch (e: any) {
      vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return { app, vite };
}

createServer().then(({ app }) =>
  app.listen(8888, () => {
    console.log("http://localhost:8888");
  }),
);
