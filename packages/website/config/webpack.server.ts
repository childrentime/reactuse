import path from "node:path";
import type webpack from "webpack";
import nodeExternals from "webpack-node-externals";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { serverOutput } from "./constant";

const target = "node";
const plugins = [new CleanWebpackPlugin()];

const config: webpack.Configuration = {
  name: target,
  mode: "development",
  target,
  entry: path.resolve(__dirname, "../server/dev.tsx"),
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  output: {
    path: serverOutput,
    filename: "[name].js",
    libraryTarget: "commonjs2",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "babel-loader",
          options: {
            caller: { target },
          },
        },
        exclude: /node_modules/,
      },

    ],
  },
  externals: [
    nodeExternals({
    }),
  ],
  optimization: {
    moduleIds: "named",
    chunkIds: "named",
  },
  plugins,
};

export default config;
