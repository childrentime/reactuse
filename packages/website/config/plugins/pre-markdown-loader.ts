import type { LoaderContext } from "webpack";
import { getTypeDefinition, replacer } from "../../utils/utils";

export default async function (this: LoaderContext<never>, content: string) {
  const callback = this.async();

  const { resourcePath } = this;
  const [pkg, _hooks, name, _i] = resourcePath.split("\\").slice(-4);
  const { typeDeclarations } = await getMarkdownSection(pkg, name);

  content = replacer(content, typeDeclarations, "TYPE", "tail");

  callback(null, content);
}

export async function getMarkdownSection(pkg: string, name: string) {
  const types = await getTypeDefinition(pkg, name);

  let typingSection = "";

  if (types) {
    const code = `\`\`\`typescript\n${types.trim()}\n\`\`\``;
    typingSection = types.length > 1000
      ? `
## Type Declarations

>>> Show Type Declarations

${code}

>>>
`
      : `\n## Type Declarations\n\n${code}`;
  }

  const typeDeclarations = `${typingSection}\n`;

  return {
    typeDeclarations,
  };
}
