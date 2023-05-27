import path from "node:path";
import fs, { createWriteStream } from "fs-extra";
import { SitemapStream } from "sitemap";
import routesJSON from "../src/routes.json";
import { renderPage } from "./common";

const routes = routesJSON.main.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);

const desc = path.resolve(__dirname, "../ssg");
for (const route of routes) {
  const html = renderPage(`/${route}`);
  fs.ensureDir(desc);
  fs.writeFile(`${desc}/${route}.html`, html);
}

const html = renderPage("/");
fs.writeFile(`${desc}/index.html`, html);

fs.copy(path.resolve(__dirname, "../public/"), desc);

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
