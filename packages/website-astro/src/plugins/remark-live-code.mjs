/**
 * Remark plugin: transforms ```tsx live code blocks into <LiveCode> React Islands.
 *
 * Also auto-injects the LiveCode import at the top of any MDX file
 * that contains live code blocks, so docs don't need manual imports.
 */
import { visit } from "unist-util-visit";

export function remarkLiveCode() {
  return (tree, file) => {
    let hasLiveCode = false;

    visit(tree, "code", (node, index, parent) => {
      const lang = node.lang || "";
      const meta = node.meta || "";

      if (lang === "tsx" && meta.includes("live")) {
        hasLiveCode = true;
        const noInline = meta.includes("noInline");
        const code = node.value;

        const jsxNode = {
          type: "mdxJsxFlowElement",
          name: "LiveCode",
          attributes: [
            { type: "mdxJsxAttribute", name: "client:visible", value: null },
            { type: "mdxJsxAttribute", name: "code", value: code },
            {
              type: "mdxJsxAttribute",
              name: "noInline",
              value: {
                type: "mdxJsxAttributeValueExpression",
                value: String(noInline),
                data: {
                  estree: {
                    type: "Program",
                    body: [{
                      type: "ExpressionStatement",
                      expression: { type: "Literal", value: noInline, raw: String(noInline) },
                    }],
                    sourceType: "module",
                  },
                },
              },
            },
          ],
          children: [],
        };

        parent.children.splice(index, 1, jsxNode);
      }
    });

    // Auto-inject LiveCode import if any live code blocks were found
    if (hasLiveCode) {
      tree.children.unshift({
        type: "mdxjsEsm",
        value: 'import LiveCode from "/src/components/LiveCode"',
        data: {
          estree: {
            type: "Program",
            sourceType: "module",
            body: [{
              type: "ImportDeclaration",
              specifiers: [{
                type: "ImportDefaultSpecifier",
                local: { type: "Identifier", name: "LiveCode" },
              }],
              source: { type: "Literal", value: "/src/components/LiveCode", raw: '"/src/components/LiveCode"' },
            }],
          },
        },
      });
    }
  };
}
