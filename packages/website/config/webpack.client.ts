import webpack from "webpack";
import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { clientOutput, development } from "./constant";
import LoadablePlugin from "@loadable/webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";

const target = "web";

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
        "webpack-hot-middleware/client?path=//localhost:3001/static/__webpack_hmr&name=client",
      ]
    : path.resolve(__dirname, "../src/main-web.tsx"),
  output: {
    path: clientOutput,
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
                localIdentName: "[local]--[hash:base64:5]",
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
        use: {
          loader: path.resolve(__dirname, "./markdown-loader.ts"),
        },
      },
    ],
  },
  plugins,
};

export default config;
