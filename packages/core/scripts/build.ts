import path from "node:path";
import assert from "node:assert";
import { execSync as exec } from "node:child_process";
import consola from "consola";
import fs from "fs-extra";
import fg from "fast-glob";

const rootDir = path.resolve(__dirname, "../../../");
const watch = process.argv.includes("--watch");

const FILES_COPY_ROOT = ["LICENSE", "README.md"];

const FILES_COPY_LOCAL = ["*.cjs", "*.mjs", "*.d.ts", "*.d.cts", "*.d.mts"];

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
      path.join(packageDist, file),
    );
  }
}

async function build() {
  consola.info("Bunchee");
  exec(`pnpm run build:bunchee${watch ? " -- --watch" : ""}`, {
    stdio: "inherit",
  });

  await buildMetaFiles();
}

build();
