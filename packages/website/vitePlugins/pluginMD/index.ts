import type { Plugin } from "vite";
import fs from "fs-extra";
import { transformSync } from "@babel/core";
import markdown from "./markdown";
import { getMarkdownSection } from "./utils";

const fileRegex = /\.md$/;

const pkg = "core";

export default async function pluginMD(): Promise<Plugin> {
  return {
    name: "plugin-markdown",
    enforce: "pre",
    async transform(src: string, id: string) {
      if (fileRegex.test(id)) {
        const index = id.lastIndexOf("/");
        const prePath = id.slice(0, index);
        const name = prePath.slice(prePath.lastIndexOf("/") + 1);

        const { typeDeclarations } = await getMarkdownSection(pkg, name);

        const demoPath = id.replace("README.md", "demo.tsx");
        const demoString = fs.readFileSync(demoPath, "utf-8");
        const demoHtml = JSON.stringify(
          markdown.render(`\`\`\`typescript\n${demoString.trim()}\n\`\`\``),
        );
        const originHtml = JSON.stringify(markdown.render(src));
        const typeDeclarationsHtml = JSON.stringify(
          markdown.render(typeDeclarations),
        );

        const reactCode = `
        import Demo from '${demoPath}';
        function Layout() {
          return <div className="prose">
            <div dangerouslySetInnerHTML={{__html: ${originHtml}}} />
            <h2>Usage</h2>
            <div dangerouslySetInnerHTML={{__html: ${demoHtml}}} />
            <div>
              <h2>Example</h2>
              <div className="demo-container">
                <Demo />
              </div>
            </div>
            <div dangerouslySetInnerHTML={{__html: ${typeDeclarationsHtml}}} />
          </div>
        }
        `;

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
