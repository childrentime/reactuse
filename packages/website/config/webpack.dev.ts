import { development } from "./constant";
import webpack from "webpack";
import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import nodeExternals from "webpack-node-externals";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";

const target = "node";
const plugins: any[] = [new MiniCssExtractPlugin()];
if (development) {
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
  entry: path.resolve(__dirname, "../server/index.tsx"),
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "server.js",
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
  externals: [nodeExternals({})],
  optimization: {
    minimize: false,
  },
  plugins,
};

export default config;
