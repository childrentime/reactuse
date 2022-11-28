import { execSync } from "child_process";
import path from "path";
import consola from "consola";
import { version } from "../package.json";

execSync("npm run update", { stdio: "inherit" });
execSync("npm run build", { stdio: "inherit" });

let command = "npm publish --access public";

if (version.includes("beta")) {
  command += " --tag beta";
}

execSync(command, {
  stdio: "inherit",
  cwd: path.resolve(__dirname, "dist"),
});
consola.success(`Published @reactuse/core`);
