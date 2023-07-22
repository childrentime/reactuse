import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import type React from "react";
import routesJSON from "../../src/routes.json";

export interface Route {
  path: string;
  element: () => React.ReactElement;
}

const CONVENTIONAL_ROUTE_ID = "website:routes";

const { dirname, resolve } = path.posix;
const __dirname = dirname(fileURLToPath(import.meta.url));

const menuGroup = routesJSON.main;
const routeObjects = menuGroup.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);

const generateRoutesCode = () => {
  return `
  import React, {lazy} from 'react'

  ${routeObjects
    .map((route, index) => {
      const importPath = resolve(
        __dirname,
        `../../node_modules/@reactuses/core/hooks/${route}/README.md`,
      );
      return `const Route${index} = lazy(() => import('${importPath}'));`;
    })
    .join("\n")}
  export const routes = [
    ${routeObjects
      .map((route, index) => {
        return `{ path: '${route}', element: Route${index} }`;
      })
      .join(",\n")}
  ];
  export const pages = ${JSON.stringify(routeObjects)}
  export const menuGroup = ${JSON.stringify(menuGroup)};
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
        return generateRoutesCode();
      }
    },
  };
}
