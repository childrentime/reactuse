/**
 * Remark plugin: replaces %%API%% placeholders with auto-generated API docs.
 *
 * Reads the API markdown from packages/website-docusaurus/api/ directory
 * and injects it into the document AST.
 */
import fs from "node:fs";
import path from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmTable } from "micromark-extension-gfm-table";
import { gfmTableFromMarkdown } from "mdast-util-gfm-table";
import { visit } from "unist-util-visit";

const aliases = {
  useClickAway: "useClickOutside",
  useCopyToClipboard: "useClipboard",
};

// API docs directory (relative to project root)
const API_DIR = path.resolve(
  process.cwd(),
  "../website-docusaurus/api"
);

export function remarkApiInject() {
  return (tree, file) => {
    const nodesToReplace = [];

    visit(tree, (node, index, parent) => {
      // Match paragraph nodes that contain %%API%%
      if (
        node.type === "paragraph" &&
        node.children?.length === 1 &&
        node.children[0].type === "text" &&
        node.children[0].value.trim() === "%%API%%"
      ) {
        nodesToReplace.push({ node, index, parent });
      }
    });

    for (const { node, index, parent } of nodesToReplace.reverse()) {
      // Derive hook name from file path
      const filePath = file.history?.[0] || file.path || "";
      const basename = path.basename(filePath, path.extname(filePath));
      const hookName = aliases[basename] || basename;

      // Read API doc
      const apiPath = path.join(API_DIR, `${hookName}-README.md`);
      if (!fs.existsSync(apiPath)) {
        // Remove the %%API%% placeholder silently
        parent.children.splice(index, 1);
        continue;
      }

      const apiContent = fs.readFileSync(apiPath, "utf-8");
      const apiAst = fromMarkdown(apiContent, {
        extensions: [gfmTable()],
        mdastExtensions: [gfmTableFromMarkdown()],
      });

      // Wrap with an "API" heading
      const apiNodes = [
        { type: "heading", depth: 2, children: [{ type: "text", value: "API" }] },
        ...apiAst.children,
      ];

      parent.children.splice(index, 1, ...apiNodes);
    }
  };
}
