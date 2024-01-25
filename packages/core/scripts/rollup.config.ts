import path from "node:path";
import esbuild from "rollup-plugin-esbuild";
import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";
import type { OutputOptions, RollupOptions } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import common from "@rollup/plugin-commonjs";

const esbuildPlugin = esbuild();

const configs: RollupOptions[] = [];

const input = path.resolve(__dirname, "../hooks/index.ts");
const output: OutputOptions[] = [];
output.push({
  file: path.resolve(__dirname, "../dist/index.mjs"),
  format: "es",
});
output.push({
  file: path.resolve(__dirname, "../dist/index.cjs"),
  format: "cjs",
});
configs.push({
  external: ["react"],
  input,
  output,
  plugins: [esbuildPlugin, json(), resolve({ extensions: [".ts"] }), common()],
});
configs.push({
  external: ["react"],
  input,
  output: {
    file: path.resolve(__dirname, "../dist/index.d.mts"),
    format: "es",
  },
  plugins: [dts(), resolve({ extensions: [".ts"] }), common()],
});
configs.push({
  external: ["react"],
  input,
  output: {
    file: path.resolve(__dirname, "../dist/index.d.ts"),
    format: "cjs",
  },
  plugins: [dts(), resolve({ extensions: [".ts"] }), common()],
});
export default configs;
