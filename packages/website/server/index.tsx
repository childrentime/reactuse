import path from "path";
import express from "express";
import { renderToString } from "react-dom/server";
import { ChunkExtractor } from "@loadable/server";
import { StaticRouter } from "react-router-dom/server";
import { routes } from "../src/routes";
import fs from "fs-extra";
import livereload from "livereload";
import connectLiveReload from "connect-livereload";

const nodeStats = path.resolve(
  __dirname,
  "../public/dist/node/loadable-stats.json"
);

const webStats = path.resolve(
  __dirname,
  "../public/dist/web/loadable-stats.json"
);

const renderPage = (url: string): string => {
  const nodeExtractor = new ChunkExtractor({ statsFile: nodeStats });
  const { default: App } = nodeExtractor.requireEntrypoint();

  const webExtractor = new ChunkExtractor({ statsFile: webStats });
  const jsx = webExtractor.collectChunks(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );

  const html = renderToString(jsx);

  return `<!DOCTYPE html>
          <html lang = "en">
            <head>
            <title>ReactUse Docs</title>
            <meta name='google-site-verification' content='cYSXMQh7Yfm6rW16yR-5_x0jmMX_ABwMDwAoPPlPc1M'>
            <meta property="og:type" content="website">
            <meta property="og:url" content="https://reactuse.com/">
            <meta property="og:title" content="ReactUse Docs">
            <meta property="og:description" content="Collection of essential React Hooks Utilities.">
            <meta charset="UTF-8">
            <meta name='keywords' content='reactuse,react' />
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name='description' content='Collection of essential React Hooks Utilities.' />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${webExtractor.getLinkTags()}
            ${webExtractor.getStyleTags()}
            </head>
            <body>
              <div id="main">${html}</div>
              ${webExtractor.getScriptTags()}
            </body>
          </html>`;
};

// DEV SSR
if (process.env.NODE_ENV !== "production") {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });

  const app = express();

  app.use(connectLiveReload());
  app.use("/static", express.static(path.join(__dirname, "../public")));
  app.use("/", express.static(path.join(__dirname, "../public/")));
  app.get("*", (req, res) => {
    const html = renderPage(req.url);
    res.set("content-type", "text/html");
    res.send(html);
  });

  app.listen(3000, () => console.log("Server started http://localhost:3000"));
}

// PRO SSG
if (process.env.NODE_ENV === "production") {
  const desc = path.resolve(__dirname, "../ssg");
  for (const route of routes) {
    const html = renderPage(`/${route}`);
    fs.ensureDir(desc);
    fs.writeFile(`${desc}/${route}.html`, html);
  }

  const html = renderPage("/");
  fs.writeFile(`${desc}/index.html`, html);

  fs.copy(path.resolve(__dirname, "../public/"), desc);
}
