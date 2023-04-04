import path from "node:path";
import webpackDevMiddleware from "webpack-dev-middleware";
import express from "express";
import { webpack } from "webpack";
import webpackHotMiddleware from "webpack-hot-middleware";
import cors from "cors";
import nodemon from "nodemon";
import webpackServerConfig from "./webpack.server";
import webpackClientConfig from "./webpack.client";

const hmrServer = express();

const compiler = webpack([webpackClientConfig, webpackServerConfig]);

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

hmrServer.use(
  cors({
    origin(origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin)
        return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        const msg
          = "The CORS policy for this site does not "
          + "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  }),
);

hmrServer.use(
  webpackDevMiddleware(compiler, {
    publicPath: webpackClientConfig.output!.publicPath,
    serverSideRender: true,
    writeToDisk: true,
    stats: "errors-only",
  }),
);

hmrServer.use(
  webpackHotMiddleware(compiler, {
    path: "/static/__webpack_hmr",
  }),
);

// HMR服务器在另外一个端口
hmrServer.listen(3001, () => {
  console.log("HMR Server successfully started");
});

nodemon({
  script: path.resolve(__dirname, "../server/index.tsx"),
  watch: [
    path.resolve(__dirname, "../public/dist"),
    path.resolve(__dirname, "../server"),
  ],
  execMap: {
    tsx: "ts-node",
  },
});
