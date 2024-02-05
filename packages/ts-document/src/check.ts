import { dirname, resolve } from "path";
import fs from "fs";
import fg from "fast-glob";
import { GenerateMarkdownConfig } from "./interface";
import generateMarkdown from "./generateMarkdown";

const cwd = resolve(__dirname, "./interfaces");
const interfaces = fg.sync(["interface1.ts","interface.ts",], { cwd, absolute: true });
const config: GenerateMarkdownConfig = {
  sourceFilesPaths: interfaces,
  lang: "en",
};

for (const file of interfaces) {
  const res = generateMarkdown(file, config) as Record<string, string> | undefined;
  if (Object.keys(res ?? {}).length && res !== undefined) {
    const content = Object.values(res).join("\n\n");
    const temp = file.slice(file.lastIndexOf("/"));
    const name = temp.slice(temp.lastIndexOf("/") + 1);
    const doc = resolve(dirname(file), "../api/", `${name}-README.md`);
    fs.writeFileSync(doc, content);
  }
}

const cnconfig: GenerateMarkdownConfig = {
  sourceFilesPaths: interfaces,
  lang: "zh",
};

for (const file of interfaces) {
  const res = generateMarkdown(file, cnconfig) as Record<string, string> | undefined;
  if (Object.keys(res ?? {}).length && res !== undefined) {
    const content = Object.values(res).join("\n\n");
    const temp = file.slice(file.lastIndexOf("/"));
    const name = temp.slice(temp.lastIndexOf("/") + 1);
    const doc = resolve(dirname(file), "../api/", `${name}-README-zhHans.md`);
    fs.writeFileSync(doc, content);
  }
}
