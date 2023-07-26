import path from "node:path";
import { fileURLToPath } from "node:url";
import type { InlineConfig } from "vite";
import { build as viteBuild } from "vite";
import fs, { createWriteStream } from "fs-extra";
import { SitemapStream } from "sitemap";
import { guideRoutes } from "./src/pages/guide";
import routesJSON from "./src/routes.json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routes = routesJSON.main.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);

const guides = guideRoutes.map(route => route.path);

const desc = path.resolve(__dirname, "./ssg");

const root = path.resolve(__dirname, "./");

/**
 * @description static file generation
 */
async function bundle() {
  const resolveViteConfig = async (ssr: boolean): Promise<InlineConfig> => {
    return {
      mode: "production",
      root,
      build: {
        minify: "esbuild",
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
        copyPublicDir: !ssr,
      },
    };
  };

  fs.removeSync("./ssg");
  fs.mkdirSync("./ssg");

  try {
    await Promise.all([
      viteBuild(await resolveViteConfig(false)),
      viteBuild(await resolveViteConfig(true)),
    ]);

    const { render } = await import("./dist/server/main-node.js");

    const assets = fs
      .readdirSync("./dist/client/assets")
      .map(asset => `/assets/${asset}`);

    fs.ensureDir(desc);
    fs.ensureDir(`${desc}/core`);
    fs.ensureDir(`${desc}/guide`);

    for (const route of routes) {
      const html = await render(`/${route}`, assets);
      await fs.writeFile(`${desc}/core/${route}.html`, html);
    }
    for (const route of guides) {
      const html = await render(`/${route}`, assets);
      await fs.writeFile(`${desc}/guide/${route}.html`, html);
    }
    const html = await render("/", assets);
    await fs.writeFile(`${desc}/index.html`, html);

    await fs.copy(path.resolve(__dirname, "./dist/client"), desc);

    // Generate site map
    const smStream = new SitemapStream({
      hostname: "https://www.reactuse.com",
    });
    const writeStream = createWriteStream(`${desc}/sitemap.xml`);
    smStream.pipe(writeStream);
    smStream.write({ url: "/" });
    for (const route of routes) {
      smStream.write({ url: `/core/${route}` });
    }
    for (const route of guides) {
      smStream.write({ url: `/guide/${route}` });
    }
    smStream.end();
  }
  catch (error) {
    console.log("error", error);
  }
}

bundle();
