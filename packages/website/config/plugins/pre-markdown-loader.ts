import { resolve, sep } from "node:path";
import type { LoaderContext } from "webpack";
import fs from "fs-extra";
import { getTypeDefinition, replacer } from "../../utils/utils";

const DIR_TYPES = resolve(__dirname, "../../../../types/packages");
const hasTypes = fs.existsSync(DIR_TYPES);
if (!hasTypes) {
  console.warn("No types dist found, run `npm run build:types` first.");
}

export default async function (this: LoaderContext<never>, content: string) {
  const callback = this.async();

  const { resourcePath } = this;
  const [pkg, _hooks, name, _i] = resourcePath.split(sep).slice(-4);
  const { typeDeclarations } = await getMarkdownSection(pkg, name);

  content = replacer(content, "%%DEMO%%", "DEMO", "tail");

  if (hasTypes) {
    content = replacer(content, typeDeclarations, "TYPE", "tail");
  }

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
