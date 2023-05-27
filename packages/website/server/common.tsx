import path from "node:path";
import { ChunkExtractor } from "@loadable/server";
import { StaticRouter } from "react-router-dom/server";
import { renderToString } from "react-dom/server";

const nodeStats = path.resolve(
  process.cwd(),
  "./public/dist/node/loadable-stats.json",
);

const webStats = path.resolve(
  process.cwd(),
  "./public/dist/web/loadable-stats.json",
);

export const renderPage = (url: string): string => {
  const nodeExtractor = new ChunkExtractor({ statsFile: nodeStats });
  const { default: App } = nodeExtractor.requireEntrypoint();

  const webExtractor = new ChunkExtractor({ statsFile: webStats });
  const jsx = webExtractor.collectChunks(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );

  const html = renderToString(jsx);

  return `<!DOCTYPE html>
          <html lang = "en">
            <head>
            <title>ReactUse Docs</title>
            <meta name='google-site-verification' content='cYSXMQh7Yfm6rW16yR-5_x0jmMX_ABwMDwAoPPlPc1M'>
            <meta name="msvalidate.01" content="FCAB31FC7E191890AC6C3BC3A945596A" />
            <meta name="baidu-site-verification" content="code-WMH1e8oKID" />
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
