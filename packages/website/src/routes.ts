import loadable from "@loadable/component";
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
      demo: loadable(() => import(`../node_modules/@reactuses/core/hooks/${page}/demo`)),
      readme: loadable(() => import(`../node_modules/@reactuses/core/hooks/${page}/README.md`) as any),
      page,
    };
  });

const routes = menuGroup.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);

export { pages, routes };
