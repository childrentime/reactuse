import path from "path";
import assert from "assert";
import consola from "consola";
import { execSync as exec } from "child_process";
import { packages } from "./meta";
import fs from "fs-extra";
import fg from "fast-glob";
import { version } from "../package.json";

const rootDir = path.resolve(__dirname, "..");
const watch = process.argv.includes("--watch");

const FILES_COPY_ROOT = ["LICENSE", "README.md"];

const FILES_COPY_LOCAL = ["*.cjs", "*.mjs", "*.d.ts"];

assert(process.cwd() !== __dirname);

async function buildMetaFiles() {
  for (const name of packages) {
    const packageRoot = path.resolve(__dirname, "..", "packages", name);
    const packageDist = path.resolve(packageRoot, "dist");

    if (name === "core") {
      await fs.copyFile(
        path.join(rootDir, "README.md"),
        path.join(packageDist, "README.md")
      );
    }

    for (const file of FILES_COPY_ROOT) {
      await fs.copyFile(path.join(rootDir, file), path.join(packageDist, file));
    }

    const files = await fg(FILES_COPY_LOCAL, { cwd: packageRoot });
    for (const file of files) {
      await fs.copyFile(
        path.join(packageRoot, file),
        path.join(packageDist, file)
      );
    }

    const packageJSON = await fs.readJSON(
      path.join(packageRoot, "package.json")
    );
    for (const key of Object.keys(packageJSON.dependencies || {})) {
      if (key.startsWith("@reactuses/")) {
        packageJSON.dependencies[key] = version;
      }
    }
    await fs.writeJSON(path.join(packageDist, "package.json"), packageJSON, {
      spaces: 2,
    });
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
