import { development, serverOutput } from "./constant";
import webpack from "webpack";
import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import nodeExternals from "webpack-node-externals";
import LoadablePlugin from "@loadable/webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

const target = "node";
const plugins = [new LoadablePlugin() as any, new MiniCssExtractPlugin()];
if (development) {
  plugins.push(new CleanWebpackPlugin());
  plugins.push(new webpack.HotModuleReplacementPlugin());
  plugins.push(
    new ReactRefreshWebpackPlugin({
      overlay: {
        sockIntegration: "whm",
      },
    })
  );
}
// 服务端资源打包，需要抽取没有BroswerRoute的部分
const config: webpack.Configuration = {
  name: target,
  mode: development ? "development" : "production",
  target,
  entry: path.resolve(__dirname, "../src/main-node.tsx"),
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  output: {
    path: serverOutput,
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
      // 服务端资源打包不需要打包css到bundle
      // 但是需要将css抽取成为link标签插入到html中。
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
