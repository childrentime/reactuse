import webpack from "webpack";
import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { clientOutput, development } from "./constant";
import LoadablePlugin from "@loadable/webpack-plugin";

const target = "web";
const config: webpack.Configuration = {
  name: target,
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  mode: development ? "development" : "production",
  entry: path.resolve(__dirname, "../src/main-web.tsx"),
  output: {
    path: clientOutput,
    publicPath: `/dist/${target}/`,
    filename: "[name].js",
  },
  target,
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
              modules: true,
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
        use: {
          loader: path.resolve(__dirname, "./markdown-loader.ts"),
        },
      },
    ],
  },
  plugins: [new LoadablePlugin() as any, new MiniCssExtractPlugin()],
};

export default config;
