import { dirname, resolve } from "node:path";
import fs from "node:fs";
import { generateMarkdown } from "ts-document";
import fg from "fast-glob";
import type { GenerateMarkdownConfig } from "ts-document/lib/interface";

const cwd = resolve(__dirname, "../src");
const interfaces = fg.sync("**/interface.ts", { cwd, absolute: true });
const config: GenerateMarkdownConfig = {
  sourceFilesPaths: interfaces,
  lang: "en",
};

for (const file of interfaces) {
  const res = generateMarkdown(file, config) as Record<string, string> | undefined;
  if (Object.keys(res ?? {}).length && res !== undefined) {
    const content = Object.values(res).join("\n\n");
    const temp = file.slice(0, file.lastIndexOf("/"));
    const name = temp.slice(temp.lastIndexOf("/") + 1);
    const doc = resolve(dirname(file), "../../../website-docusaurus/api/", `${name}-README.md`);
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
    const temp = file.slice(0, file.lastIndexOf("/"));
    const name = temp.slice(temp.lastIndexOf("/") + 1);
    const doc = resolve(dirname(file), "../../../website-docusaurus/api/", `${name}-README-zhHans.md`);
    fs.writeFileSync(doc, content);
  }
}
