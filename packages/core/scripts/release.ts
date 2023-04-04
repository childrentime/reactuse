import { execSync } from "node:child_process";
import { readJSONSync } from "fs-extra";

const { version } = readJSONSync("package.json");

execSync("git add .", { stdio: "inherit" });

execSync(`git commit -m "chore: release v${version}"`, { stdio: "inherit" });
execSync(`git tag -a v${version} -m "v${version}"`, { stdio: "inherit" });
