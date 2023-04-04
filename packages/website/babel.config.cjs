function isWebTarget(caller) {
  return Boolean(caller && caller.target === "web");
}

function isWebpack(caller) {
  return Boolean(caller && caller.name === "babel-loader");
}

export default (api) => {
  const web = api.caller(isWebTarget);
  const webpack = api.caller(isWebpack);
  const isDevelopment
    = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          useBuiltIns: web ? "entry" : undefined,
          corejs: web ? "core-js@3" : false,
          targets: !web ? { node: "current" } : undefined,
          modules: webpack ? false : "commonjs",
        },
      ],
      [
        "@babel/preset-react",
        {
          runtime: "automatic",
        },
      ],
      ["@babel/preset-typescript"],
    ],
    plugins: [
      [
        "@babel/plugin-transform-runtime",
        {
          corejs: 3,
        },
      ],
      ["@babel/plugin-syntax-dynamic-import"],
      ["@loadable/babel-plugin"],
      isDevelopment && "react-refresh/babel",
    ].filter(Boolean),
  };
};
