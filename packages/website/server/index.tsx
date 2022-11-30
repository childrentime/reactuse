import path from "path";
import express from "express";
import { renderToString } from "react-dom/server";
import { ChunkExtractor } from "@loadable/server";
import webpackClient from "../config/webpack.client";
import webpackServer from "../config/webpack.server";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpack from "webpack";
import { StaticRouter } from "react-router-dom/server";
import { routes } from "../src/routes";
import fs from "fs-extra";

const app = express();

app.use(express.static(path.join(__dirname, "../public")));

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
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
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
  const compiler = webpack([webpackClient, webpackServer]);

  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: "/dist/web",
      writeToDisk(filePath) {
        return /dist\/node\//.test(filePath) || /loadable-stats/.test(filePath);
      },
    })
  );

  app.get("*", (req, res) => {
    const html = renderPage(req.url);
    res.set("content-type", "text/html");
    res.send(html);
  });

  app.listen(9000, () => console.log("Server started http://localhost:9000"));
}

// PRO SSG
if (process.env.NODE_ENV === "production") {
  const desc = path.resolve(__dirname, "../ssg");
  routes.push("index");
  for (const route of routes) {
    const html = renderPage(route);
    fs.ensureDir(desc);
    fs.writeFile(`${desc}/${route}.html`, html);
  }

  fs.copy(path.resolve(__dirname, "../public/"), desc);
}
