import path from "path";
import { packages } from "./meta";
import fs from "fs-extra";
import { version } from "../package.json";

async function updateWebsiteImport() {
  const packageRoot = path.resolve(__dirname, "..", "packages", "website");
  const packageJSON = await fs.readJSON(path.join(packageRoot, "package.json"));
  for (const name of packages) {
    if (packageJSON.dependencies?.[`@reactuses/${name}`]) {
      packageJSON.dependencies[`@reactuses/${name}`] = version;
    }
    if (packageJSON.devDependencies?.[`@reactuses/${name}`]) {
      packageJSON.devDependencies[`@reactuses/${name}`] = version;
    }
  }
  await fs.writeJSON(path.join(packageRoot, "package.json"), packageJSON, {
    spaces: 2,
  });
}

async function updatePackageJSON() {
  for (const name of packages) {
    const packageRoot = path.resolve(__dirname, "..", "packages", name);
    const packageJSON = await fs.readJSON(
      path.join(packageRoot, "package.json")
    );
    packageJSON.version = version;
    await fs.writeJSON(path.join(packageRoot, "package.json"), packageJSON, {
      spaces: 2,
    });
  }
}

async function run() {
  await Promise.all([updateWebsiteImport(), updatePackageJSON()]);
}

run();
