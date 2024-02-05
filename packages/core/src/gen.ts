import fs from "node:fs";
import path from "node:path";

function generateExports(dir) {
  let result = "";

  fs.readdirSync(dir, { withFileTypes: true }).forEach((dirent) => {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      result += generateExports(fullPath);
    }
    else if (dirent.name === "interface.ts") {
      // Convert the file path to a module specifier.
      const moduleSpecifier = fullPath.replace(/\\/g, "/").replace(/\.ts$/, "");
      result += `export * from './${moduleSpecifier}';\n`;
    }
  });

  return result;
}

fs.writeFileSync("index1.ts", generateExports("."));
