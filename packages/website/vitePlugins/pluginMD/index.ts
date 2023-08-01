import type { Plugin } from "vite";
import fs from "fs-extra";
import { transformSync } from "@babel/core";
import markdown from "./markdown";
import { getMarkdownSection } from "./utils";
import { getHookTemplate, getNormalTemplate } from "./template";

const fileRegex = /\.md$/;

const pkg = "core";

export default async function pluginMD(): Promise<Plugin> {
  return {
    name: "plugin-markdown",
    enforce: "pre",
    async transform(src: string, id: string) {
      if (fileRegex.test(id)) {
        const isHook = id.includes("hooks");
        const getHookCode = async () => {
          const index = id.lastIndexOf("/");
          const prePath = id.slice(0, index);
          const name = prePath.slice(prePath.lastIndexOf("/") + 1);

          const { typeDeclarations, hookMeta } = await getMarkdownSection(pkg, name);

          const demoPath = id.replace("README.md", "demo.tsx");
          const demoString = fs.readFileSync(demoPath, "utf-8");
          const demoHtml = JSON.stringify(
            markdown.render(`\`\`\`typescript\n${demoString.trim()}\n\`\`\``),
          );
          let originHtml = markdown.render(src);
          originHtml = JSON.stringify(originHtml.replace("</h1>", `</h1>${hookMeta}`));
          const typeDeclarationsHtml = JSON.stringify(
            markdown.render(typeDeclarations),
          );

          return getHookTemplate(
            demoPath,
            originHtml,
            demoHtml,
            typeDeclarationsHtml,
          );
        };

        const getNormalCode = () => {
          const html = JSON.stringify(markdown.render(src));
          return getNormalTemplate(html);
        };

        const reactCode = isHook ? await getHookCode() : getNormalCode();

        try {
          const compiled = transformSync(reactCode, {
            ast: false,
            presets: [
              [
                "@babel/preset-react",
                {
                  runtime: "automatic",
                },
              ],
            ],
          })!.code;

          const code = `${compiled}\nexport default Layout\n`;

          return {
            code,
          };
        }
        catch (error) {
          console.log("error", error);
        }
      }
    },
  };
}
