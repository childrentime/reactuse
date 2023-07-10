import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import type React from "react";
import routesJSON from "../../src/routes.json";

export interface Route {
  path: string;
  element: React.ReactElement;
}

const CONVENTIONAL_ROUTE_ID = "website:routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const routes = routesJSON.main.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);

const generateRoutesCode = (ssr: boolean) => {
  return `
  import React from 'react';
  ${ssr ? "" : "import loadable from \"@loadable/component\";"}

  ${routes
    .map((route, index) => {
      const importPath = path.resolve(__dirname, `../../node_modules/@reactuses/core/hooks/${route}/README.md`);
      return ssr
        ? `import Route${index} from "${importPath}";`
        : `const Route${index} = loadable(() => import('${importPath}'));`;
    })
    .join("\n")}
  export const routes = [
    ${routes
      .map((route, index) => {
        return `{ path: '${route}', element: React.createElement(Route${index}) }`;
      })
      .join(",\n")}
  ];
  `;
};

export default function pluginRoutes(): Plugin {
  return {
    name: "island:routes",
    resolveId(id: string) {
      if (id === CONVENTIONAL_ROUTE_ID) {
        return `\0${id}`;
      }
    },

    load(id: string) {
      if (id === `\0${CONVENTIONAL_ROUTE_ID}`) {
        // FIXME when set it to true, it will load all routes code
        // But when it set to false, it will not load markdown string in server
        return generateRoutesCode(true);
      }
    },
  };
}
