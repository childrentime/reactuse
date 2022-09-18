import esbuild from "rollup-plugin-esbuild";
import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";
import type { OutputOptions, RollupOptions } from "rollup";
import { packages } from "./meta";
import resolve from "@rollup/plugin-node-resolve";
import common from "@rollup/plugin-commonjs";

const esbuildPlugin = esbuild();

const dtsPlugin = dts();

const configs: RollupOptions[] = [];

for (const name of packages) {
  const input = `packages/${name}/index.ts`;
  const output: OutputOptions[] = [];
  output.push({
    file: `packages/${name}/dist/index.mjs`,
    format: "es",
  });
  output.push({
    file: `packages/${name}/dist/index.cjs`,
    format: "cjs",
  });
  configs.push({
    external: ["react", "lodash"],
    input,
    output,
    plugins: [
      esbuildPlugin,
      json(),
      resolve({ extensions: [".ts"] }),
      common(),
    ],
  });
  configs.push({
    external: ["react", "lodash"],
    input,
    output: {
      file: `packages/${name}/dist/index.d.ts`,
      format: "es",
    },
    plugins: [dtsPlugin, resolve({ extensions: [".ts"] }), common()],
  });
}

export default configs;
