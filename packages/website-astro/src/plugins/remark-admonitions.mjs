/**
 * Remark plugin: transforms Docusaurus-style admonitions (:::note, :::tip, etc.)
 * into HTML <aside> elements.
 *
 * Requires remark-directive to parse the ::: syntax into directive AST nodes.
 *
 * Input:
 *   :::note
 *   Some content
 *   :::
 *
 * Output:
 *   <aside class="admonition admonition-note"><p class="admonition-title">Note</p>...content...</aside>
 */
import { visit } from "unist-util-visit";

const TYPES = new Set(["note", "tip", "info", "warning", "danger", "caution"]);

export function remarkAdmonitions() {
  return (tree) => {
    visit(tree, (node) => {
      // remark-directive creates containerDirective nodes for :::name blocks
      if (node.type !== "containerDirective") return;
      if (!TYPES.has(node.name)) return;

      const type = node.name;
      const title = type.charAt(0).toUpperCase() + type.slice(1);

      // Convert the directive node into HTML wrapper
      const data = node.data || (node.data = {});
      data.hName = "aside";
      data.hProperties = {
        class: `admonition admonition-${type}`,
      };

      // Prepend a title paragraph
      node.children.unshift({
        type: "paragraph",
        data: {
          hName: "p",
          hProperties: { class: "admonition-title" },
        },
        children: [{ type: "text", value: title }],
      });
    });
  };
}
