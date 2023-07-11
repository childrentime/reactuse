import { Writable } from "node:stream";
import { StaticRouter } from "react-router-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import App from "./App";
import Document from "./Document";

const isDev = process.env.NODE_ENV !== "production";

const renderToString = (element: JSX.Element): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = renderToPipeableStream(element, {
      bootstrapModules: !isDev ? ["/main-web.js"] : ["/src/main-web.tsx"],
      onAllReady() {
        const chunks: Buffer[] = [];

        const writable = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(Buffer.from(chunk));
            callback();
          },
        });

        writable.on("error", error => reject(error));

        writable.on("finish", () => {
          resolve(Buffer.concat(chunks).toString("utf8"));
        });

        stream.pipe(writable);
      },
      onError(error) {
        reject(error);
      },
    });
  });

export const render = async (
  url: string,
  assets: string[],
): Promise<string> => {
  const jsx = (
    <Document assets={assets}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </Document>
  );

  const html = await renderToString(jsx);

  return html;
};
