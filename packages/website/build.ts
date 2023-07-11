import { build as viteBuild, InlineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import routesJSON from "./src/routes.json";
import fs, { createWriteStream } from "fs-extra";
import { SitemapStream } from "sitemap";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routes = routesJSON.main.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);

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

    // Generate site map
    const smStream = new SitemapStream({
      hostname: "https://www.reactuse.com",
    });
    const writeStream = createWriteStream(`${desc}/sitemap.xml`);
    smStream.pipe(writeStream);
    for (const route of routes) {
      smStream.write({ url: `/${route}` });
    }
    smStream.end();
  } catch (error) {
    console.log("error", error);
  }
}

bundle();
