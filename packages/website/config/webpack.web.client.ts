import path from "node:path";
import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import LoadablePlugin from "@loadable/webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { clientWebOutput, development } from "./constant";

const target = "web";

const plugins = [new LoadablePlugin({ writeToDisk: true }) as any, new MiniCssExtractPlugin()];
if (development) {
  plugins.push(new CleanWebpackPlugin());
  plugins.push(new webpack.HotModuleReplacementPlugin());
  plugins.push(
    new ReactRefreshWebpackPlugin({
      overlay: {
        sockIntegration: "whm",
      },
    }),
  );
}

const config: webpack.Configuration = {
  name: target,
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  devtool: development ? "source-map" : false,
  mode: development ? "development" : "production",
  entry: development
    ? [
        path.resolve(__dirname, "../src/main-web.tsx"),
        "webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true&noInfo=true",
      ]
    : path.resolve(__dirname, "../src/main-web.tsx"),
  output: {
    path: clientWebOutput,
    publicPath: development ? `/static/dist/${target}/` : `/dist/${target}/`,
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
  plugins,
};

export default config;
