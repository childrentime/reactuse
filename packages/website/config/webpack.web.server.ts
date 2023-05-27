import path from "node:path";
import type webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import nodeExternals from "webpack-node-externals";
import LoadablePlugin from "@loadable/webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { development, serverWebOutput } from "./constant";

const target = "node";
const plugins = [new LoadablePlugin() as any, new MiniCssExtractPlugin()];
if (development) {
  plugins.push(new CleanWebpackPlugin());
  plugins.push(
    new ReactRefreshWebpackPlugin(),
  );
}
// 服务端资源打包，需要抽取没有BroswerRoute的部分
const config: webpack.Configuration = {
  name: target,
  mode: development ? "development" : "production",
  target,
  entry: {
    main: path.resolve(__dirname, "../src/main-node.tsx"),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  output: {
    path: serverWebOutput,
    publicPath: development ? `/static/dist/${target}/` : `/dist/${target}/`,
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
      {
        test: /\.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          "css-loader",
        ],
        exclude: /\.module\.css$/,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: {
                localIdentName: development ? "[name]_[local]_[hash:base64:5]" : "[hash:base64:8]",
              },
            },
          },
        ],
        include: /\.module\.css$/,
      },
      {
        test: /\.(png|jpg|gif|svg|svg+xml)$/i,
        type: "asset",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf|ico)$/i,
        type: "asset",
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              caller: { target },
            },
          },
          {
            loader: path.resolve(__dirname, "./plugins/markdown-loader.ts"),
          },
          {
            loader: path.resolve(__dirname, "./plugins/pre-markdown-loader.ts"),
          },
        ],
      },
    ],
  },
  externals: [
    "@loadable/component",
    nodeExternals({
      allowlist: [/\.(css)$/],
    }),
  ],
  optimization: {
    moduleIds: "named",
    chunkIds: "named",
  },
  plugins,
};

export default config;
