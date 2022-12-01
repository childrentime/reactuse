import path from "path";
import assert from "assert";
import consola from "consola";
import { execSync as exec } from "child_process";
import fs from "fs-extra";
import fg from "fast-glob";

const rootDir = path.resolve(__dirname, "../../../");
const watch = process.argv.includes("--watch");

const FILES_COPY_ROOT = ["LICENSE", "README.md"];

const FILES_COPY_LOCAL = ["*.cjs", "*.mjs", "*.d.ts"];

assert(process.cwd() !== __dirname);

async function buildMetaFiles() {
  const packageRoot = path.resolve(__dirname, "../");
  const packageDist = path.resolve(packageRoot, "../dist");

  for (const file of FILES_COPY_ROOT) {
    await fs.copyFile(path.join(rootDir, file), path.join(packageRoot, file));
  }

  const files = await fg(FILES_COPY_LOCAL, { cwd: packageRoot });
  for (const file of files) {
    await fs.copyFile(
      path.join(packageRoot, file),
      path.join(packageDist, file)
    );
  }
}

async function build() {
  consola.info("Rollup");
  exec(`yarn run build:rollup${watch ? " -- --watch" : ""}`, {
    stdio: "inherit",
  });

  await buildMetaFiles();
}

build();
