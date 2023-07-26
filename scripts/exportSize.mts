import { getExportsSize } from "export-size";
import { markdownTable } from "markdown-table";
import filesize from "filesize";
import fs from "fs-extra";
import { version } from "@reactuses/core/package.json";

async function run() {
  let md = "# Export size\n\n";
  const mdJSON = {} as { [name: string]: string };
  md
    += "generated by [export-size](https://github.com/antfu/export-size)<br>\n";
  md += `version: ${version}<br>\n`;
  md += `date: ${new Date().toISOString()}\n\n`;

  md
    += "> Please note this is bundle size for each individual APIs (excluding React). ";
  md
    += "Depends on the bundler and minifier you use, the final result might vary, this list is for reference only.";
  md += "\n\n";

  const { exports, packageJSON } = await getExportsSize({
    pkg: "./packages/core/",
    output: false,
    bundler: "rollup",
    external: ["react"],
    includes: ["lodash-es", "js-cookie", "screenfull"],
  });

  md += `<kbd>${packageJSON.name}</kbd>\n\n`;

  md += markdownTable([
    ["Function", "min+gzipped"],
    ...exports.map((i) => {
      mdJSON[i.name] = filesize(i.minzipped);
      return [`\`${i.name}\``, filesize(i.minzipped)];
    }),
  ]);

  md += "\n\n";

  const markdownPath = "packages/website/src/pages/guide/exportSize.md";
  fs.removeSync(markdownPath);
  await fs.writeFile(markdownPath, md, "utf-8");
}

run();