import path from "node:path";
import fs from "fs-extra";

const { resolve, join } = path.posix;
const DIR_TYPES = resolve(__dirname, "../../../../types/packages");

export async function getTypeDefinition(
  pkg: string,
  name: string,
): Promise<string | undefined> {
  const typingFilepath = join(DIR_TYPES, `${pkg}/hooks/${name}/index.d.ts`);

  if (!fs.existsSync(typingFilepath))
    return;

  let types = await fs.readFile(typingFilepath, "utf-8");

  if (!types)
    return;

  types = types
    .replace(/import\(.*?\)\./g, "")
    .replace(/import[\s\S]+?from ?["'][\s\S]+?["']/g, "")
    .replace(/export {}/g, "");

  const prettier = await import("prettier");
  return prettier
    .format(types, {
      semi: false,
      parser: "typescript",
    })
    .trim();
}

export function replacer(
  code: string,
  value: string,
  key: string,
  insert: "head" | "tail" | "none" = "none",
) {
  const START = `<!--${key}_STARTS-->`;
  const END = `<!--${key}_ENDS-->`;
  const regex = new RegExp(`${START}[\\s\\S]*?${END}`, "im");

  const target = value ? `${START}\n${value}\n${END}` : `${START}${END}`;

  if (!code.match(regex)) {
    if (insert === "none")
      return code;
    else if (insert === "head")
      return `${target}\n\n${code}`;
    else return `${code}\n\n${target}`;
  }

  return code.replace(regex, target);
}

export async function getMarkdownSection(pkg: string, name: string) {
  const types = await getTypeDefinition(pkg, name);

  let typingSection = "";

  if (types) {
    const code = `\`\`\`typescript\n${types.trim()}\n\`\`\``;
    typingSection
      = types.length > 1000
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
