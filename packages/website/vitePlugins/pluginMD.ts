import path from "node:path";
import markdown from "../utils/markdown";
import { getMarkdownSection } from "../config/plugins/pre-markdown-loader";

const fileRegex = /\.md$/;

const pkg = "core";

export default async function pluginMD() {
  return {
    name: "plugin-markdown",

    async transform(src: string, id: string) {
      if (fileRegex.test(id)) {
        const index = id.lastIndexOf(path.sep);
        const prePath = id.slice(0, index);
        const name = prePath.slice(prePath.lastIndexOf(path.sep) + 1);

        const { typeDeclarations } = await getMarkdownSection(pkg, name);

        const demoPath = id.replace("README.md", "demo.tsx");
        const originHtml = markdown.render(src);

        // FIXME vite need return js systax
        const code = `
        import Demo from '${demoPath}';
        function Layout() (
          <div className="prose">
            <div dangerouslySetInnerHTML={{__html: ${originHtml}}} />
            <div>
              <h2>Example</h2>
              <div className="demo-container">
                <Demo />
              </div>
            </div>
            <div dangerouslySetInnerHTML={{__html: ${typeDeclarations}}} />
          </div>
        )
        export default Layout;
        `;

        return {
          code: JSON.stringify(code),
        };
      }
    },
  };
}
