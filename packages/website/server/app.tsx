import path from "node:path";
import webpack from "webpack";
import type { Express } from "express";
import express from "express";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";
import clearModule from "clear-module";
import webpackWebServerConfig from "../config/webpack.web.server";
import webpackWebClientConfig from "../config/webpack.web.client";
import webpackServerConfig from "../config/webpack.server";

const compiler = webpack(webpackWebClientConfig);

let app: Express;
let initialized = false;
const server = express();

const outputFilePath = path.join(webpackServerConfig.output!.path!, "main");

webpack(webpackWebServerConfig).watch(
  { aggregateTimeout: 300 },
  (error, stats) => {
    if (error) {
      throw error;
    }

    // nodejs hmr
    webpack(webpackServerConfig).run(() => {
      if (!stats!.hasErrors()) {
        if (initialized) {
          clearModule(outputFilePath);
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          app = require(outputFilePath).default;
        }
        else {
          console.log(`starting app.js at ${new Date().toLocaleString()}`);

          // eslint-disable-next-line @typescript-eslint/no-var-requires
          app = require(outputFilePath).default;

          server.use(
            "/static",
            express.static(path.join(__dirname, "../public")),
          );
          server.use("/", express.static(path.join(__dirname, "../public/")));

          const devMiddleware = webpackDevMiddleware(compiler, {
            publicPath: webpackWebClientConfig.output!.publicPath,
            writeToDisk(filePath) {
              return /\.json?$/.test(filePath) || /\/hot-update\//.test(filePath);
            },
            stats: {
              all: false,
              env: true,
              errors: true,
              errorDetails: true,
              timings: true,
            },
          });

          const hotMiddleware = webpackHotMiddleware(compiler, {
            log: (message) => {
              console.log("HMR LOGGER: ", message);
            },
            heartbeat: 2000,
          });

          server.use(devMiddleware);
          server.use(hotMiddleware);

          server.use((req, res, next) => {
            // @ts-expect-error express的内部方法
            app.handle(req, res, next);
          });

          const port = 3000;
          server.listen(port, () => {
            console.log(`server is listening on port: ${port}`);
          });

          initialized = true;
        }
      }
      else {
        if (!initialized) {
          throw new Error(stats!.toString());
        }
      }
    });
  },
);
