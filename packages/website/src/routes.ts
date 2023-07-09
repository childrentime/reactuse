import loadable from "@loadable/component";
import React from "react";
import routesJSON from "./routes.json";

interface Menu {
  title: string;
  items: string[];
}

export const menuGroup: Menu[] = routesJSON.main;

const pages = menuGroup
  .reduce((pre: string[], cur) => {
    pre.push(...cur.items);
    return pre;
  }, [])
  .map((page) => {
    return {
      element: React.createElement(loadable(() => import(`../node_modules/@reactuses/core/hooks/${page}/README.md`)), {
        fallback: React.createElement("div", {}, "Loading..."),
      }),
      page,
    };
  });

const routes = menuGroup.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);

export { pages, routes };
