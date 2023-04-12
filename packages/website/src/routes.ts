import loadable from "@loadable/component";
import routesJSON from "./routes.json";

interface Menu {
  title: string;
  items: string[];
}

export const menuGroup: Menu[] = routesJSON.main;

export const pages = menuGroup
  .reduce((pre: string[], cur) => {
    pre.push(...cur.items);
    return pre;
  }, [])
  .map((page) => {
    return {
      component: loadable(() => import(`./components/${page}`)),
      page,
    };
  });

export const routes = menuGroup.reduce((pre: string[], cur) => {
  pre.push(...cur.items);
  return pre;
}, []);
