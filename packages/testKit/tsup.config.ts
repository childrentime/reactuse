import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["./index.ts"],
  clean: true,
  bundle: true,
  splitting: true,
  outDir: "dist",
  format: ["cjs", "esm"],
  dts: true,
  shims: true,
});
